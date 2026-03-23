import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      return new Response(
        JSON.stringify({ error: "Database URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { Pool } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
    const pool = new Pool(dbUrl, 3, true);
    const connection = await pool.connect();

    try {
      const [
        tablesResult, allColsResult, allPkResult, allFkResult, allRlsResult,
        enumsResult, uniqueResult, indexesResult, functionsResult, triggersResult
      ] = await Promise.all([
        // Tables
        connection.queryObject<{ tablename: string }>(
          `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
        ),
        // Columns
        connection.queryObject<{
          table_name: string; column_name: string; data_type: string; udt_name: string;
          is_nullable: string; column_default: string | null; character_maximum_length: number | null;
          ordinal_position: number;
        }>(
          `SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length, ordinal_position
           FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`
        ),
        // Primary keys
        connection.queryObject<{ table_name: string; column_name: string }>(
          `SELECT tc.table_name, kcu.column_name
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
           WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY' ORDER BY tc.table_name`
        ),
        // Foreign keys
        connection.queryObject<{
          table_name: string; column_name: string; foreign_table: string; foreign_column: string; constraint_name: string;
        }>(
          `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column, tc.constraint_name
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
           JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
           WHERE tc.table_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY' ORDER BY tc.table_name`
        ),
        // RLS
        connection.queryObject<{ relname: string; rowsecurity: boolean }>(
          `SELECT c.relname, c.relrowsecurity as rowsecurity FROM pg_class c
           JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relkind = 'r'`
        ),
        // Enums
        connection.queryObject<{ enum_name: string; enum_value: string }>(
          `SELECT t.typname AS enum_name, e.enumlabel AS enum_value
           FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
           JOIN pg_namespace n ON t.typnamespace = n.oid
           WHERE n.nspname = 'public' ORDER BY t.typname, e.enumsortorder`
        ),
        // Unique constraints
        connection.queryObject<{ table_name: string; constraint_name: string; column_name: string }>(
          `SELECT tc.table_name, tc.constraint_name, kcu.column_name
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
           WHERE tc.table_schema = 'public' AND tc.constraint_type = 'UNIQUE' ORDER BY tc.table_name, tc.constraint_name`
        ),
        // Custom indexes (non-pk, non-unique-constraint)
        connection.queryObject<{ tablename: string; indexname: string; indexdef: string }>(
          `SELECT t.relname AS tablename, i.relname AS indexname, pg_get_indexdef(ix.indexrelid) AS indexdef
           FROM pg_index ix
           JOIN pg_class t ON t.oid = ix.indrelid
           JOIN pg_class i ON i.oid = ix.indexrelid
           JOIN pg_namespace n ON t.relnamespace = n.oid
           WHERE n.nspname = 'public' AND NOT ix.indisprimary AND NOT ix.indisunique
           ORDER BY t.relname, i.relname`
        ),
        // Functions
        connection.queryObject<{ function_name: string; function_def: string }>(
          `SELECT p.proname AS function_name, pg_get_functiondef(p.oid) AS function_def
           FROM pg_proc p
           JOIN pg_namespace n ON p.pronamespace = n.oid
           WHERE n.nspname = 'public' AND p.prokind = 'f'
           ORDER BY p.proname`
        ),
        // Triggers
        connection.queryObject<{ trigger_name: string; table_name: string; trigger_def: string }>(
          `SELECT t.tgname AS trigger_name, c.relname AS table_name,
                  pg_get_triggerdef(t.oid) AS trigger_def
           FROM pg_trigger t
           JOIN pg_class c ON t.tgrelid = c.oid
           JOIN pg_namespace n ON c.relnamespace = n.oid
           WHERE n.nspname = 'public' AND NOT t.tgisinternal
           ORDER BY c.relname, t.tgname`
        ),
      ]);

      // --- Index data ---
      const colsByTable = new Map<string, typeof allColsResult.rows>();
      for (const col of allColsResult.rows) {
        if (!colsByTable.has(col.table_name)) colsByTable.set(col.table_name, []);
        colsByTable.get(col.table_name)!.push(col);
      }

      const pkByTable = new Map<string, string[]>();
      for (const pk of allPkResult.rows) {
        if (!pkByTable.has(pk.table_name)) pkByTable.set(pk.table_name, []);
        pkByTable.get(pk.table_name)!.push(pk.column_name);
      }

      const fkByTable = new Map<string, typeof allFkResult.rows>();
      for (const fk of allFkResult.rows) {
        if (!fkByTable.has(fk.table_name)) fkByTable.set(fk.table_name, []);
        fkByTable.get(fk.table_name)!.push(fk);
      }

      const rlsMap = new Map<string, boolean>();
      for (const r of allRlsResult.rows) rlsMap.set(r.relname, r.rowsecurity);

      const uniqueByTable = new Map<string, Map<string, string[]>>();
      for (const u of uniqueResult.rows) {
        if (!uniqueByTable.has(u.table_name)) uniqueByTable.set(u.table_name, new Map());
        const m = uniqueByTable.get(u.table_name)!;
        if (!m.has(u.constraint_name)) m.set(u.constraint_name, []);
        m.get(u.constraint_name)!.push(u.column_name);
      }

      // --- Enums ---
      const enumMap = new Map<string, string[]>();
      for (const e of enumsResult.rows) {
        if (!enumMap.has(e.enum_name)) enumMap.set(e.enum_name, []);
        enumMap.get(e.enum_name)!.push(e.enum_value);
      }

      // --- Topological sort ---
      const allTables = tablesResult.rows.map(r => r.tablename);
      const tableSet = new Set(allTables);
      const deps = new Map<string, Set<string>>();
      const deferredFKs: { table: string; col: string; refTable: string; refCol: string; constraint: string }[] = [];

      for (const t of allTables) deps.set(t, new Set());

      for (const fk of allFkResult.rows) {
        if (fk.foreign_table === fk.table_name) continue; // self-ref
        if (!tableSet.has(fk.foreign_table)) continue;
        deps.get(fk.table_name)!.add(fk.foreign_table);
      }

      // Kahn's algorithm
      const inDegree = new Map<string, number>();
      for (const t of allTables) inDegree.set(t, 0);
      for (const [t, d] of deps) {
        inDegree.set(t, d.size);
      }

      const sorted: string[] = [];
      const queue: string[] = [];
      for (const [t, deg] of inDegree) { if (deg === 0) queue.push(t); }
      queue.sort();

      while (queue.length > 0) {
        const t = queue.shift()!;
        sorted.push(t);
        for (const [other, d] of deps) {
          if (d.has(t)) {
            d.delete(t);
            inDegree.set(other, d.size);
            if (d.size === 0) {
              // Insert sorted
              let inserted = false;
              for (let i = 0; i < queue.length; i++) {
                if (other < queue[i]) { queue.splice(i, 0, other); inserted = true; break; }
              }
              if (!inserted) queue.push(other);
            }
          }
        }
      }

      // Circular deps: remaining tables
      const sortedSet = new Set(sorted);
      const circular: string[] = [];
      for (const t of allTables) {
        if (!sortedSet.has(t)) { sorted.push(t); circular.push(t); }
      }

      // Determine which FKs to defer (circular tables or forward refs)
      const tableOrder = new Map<string, number>();
      sorted.forEach((t, i) => tableOrder.set(t, i));

      // --- Build per-table SQL ---
      const perTableSql = new Map<string, string>();
      const deferredAlters: string[] = [];

      for (const tableName of sorted) {
        const cols = colsByTable.get(tableName) || [];
        const pkCols = pkByTable.get(tableName) || [];
        const fks = fkByTable.get(tableName) || [];
        const uniques = uniqueByTable.get(tableName);

        let sql = `CREATE TABLE public.${tableName} (\n`;
        const colDefs: string[] = [];

        for (const col of cols) {
          let typeName: string;
          if (col.data_type === "ARRAY") typeName = col.udt_name.replace(/^_/, "") + "[]";
          else if (col.data_type === "USER-DEFINED") typeName = col.udt_name;
          else if (col.character_maximum_length) typeName = `${col.data_type}(${col.character_maximum_length})`;
          else typeName = col.data_type;

          let def = `  ${col.column_name} ${typeName}`;
          if (col.column_default) def += ` DEFAULT ${col.column_default}`;
          if (col.is_nullable === "NO") def += " NOT NULL";
          colDefs.push(def);
        }

        if (pkCols.length > 0) {
          colDefs.push(`  PRIMARY KEY (${pkCols.join(", ")})`);
        }

        // Inline FKs only if target table comes before this one
        for (const fk of fks) {
          if (fk.foreign_table === tableName) {
            // self-ref: defer
            deferredAlters.push(
              `ALTER TABLE public.${tableName} ADD CONSTRAINT ${fk.constraint_name} FOREIGN KEY (${fk.column_name}) REFERENCES public.${fk.foreign_table}(${fk.foreign_column});`
            );
          } else if ((tableOrder.get(fk.foreign_table) ?? 999999) < (tableOrder.get(tableName) ?? 0)) {
            colDefs.push(
              `  FOREIGN KEY (${fk.column_name}) REFERENCES public.${fk.foreign_table}(${fk.foreign_column})`
            );
          } else {
            deferredAlters.push(
              `ALTER TABLE public.${tableName} ADD CONSTRAINT ${fk.constraint_name} FOREIGN KEY (${fk.column_name}) REFERENCES public.${fk.foreign_table}(${fk.foreign_column});`
            );
          }
        }

        // Unique constraints
        if (uniques) {
          for (const [, cols] of uniques) {
            colDefs.push(`  UNIQUE (${cols.join(", ")})`);
          }
        }

        sql += colDefs.join(",\n") + "\n);";

        if (rlsMap.get(tableName)) {
          sql += `\nALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;`;
        }

        perTableSql.set(tableName, sql);
      }

      // --- Build ordered script ---
      const parts: string[] = [];

      // 1. Enums
      if (enumMap.size > 0) {
        parts.push("-- ============================================");
        parts.push("-- ENUMS / TYPES");
        parts.push("-- ============================================");
        for (const [name, values] of enumMap) {
          parts.push(`CREATE TYPE public.${name} AS ENUM (${values.map(v => `'${v}'`).join(", ")});`);
        }
        parts.push("");
      }

      // 2. Tables (topologically ordered)
      parts.push("-- ============================================");
      parts.push("-- TABLES (topological order)");
      parts.push("-- ============================================");
      for (const t of sorted) {
        parts.push(`\n-- Table: ${t}`);
        parts.push(perTableSql.get(t)!);
      }
      parts.push("");

      // 3. Deferred foreign keys
      if (deferredAlters.length > 0) {
        parts.push("-- ============================================");
        parts.push("-- DEFERRED FOREIGN KEYS (circular / forward refs)");
        parts.push("-- ============================================");
        for (const a of deferredAlters) parts.push(a);
        parts.push("");
      }

      // 4. Indexes
      if (indexesResult.rows.length > 0) {
        parts.push("-- ============================================");
        parts.push("-- INDEXES");
        parts.push("-- ============================================");
        for (const idx of indexesResult.rows) {
          parts.push(`${idx.indexdef};`);
        }
        parts.push("");
      }

      // 5. Functions
      if (functionsResult.rows.length > 0) {
        parts.push("-- ============================================");
        parts.push("-- FUNCTIONS");
        parts.push("-- ============================================");
        for (const fn of functionsResult.rows) {
          parts.push(fn.function_def + ";");
          parts.push("");
        }
      }

      // 6. Triggers
      if (triggersResult.rows.length > 0) {
        parts.push("-- ============================================");
        parts.push("-- TRIGGERS");
        parts.push("-- ============================================");
        for (const tr of triggersResult.rows) {
          parts.push(`-- Trigger on ${tr.table_name}`);
          parts.push(`${tr.trigger_def};`);
        }
        parts.push("");
      }

      const fullScript = parts.join("\n");

      // Also return per-table schemas for backward compat
      const schemas: Record<string, string> = {};
      for (const t of sorted) schemas[t] = perTableSql.get(t)!;

      return new Response(JSON.stringify({
        schemas,
        orderedScript: fullScript,
        tableOrder: sorted,
        tableCount: sorted.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } finally {
      connection.release();
      await pool.end();
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
