import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getPool, sql } from "@/lib/db";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
  if (String(payload.role || "").toLowerCase() !== "administrador") return null;
  return payload;
}

export async function POST(httpReq: Request) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  try {
    const me = await requireAdmin();
    if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const body = await httpReq.json();
    const { email, full_name, password, roleKey, is_active, permissions } = body;

    if (!email || !password || !roleKey) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const actorUserId = me.userId || me.UserId || me.id || me.sub;

    await tx.begin();

    // 1) Existe?
    const exists = await new sql.Request(tx)
      .input("Email", sql.NVarChar(255), email)
      .query(`SELECT 1 FROM dbo.Usuarios_Dgci WHERE Email=@Email`);

    if (exists.recordset.length > 0) {
      await tx.rollback();
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 409 });
    }

    // 2) RoleId (INT)
    const roleRow = await new sql.Request(tx)
      .input("RoleKey", sql.NVarChar(50), roleKey)
      .query(`SELECT TOP 1 RoleId FROM dbo.Roles_Dgci WHERE RoleKey=@RoleKey`);

    if (roleRow.recordset.length === 0) {
      await tx.rollback();
      return NextResponse.json({ error: `RoleKey no existe: ${roleKey}` }, { status: 400 });
    }

    const roleId = Number(roleRow.recordset[0].RoleId);

    // 3) Crear usuario
    const hash = await bcrypt.hash(password, 10);

    const inserted = await new sql.Request(tx)
      .input("Email", sql.NVarChar(255), email)
      .input("FullName", sql.NVarChar(200), full_name ?? null)
      .input("PasswordHash", sql.NVarChar(255), hash)
      .input("IsActive", sql.Bit, is_active ? 1 : 0)
      .query(`
        INSERT INTO dbo.Usuarios_Dgci (Email, FullName, PasswordHash, IsActive)
        OUTPUT INSERTED.UserId
        VALUES (@Email, @FullName, @PasswordHash, @IsActive)
      `);

    const userId = inserted.recordset[0].UserId;

    // 4) Asignar rol
    await new sql.Request(tx)
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("RoleId", sql.Int, roleId)
      .query(`INSERT INTO dbo.UserRoles_Dgci (UserId, RoleId) VALUES (@UserId, @RoleId)`);

// 5) Permisos en 1 query 
// 5) Permisos (SubModuleId INT)
if (Array.isArray(permissions) && permissions.length > 0) {
  const validPerms = permissions
    .map((p: any) => ({
      subModuleId: Number(p.subModuleId),
      canView: !!p.canView,
      canCreate: !!p.canCreate,
      canEdit: !!p.canEdit,
      canDelete: !!p.canDelete,
    }))
    .filter((p: any) => Number.isFinite(p.subModuleId) && p.subModuleId > 0);

  if (validPerms.length === 0) {
    throw new Error("Permisos llegaron pero ningún SubModuleId es INT válido");
  }

  const valuesSql = validPerms
    .map((p: any, i: number) =>
      `(@UserId, @SubId${i}, ${p.canView ? 1 : 0}, ${p.canCreate ? 1 : 0}, ${p.canEdit ? 1 : 0}, ${p.canDelete ? 1 : 0})`
    )
    .join(",");

  const reqPerm = new sql.Request(tx);
  reqPerm.input("UserId", sql.UniqueIdentifier, userId);

  validPerms.forEach((p: any, i: number) => {
    reqPerm.input(`SubId${i}`, sql.Int, p.subModuleId); // ✅ INT
  });

console.log("permissions recibidos:", permissions);
  await reqPerm.query(`
    INSERT INTO dbo.usuariosSubmodulospermisos
      (UserId, SubModuleId, CanView, CanCreate, CanEdit, CanDelete)
    VALUES ${valuesSql}
  `);
  console.log("permisos insertados:", validPerms.length);
}
    // 6) Auditoría (si ActorUserId no existe en token, no truenes)
    if (actorUserId) {
      await new sql.Request(tx)
        .input("ActorUserId", sql.UniqueIdentifier, actorUserId)
        .input("Action", sql.NVarChar(50), "CREATE_USER")
        .input("Entity", sql.NVarChar(50), "Users")
        .input("EntityId", sql.NVarChar(100), String(userId))
        .input("Details", sql.NVarChar(sql.MAX), JSON.stringify({ email, roleKey }))
        .query(`
          INSERT INTO dbo.Auditoria_Datos_Dgci(ActorUserId, Action, Entity, EntityId, Details)
          VALUES (@ActorUserId, @Action, @Entity, @EntityId, @Details)
        `);
    }

    await tx.commit();
    return NextResponse.json({ ok: true, userId });
  } catch (err: any) {
    try { await tx.rollback(); } catch {}
    console.error("CREATE USER ERROR:", err);
    return NextResponse.json(
      { error: "Server error", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}