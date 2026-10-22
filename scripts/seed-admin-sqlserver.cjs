/* ============================================================
   SEED DE USUARIO ADMINISTRADOR - PRODUCCIÓN
   Uso: node scripts/seed-admin-sqlserver.cjs
   - Lee SQLSERVER_CONNECTION_STRING del .env.local
   - Crea el usuario admin en dbo.Usuarios_Dgci (si no existe)
   - Asigna el rol "administrador" (RoleId 1) en dbo.UserRoles_Dgci
   - Genera una contraseña temporal y la muestra en pantalla
   Idempotente: si el usuario ya existe, no duplica nada.
   ============================================================ */

const fs = require("fs");
const path = require("path");
const sql = require("mssql");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// ---------- CONFIGURACIÓN ----------
const ADMIN_EMAIL = "jorge.leiva@uncsm.edu.ni";
const ADMIN_FULLNAME = "Administrador DGCI";
const ADMIN_CARGO = "Administrador del Sistema";
const ROLE_KEY = "administrador";
const MUST_CHANGE_PASSWORD = 0; // 0 = entra directo al dashboard
// -----------------------------------

function generatePassword(length = 14) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*?";
  const all = upper + lower + numbers + symbols;

  const chars = [
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    symbols[crypto.randomInt(0, symbols.length)],
  ];
  while (chars.length < length) {
    chars.push(all[crypto.randomInt(0, all.length)]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function readConnStr() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const env = fs.readFileSync(envPath, "utf8");
  const line = env.split(/\r?\n/).find((l) => l.startsWith("SQLSERVER_CONNECTION_STRING="));
  if (!line) throw new Error("No se encontró SQLSERVER_CONNECTION_STRING en .env.local");
  return line.split("=").slice(1).join("=");
}

async function main() {
  const pool = await sql.connect(readConnStr());
  console.log("✅ Conectado a la base de producción\n");

  try {
    // 1. Verificar si ya existe
    const exists = await pool
      .request()
      .input("Email", sql.NVarChar(255), ADMIN_EMAIL)
      .query(`SELECT UserId, IsActive FROM dbo.Usuarios_Dgci WHERE LOWER(Email) = LOWER(@Email)`);

    if (exists.recordset.length > 0) {
      const u = exists.recordset[0];
      console.log(`⚠️  El usuario ${ADMIN_EMAIL} ya existe (UserId: ${u.UserId}, IsActive: ${u.IsActive}).`);
      console.log("No se modificó nada. Si quieres resetear la contraseña usa /dashboard/permisos/usuario (una vez dentro).");

      // Asegurar rol administrador aunque el usuario exista
      await ensureRole(pool, u.UserId);
      return;
    }

    // 2. Generar contraseña y hash
    const tempPassword = generatePassword(14);
    const hash = await bcrypt.hash(tempPassword, 10);

    // 3. Insertar usuario
    const inserted = await pool
      .request()
      .input("Email", sql.NVarChar(255), ADMIN_EMAIL)
      .input("FullName", sql.NVarChar(200), ADMIN_FULLNAME)
      .input("Cargo", sql.NVarChar(200), ADMIN_CARGO)
      .input("PasswordHash", sql.NVarChar(255), hash)
      .input("IsActive", sql.Bit, 1)
      .input("MustChangePassword", sql.Bit, MUST_CHANGE_PASSWORD)
      .query(`
        INSERT INTO dbo.Usuarios_Dgci
          (Email, FullName, Cargo, PasswordHash, IsActive, MustChangePassword)
        OUTPUT INSERTED.UserId
        VALUES (@Email, @FullName, @Cargo, @PasswordHash, @IsActive, @MustChangePassword);
      `);

    const userId = inserted.recordset[0].UserId;
    console.log(`✅ Usuario creado: ${ADMIN_EMAIL} (UserId: ${userId})`);

    // 4. Asignar rol administrador
    await ensureRole(pool, userId);

    // 5. Mostrar credenciales
    console.log("\n================= CREDENCIALES =================");
    console.log(`  URL:               http://localhost:3000/auth/login`);
    console.log(`  Correo:            ${ADMIN_EMAIL}`);
    console.log(`  Contraseña:        ${tempPassword}`);
    console.log("================================================");
    console.log("\n📌 GUARDE LA CONTRASEÑA EN UN LUGAR SEGURO.");
    console.log("   Después puede cambiarla desde el sistema.");
    console.log("\n💡 También puede ingresar con Google (misma cuenta),");
    console.log("   ahora sí está registrado en la base.");
  } finally {
    await pool.close();
  }
}

async function ensureRole(pool, userId) {
  const role = await pool
    .request()
    .input("RoleKey", sql.NVarChar(50), ROLE_KEY)
    .query(`SELECT RoleId, RoleName FROM dbo.Roles_Dgci WHERE RoleKey = @RoleKey`);

  if (role.recordset.length === 0) throw new Error(`No existe el rol ${ROLE_KEY} en dbo.Roles_Dgci`);
  const roleId = role.recordset[0].RoleId;

  const already = await pool
    .request()
    .input("UserId", sql.UniqueIdentifier, userId)
    .input("RoleId", sql.Int, roleId)
    .query(`SELECT 1 FROM dbo.UserRoles_Dgci WHERE UserId = @UserId AND RoleId = @RoleId`);

  if (already.recordset.length === 0) {
    await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("RoleId", sql.Int, roleId)
      .query(`INSERT INTO dbo.UserRoles_Dgci (UserId, RoleId) VALUES (@UserId, @RoleId)`);
    console.log(`✅ Rol "${role.recordset[0].RoleName}" asignado`);
  } else {
    console.log(`ℹ️  El usuario ya tiene el rol "${role.recordset[0].RoleName}"`);
  }
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
