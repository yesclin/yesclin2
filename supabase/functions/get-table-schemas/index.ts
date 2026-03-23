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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all tables and their columns from information_schema
    const { data: columns, error } = await supabase.rpc("get_public_table_ddl");

    if (error) {
      // Fallback: query information_schema directly via postgrest
      const { data: colData, error: colError } = await supabase
        .from("information_schema.columns" as any)
        .select("*")
        .eq("table_schema", "public");

      // If that also fails, use direct SQL via service role
      const dbUrl = Deno.env.get("SUPABASE_DB_URL");
      if (!dbUrl) {
        return new Response(
          JSON.stringify({ error: "Database URL not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Use pg to query
      const { Pool } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
      const pool = new Pool(dbUrl, 3, true);
      const connection = await pool.connect();

      try {
        // Get all public tables
        const tablesResult = await connection.queryObject<{ tablename: string }>(
          `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
        );

        const schemas: Record<string, string> = {};

        for (const row of tablesResult.rows) {
          const tableName = row.tablename;

          // Get columns
          const colsResult = await connection.queryObject<{
            column_name: string;
            data_type: string;
            udt_name: string;
            is_nullable: string;
            column_default: string | null;
            character_maximum_length: number | null;
          }>(
            `SELECT column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length
             FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = $1
             ORDER BY ordinal_position`,
            [tableName]
          );

          // Get primary key
          const pkResult = await connection.queryObject<{ column_name: string }>(
            `SELECT kcu.column_name
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
             WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY'`,
            [tableName]
          );
          const pkCols = pkResult.rows.map((r) => r.column_name);

          // Get foreign keys
          const fkResult = await connection.queryObject<{
            column_name: string;
            foreign_table: string;
            foreign_column: string;
            constraint_name: string;
          }>(
            `SELECT kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column, tc.constraint_name
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
             JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
             WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY'`,
            [tableName]
          );

          // Build CREATE TABLE
          let sql = `CREATE TABLE public.${tableName} (\n`;
          const colDefs: string[] = [];

          for (const col of colsResult.rows) {
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

          for (const fk of fkResult.rows) {
            colDefs.push(
              `  FOREIGN KEY (${fk.column_name}) REFERENCES public.${fk.foreign_table}(${fk.foreign_column})`
            );
          }

          sql += colDefs.join(",\n") + "\n);";

          // Get RLS status
          const rlsResult = await connection.queryObject<{ rowsecurity: boolean }>(
            `SELECT relrowsecurity as rowsecurity FROM pg_class WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`,
            [tableName]
          );
          if (rlsResult.rows[0]?.rowsecurity) {
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
    }

    return new Response(JSON.stringify({ schemas: columns }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
