/* ============================================================
   DIAGNÓSTICO DE BASE DE DATOS DE PRODUCCIÓN
   Uso: node scripts/diag-produccion.cjs
   Lee SQLSERVER_CONNECTION_STRING del .env.local
   ============================================================ */

const fs = require("fs");
const path = require("path");
const sql = require("mssql");

// Leer .env.local manualmente
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const connStr = envContent
  .split(/\r?\n/)
  .find((l) => l.startsWith("SQLSERVER_CONNECTION_STRING="))
  ?.split("=")
  .slice(1)
  .join("=");

if (!connStr) {
  console.error("No se encontró SQLSERVER_CONNECTION_STRING en .env.local");
  process.exit(1);
}

async function main() {
  const pool = await sql.connect(connStr);
  console.log("✅ Conexión exitosa\n");

  // 1. Tablas del sistema DGCI existentes
  const tables = await pool.request().query(`
    SELECT name FROM sys.tables
    WHERE name LIKE '%dgci%' OR name IN ('Apertura_sistema')
    ORDER BY name;
  `);
  console.log("=== TABLAS DGCI EXISTENTES ===");
  console.log(tables.recordset.map((t) => t.name).join("\n") || "(ninguna)");

  // 2. Conteo de filas
  const interesting = [
    "Usuarios_Dgci", "Roles_Dgci", "UserRoles_Dgci",
    "Modulos_Dgci", "submodulos_dgci", "Apertura_sistema",
    "UsuariosModulos_Dgci", "UsuariosPreguntas_Dgci", "Auditoria_Datos_Dgci",
  ];
  console.log("\n=== CONTEO DE FILAS ===");
  for (const t of interesting) {
    try {
      const r = await pool.request().query(`SELECT COUNT(*) AS n FROM dbo.[${t}]`);
      console.log(`${t}: ${r.recordset[0].n}`);
    } catch {
      console.log(`${t}: (no existe o sin acceso)`);
    }
  }

  // 3. Columnas de tablas clave
  for (const t of ["Usuarios_Dgci", "Roles_Dgci", "UserRoles_Dgci", "Modulos_Dgci"]) {
    try {
      const cols = await pool.request().query(`
        SELECT c.name AS col, ty.name AS type, c.is_nullable, c.is_identity
        FROM sys.columns c
        INNER JOIN sys.types ty ON ty.user_type_id = c.user_type_id
        WHERE c.object_id = OBJECT_ID('dbo.${t}')
        ORDER BY c.column_id;
      `);
      console.log(`\n=== COLUMNAS dbo.${t} ===`);
      console.log(cols.recordset.map((c) => `${c.col} ${c.type}${c.is_identity ? " IDENTITY" : ""}${c.is_nullable ? "" : " NOT NULL"}`).join("\n") || "(tabla no existe)");
    } catch (e) {
      console.log(`\n=== COLUMNAS dbo.${t} === ERROR: ${e.message}`);
    }
  }

  // 4. Contenido de catálogos
  for (const t of ["Roles_Dgci", "Modulos_Dgci", "submodulos_dgci"]) {
    try {
      const r = await pool.request().query(`SELECT * FROM dbo.[${t}]`);
      console.log(`\n=== CONTENIDO dbo.${t} ===`);
      console.table(r.recordset);
    } catch (e) {
      console.log(`\n=== CONTENIDO dbo.${t} === ERROR: ${e.message}`);
    }
  }

  await pool.close();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
