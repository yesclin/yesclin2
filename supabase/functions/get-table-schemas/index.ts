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
      // Fetch ALL data in bulk queries (not per-table)
      const [tablesResult, allColsResult, allPkResult, allFkResult, allRlsResult] = await Promise.all([
        connection.queryObject<{ tablename: string }>(
          `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
        ),
        connection.queryObject<{
          table_name: string;
          column_name: string;
          data_type: string;
          udt_name: string;
          is_nullable: string;
          column_default: string | null;
          character_maximum_length: number | null;
          ordinal_position: number;
        }>(
          `SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length, ordinal_position
           FROM information_schema.columns
           WHERE table_schema = 'public'
           ORDER BY table_name, ordinal_position`
        ),
        connection.queryObject<{ table_name: string; column_name: string }>(
          `SELECT tc.table_name, kcu.column_name
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
           WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
           ORDER BY tc.table_name`
        ),
        connection.queryObject<{
          table_name: string;
          column_name: string;
          foreign_table: string;
          foreign_column: string;
        }>(
          `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
           JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
           WHERE tc.table_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY'
           ORDER BY tc.table_name`
        ),
        connection.queryObject<{ relname: string; rowsecurity: boolean }>(
          `SELECT c.relname, c.relrowsecurity as rowsecurity
           FROM pg_class c
           JOIN pg_namespace n ON c.relnamespace = n.oid
           WHERE n.nspname = 'public' AND c.relkind = 'r'`
        ),
      ]);

      // Index data by table name
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
      for (const r of allRlsResult.rows) {
        rlsMap.set(r.relname, r.rowsecurity);
      }

      // Build schemas
      const schemas: Record<string, string> = {};

      for (const row of tablesResult.rows) {
        const tableName = row.tablename;
        const cols = colsByTable.get(tableName) || [];
        const pkCols = pkByTable.get(tableName) || [];
        const fks = fkByTable.get(tableName) || [];

        let sql = `CREATE TABLE public.${tableName} (\n`;
        const colDefs: string[] = [];

        for (const col of cols) {
          let typeName = col.udt_name;
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

        for (const fk of fks) {
          colDefs.push(
            `  FOREIGN KEY (${fk.column_name}) REFERENCES public.${fk.foreign_table}(${fk.foreign_column})`
          );
        }

        sql += colDefs.join(",\n") + "\n);";

        if (rlsMap.get(tableName)) {
          sql += `\n\nALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;`;
        }

        schemas[tableName] = sql;
      }

      return new Response(JSON.stringify({ schemas }), {
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
