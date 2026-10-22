const fs = require("fs");
const path = require("path");
const sql = require("mssql");

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const connStr = env.split(/\r?\n/).find((l) => l.startsWith("SQLSERVER_CONNECTION_STRING=")).split("=").slice(1).join("=");

const TABLAS = [
  "Resultado_Componente",
  "Resultado_MatrizSA",
  "EvaluacionesPrincipioDetalleDGCI",
  "EvaluacionesPrincipioDGCI",
  "Matriz_SistemaAdministrativoDetalle",
  "Matriz_SistemaAdministrativo",
];

async function main() {
  const pool = await sql.connect(connStr);
  for (const t of TABLAS) {
    const cols = await pool.request().query(`
      SELECT c.name AS col, ty.name AS type, c.is_identity
      FROM sys.columns c
      INNER JOIN sys.types ty ON ty.user_type_id = c.user_type_id
      WHERE c.object_id = OBJECT_ID('dbo.${t}')
      ORDER BY c.column_id;
    `);
    console.log(`\n=== dbo.${t} ===`);
    console.log(cols.recordset.map((c) => c.col + (c.is_identity ? " IDENTITY" : "")).join(", ") || "(no existe)");
  }

  // Relaciones FK
  const fks = await pool.request().query(`
    SELECT
      OBJECT_NAME(fk.parent_object_id) AS tabla_hija,
      c.name AS columna,
      OBJECT_NAME(fk.referenced_object_id) AS tabla_padre
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
    INNER JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE OBJECT_NAME(fk.parent_object_id) IN (${TABLAS.map((t) => `'${t}'`).join(",")})
       OR OBJECT_NAME(fk.referenced_object_id) IN (${TABLAS.map((t) => `'${t}'`).join(",")});
  `);
  console.log("\n=== FKs ===");
  console.table(fks.recordset);
  await pool.close();
}
main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
