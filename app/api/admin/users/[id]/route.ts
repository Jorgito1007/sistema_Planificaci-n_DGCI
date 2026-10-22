import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool, sql } from "@/lib/db";
import {
  getCurrentUser,
  getCurrentUserFromToken,
  getUserByEmail,
} from "@/lib/current-user";

// ============================================================
// VALIDAR ADMINISTRADOR
// ============================================================

async function requireAdmin() {
  let currentUser = await getCurrentUser();

  if (!currentUser) {
    const tokenUser =
      await getCurrentUserFromToken();

    if (tokenUser?.email) {
      currentUser =
        await getUserByEmail(
          tokenUser.email
        );
    }
  }

  if (!currentUser) {
    return null;
  }

  const role = String(
    currentUser.role || ""
  )
    .toLowerCase()
    .trim();

  if (role !== "administrador") {
    return null;
  }

  return currentUser;
}

// ============================================================
// OBTENER USER ID DESDE URL
// /api/admin/users/[userId]
// ============================================================

function getUserIdFromUrl(
  req: Request
) {
  const url = new URL(req.url);

  const parts =
    url.pathname
      .split("/")
      .filter(Boolean);

  return parts[3];
}

// ============================================================
// VALIDAR GUID
// ============================================================

function isGuid(value: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

// ============================================================
// PUT
// ACTUALIZAR USUARIO Y PERMISOS
// ============================================================

export async function PUT(
  req: Request
) {
  const pool = await getPool();

  const tx =
    new sql.Transaction(pool);

  try {
    // ==========================================================
    // 1. VALIDAR ADMIN
    // ==========================================================

    const me =
      await requireAdmin();

    if (!me) {
      return NextResponse.json(
        {
          error:
            "No autorizado",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================================
    // 2. USER ID
    // ==========================================================

    const userId =
      getUserIdFromUrl(req);

    if (!isGuid(userId)) {
      return NextResponse.json(
        {
          error:
            "UserId inválido",

          detail:
            userId,
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================================
    // 3. BODY
    // ==========================================================

    const body =
      await req.json();

    const {
      email,
      full_name,
      cargo,
      password,
      roleKey,
      is_active,

      // Módulos
      modules,

      // Submódulos
      permissions,

      // Principios de Por Componentes
      principles,

      // Sistema Administrativo
      questions,

      // Preguntas de Por Componentes
      principleQuestions,
    } = body;

    // ==========================================================
    // 4. VALIDACIONES
    // ==========================================================

    if (!email || !roleKey) {
      return NextResponse.json(
        {
          error:
            "Faltan datos",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================================
    // 5. INICIAR TRANSACCIÓN
    // ==========================================================

    await tx.begin();

    // ==========================================================
    // 6. VERIFICAR QUE EL USUARIO EXISTA
    // ==========================================================

    const userExists =
      await new sql.Request(tx)
        .input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        )
        .query(`
          SELECT TOP 1
            UserId
          FROM dbo.Usuarios_Dgci
          WHERE UserId = @UserId;
        `);

    if (
      userExists.recordset.length ===
      0
    ) {
      await tx.rollback();

      return NextResponse.json(
        {
          error:
            "Usuario no encontrado",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================================
    // 7. VALIDAR QUE EL CORREO NO PERTENEZCA A OTRO USUARIO
    // ==========================================================

    const emailExists =
      await new sql.Request(tx)
        .input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        )
        .input(
          "Email",
          sql.NVarChar(255),
          String(email).trim()
        )
        .query(`
          SELECT TOP 1
            UserId
          FROM dbo.Usuarios_Dgci
          WHERE LOWER(Email) = LOWER(@Email)
            AND UserId <> @UserId;
        `);

    if (
      emailExists.recordset.length >
      0
    ) {
      await tx.rollback();

      return NextResponse.json(
        {
          error:
            "El correo ya pertenece a otro usuario",
        },
        {
          status: 409,
        }
      );
    }

  // ==========================================================
// 8. ACTUALIZAR DATOS DEL USUARIO
// ==========================================================

await new sql.Request(tx)
  .input(
    "UserId",
    sql.UniqueIdentifier,
    userId
  )
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
    "IsActive",
    sql.Bit,
    is_active ? 1 : 0
  )
  .query(`
    UPDATE dbo.Usuarios_Dgci
    SET
      Email = @Email,
      FullName = @FullName,
      Cargo = @Cargo,
      IsActive = @IsActive,
      UpdatedAt = SYSDATETIME()
    WHERE UserId = @UserId;
  `);


  // ==========================================================
// 9. CONTRASEÑA PROVISIONAL
//
// Si el administrador establece una nueva contraseña,
// el usuario deberá cambiarla al iniciar sesión.
// ==========================================================

if (
  password &&
  String(password).trim().length > 0
) {
  const hash = await bcrypt.hash(
    password,
    10
  );

  await new sql.Request(tx)
    .input(
      "UserId",
      sql.UniqueIdentifier,
      userId
    )
    .input(
      "PasswordHash",
      sql.NVarChar(255),
      hash
    )
    .query(`
      UPDATE dbo.Usuarios_Dgci
      SET
        PasswordHash = @PasswordHash,
        MustChangePassword = 1,
        UpdatedAt = SYSDATETIME()
      WHERE UserId = @UserId;
    `);
}
  
    // ==========================================================
    // 10. OBTENER ROLE ID
    // ==========================================================

    const roleRow =
      await new sql.Request(tx)
        .input(
          "RoleKey",
          sql.NVarChar(50),
          roleKey
        )
        .query(`
          SELECT TOP 1
            RoleId
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
          error:
            `RoleKey no existe: ${roleKey}`,
        },
        {
          status: 400,
        }
      );
    }

    const roleId =
      Number(
        roleRow.recordset[0]
          .RoleId
      );

    // ==========================================================
    // 11. ACTUALIZAR ROL
    // ==========================================================

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
        UPDATE dbo.UserRoles_Dgci
        SET RoleId = @RoleId
        WHERE UserId = @UserId;

        IF @@ROWCOUNT = 0
        BEGIN
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
        END
      `);

    // ==========================================================
    // 12. MÓDULOS
    // ELIMINAR ANTERIORES
    // ==========================================================

    await new sql.Request(tx)
      .input(
        "UserId",
        sql.UniqueIdentifier,
        userId
      )
      .query(`
        DELETE
        FROM dbo.usuariosModulosPermisos
        WHERE UserId = @UserId;
      `);

    // ==========================================================
    // INSERTAR MÓDULOS NUEVOS
    // ==========================================================

    if (Array.isArray(modules)) {
      for (const m of modules) {
        const moduleId =
          Number(m.moduleId);

        if (
          !Number.isFinite(
            moduleId
          ) ||
          moduleId <= 0
        ) {
          continue;
        }

        await new sql.Request(tx)
          .input(
            "UserId",
            sql.UniqueIdentifier,
            userId
          )
          .input(
            "ModuleId",
            sql.Int,
            moduleId
          )
          .input(
            "CanView",
            sql.Bit,
            m.canView ? 1 : 0
          )
          .input(
            "CanCreate",
            sql.Bit,
            m.canCreate ? 1 : 0
          )
          .input(
            "CanEdit",
            sql.Bit,
            m.canEdit ? 1 : 0
          )
          .input(
            "CanDelete",
            sql.Bit,
            m.canDelete ? 1 : 0
          )
          .query(`
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
            (
              @UserId,
              @ModuleId,
              @CanView,
              @CanCreate,
              @CanEdit,
              @CanDelete
            );
          `);
      }
    }

    // ==========================================================
    // 13. SUBMÓDULOS
    // ELIMINAR ANTERIORES
    // ==========================================================

    await new sql.Request(tx)
      .input(
        "UserId",
        sql.UniqueIdentifier,
        userId
      )
      .query(`
        DELETE
        FROM dbo.usuariosSubmodulospermisos
        WHERE UserId = @UserId;
      `);

    // ==========================================================
    // INSERTAR SUBMÓDULOS NUEVOS
    // ==========================================================

    if (
      Array.isArray(
        permissions
      )
    ) {
      for (
        const p of permissions
      ) {
        const subModuleId =
          Number(
            p.subModuleId
          );

        if (
          !Number.isFinite(
            subModuleId
          ) ||
          subModuleId <= 0
        ) {
          continue;
        }

        await new sql.Request(tx)
          .input(
            "UserId",
            sql.UniqueIdentifier,
            userId
          )
          .input(
            "SubModuleId",
            sql.Int,
            subModuleId
          )
          .input(
            "CanView",
            sql.Bit,
            p.canView ? 1 : 0
          )
          .input(
            "CanCreate",
            sql.Bit,
            p.canCreate ? 1 : 0
          )
          .input(
            "CanEdit",
            sql.Bit,
            p.canEdit ? 1 : 0
          )
          .input(
            "CanDelete",
            sql.Bit,
            p.canDelete ? 1 : 0
          )
          .query(`
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
            (
              @UserId,
              @SubModuleId,
              @CanView,
              @CanCreate,
              @CanEdit,
              @CanDelete
            );
          `);
      }
    }

    // ==========================================================
    // 14. PRINCIPIOS
    // MATRIZ POR COMPONENTES
    //
    // ELIMINAR ANTERIORES
    // ==========================================================

    await new sql.Request(tx)
      .input(
        "UserId",
        sql.UniqueIdentifier,
        userId
      )
      .query(`
        DELETE
        FROM dbo.usuariosPrincipiosPermisos
        WHERE UserId = @UserId;
      `);

    // ==========================================================
    // INSERTAR PRINCIPIOS NUEVOS
    // ==========================================================

    if (
      Array.isArray(principles)
    ) {
      for (
        const p of principles
      ) {
        const subModuleId =
          Number(
            p.subModuleId
          );

        const principioId =
          Number(
            p.principleId
          );

        if (
          !Number.isFinite(
            subModuleId
          ) ||
          subModuleId <= 0 ||
          !Number.isFinite(
            principioId
          ) ||
          principioId <= 0
        ) {
          continue;
        }

        await new sql.Request(tx)
          .input(
            "UserId",
            sql.UniqueIdentifier,
            userId
          )
          .input(
            "SubModuleId",
            sql.Int,
            subModuleId
          )
          .input(
            "PrincipioId",
            sql.Int,
            principioId
          )
          .input(
            "CanView",
            sql.Bit,
            p.canView ? 1 : 0
          )
          .input(
            "CanCreate",
            sql.Bit,
            p.canCreate ? 1 : 0
          )
          .input(
            "CanEdit",
            sql.Bit,
            p.canEdit ? 1 : 0
          )
          .input(
            "CanDelete",
            sql.Bit,
            p.canDelete ? 1 : 0
          )
          .query(`
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
            (
              @UserId,
              @SubModuleId,
              @PrincipioId,
              @CanView,
              @CanCreate,
              @CanEdit,
              @CanDelete
            );
          `);
      }
    }

    // ==========================================================
    // 15. PREGUNTAS DE MATRIZ POR COMPONENTES
    //
    // ELIMINAR ASIGNACIONES ANTERIORES
    // ==========================================================

    await new sql.Request(tx)
      .input(
        "UserId",
        sql.UniqueIdentifier,
        userId
      )
      .query(`
        DELETE
        FROM dbo.usuariosPrincipiosPreguntasPermisos
        WHERE UserId = @UserId;
      `);

    // ==========================================================
    // INSERTAR NUEVAS PREGUNTAS DE POR COMPONENTES
    // ==========================================================

    if (
      Array.isArray(
        principleQuestions
      )
    ) {
      for (
        const q of
          principleQuestions
      ) {
        const subModuleId =
          Number(
            q.subModuleId
          );

        const questionId =
          Number(
            q.questionId
          );

        if (
          !Number.isFinite(
            subModuleId
          ) ||
          subModuleId <= 0 ||
          !Number.isFinite(
            questionId
          ) ||
          questionId <= 0
        ) {
          continue;
        }

        // ======================================================
        // VALIDAR QUE LA PREGUNTA REALMENTE PERTENEZCA
        // AL SUBMÓDULO ENVIADO
        // ======================================================

        const questionExists =
          await new sql.Request(
            tx
          )
            .input(
              "QuestionId",
              sql.Int,
              questionId
            )
            .input(
              "SubModuleId",
              sql.Int,
              subModuleId
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
            `La pregunta ${questionId} no pertenece al submódulo ${subModuleId}.`
          );
        }

        // ======================================================
        // INSERTAR PERMISO
        // ======================================================

        await new sql.Request(tx)
          .input(
            "UserId",
            sql.UniqueIdentifier,
            userId
          )
          .input(
            "SubModuleId",
            sql.Int,
            subModuleId
          )
          .input(
            "QuestionId",
            sql.Int,
            questionId
          )
          .input(
            "CanView",
            sql.Bit,
            q.canView ? 1 : 0
          )
          .input(
            "CanCreate",
            sql.Bit,
            q.canCreate ? 1 : 0
          )
          .input(
            "CanEdit",
            sql.Bit,
            q.canEdit ? 1 : 0
          )
          .input(
            "CanDelete",
            sql.Bit,
            q.canDelete ? 1 : 0
          )
          .query(`
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
            (
              @UserId,
              @SubModuleId,
              @QuestionId,
              @CanView,
              @CanCreate,
              @CanEdit,
              @CanDelete
            );
          `);
      }
    }

    // ==========================================================
    // 16. PREGUNTAS SISTEMA ADMINISTRATIVO
    //
    // ELIMINAR PERMISOS ANTERIORES
    // ==========================================================

    await new sql.Request(tx)
      .input(
        "UserId",
        sql.UniqueIdentifier,
        userId
      )
      .query(`
        DELETE
        FROM dbo.usuariosPreguntasPermisos
        WHERE UserId = @UserId;
      `);

    // ==========================================================
    // LIMPIAR ACTOR USER ID ANTERIOR
    // SOLO SISTEMA ADMINISTRATIVO
    // ==========================================================

    await new sql.Request(tx)
      .input(
        "UserId",
        sql.UniqueIdentifier,
        userId
      )
      .query(`
        UPDATE dbo.Matriz_SistemaAdministrativoDetalle
        SET
          ActorUserId = NULL,
          FechaActualizacion = GETDATE()
        WHERE ActorUserId = @UserId;
      `);

    // ==========================================================
    // INSERTAR NUEVAS PREGUNTAS DEL SISTEMA ADMINISTRATIVO
    // ==========================================================

    if (
      Array.isArray(questions)
    ) {
      for (
        const q of questions
      ) {
        const subModuleId =
          Number(
            q.subModuleId
          );

        const questionId =
          Number(
            q.questionId
          );

        if (
          !Number.isFinite(
            subModuleId
          ) ||
          subModuleId <= 0 ||
          !Number.isFinite(
            questionId
          ) ||
          questionId <= 0
        ) {
          continue;
        }

        // ======================================================
        // INSERTAR PERMISO
        // ======================================================

        await new sql.Request(tx)
          .input(
            "UserId",
            sql.UniqueIdentifier,
            userId
          )
          .input(
            "SubModuleId",
            sql.Int,
            subModuleId
          )
          .input(
            "QuestionId",
            sql.Int,
            questionId
          )
          .input(
            "CanView",
            sql.Bit,
            q.canView ? 1 : 0
          )
          .input(
            "CanCreate",
            sql.Bit,
            q.canCreate ? 1 : 0
          )
          .input(
            "CanEdit",
            sql.Bit,
            q.canEdit ? 1 : 0
          )
          .input(
            "CanDelete",
            sql.Bit,
            q.canDelete ? 1 : 0
          )
          .query(`
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
            (
              @UserId,
              @SubModuleId,
              @QuestionId,
              @CanView,
              @CanCreate,
              @CanEdit,
              @CanDelete
            );
          `);

        // ======================================================
        // ACTOR USER ID
        // SOLO SISTEMA ADMINISTRATIVO
        // ======================================================

        await new sql.Request(tx)
          .input(
            "UserId",
            sql.UniqueIdentifier,
            userId
          )
          .input(
            "QuestionId",
            sql.Int,
            questionId
          )
          .query(`
            UPDATE dbo.Matriz_SistemaAdministrativoDetalle
            SET
              ActorUserId = @UserId,
              FechaActualizacion = GETDATE()
            WHERE Id = @QuestionId;
          `);
      }
    }

    // ==========================================================
    // 17. COMMIT
    // ==========================================================

    await tx.commit();

    console.log(
      "USUARIO ACTUALIZADO:",
      userId
    );

    console.log(
      "PREGUNTAS POR COMPONENTES RECIBIDAS:",
      Array.isArray(
        principleQuestions
      )
        ? principleQuestions.length
        : 0
    );

    console.log(
      "PREGUNTAS SISTEMA ADMINISTRATIVO RECIBIDAS:",
      Array.isArray(
        questions
      )
        ? questions.length
        : 0
    );

    return NextResponse.json({
      ok: true,
    });

  } catch (e: any) {
    // ==========================================================
    // ROLLBACK
    // ==========================================================

    try {
      await tx.rollback();
    } catch {}

    console.error(
      "UPDATE USER ERROR:",
      e
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar",

        detail:
          "Contacte al administrador del sistema.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// DELETE
// ELIMINAR USUARIO
// ============================================================

export async function DELETE(
  req: Request
) {
  const pool = await getPool();

  const tx =
    new sql.Transaction(pool);

  try {
    // ==========================================================
    // 1. VALIDAR ADMIN
    // ==========================================================

    const me =
      await requireAdmin();

    if (!me) {
      return NextResponse.json(
        {
          error:
            "No autorizado",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================================
    // 2. USER ID
    // ==========================================================

    const userId =
      getUserIdFromUrl(req);

    if (!isGuid(userId)) {
      return NextResponse.json(
        {
          error:
            "UserId inválido",

          detail:
            userId,
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================================
    // 3. INICIAR TRANSACCIÓN
    // ==========================================================

    await tx.begin();

    // ==========================================================
    // 4. LIMPIAR ACTOR USER ID
    // SISTEMA ADMINISTRATIVO
    // ==========================================================

    await new sql.Request(tx)
      .input(
        "UserId",
        sql.UniqueIdentifier,
        userId
      )
      .query(`
        UPDATE dbo.Matriz_SistemaAdministrativoDetalle
        SET
          ActorUserId = NULL,
          FechaActualizacion = GETDATE()
        WHERE ActorUserId = @UserId;
      `);

    // ==========================================================
    // 5. ELIMINAR PERMISOS Y USUARIO
    //
    // IMPORTANTE:
    // Primero tablas hijas.
    // ==========================================================

    await new sql.Request(tx)
      .input(
        "UserId",
        sql.UniqueIdentifier,
        userId
      )
      .query(`
        DELETE
        FROM dbo.usuariosPrincipiosPreguntasPermisos
        WHERE UserId = @UserId;

        DELETE
        FROM dbo.usuariosPreguntasPermisos
        WHERE UserId = @UserId;

        DELETE
        FROM dbo.usuariosPrincipiosPermisos
        WHERE UserId = @UserId;

        DELETE
        FROM dbo.usuariosSubmodulospermisos
        WHERE UserId = @UserId;

        DELETE
        FROM dbo.usuariosModulosPermisos
        WHERE UserId = @UserId;

        DELETE
        FROM dbo.UserRoles_Dgci
        WHERE UserId = @UserId;

        DELETE
        FROM dbo.Usuarios_Dgci
        WHERE UserId = @UserId;
      `);

    // ==========================================================
    // 6. COMMIT
    // ==========================================================

    await tx.commit();

    console.log(
      "USUARIO ELIMINADO:",
      userId
    );

    return NextResponse.json({
      ok: true,
    });

  } catch (e: any) {
    try {
      await tx.rollback();
    } catch {}

    console.error(
      "DELETE USER ERROR:",
      e
    );

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar",

        detail:
          "Contacte al administrador del sistema.",
      },
      {
        status: 500,
      }
    );
  }
}