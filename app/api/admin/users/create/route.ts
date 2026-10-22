import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getPool, sql } from "@/lib/db";
import { sendMail } from "@/lib/sendMail";


function generateTemporaryPassword(length = 12) {
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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildWelcomeEmail({
  fullName, email, cargo, roleName, temporaryPassword,
}: {
  fullName: string;
  email: string;
  cargo: string;
  roleName: string;
  temporaryPassword: string;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://sci.uncsm.edu.ni:3000").replace(/\/$/, "");
  const loginUrl = `${baseUrl}/auth/login`;

  const name = escapeHtml(fullName || "Usuario(a)");
  const safeEmail = escapeHtml(email);
  const safeCargo = escapeHtml(cargo || "No especificado");
  const safeRole = escapeHtml(roleName || "Usuario");
  const safePassword = escapeHtml(temporaryPassword);
  const safeUrl = escapeHtml(loginUrl);

  return `
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f6f8;font-family:Arial,Helvetica,sans-serif;color:#334155;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f6f8;padding:28px 12px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#0B4DA2;padding:28px 36px;text-align:center;color:#fff;">
<div style="font-size:13px;letter-spacing:.8px;text-transform:uppercase;">Universidad Nacional Casimiro Sotelo Montenegro</div>
<div style="font-size:28px;font-weight:700;margin-top:8px;">Sistema de Control Interno - SCI</div>
</td></tr>
<tr><td style="padding:36px;">
<h1 style="margin:0 0 22px;color:#0B4DA2;font-size:27px;text-align:center;">¡Bienvenido(a) al SCI!</h1>
<p style="font-size:16px;line-height:1.7;">Estimado(a) <strong>${name}</strong>, reciba un cordial saludo.</p>
<p style="font-size:16px;line-height:1.7;">Se ha creado su perfil de acceso al <strong>Sistema de Control Interno (SCI)</strong> de la Universidad Nacional Casimiro Sotelo Montenegro.</p>

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:24px 0;">
<tr><td style="padding:22px 24px;">
<div style="font-size:13px;color:#64748b;margin-bottom:5px;">Cargo</div>
<div style="font-size:16px;font-weight:700;margin-bottom:16px;">${safeCargo}</div>
<div style="font-size:13px;color:#64748b;margin-bottom:5px;">Rol de acceso</div>
<div style="font-size:16px;font-weight:700;margin-bottom:16px;">${safeRole}</div>
<div style="font-size:13px;color:#64748b;margin-bottom:5px;">Correo institucional (usuario)</div>
<div style="font-size:16px;font-weight:700;margin-bottom:16px;">${safeEmail}</div>
<div style="font-size:13px;color:#64748b;margin-bottom:5px;">Contraseña temporal</div>
<div style="font-family:Consolas,monospace;font-size:20px;font-weight:700;letter-spacing:1px;">${safePassword}</div>
</td></tr></table>

<div style="text-align:center;margin:28px 0;">
  <a
    href="${safeUrl}"
    style="display:inline-block;background:#c7a97a;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:15px 30px;border-radius:999px;"
  >
    Ingresar al SCI
  </a>
</div>

<div style="font-size:16px;font-weight:700;margin:28px 0 10px;">Para su primer ingreso:</div>
<ol style="padding-left:22px;color:#475569;font-size:15px;line-height:1.8;">
<li>Ingrese con su correo institucional y la contraseña temporal indicada.</li>
<li>El sistema solicitará establecer una nueva contraseña personal.</li>
<li>Defina y confirme su nueva contraseña.</li>
<li>Después del cambio podrá acceder normalmente al SCI.</li>
</ol>

<div style="margin-top:26px;padding:16px 18px;background:#fff7ed;border-left:4px solid #f59e0b;border-radius:8px;color:#92400e;font-size:14px;line-height:1.6;">
<strong>Importante:</strong> por seguridad, no comparta esta contraseña temporal.
</div>
<p style="margin:28px 0 0;color:#64748b;font-size:13px;text-align:center;">Mensaje automático del Sistema de Control Interno (SCI).</p>
</td></tr></table>
</td></tr></table>
</body>
</html>`;
}

export async function POST(httpReq: Request) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  try {
    // ============================================================
    // 1. VALIDAR USUARIO ACTUAL
    // ============================================================

    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json(
        { error: "No auth" },
        { status: 401 }
      );
    }

    const role = String(me.role || "")
      .toLowerCase()
      .trim();

    if (role !== "administrador") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // ============================================================
    // 2. LEER BODY
    // ============================================================

    const body = await httpReq.json();

    const {
      email,
      full_name,
      cargo,
      roleKey,
      is_active,

      // Permisos generales
      modules,
      permissions,

      // Matriz por Componentes
      principles,
      principleQuestions,

      // Sistema Administrativo
      questions,
    } = body;

    // ============================================================
    // 3. VALIDACIONES
    // ============================================================

    if (!email || !full_name || !cargo || !roleKey) {
      return NextResponse.json(
        {
          error:
            "Faltan datos obligatorios",
        },
        { status: 400 }
      );
    }

    const actorUserId = me.userId;

    // ============================================================
    // 4. INICIAR TRANSACCIÓN
    // ============================================================

    await tx.begin();

    // ============================================================
    // 5. VERIFICAR SI EL USUARIO YA EXISTE
    // ============================================================

    const exists =
      await new sql.Request(tx)
        .input(
          "Email",
          sql.NVarChar(255),
          String(email).trim()
        )
        .query(`
          SELECT TOP 1
            UserId
          FROM dbo.Usuarios_Dgci
          WHERE Email = @Email;
        `);

    if (
      exists.recordset.length > 0
    ) {
      await tx.rollback();

      return NextResponse.json(
        {
          error:
            "El usuario ya existe",
        },
        { status: 409 }
      );
    }

    // ============================================================
    // 6. OBTENER ROLE ID
    // ============================================================

    const roleRow =
      await new sql.Request(tx)
        .input(
          "RoleKey",
          sql.NVarChar(50),
          roleKey
        )
        .query(`
          SELECT TOP 1
            RoleId,
            RoleName
          FROM dbo.Roles_Dgci
          WHERE RoleKey = @RoleKey;
        `);

    if (
      roleRow.recordset.length ===
      0
    ) {
      await tx.rollback();

      return NextResponse.json(
        {
          error: `RoleKey no existe: ${roleKey}`,
        },
        { status: 400 }
      );
    }

    const roleId = Number(
      roleRow.recordset[0].RoleId
    );

    const roleName = String(
      roleRow.recordset[0].RoleName || roleKey
    );

    // ============================================================
// 7. CREAR USUARIO
// CONTRASEÑA INICIAL = PROVISIONAL
// ============================================================

const temporaryPassword =
  generateTemporaryPassword(12);

const hash = await bcrypt.hash(
  temporaryPassword,
  10
);

const inserted =
  await new sql.Request(tx)
    .input(
      "Email",
      sql.NVarChar(255),
      String(email).trim()
    )
    .input(
      "FullName",
      sql.NVarChar(200),
      full_name ?? null
    )
    .input(
      "Cargo",
      sql.NVarChar(200),
      cargo?.trim() || null
    )
    .input(
      "PasswordHash",
      sql.NVarChar(255),
      hash
    )
    .input(
      "IsActive",
      sql.Bit,
      is_active ? 1 : 0
    )
    .input(
      "MustChangePassword",
      sql.Bit,
      1
    )
    .query(`
      INSERT INTO dbo.Usuarios_Dgci
      (
        Email,
        FullName,
        Cargo,
        PasswordHash,
        IsActive,
        MustChangePassword
      )
      OUTPUT
        INSERTED.UserId
      VALUES
      (
        @Email,
        @FullName,
        @Cargo,
        @PasswordHash,
        @IsActive,
        @MustChangePassword
      );
    `);

const userId =
  inserted.recordset[0].UserId;

    // ============================================================
    // 8. ASIGNAR ROL
    // ============================================================

    await new sql.Request(tx)
      .input(
        "UserId",
        sql.UniqueIdentifier,
        userId
      )
      .input(
        "RoleId",
        sql.Int,
        roleId
      )
      .query(`
        INSERT INTO dbo.UserRoles_Dgci
        (
          UserId,
          RoleId
        )
        VALUES
        (
          @UserId,
          @RoleId
        );
      `);

    // ============================================================
    // 9. PERMISOS DE MÓDULOS
    // ============================================================

    if (
      Array.isArray(modules) &&
      modules.length > 0
    ) {
      const validModules =
        modules
          .map((m: any) => ({
            moduleId:
              Number(m.moduleId),

            canView:
              !!m.canView,

            canCreate:
              !!m.canCreate,

            canEdit:
              !!m.canEdit,

            canDelete:
              !!m.canDelete,
          }))
          .filter(
            (m: any) =>
              Number.isFinite(
                m.moduleId
              ) &&
              m.moduleId > 0
          );

      if (
        validModules.length > 0
      ) {
        const valuesSql =
          validModules
            .map(
              (
                m: any,
                i: number
              ) =>
                `(
                  @UserId,
                  @ModuleId${i},
                  ${m.canView ? 1 : 0},
                  ${m.canCreate ? 1 : 0},
                  ${m.canEdit ? 1 : 0},
                  ${m.canDelete ? 1 : 0}
                )`
            )
            .join(",");

        const reqMod =
          new sql.Request(tx);

        reqMod.input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        );

        validModules.forEach(
          (
            m: any,
            i: number
          ) => {
            reqMod.input(
              `ModuleId${i}`,
              sql.Int,
              m.moduleId
            );
          }
        );

        await reqMod.query(`
          INSERT INTO dbo.usuariosModulosPermisos
          (
            UserId,
            ModuleId,
            CanView,
            CanCreate,
            CanEdit,
            CanDelete
          )
          VALUES
            ${valuesSql};
        `);

        console.log(
          "Módulos insertados:",
          validModules.length
        );
      }
    }

    // ============================================================
    // 10. PERMISOS DE SUBMÓDULOS
    // ============================================================

    if (
      Array.isArray(permissions) &&
      permissions.length > 0
    ) {
      const validPerms =
        permissions
          .map((p: any) => ({
            subModuleId:
              Number(
                p.subModuleId
              ),

            canView:
              !!p.canView,

            canCreate:
              !!p.canCreate,

            canEdit:
              !!p.canEdit,

            canDelete:
              !!p.canDelete,
          }))
          .filter(
            (p: any) =>
              Number.isFinite(
                p.subModuleId
              ) &&
              p.subModuleId > 0
          );

      if (
        validPerms.length === 0
      ) {
        throw new Error(
          "Permisos llegaron pero ningún SubModuleId es INT válido"
        );
      }

      const valuesSql =
        validPerms
          .map(
            (
              p: any,
              i: number
            ) =>
              `(
                @UserId,
                @SubId${i},
                ${p.canView ? 1 : 0},
                ${p.canCreate ? 1 : 0},
                ${p.canEdit ? 1 : 0},
                ${p.canDelete ? 1 : 0}
              )`
          )
          .join(",");

      const reqPerm =
        new sql.Request(tx);

      reqPerm.input(
        "UserId",
        sql.UniqueIdentifier,
        userId
      );

      validPerms.forEach(
        (
          p: any,
          i: number
        ) => {
          reqPerm.input(
            `SubId${i}`,
            sql.Int,
            p.subModuleId
          );
        }
      );

      await reqPerm.query(`
        INSERT INTO dbo.usuariosSubmodulospermisos
        (
          UserId,
          SubModuleId,
          CanView,
          CanCreate,
          CanEdit,
          CanDelete
        )
        VALUES
          ${valuesSql};
      `);

      console.log(
        "Submódulos insertados:",
        validPerms.length
      );
    }

    // ============================================================
    // 11. PERMISOS POR PRINCIPIOS
    //     MATRIZ POR COMPONENTES
    // ============================================================

    if (
      Array.isArray(principles) &&
      principles.length > 0
    ) {
      const validPrinciples =
        principles
          .map((p: any) => ({
            subModuleId:
              Number(
                p.subModuleId
              ),

            principioId:
              Number(
                p.principleId
              ),

            canView:
              !!p.canView,

            canCreate:
              !!p.canCreate,

            canEdit:
              !!p.canEdit,

            canDelete:
              !!p.canDelete,
          }))
          .filter(
            (p: any) =>
              Number.isFinite(
                p.subModuleId
              ) &&
              p.subModuleId > 0 &&
              Number.isFinite(
                p.principioId
              ) &&
              p.principioId > 0
          );

      if (
        validPrinciples.length >
        0
      ) {
        const valuesSql =
          validPrinciples
            .map(
              (
                p: any,
                i: number
              ) =>
                `(
                  @UserId,
                  @SubIdP${i},
                  @PrincipioId${i},
                  ${p.canView ? 1 : 0},
                  ${p.canCreate ? 1 : 0},
                  ${p.canEdit ? 1 : 0},
                  ${p.canDelete ? 1 : 0}
                )`
            )
            .join(",");

        const reqPrinciples =
          new sql.Request(tx);

        reqPrinciples.input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        );

        validPrinciples.forEach(
          (
            p: any,
            i: number
          ) => {
            reqPrinciples.input(
              `SubIdP${i}`,
              sql.Int,
              p.subModuleId
            );

            reqPrinciples.input(
              `PrincipioId${i}`,
              sql.Int,
              p.principioId
            );
          }
        );

        await reqPrinciples.query(`
          INSERT INTO dbo.usuariosPrincipiosPermisos
          (
            UserId,
            SubModuleId,
            PrincipioId,
            CanView,
            CanCreate,
            CanEdit,
            CanDelete
          )
          VALUES
            ${valuesSql};
        `);

        console.log(
          "Principios insertados:",
          validPrinciples.length
        );
      }
    }

    // ============================================================
    // 12. PREGUNTAS DE MATRIZ POR COMPONENTES
    //
    // Tabla:
    // dbo.usuariosPrincipiosPreguntasPermisos
    //
    // QuestionId:
    // dbo.EvaluacionesPrincipioDetalleDGCI.Id
    // ============================================================

    if (
      Array.isArray(
        principleQuestions
      ) &&
      principleQuestions.length >
        0
    ) {
      const validPrincipleQuestions =
        principleQuestions
          .map((q: any) => ({
            subModuleId:
              Number(
                q.subModuleId
              ),

            questionId:
              Number(
                q.questionId
              ),

            canView:
              !!q.canView,

            canCreate:
              !!q.canCreate,

            canEdit:
              !!q.canEdit,

            canDelete:
              !!q.canDelete,
          }))
          .filter(
            (q: any) =>
              Number.isFinite(
                q.subModuleId
              ) &&
              q.subModuleId > 0 &&
              Number.isFinite(
                q.questionId
              ) &&
              q.questionId > 0
          );

      if (
        validPrincipleQuestions.length >
        0
      ) {
        // --------------------------------------------------------
        // VALIDAR QUE LAS PREGUNTAS REALMENTE PERTENEZCAN
        // AL SUBMÓDULO INDICADO.
        // --------------------------------------------------------

        for (
          const q of
            validPrincipleQuestions
        ) {
          const questionExists =
            await new sql.Request(
              tx
            )
              .input(
                "QuestionId",
                sql.Int,
                q.questionId
              )
              .input(
                "SubModuleId",
                sql.Int,
                q.subModuleId
              )
              .query(`
                SELECT TOP 1
                  d.Id
                FROM dbo.EvaluacionesPrincipioDetalleDGCI d
                INNER JOIN dbo.EvaluacionesPrincipioDGCI ep
                  ON ep.Id = d.EvaluacionPrincipioId
                WHERE
                  d.Id = @QuestionId
                  AND ep.SubModuleId = @SubModuleId;
              `);

          if (
            questionExists
              .recordset.length ===
            0
          ) {
            throw new Error(
              `La pregunta ${q.questionId} no pertenece al submódulo ${q.subModuleId}.`
            );
          }
        }

        // --------------------------------------------------------
        // INSERTAR PERMISOS
        // --------------------------------------------------------

        const valuesSql =
          validPrincipleQuestions
            .map(
              (
                q: any,
                i: number
              ) =>
                `(
                  @UserId,
                  @SubIdPQ${i},
                  @QuestionIdPQ${i},
                  ${q.canView ? 1 : 0},
                  ${q.canCreate ? 1 : 0},
                  ${q.canEdit ? 1 : 0},
                  ${q.canDelete ? 1 : 0}
                )`
            )
            .join(",");

        const reqPQ =
          new sql.Request(tx);

        reqPQ.input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        );

        validPrincipleQuestions.forEach(
          (
            q: any,
            i: number
          ) => {
            reqPQ.input(
              `SubIdPQ${i}`,
              sql.Int,
              q.subModuleId
            );

            reqPQ.input(
              `QuestionIdPQ${i}`,
              sql.Int,
              q.questionId
            );
          }
        );

        await reqPQ.query(`
          INSERT INTO dbo.usuariosPrincipiosPreguntasPermisos
          (
            UserId,
            SubModuleId,
            QuestionId,
            CanView,
            CanCreate,
            CanEdit,
            CanDelete
          )
          VALUES
            ${valuesSql};
        `);

        console.log(
          "Preguntas por componentes insertadas:",
          validPrincipleQuestions.length
        );
      }
    }

    // ============================================================
    // 13. PREGUNTAS DEL SISTEMA ADMINISTRATIVO
    //
    // Tabla:
    // dbo.usuariosPreguntasPermisos
    //
    // QuestionId:
    // dbo.Matriz_SistemaAdministrativoDetalle.Id
    // ============================================================

    if (
      Array.isArray(questions) &&
      questions.length > 0
    ) {
      const validQuestions =
        questions
          .map((q: any) => ({
            subModuleId:
              Number(
                q.subModuleId
              ),

            questionId:
              Number(
                q.questionId
              ),

            canView:
              !!q.canView,

            canCreate:
              !!q.canCreate,

            canEdit:
              !!q.canEdit,

            canDelete:
              !!q.canDelete,
          }))
          .filter(
            (q: any) =>
              Number.isFinite(
                q.subModuleId
              ) &&
              q.subModuleId > 0 &&
              Number.isFinite(
                q.questionId
              ) &&
              q.questionId > 0
          );

      if (
        validQuestions.length >
        0
      ) {
        const valuesSql =
          validQuestions
            .map(
              (
                q: any,
                i: number
              ) =>
                `(
                  @UserId,
                  @SubIdQ${i},
                  @QuestionId${i},
                  ${q.canView ? 1 : 0},
                  ${q.canCreate ? 1 : 0},
                  ${q.canEdit ? 1 : 0},
                  ${q.canDelete ? 1 : 0}
                )`
            )
            .join(",");

        const reqQuestions =
          new sql.Request(tx);

        reqQuestions.input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        );

        validQuestions.forEach(
          (
            q: any,
            i: number
          ) => {
            reqQuestions.input(
              `SubIdQ${i}`,
              sql.Int,
              q.subModuleId
            );

            reqQuestions.input(
              `QuestionId${i}`,
              sql.Int,
              q.questionId
            );
          }
        );

        await reqQuestions.query(`
          INSERT INTO dbo.usuariosPreguntasPermisos
          (
            UserId,
            SubModuleId,
            QuestionId,
            CanView,
            CanCreate,
            CanEdit,
            CanDelete
          )
          VALUES
            ${valuesSql};
        `);

        // --------------------------------------------------------
        // ACTOR USER ID
        // SOLO SISTEMA ADMINISTRATIVO
        // --------------------------------------------------------

        for (
          const q of
            validQuestions
        ) {
          await new sql.Request(
            tx
          )
            .input(
              "UserId",
              sql.UniqueIdentifier,
              userId
            )
            .input(
              "QuestionId",
              sql.Int,
              q.questionId
            )
            .query(`
              UPDATE dbo.Matriz_SistemaAdministrativoDetalle
              SET
                ActorUserId = @UserId,
                FechaActualizacion = GETDATE()
              WHERE Id = @QuestionId;
            `);
        }

        console.log(
          "Preguntas Sistema Administrativo insertadas:",
          validQuestions.length
        );
      }
    }

    // ============================================================
    // 14. AUDITORÍA
    // ============================================================

    if (actorUserId) {
      await new sql.Request(tx)
        .input(
          "ActorUserId",
          sql.UniqueIdentifier,
          actorUserId
        )
        .input(
          "Action",
          sql.NVarChar(50),
          "CREATE_USER"
        )
        .input(
          "Entity",
          sql.NVarChar(50),
          "Users"
        )
        .input(
          "EntityId",
          sql.NVarChar(100),
          String(userId)
        )
        .input(
          "Details",
          sql.NVarChar(
            sql.MAX
          ),
          JSON.stringify({
            email,
            roleKey,
            modules:
              Array.isArray(
                modules
              )
                ? modules.length
                : 0,

            submodules:
              Array.isArray(
                permissions
              )
                ? permissions.length
                : 0,

            principles:
              Array.isArray(
                principles
              )
                ? principles.length
                : 0,

            principleQuestions:
              Array.isArray(
                principleQuestions
              )
                ? principleQuestions.length
                : 0,

            questions:
              Array.isArray(
                questions
              )
                ? questions.length
                : 0,
          })
        )
        .query(`
          INSERT INTO dbo.Auditoria_Datos_Dgci
          (
            ActorUserId,
            Action,
            Entity,
            EntityId,
            Details
          )
          VALUES
          (
            @ActorUserId,
            @Action,
            @Entity,
            @EntityId,
            @Details
          );
        `);
    }

    // ============================================================
    // 15. COMMIT
    // ============================================================

    await tx.commit();

    console.log(
      "Usuario creado:",
      userId
    );

    let emailSent = false;
    let warning: string | null = null;

    try {
      await sendMail({
        to: String(email).trim(),
        subject: "Bienvenido(a) al SCI - Credenciales de acceso",
        html: buildWelcomeEmail({
          fullName: String(full_name || "").trim(),
          email: String(email).trim(),
          cargo: String(cargo || "").trim(),
          roleName,
          temporaryPassword,
        }),
      });

      emailSent = true;

      console.log(
        "Correo de bienvenida enviado:",
        String(email).trim()
      );
    } catch (mailError) {
      warning =
        "El usuario fue creado correctamente, pero no fue posible enviar el correo de bienvenida.";

      console.error(
        "ERROR ENVIANDO CORREO DE BIENVENIDA:",
        mailError
      );
    }

    return NextResponse.json({
      ok: true,
      userId,
      emailSent,
      warning,
    });

  } catch (err: any) {
    // ============================================================
    // ROLLBACK
    // ============================================================

    try {
      await tx.rollback();
    } catch {}

    console.error(
      "CREATE USER ERROR:",
      err
    );

    return NextResponse.json(
      {
        error:
          "Server error",

        detail:
          "Contacte al administrador del sistema.",
      },
      {
        status: 500,
      }
    );
  }
}