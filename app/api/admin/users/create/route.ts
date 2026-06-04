import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import bcrypt from "bcryptjs";
import { getPool, sql } from "@/lib/db";


export async function POST(httpReq: Request) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  try {
   
    const me = await getCurrentUser();

if (!me) {
  return NextResponse.json({ error: "No auth" }, { status: 401 });
}

const role = String(me.role || "").toLowerCase();

if (role !== "administrador") {
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

    const body = await httpReq.json();
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

    if (!email || !password || !roleKey) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const actorUserId = me.userId;

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


      // 5) Permisos de módulos
if (Array.isArray(modules) && modules.length > 0) {
  const validModules = modules
    .map((m: any) => ({
      moduleId: Number(m.moduleId),
      canView: !!m.canView,
      canCreate: !!m.canCreate,
      canEdit: !!m.canEdit,
      canDelete: !!m.canDelete,
    }))
    .filter((m: any) => Number.isFinite(m.moduleId) && m.moduleId > 0);

  if (validModules.length > 0) {
    const valuesSql = validModules
      .map((m: any, i: number) =>
        `(@UserId, @ModuleId${i}, ${m.canView ? 1 : 0}, ${m.canCreate ? 1 : 0}, ${m.canEdit ? 1 : 0}, ${m.canDelete ? 1 : 0})`
      )
      .join(",");

    const reqMod = new sql.Request(tx);
    reqMod.input("UserId", sql.UniqueIdentifier, userId);

    validModules.forEach((m: any, i: number) => {
      reqMod.input(`ModuleId${i}`, sql.Int, m.moduleId);
    });

    await reqMod.query(`
      INSERT INTO dbo.usuariosModulosPermisos
        (UserId, ModuleId, CanView, CanCreate, CanEdit, CanDelete)
      VALUES ${valuesSql}
    `);

    console.log("módulos insertados:", validModules.length);
  }
}
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

// Permisos por principios
if (Array.isArray(principles) && principles.length > 0) {
  const validPrinciples = principles
    .map((p: any) => ({
      subModuleId: Number(p.subModuleId),
      principioId: Number(p.principleId),
      canView: !!p.canView,
      canCreate: !!p.canCreate,
      canEdit: !!p.canEdit,
      canDelete: !!p.canDelete,
    }))
    .filter((p: any) =>
      Number.isFinite(p.subModuleId) &&
      p.subModuleId > 0 &&
      Number.isFinite(p.principioId) &&
      p.principioId > 0
    );

  if (validPrinciples.length > 0) {
    const valuesSql = validPrinciples
      .map((p: any, i: number) =>
        `(@UserId, @SubIdP${i}, @PrincipioId${i}, ${p.canView ? 1 : 0}, ${p.canCreate ? 1 : 0}, ${p.canEdit ? 1 : 0}, ${p.canDelete ? 1 : 0})`
      )
      .join(",");

    const req = new sql.Request(tx);
    req.input("UserId", sql.UniqueIdentifier, userId);

    validPrinciples.forEach((p: any, i: number) => {
      req.input(`SubIdP${i}`, sql.Int, p.subModuleId);
      req.input(`PrincipioId${i}`, sql.Int, p.principioId);
    });

    await req.query(`
      INSERT INTO dbo.usuariosPrincipiosPermisos
        (UserId, SubModuleId, PrincipioId, CanView, CanCreate, CanEdit, CanDelete)
      VALUES ${valuesSql}
    `);
  }
}

// Permisos por preguntas
if (Array.isArray(questions) && questions.length > 0) {
  const validQuestions = questions
    .map((q: any) => ({
      subModuleId: Number(q.subModuleId),
      questionId: Number(q.questionId),
      canView: !!q.canView,
      canCreate: !!q.canCreate,
      canEdit: !!q.canEdit,
      canDelete: !!q.canDelete,
    }))
    .filter((q: any) =>
      Number.isFinite(q.subModuleId) &&
      q.subModuleId > 0 &&
      Number.isFinite(q.questionId) &&
      q.questionId > 0
    );

  if (validQuestions.length > 0) {
    const valuesSql = validQuestions
      .map((q: any, i: number) =>
        `(@UserId, @SubIdQ${i}, @QuestionId${i}, ${q.canView ? 1 : 0}, ${q.canCreate ? 1 : 0}, ${q.canEdit ? 1 : 0}, ${q.canDelete ? 1 : 0})`
      )
      .join(",");

    const req = new sql.Request(tx);
    req.input("UserId", sql.UniqueIdentifier, userId);

    validQuestions.forEach((q: any, i: number) => {
      req.input(`SubIdQ${i}`, sql.Int, q.subModuleId);
      req.input(`QuestionId${i}`, sql.Int, q.questionId);
    });

    await req.query(`
      INSERT INTO dbo.usuariosPreguntasPermisos
        (UserId, SubModuleId, QuestionId, CanView, CanCreate, CanEdit, CanDelete)
      VALUES ${valuesSql}
    `);
  }
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