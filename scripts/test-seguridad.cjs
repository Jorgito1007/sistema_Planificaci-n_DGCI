/* ============================================================
   PRUEBAS DE SEGURIDAD (usa el dev server en localhost:3000)
   node scripts/test-seguridad.cjs
   ============================================================ */

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_ID = "A71305E2-51DC-4530-88F2-B941459F8A76";

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const JWT_SECRET = env.split(/\r?\n/).find((l) => l.startsWith("JWT_SECRET=")).split("=").slice(1).join("=");

const tokenAdmin = jwt.sign(
  { userId: ADMIN_ID, email: "jorge.leiva@uncsm.edu.ni", role: "administrador", mustChangePassword: false },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const tokenCambio = jwt.sign(
  { userId: ADMIN_ID, email: "jorge.leiva@uncsm.edu.ni", role: "administrador", mustChangePassword: true },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const tokenFalsificado = jwt.sign(
  { userId: "00000000-0000-0000-0000-000000000001", role: "administrador" },
  "secreto_adivinable",
  { expiresIn: "1h" }
);

const resultados = [];

async function caso(nombre, metodo, ruta, opts = {}, esperado) {
  try {
    const res = await fetch(BASE + ruta, {
      method: metodo,
      redirect: "manual",
      headers: opts.headers || {},
      body: opts.body,
    });
    const ok = esperado.includes(res.status);
    resultados.push({
      caso: nombre,
      status: res.status,
      esperado: esperado.join("|"),
      resultado: ok ? "PASS" : "FAIL",
    });
  } catch (e) {
    resultados.push({ caso: nombre, status: "ERR", esperado: esperado.join("|"), resultado: "ERROR: " + e.message });
  }
}

async function main() {
  const auth = (t) => ({ cookie: `auth_token=${t}` });

  // ---------- SIN SESIÓN (el atacante anónimo) ----------
  await caso("API auditoría sin sesión → 401", "GET", "/api/informes/auditoria", {}, [401]);
  await caso("API permisos-usuarios sin sesión → 401", "GET", "/api/informes/permisos-usuarios", {}, [401]);
  await caso("API aprobar resultados sin sesión → 401", "POST", "/api/evaluacion-componentes/aprobar", { headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }, [401]);
  await caso("API aprobar plan sin sesión → 401", "POST", "/api/informes/planes-accion/aprobar", { headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }, [401]);
  await caso("Registro abierto sin sesión → 401", "POST", "/auth/register", { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "atacante@uncsm.edu.ni", password: "Password1!" }) }, [401]);
  await caso("Apertura sin sesión → 401", "POST", "/api/apertura", { headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }, [401]);
  await caso("Cerrar período sin sesión → 401", "POST", "/api/cerrar", { headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }, [401]);
  await caso("Resultado componente POST sin sesión → 401", "POST", "/api/resultados/resultado-componente", { headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }, [401]);
  await caso("Guardar matriz sin sesión → 401", "POST", "/api/matriz-sistema-administrativo/guardar", { headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }, [401]);
  await caso("Dashboard sin sesión → redirect login", "GET", "/dashboard", {}, [302, 307]);
  await caso("db-test sin sesión → 401", "GET", "/api/db-test", {}, [401]);
  await caso("Páginas públicas siguen públicas (login)", "GET", "/auth/login", {}, [200]);
  await caso("Callback de Google público (session)", "GET", "/api/auth/session", {}, [200]);

  // ---------- TOKEN FALSIFICADO ----------
  await caso("Token con secreto viejo/falso → 401", "GET", "/api/informes/auditoria", { headers: auth(tokenFalsificado) }, [401]);
  await caso("Token falso no entra a dashboard → redirect", "GET", "/dashboard", { headers: auth(tokenFalsificado) }, [302, 307]);

  // ---------- CON SESIÓN VÁLIDA (administrador) ----------
  await caso("Token admin válido pasa middleware (auditoría)", "GET", "/api/informes/auditoria", { headers: auth(tokenAdmin) }, [200]);
  await caso("Admin aprueba resultados: auth OK (404 por id inexistente)", "POST", "/api/evaluacion-componentes/aprobar", { headers: { ...auth(tokenAdmin), "Content-Type": "application/json" }, body: JSON.stringify({ resultadoId: 999999, tipo: "COMPONENTES" }) }, [404]);
  await caso("Admin abre apertura: auth+rol OK (400 por datos)", "POST", "/api/apertura", { headers: { ...auth(tokenAdmin), "Content-Type": "application/json" }, body: JSON.stringify({}) }, [400]);
  await caso("Admin cierra período: auth+rol OK (400 por id)", "POST", "/api/cerrar", { headers: { ...auth(tokenAdmin), "Content-Type": "application/json" }, body: JSON.stringify({}) }, [400]);
  await caso("Admin aprueba plan: auth+rollo OK (400 por datos)", "POST", "/api/informes/planes-accion/aprobar", { headers: { ...auth(tokenAdmin), "Content-Type": "application/json" }, body: JSON.stringify({}) }, [400]);
  await caso("Token con cambio pendiente → bloqueado en API/dashboard", "GET", "/dashboard", { headers: { ...auth(tokenCambio), Accept: "text/html" } }, [302, 307]);

  // ---------- CASOS ADICIONALES: ROLES Y REGISTRO ----------
  await caso("Registro con sesión de admin y correo existente → 409", "POST", "/auth/register", { headers: { ...auth(tokenAdmin), "Content-Type": "application/json" }, body: JSON.stringify({ email: "jorge.leiva@uncsm.edu.ni", password: "Password1!" }) }, [409]);
  await caso("Registro con admin y correo NO institucional → 400", "POST", "/auth/register", { headers: { ...auth(tokenAdmin), "Content-Type": "application/json" }, body: JSON.stringify({ email: "atacante@gmail.com", password: "Password1!" }) }, [400]);
  await caso("Guardar matriz como admin sin subModuleKey → 400", "POST", "/api/matriz-sistema-administrativo/guardar", { headers: { ...auth(tokenAdmin), "Content-Type": "application/json" }, body: JSON.stringify({}) }, [400]);
  await caso("GET resultado componente con sesión → 200", "GET", "/api/resultados/resultado-componente", { headers: auth(tokenAdmin) }, [200]);
  await caso("GET resultado matriz SA con sesión → 200", "GET", "/api/resultados/resultado-matriz-sa", { headers: auth(tokenAdmin) }, [200]);
  await caso("POST resultado componente admin (permiso OK) → 400 datos", "POST", "/api/resultados/resultado-componente", { headers: { ...auth(tokenAdmin), "Content-Type": "application/json" }, body: JSON.stringify({}) }, [400]);
  await caso("GET histórico aperturas con sesión → 200", "GET", "/api/apertura", { headers: auth(tokenAdmin) }, [200]);

  // ---------- HEADERS DE SEGURIDAD (next.config.mjs) ----------
  {
    const res = await fetch(BASE + "/auth/login");
    const csp = res.headers.get("content-security-policy") || "";
    const check = (nombre, cond) =>
      resultados.push({ caso: nombre, status: res.status, esperado: "presente", resultado: cond ? "PASS" : "FAIL" });
    check("Header CSP presente con frame-ancestors 'none'", csp.includes("frame-ancestors 'none'"));
    check("Header X-Frame-Options DENY", res.headers.get("x-frame-options") === "DENY");
    check("Header X-Content-Type-Options nosniff", res.headers.get("x-content-type-options") === "nosniff");
    check("Header Referrer-Policy presente", !!res.headers.get("referrer-policy"));
    check("Header Permissions-Policy presente", !!res.headers.get("permissions-policy"));
  }

  // ---------- DOCUMENTOS: ARCHIVOS PRIVADOS ----------
  await caso("Archivo documento sin sesión → 401", "GET", "/api/documents/file/prueba.pdf", {}, [401]);
  await caso("Archivo documento sin sesión (navegador) → 401 o redirect login", "GET", "/api/documents/file/prueba.pdf", { headers: { Accept: "text/html" } }, [302, 307, 401]);
  await caso("Path traversal en filename (../../.env.local) → 400/404", "GET", "/api/documents/file/..%2F..%2F.env.local", { headers: auth(tokenAdmin) }, [400, 404]);
  {
    const dir = path.join(__dirname, "..", "uploads", "documents");
    const pdfs = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf")) : [];
    if (pdfs.length > 0) {
      const res = await fetch(BASE + `/api/documents/file/${encodeURIComponent(pdfs[0])}`, { headers: auth(tokenAdmin) });
      const contentType = res.headers.get("content-type") || "";
      const okFile = res.status === 200 && contentType.includes("pdf") && res.headers.get("x-content-type-options") === "nosniff";
      resultados.push({ caso: "Archivo real con sesión admin → 200 application/pdf + nosniff", status: res.status, esperado: "200", resultado: okFile ? "PASS" : "FAIL" });
    } else {
      resultados.push({ caso: "Archivo real con sesión admin → 200 application/pdf + nosniff", status: "-", esperado: "200", resultado: "SKIP (sin archivos locales)" });
    }
  }

  // ---------- SUBIDA DE DOCUMENTOS: VALIDACIÓN ESTRICTA ----------
  {
    const baseForm = () => {
      const fd = new FormData();
      fd.append("Nombre", "Test seguridad");
      fd.append("SubModuleId", "1");
      fd.append("Elaborado", "false");
      fd.append("Aprobado", "false");
      fd.append("Implementado", "false");
      fd.append("Actualizado", "false");
      fd.append("Difundido", "false");
      return fd;
    };

    // .html con MIME correcto: rechazado por extensión
    const f1 = baseForm();
    f1.append("file", new Blob(["<html><script>alert(1)</script></html>"], { type: "text/html" }), "xss.html");
    const r1 = await fetch(BASE + "/api/documents", { method: "POST", headers: auth(tokenAdmin), body: f1 });
    resultados.push({ caso: "Upload .html (XSS almacenado) → 400", status: r1.status, esperado: "400", resultado: r1.status === 400 ? "PASS" : "FAIL" });

    // .pdf con contenido HTML: rechazado por magic bytes
    const f2 = baseForm();
    f2.append("file", new Blob(["<html>fake pdf</html>"], { type: "application/pdf" }), "fake.pdf");
    const r2 = await fetch(BASE + "/api/documents", { method: "POST", headers: auth(tokenAdmin), body: f2 });
    resultados.push({ caso: "Upload .pdf con contenido HTML (magic bytes) → 400", status: r2.status, esperado: "400", resultado: r2.status === 400 ? "PASS" : "FAIL" });

    // .html renombrado a .pdf: rechazado por magic bytes
    const f3 = baseForm();
    f3.append("file", new Blob(["<html><script>alert(1)</script></html>"], { type: "application/pdf" }), "disfraz.pdf");
    const r3 = await fetch(BASE + "/api/documents", { method: "POST", headers: auth(tokenAdmin), body: f3 });
    resultados.push({ caso: "Upload HTML disfrazado de .pdf → 400", status: r3.status, esperado: "400", resultado: r3.status === 400 ? "PASS" : "FAIL" });
  }

  // ---------- RATE LIMITING DEL LOGIN ----------
  {
    const pagina = await fetch(BASE + "/auth/login");
    const html = await pagina.text();
    const m = html.match(/\$ACTION_ID_([a-f0-9]+)/);

    if (!m) {
      resultados.push({ caso: "Rate limit: localizar server action del login", status: "-", esperado: "$ACTION_ID_", resultado: "FAIL (no encontrado en HTML)" });
    } else {
      const actionId = m[1];
      const emailAtaque = `noexistente${Date.now()}@uncsm.edu.ni`;
      const postLogin = (email) => {
        const fd = new FormData();
        fd.set("email", email);
        fd.set("password", "PasswordIncorrecta1!");
        fd.set(`$ACTION_ID_${actionId}`, "");
        return fetch(BASE + "/auth/login", {
          method: "POST",
          redirect: "manual",
          headers: { Origin: BASE },
          body: fd,
        });
      };

      // 1er intento: debe decir "Credenciales inválidas" (sin bloqueo)
      const r1 = await postLogin(emailAtaque);
      const loc1 = decodeURIComponent(r1.headers.get("location") || "");
      resultados.push({ caso: "Login fallido #1 → 'Credenciales inválidas'", status: r1.status, esperado: "Credenciales inválidas", resultado: loc1.includes("Credenciales inválidas") ? "PASS" : `FAIL (loc=${loc1})` });

      // intentos 2..5 (fallidos) + 6º → debe estar bloqueado
      for (let i = 0; i < 5; i++) await postLogin(emailAtaque);
      const r6 = await postLogin(emailAtaque);
      const loc6 = decodeURIComponent(r6.headers.get("location") || "");
      resultados.push({ caso: "Rate limit: 6º intento fallido → bloqueado ('Demasiados intentos')", status: r6.status, esperado: "Demasiados intentos", resultado: loc6.includes("Demasiados intentos") ? "PASS" : `FAIL (loc=${loc6})` });
    }
  }

  console.table(resultados);
  const fallas = resultados.filter((r) => r.resultado !== "PASS");
  console.log(fallas.length === 0 ? "✅ TODAS LAS PRUEBAS PASARON" : `⚠️ ${fallas.length} fallas`);
  process.exit(fallas.length === 0 ? 0 : 1);
}

main();
