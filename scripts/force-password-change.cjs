/* ============================================================
   FORZAR CAMBIO DE CONTRASEÑA EN PRÓXIMO INGRESO
   Uso: node scripts/force-password-change.cjs "correo@uncsm.edu.ni"
   Si no se pasa correo, aplica al administrador por defecto.
   Pone MustChangePassword = 1 en dbo.Usuarios_Dgci.
   ============================================================ */

const fs = require("fs");
const path = require("path");
const sql = require("mssql");

const EMAIL = (process.argv[2] || "jorge.leiva@uncsm.edu.ni").trim().toLowerCase();

function readConnStr() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const env = fs.readFileSync(envPath, "utf8");
  const line = env.split(/\r?\n/).find((l) => l.startsWith("SQLSERVER_CONNECTION_STRING="));
  if (!line) throw new Error("No se encontró SQLSERVER_CONNECTION_STRING en .env.local");
  return line.split("=").slice(1).join("=");
}

async function main() {
  const pool = await sql.connect(readConnStr());

  const r = await pool
    .request()
    .input("Email", sql.NVarChar(255), EMAIL)
    .query(`
      UPDATE dbo.Usuarios_Dgci
      SET MustChangePassword = 1,
          UpdatedAt = SYSDATETIME()
      OUTPUT INSERTED.Email, INSERTED.MustChangePassword
      WHERE LOWER(Email) = LOWER(@Email);
    `);

  if (r.recordset.length === 0) {
    console.log(`⚠️  No existe el usuario ${EMAIL}`);
  } else {
    console.log(`✅ Listo: ${r.recordset[0].Email} → MustChangePassword = ${r.recordset[0].MustChangePassword}`);
    console.log("En el próximo ingreso el sistema lo redirigirá a /auth/cambiar-contrasena");
  }

  await pool.close();
}

main().catch((e) => { console.error("❌ Error:", e.message); process.exit(1); });
