const fs = require("fs");
const path = require("path");
const sql = require("mssql");

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const connStr = env.split(/\r?\n/).find((l) => l.startsWith("SQLSERVER_CONNECTION_STRING=")).split("=").slice(1).join("=");

async function main() {
  const pool = await sql.connect(connStr);
  const r = await pool.request().query(`
    SELECT u.Email, u.FullName, u.Cargo, u.IsActive, u.MustChangePassword, r.RoleKey, r.RoleName
    FROM dbo.Usuarios_Dgci u
    INNER JOIN dbo.UserRoles_Dgci ur ON ur.UserId = u.UserId
    INNER JOIN dbo.Roles_Dgci r ON r.RoleId = ur.RoleId
  `);
  console.table(r.recordset);
  await pool.close();
}
main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
