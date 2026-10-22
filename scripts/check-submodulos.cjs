const fs = require("fs");
const path = require("path");
const sql = require("mssql");

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const connStr = env.split(/\r?\n/).find((l) => l.startsWith("SQLSERVER_CONNECTION_STRING=")).split("=").slice(1).join("=");

async function main() {
  const pool = await sql.connect(connStr);

  const mods = await pool.request().query(`
    SELECT ModuleId, ModuleKey, ModuleName, IsActive
    FROM dbo.Modulos_Dgci
    ORDER BY ModuleId;
  `);
  console.log("=== MÓDULOS ===");
  console.table(mods.recordset);

  const subs = await pool.request().query(`
    SELECT SubModuleId, ModuleId, SubModuleKey, SubModuleName, IsActive
    FROM dbo.Submodulos_Dgci
    ORDER BY ModuleId, SubModuleId;
  `);
  console.log("=== SUBMÓDULOS ===");
  console.table(subs.recordset);

  await pool.close();
}
main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
