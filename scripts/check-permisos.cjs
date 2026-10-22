const fs = require("fs");
const path = require("path");
const sql = require("mssql");

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const connStr = env.split(/\r?\n/).find((l) => l.startsWith("SQLSERVER_CONNECTION_STRING=")).split("=").slice(1).join("=");

async function main() {
  const pool = await sql.connect(connStr);
  const r = await pool.request().query(`
    SELECT name FROM sys.tables WHERE name IN (
      'usuariosModulosPermisos', 'usuariosSubmodulospermisos',
      'usuariosPreguntasPermisos', 'usuariosPrincipiosPermisos',
      'usuariosPrincipiosPreguntasPermisos', 'usuariosPrincipiosPermisos'
    ) ORDER BY name;
  `);
  console.log("Tablas de permisos encontradas:", r.recordset.map((x) => x.name));
  for (const t of r.recordset.map((x) => x.name)) {
    const c = await pool.request().query(`SELECT COUNT(*) AS n FROM dbo.[${t}]`);
    console.log(`  ${t}: ${c.recordset[0].n} filas`);
  }
  await pool.close();
}
main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
