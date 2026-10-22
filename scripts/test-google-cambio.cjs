/* ============================================================
   PRUEBA E2E: sesión Google (Auth.js) + MustChangePassword = 1

   Usa un usuario TEMPORAL desechable (se crea y se borra):
     test.cambio.flujo@uncsm.edu.ni

   Verifica:
   1. /dashboard con sesión Google + bandera 1 → 307 al cambio
   2. La página del cambio renderiza
   3. El server action ACEPTA la sesión Google (sin auth_token),
      actualiza la contraseña, pone la bandera en 0 y borra
      ambas cookies (auth_token + authjs.session-token)
   4. Limpia el usuario temporal
   ============================================================ */

const fs = require("fs");
const path = require("path");
const sql = require("mssql");
const bcrypt = require("bcryptjs");

const EMAIL_TEMP = "test.cambio.flujo@uncsm.edu.ni";

async function main() {
  const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  const get = (k) => env.split(/\r?\n/).find((l) => l.startsWith(k + "=")).split("=").slice(1).join("=");
  const AUTH_SECRET = get("AUTH_SECRET");
  const connStr = get("SQLSERVER_CONNECTION_STRING");

  const pool = await sql.connect(connStr);

  // Limpieza previa por si la prueba quedó a medias
  await pool.request().query(`DELETE FROM dbo.Usuarios_Dgci WHERE Email = '${EMAIL_TEMP}';`);

  // --------------------------------------------------------
  // 0. Usuario temporal con contraseña provisional
  // --------------------------------------------------------
  const hash = await bcrypt.hash("Provisional1!", 10);
  const ins = await pool
    .request()
    .input("Email", sql.NVarChar(255), EMAIL_TEMP)
    .input("FullName", sql.NVarChar(200), "Usuario Temporal Prueba")
    .input("PasswordHash", sql.NVarChar(255), hash)
    .input("IsActive", sql.Bit, 1)
    .input("MustChangePassword", sql.Bit, 1)
    .query(`
      INSERT INTO dbo.Usuarios_Dgci
        (Email, FullName, PasswordHash, IsActive, MustChangePassword)
      OUTPUT INSERTED.UserId
      VALUES (@Email, @FullName, @PasswordHash, @IsActive, @MustChangePassword);
    `);
  const tempUserId = ins.recordset[0].UserId;

  // Asignar el mismo rol que el administrador (el layout exige rol)
  await pool.request().query(`
    INSERT INTO dbo.UserRoles_Dgci (UserId, RoleId)
    SELECT '${tempUserId}', ur.RoleId
    FROM dbo.UserRoles_Dgci ur
    INNER JOIN dbo.Usuarios_Dgci u ON u.UserId = ur.UserId
    WHERE u.Email = 'jorge.leiva@uncsm.edu.ni'
      AND NOT EXISTS (
        SELECT 1 FROM dbo.UserRoles_Dgci x
        WHERE x.UserId = '${tempUserId}' AND x.RoleId = ur.RoleId
      );
  `);
  console.log("[0] Usuario temporal creado:", tempUserId);

  try {
    // --------------------------------------------------------
    // 1. Cookie de sesión Auth.js válida (JWE, como next-auth)
    // --------------------------------------------------------
    const { encode } = await import("next-auth/jwt");
    const sessionToken = await encode({
      token: {
        name: "Usuario Temporal Prueba",
        email: EMAIL_TEMP,
        picture: "",
        sub: String(tempUserId),
      },
      salt: "authjs.session-token",
      secret: AUTH_SECRET,
    });
    const cookie = `authjs.session-token=${sessionToken}`;

    // --------------------------------------------------------
    // 2. /dashboard con sesión Google + bandera 1
    // --------------------------------------------------------
    const r1 = await fetch("http://localhost:3000/dashboard", {
      redirect: "manual",
      headers: { cookie, Accept: "text/html" },
    });
    console.log("[1] /dashboard →", r1.status, "→", r1.headers.get("location"));
    const okRedirect =
      r1.status === 307 &&
      String(r1.headers.get("location")).includes("/auth/cambiar-contrasena");

    // --------------------------------------------------------
    // 3. Página del cambio renderiza
    // --------------------------------------------------------
    const r2 = await fetch("http://localhost:3000/auth/cambiar-contrasena", {
      headers: { cookie, Accept: "text/html" },
    });
    const html = await r2.text();
    console.log("[2] /auth/cambiar-contrasena →", r2.status);
    const okPagina = r2.status === 200 && html.includes("Mínimo 8 caracteres");

    // --------------------------------------------------------
    // 4. Submit del server action SIN auth_token (solo Google)
    //    (progressive enhancement: POST al mismo page)
    // --------------------------------------------------------
    const m = html.match(/\$ACTION_ID_([a-f0-9]+)/);
    if (!m) {
      throw new Error("No se encontró $ACTION_ID en el HTML");
    }
    const actionId = m[1];

    const body = new FormData();
    body.set("$ACTION_ID_" + actionId, "");
    body.set("password", "NuevaClave2026!");
    body.set("confirmPassword", "NuevaClave2026!");

    const r3 = await fetch("http://localhost:3000/auth/cambiar-contrasena", {
      method: "POST",
      redirect: "manual",
      headers: {
        cookie,
        Accept: "text/html",
      },
      body,
    });
    const loc = r3.headers.get("location") || "";
    const setCookies = typeof r3.headers.getSetCookie === "function" ? r3.headers.getSetCookie() : [];
    const borradas = setCookies
      .filter((c) => /^(auth_token|authjs\.session-token|__Secure-authjs\.session-token)/.test(c))
      .map((c) => c.split(";")[0].split("=")[0] + "=borrada");

    console.log("[3] server action →", r3.status, "→", loc || "(sin location)");
    console.log("    cookies manipuladas:", borradas.length ? borradas.join(", ") : "(ninguna)");

    const okAccion =
      r3.status === 303 &&
      loc.includes("/auth/login?exito=") &&
      borradas.length >= 1;

    // --------------------------------------------------------
    // 5. Bandera y hash nuevos en BD
    // --------------------------------------------------------
    const chk = await pool.request().query(`
      SELECT MustChangePassword,
             CASE WHEN PasswordHash = '${hash}' THEN 0 ELSE 1 END AS HashCambiado
      FROM dbo.Usuarios_Dgci
      WHERE UserId = '${tempUserId}';
    `);
    const fila = chk.recordset[0];
    const flagEnCero = fila.MustChangePassword === false || fila.MustChangePassword === 0;
    const hashOk = fila.HashCambiado === 1 || fila.HashCambiado === true;
    console.log("[4] MustChangePassword:", fila.MustChangePassword, "| Hash actualizado:", hashOk);
    const okBandera = flagEnCero && hashOk;

    // --------------------------------------------------------
    // Resultado
    // --------------------------------------------------------
    console.log("\n========== RESULTADO ==========");
    console.log("Redirección al cambio con sesión Google:", okRedirect ? "PASS" : "FAIL");
    console.log("Página del cambio renderiza:           ", okPagina ? "PASS" : "FAIL");
    console.log("Cambio aceptado sin auth_token:        ", okAccion ? "PASS" : "FAIL");
    console.log("Bandera en 0 + hash actualizado:       ", okBandera ? "PASS" : "FAIL");
    const todoOk = okRedirect && okPagina && okAccion && okBandera;
    console.log("================================");
    console.log(todoOk ? "✅ 4/4 PASS" : "❌ HAY FALLOS");

    if (!todoOk) process.exitCode = 1;
  } finally {
    // --------------------------------------------------------
    // Limpieza: eliminar usuario temporal
    // --------------------------------------------------------
    await pool.request().query(`
      DELETE FROM dbo.UserRoles_Dgci WHERE UserId = '${tempUserId}';
      DELETE FROM dbo.Usuarios_Dgci WHERE Email = '${EMAIL_TEMP}';
    `);
    console.log("\n[5] Usuario temporal eliminado de BD");
    await pool.close();
  }
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
