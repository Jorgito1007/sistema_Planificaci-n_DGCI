import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool, sql } from "@/lib/db";
import {
  getCurrentUser,
  getCurrentUserFromToken,
  getUserByEmail,
} from "@/lib/current-user";

async function requireAdmin() {
  let currentUser = await getCurrentUser();

  if (!currentUser) {
    const tokenUser = await getCurrentUserFromToken();

    if (tokenUser?.email) {
      currentUser = await getUserByEmail(tokenUser.email);
    }
  }

  if (!currentUser) return null;

  const role = String(currentUser.role || "").toLowerCase();

  if (role !== "administrador") return null;

  return currentUser;
}

function getUserIdFromUrl(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[3];
}

function isGuid(value: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

export async function PUT(req: Request) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  try {
    const me = await requireAdmin();

    if (!me) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const userId = getUserIdFromUrl(req);

    if (!isGuid(userId)) {
      return NextResponse.json(
        { error: "UserId inválido", detail: userId },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      email,
      full_name,
      password,
      roleKey,
      is_active,
      modules,
      permissions,
      principles,
      questions,
    } = body;

    if (!email || !roleKey) {
      return NextResponse.json(
        { error: "Faltan datos" },
        { status: 400 }
      );
    }

    await tx.begin();

    await new sql.Request(tx)
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("Email", sql.NVarChar(255), email)
      .input("FullName", sql.NVarChar(200), full_name ?? null)
      .input("IsActive", sql.Bit, is_active ? 1 : 0)
      .query(`
        UPDATE dbo.Usuarios_Dgci
        SET Email = @Email,
            FullName = @FullName,
            IsActive = @IsActive
        WHERE UserId = @UserId
      `);

    if (password && String(password).trim().length > 0) {
      const hash = await bcrypt.hash(password, 10);

      await new sql.Request(tx)
        .input("UserId", sql.UniqueIdentifier, userId)
        .input("PasswordHash", sql.NVarChar(255), hash)
        .query(`
          UPDATE dbo.Usuarios_Dgci
          SET PasswordHash = @PasswordHash
          WHERE UserId = @UserId
        `);
    }

    const roleRow = await new sql.Request(tx)
      .input("RoleKey", sql.NVarChar(50), roleKey)
      .query(`
        SELECT TOP 1 RoleId
        FROM dbo.Roles_Dgci
        WHERE RoleKey = @RoleKey
      `);

    if (roleRow.recordset.length === 0) {
      await tx.rollback();

      return NextResponse.json(
        { error: `RoleKey no existe: ${roleKey}` },
        { status: 400 }
      );
    }

    const roleId = Number(roleRow.recordset[0].RoleId);

    await new sql.Request(tx)
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("RoleId", sql.Int, roleId)
      .query(`
        UPDATE dbo.UserRoles_Dgci
        SET RoleId = @RoleId
        WHERE UserId = @UserId;

        IF @@ROWCOUNT = 0
        BEGIN
          INSERT INTO dbo.UserRoles_Dgci (UserId, RoleId)
          VALUES (@UserId, @RoleId);
        END
      `);

    await new sql.Request(tx)
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`DELETE FROM dbo.usuariosModulosPermisos WHERE UserId = @UserId`);

    if (Array.isArray(modules)) {
      for (const m of modules) {
        await new sql.Request(tx)
          .input("UserId", sql.UniqueIdentifier, userId)
          .input("ModuleId", sql.Int, Number(m.moduleId))
          .input("CanView", sql.Bit, m.canView ? 1 : 0)
          .input("CanCreate", sql.Bit, m.canCreate ? 1 : 0)
          .input("CanEdit", sql.Bit, m.canEdit ? 1 : 0)
          .input("CanDelete", sql.Bit, m.canDelete ? 1 : 0)
          .query(`
            INSERT INTO dbo.usuariosModulosPermisos
              (UserId, ModuleId, CanView, CanCreate, CanEdit, CanDelete)
            VALUES
              (@UserId, @ModuleId, @CanView, @CanCreate, @CanEdit, @CanDelete)
          `);
      }
    }

    await new sql.Request(tx)
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`DELETE FROM dbo.usuariosSubmodulospermisos WHERE UserId = @UserId`);

    if (Array.isArray(permissions)) {
      for (const p of permissions) {
        await new sql.Request(tx)
          .input("UserId", sql.UniqueIdentifier, userId)
          .input("SubModuleId", sql.Int, Number(p.subModuleId))
          .input("CanView", sql.Bit, p.canView ? 1 : 0)
          .input("CanCreate", sql.Bit, p.canCreate ? 1 : 0)
          .input("CanEdit", sql.Bit, p.canEdit ? 1 : 0)
          .input("CanDelete", sql.Bit, p.canDelete ? 1 : 0)
          .query(`
            INSERT INTO dbo.usuariosSubmodulospermisos
              (UserId, SubModuleId, CanView, CanCreate, CanEdit, CanDelete)
            VALUES
              (@UserId, @SubModuleId, @CanView, @CanCreate, @CanEdit, @CanDelete)
          `);
      }
    }

    await new sql.Request(tx)
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`DELETE FROM dbo.usuariosPrincipiosPermisos WHERE UserId = @UserId`);

    if (Array.isArray(principles)) {
      for (const p of principles) {
        await new sql.Request(tx)
          .input("UserId", sql.UniqueIdentifier, userId)
          .input("SubModuleId", sql.Int, Number(p.subModuleId))
          .input("PrincipioId", sql.Int, Number(p.principleId))
          .input("CanView", sql.Bit, p.canView ? 1 : 0)
          .input("CanCreate", sql.Bit, p.canCreate ? 1 : 0)
          .input("CanEdit", sql.Bit, p.canEdit ? 1 : 0)
          .input("CanDelete", sql.Bit, p.canDelete ? 1 : 0)
          .query(`
            INSERT INTO dbo.usuariosPrincipiosPermisos
              (UserId, SubModuleId, PrincipioId, CanView, CanCreate, CanEdit, CanDelete)
            VALUES
              (@UserId, @SubModuleId, @PrincipioId, @CanView, @CanCreate, @CanEdit, @CanDelete)
          `);
      }
    }

    await new sql.Request(tx)
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`DELETE FROM dbo.usuariosPreguntasPermisos WHERE UserId = @UserId`);

    if (Array.isArray(questions)) {
      for (const q of questions) {
        await new sql.Request(tx)
          .input("UserId", sql.UniqueIdentifier, userId)
          .input("SubModuleId", sql.Int, Number(q.subModuleId))
          .input("QuestionId", sql.Int, Number(q.questionId))
          .input("CanView", sql.Bit, q.canView ? 1 : 0)
          .input("CanCreate", sql.Bit, q.canCreate ? 1 : 0)
          .input("CanEdit", sql.Bit, q.canEdit ? 1 : 0)
          .input("CanDelete", sql.Bit, q.canDelete ? 1 : 0)
          .query(`
            INSERT INTO dbo.usuariosPreguntasPermisos
              (UserId, SubModuleId, QuestionId, CanView, CanCreate, CanEdit, CanDelete)
            VALUES
              (@UserId, @SubModuleId, @QuestionId, @CanView, @CanCreate, @CanEdit, @CanDelete)
          `);
      }
    }

    await tx.commit();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    try {
      await tx.rollback();
    } catch {}

    return NextResponse.json(
      {
        error: "No se pudo actualizar",
        detail: String(e?.message || e),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  try {
    const me = await requireAdmin();

    if (!me) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const userId = getUserIdFromUrl(req);

    if (!isGuid(userId)) {
      return NextResponse.json(
        { error: "UserId inválido", detail: userId },
        { status: 400 }
      );
    }

    await tx.begin();

    await new sql.Request(tx)
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`
        DELETE FROM dbo.usuariosPreguntasPermisos
        WHERE UserId = @UserId;

        DELETE FROM dbo.usuariosPrincipiosPermisos
        WHERE UserId = @UserId;

        DELETE FROM dbo.usuariosSubmodulospermisos
        WHERE UserId = @UserId;

        DELETE FROM dbo.usuariosModulosPermisos
        WHERE UserId = @UserId;

        DELETE FROM dbo.UserRoles_Dgci
        WHERE UserId = @UserId;

        DELETE FROM dbo.Usuarios_Dgci
        WHERE UserId = @UserId;
      `);

    await tx.commit();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    try {
      await tx.rollback();
    } catch {}

    return NextResponse.json(
      {
        error: "No se pudo eliminar",
        detail: String(e?.message || e),
      },
      { status: 500 }
    );
  }

}