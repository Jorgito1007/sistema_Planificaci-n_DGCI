import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { sendMail } from "@/lib/sendMail";

// ============================================================
// GENERAR CONTRASEÑA TEMPORAL
// ============================================================

function generateTemporaryPassword(length = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*?";

  const all =
    upper +
    lower +
    numbers +
    symbols;

  const chars: string[] = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    numbers[crypto.randomInt(numbers.length)],
    symbols[crypto.randomInt(symbols.length)],
  ];

  while (chars.length < length) {
    chars.push(
      all[crypto.randomInt(all.length)]
    );
  }

  // Mezclar usando crypto
  for (let i = chars.length - 1; i > 0; i--) {
    const j =
      crypto.randomInt(i + 1);

    [chars[i], chars[j]] =
      [chars[j], chars[i]];
  }

  return chars.join("");
}

// ============================================================
// ESCAPAR HTML
// ============================================================

function escapeHtml(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// PLANTILLA DEL CORREO
// ============================================================

function buildResetPasswordEmail({
  fullName,
  email,
  temporaryPassword,
  loginUrl,
}: {
  fullName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}) {
  const safeName =
    escapeHtml(fullName);

  const safeEmail =
    escapeHtml(email);

  const safePassword =
    escapeHtml(temporaryPassword);

  const safeUrl =
    escapeHtml(loginUrl);

  return `
    <!DOCTYPE html>

    <html lang="es">

    <head>

      <meta charset="UTF-8" />

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      />

      <title>
        Reinicio de contraseña SCI
      </title>

    </head>

    <body
      style="
        margin:0;
        padding:0;
        background:#f4f6f8;
        font-family:Arial,Helvetica,sans-serif;
        color:#1e293b;
      "
    >

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
          background:#f4f6f8;
          padding:32px 12px;
        "
      >

        <tr>

          <td align="center">

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="
                max-width:620px;
                background:#ffffff;
                border-radius:18px;
                overflow:hidden;
                box-shadow:0 8px 30px rgba(15,23,42,.08);
              "
            >

              <!-- ============================================= -->
              <!-- ENCABEZADO                                    -->
              <!-- ============================================= -->

              <tr>

                <td
                  style="
                    padding:30px;
                    text-align:center;
                    background:#0B4DA2;
                    color:#ffffff;
                  "
                >

                  <div
                    style="
                      font-size:13px;
                      font-weight:700;
                      letter-spacing:1.5px;
                      text-transform:uppercase;
                      opacity:.85;
                    "
                  >
                    Universidad Nacional Casimiro Sotelo Montenegro
                  </div>

                  <div
                    style="
                      margin-top:10px;
                      font-size:26px;
                      font-weight:800;
                    "
                  >
                    Sistema de Control Interno
                  </div>

                  <div
                    style="
                      margin-top:5px;
                      font-size:16px;
                      font-weight:600;
                    "
                  >
                    SCI
                  </div>

                </td>

              </tr>


              <!-- ============================================= -->
              <!-- CONTENIDO                                     -->
              <!-- ============================================= -->

              <tr>

                <td
                  style="
                    padding:32px;
                  "
                >

                  <div
                    style="
                      font-size:22px;
                      font-weight:700;
                      color:#0f172a;
                    "
                  >
                    Contraseña restablecida
                  </div>


                  <p
                    style="
                      margin:18px 0 0;
                      font-size:15px;
                      line-height:1.7;
                      color:#475569;
                    "
                  >
                    Estimado(a)
                    <strong>
                      ${safeName}
                    </strong>:
                  </p>


                  <p
                    style="
                      margin:12px 0 0;
                      font-size:15px;
                      line-height:1.7;
                      color:#475569;
                    "
                  >
                    La contraseña de su cuenta en el
                    <strong>
                      Sistema de Control Interno (SCI)
                    </strong>
                    ha sido restablecida por un administrador.
                  </p>


                  <p
                    style="
                      margin:12px 0 0;
                      font-size:15px;
                      line-height:1.7;
                      color:#475569;
                    "
                  >
                    Se ha generado una nueva contraseña temporal
                    para que pueda ingresar nuevamente al sistema.
                  </p>


                  <!-- ========================================= -->
                  <!-- CREDENCIALES                              -->
                  <!-- ========================================= -->

                  <div
                    style="
                      margin-top:24px;
                      padding:20px;
                      background:#f8fafc;
                      border:1px solid #e2e8f0;
                      border-radius:14px;
                    "
                  >

                    <div
                      style="
                        font-size:12px;
                        font-weight:700;
                        color:#64748b;
                        text-transform:uppercase;
                        letter-spacing:.8px;
                      "
                    >
                      Correo institucional
                    </div>

                    <div
                      style="
                        margin-top:6px;
                        font-size:15px;
                        font-weight:700;
                        color:#0f172a;
                      "
                    >
                      ${safeEmail}
                    </div>


                    <div
                      style="
                        margin-top:20px;
                        font-size:12px;
                        font-weight:700;
                        color:#64748b;
                        text-transform:uppercase;
                        letter-spacing:.8px;
                      "
                    >
                      Nueva contraseña temporal
                    </div>


                    <div
                      style="
                        margin-top:8px;
                        padding:14px;
                        background:#ffffff;
                        border:1px dashed #c7a97a;
                        border-radius:10px;
                        text-align:center;
                        font-family:Consolas,Monaco,monospace;
                        font-size:20px;
                        font-weight:800;
                        letter-spacing:2px;
                        color:#0f172a;
                      "
                    >
                      ${safePassword}
                    </div>

                  </div>


                  <!-- ========================================= -->
                  <!-- BOTÓN                                     -->
                  <!-- ========================================= -->

                  <div
                    style="
                      text-align:center;
                      margin:28px 0;
                    "
                  >

                    <a
                      href="${safeUrl}"
                      style="
                        display:inline-block;
                        background:#c7a97a;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:16px;
                        font-weight:700;
                        padding:15px 30px;
                        border-radius:999px;
                      "
                    >
                      INGRESAR AL SCI
                    </a>

                  </div>


                  <!-- ========================================= -->
                  <!-- INSTRUCCIONES                             -->
                  <!-- ========================================= -->

                  <div
                    style="
                      margin-top:24px;
                      padding:20px;
                      background:#fffbeb;
                      border:1px solid #fde68a;
                      border-radius:14px;
                    "
                  >

                    <div
                      style="
                        font-size:14px;
                        font-weight:700;
                        color:#92400e;
                      "
                    >
                      Importante
                    </div>


                    <ol
                      style="
                        margin:12px 0 0;
                        padding-left:20px;
                        color:#78350f;
                        font-size:14px;
                        line-height:1.8;
                      "
                    >

                      <li>
                        Ingrese al SCI utilizando su correo institucional.
                      </li>

                      <li>
                        Utilice la contraseña temporal proporcionada en este correo.
                      </li>

                      <li>
                        El sistema le solicitará establecer una nueva contraseña personal.
                      </li>

                      <li>
                        La nueva contraseña deberá cumplir los requisitos de seguridad establecidos.
                      </li>

                    </ol>

                  </div>


                  <!-- ========================================= -->
                  <!-- SEGURIDAD                                 -->
                  <!-- ========================================= -->

                  <div
                    style="
                      margin-top:24px;
                      padding-top:20px;
                      border-top:1px solid #e2e8f0;
                    "
                  >

                    <p
                      style="
                        margin:0;
                        font-size:13px;
                        line-height:1.7;
                        color:#64748b;
                      "
                    >
                      Por seguridad, no comparta su contraseña con otras personas.
                      El personal administrador del SCI nunca le solicitará su
                      contraseña personal.
                    </p>

                  </div>

                </td>

              </tr>


              <!-- ============================================= -->
              <!-- PIE                                           -->
              <!-- ============================================= -->

              <tr>

                <td
                  style="
                    padding:22px 30px;
                    text-align:center;
                    background:#f8fafc;
                    border-top:1px solid #e2e8f0;
                  "
                >

                  <div
                    style="
                      font-size:12px;
                      color:#64748b;
                    "
                  >
                    Sistema de Control Interno - SCI
                  </div>

                  <div
                    style="
                      margin-top:4px;
                      font-size:11px;
                      color:#94a3b8;
                    "
                  >
                    Universidad Nacional Casimiro Sotelo Montenegro
                  </div>

                </td>

              </tr>

            </table>

          </td>

        </tr>

      </table>

    </body>

    </html>
  `;
}

// ============================================================
// POST
// /api/admin/users/[userId]/reset-password
// ============================================================

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json(
        {
          ok: false,
          error: "No autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const role = String(
      me.role || ""
    )
      .trim()
      .toLowerCase();

    if (role !== "administrador") {
      return NextResponse.json(
        {
          ok: false,
          error: "No autorizado.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // OBTENER USER ID
    // ========================================================

    const resolvedParams =
      await params;

  const { id } = await params;

const userId = id;

    console.log(
      "RESET PASSWORD PARAMS:",
      resolvedParams
    );

    console.log(
      "RESET PASSWORD USER ID:",
      userId
    );

    if (
  !userId ||
  userId === "undefined" ||
  userId === "null"
) {
  return NextResponse.json(
    {
      ok: false,
      error: "Usuario inválido.",
    },
    {
      status: 400,
    }
  );
}

    // ========================================================
    // 3. BUSCAR USUARIO
    // ========================================================

    const pool =
      await getPool();

    const result =
      await pool
        .request()
        .input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        )
        .query(`
          SELECT TOP 1
            U.UserId,
            U.Email,
            U.FullName,
            U.Cargo,
            U.IsActive,
            R.RoleKey,
            R.RoleName
          FROM dbo.Usuarios_Dgci U
          LEFT JOIN dbo.UserRoles_Dgci UR
            ON UR.UserId = U.UserId
          LEFT JOIN dbo.Roles_Dgci R
            ON R.RoleId = UR.RoleId
          WHERE U.UserId = @UserId;
        `);

    const user =
      result.recordset[0];

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El usuario no existe.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // 4. GENERAR NUEVA CONTRASEÑA TEMPORAL
    // ========================================================

    const temporaryPassword =
      generateTemporaryPassword(
        12
      );

    const passwordHash =
      await bcrypt.hash(
        temporaryPassword,
        10
      );

    // ========================================================
    // 5. ACTUALIZAR CONTRASEÑA
    // ========================================================

    await pool
      .request()
      .input(
        "UserId",
        sql.UniqueIdentifier,
        userId
      )
      .input(
        "PasswordHash",
        sql.NVarChar(255),
        passwordHash
      )
      .query(`
        UPDATE dbo.Usuarios_Dgci
        SET
          PasswordHash = @PasswordHash,
          MustChangePassword = 1,
          UpdatedAt = SYSDATETIME()
        WHERE UserId = @UserId;
      `);

    // ========================================================
    // 6. CONSTRUIR URL DEL LOGIN
    // ========================================================

    const appUrl =
      (
        process.env
          .NEXT_PUBLIC_APP_URL ||
        "http://sci.uncsm.edu.ni:3000"
      ).replace(/\/$/, "");

    const loginUrl =
      `${appUrl}/auth/login`;

    // ========================================================
    // 7. ENVIAR CORREO
    // ========================================================

    let emailSent =
      false;

    let warning:
      | string
      | null = null;

    try {
      await sendMail({
        to:
          String(
            user.Email
          ).trim(),

        subject:
          "SCI - Reinicio de contraseña",

        html:
          buildResetPasswordEmail({
            fullName:
              String(
                user.FullName ||
                  user.Email
              ).trim(),

            email:
              String(
                user.Email
              ).trim(),

            temporaryPassword,

            loginUrl,
          }),
      });

      emailSent =
        true;
    } catch (mailError) {
      console.error(
        "Error enviando correo de reinicio de contraseña:",
        mailError
      );

      warning =
        "La contraseña fue reiniciada, pero no fue posible enviar el correo al usuario.";
    }

    // ========================================================
    // 8. RESPUESTA
    // ========================================================

    return NextResponse.json(
      {
        ok: true,

        message:
          emailSent
            ? "La contraseña fue reiniciada y enviada al correo institucional."
            : "La contraseña fue reiniciada.",

        emailSent,

        warning,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Error reiniciando contraseña:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "No se pudo reiniciar la contraseña del usuario.",

        detail:
          "Contacte al administrador del sistema.",
      },
      {
        status: 500,
      }
    );
  }
}