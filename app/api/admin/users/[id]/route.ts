import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getPool, sql } from "@/lib/db";

async function requireAdmin() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return null;

  const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
  if (String(payload.role || "").toLowerCase() !== "administrador") return null;

  return payload;
}

export async function PUT(req: Request) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  try {
    const me = await requireAdmin();
    if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    // ✅ sacar id desde URL (porque params a veces viene null)
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const userId = parts[3]; // api/admin/users/{id}

    const guidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(userId)) {
      return NextResponse.json({ error: "UserId inválido", detail: userId }, { status: 400 });
    }

    const body = await req.json();
    const { email, full_name, password, roleKey, is_active, permissions, modules } = body;

    if (!email || !roleKey) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    await tx.begin();

    // 1) actualizar datos básicos
    await new sql.Request(tx)
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("Email", sql.NVarChar(255), email)
      .input("FullName", sql.NVarChar(200), full_name ?? null)
      .input("IsActive", sql.Bit, is_active ? 1 : 0)
      .query(`
        UPDATE dbo.Usuarios_Dgci
        SET Email=@Email, FullName=@FullName, IsActive=@IsActive
        WHERE UserId=@UserId
      `);

    // 2) actualizar password si viene
    if (password && String(password).trim().length > 0) {
      const hash = await bcrypt.hash(password, 10);
      await new sql.Request(tx)
        .input("UserId", sql.UniqueIdentifier, userId)
        .input("PasswordHash", sql.NVarChar(255), hash)
        .query(`
          UPDATE dbo.Usuarios_Dgci
          SET PasswordHash=@PasswordHash
          WHERE UserId=@UserId
        `);
    }

    // 3) actualizar rol (RoleId es INT)
    const roleRow = await new sql.Request(tx)
      .input("RoleKey", sql.NVarChar(50), roleKey)
      .query(`SELECT TOP 1 RoleId FROM dbo.Roles_Dgci WHERE RoleKey=@RoleKey`);

    if (roleRow.recordset.length === 0) {
      await tx.rollback();
      return NextResponse.json({ error: `RoleKey no existe: ${roleKey}` }, { status: 400 });
    }

    const roleId = Number(roleRow.recordset[0].RoleId);

    // ✅ ACTUALIZAR rol (no insertar duplicado)
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

    // 4) MÓDULOS: reemplazar (borrar e insertar)
    await new sql.Request(tx)
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`DELETE FROM dbo.usuariosModulosPermisos WHERE UserId=@UserId`);

    if (Array.isArray(modules) && modules.length > 0) {
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

    // 5) SUBMÓDULOS: reemplazar (borrar e insertar)
    await new sql.Request(tx)
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`DELETE FROM dbo.usuariosSubmodulospermisos WHERE UserId=@UserId`);

    if (Array.isArray(permissions) && permissions.length > 0) {
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

    await tx.commit();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    try {
      await tx.rollback();
    } catch {}
    return NextResponse.json(
      { error: "No se pudo actualizar", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}