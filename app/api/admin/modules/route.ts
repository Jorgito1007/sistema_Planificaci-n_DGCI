import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "No auth" },
        { status: 401 }
      );
    }

   const roleKey = String(
  currentUser.roleKey || currentUser.role || ""
)
  .toLowerCase()
  .trim()
  .replace(/\s+/g, "");

console.log("ADMIN MODULES ROLE:", roleKey);

if (
  roleKey !== "administrador" &&
  roleKey !== "subadministrador"
) {
  return NextResponse.json(
    { error: "No autorizado", roleKey },
    { status: 403 }
  );
}

    const pool = await getPool();

    const modulesRes = await pool.request().query(`
      SELECT
        ModuleId,
        ModuleKey,
        ModuleName
      FROM dbo.Modulos_Dgci
      ORDER BY ModuleId ASC
    `);

    const subRes = await pool.request().query(`
      SELECT
        SubModuleId,
        ModuleId,
        SubModuleKey,
        SubModuleName,
        SortOrder
      FROM dbo.submodulos_dgci
      ORDER BY SortOrder ASC
    `);

    //Preguntas del sistema administrativo
const questionsRes = await pool.request().query(`
  SELECT
    msa.SubModuleId,
    msad.Id AS QuestionId,
    msad.MatrizSistemaAdministrativoId,
    msad.Numero,
    msad.Texto
  FROM dbo.Matriz_SistemaAdministrativoDetalle msad
  INNER JOIN dbo.Matriz_SistemaAdministrativo msa
    ON msa.Id = msad.MatrizSistemaAdministrativoId
  ORDER BY
    msa.SubModuleId ASC,
    msad.MatrizSistemaAdministrativoId ASC,
    msad.Numero ASC
`);

// =========================
// AGRUPAR Matriz del SA
// =========================

const questionsBySubmodule = new Map<string, any[]>();

for (const q of questionsRes.recordset) {
  const subId = String(q.SubModuleId);

  if (!questionsBySubmodule.has(subId)) {
    questionsBySubmodule.set(subId, []);
  }

  questionsBySubmodule.get(subId)!.push({
    id: String(q.QuestionId),
    parentId: String(q.MatrizSistemaAdministrativoId),
    number: String(q.Numero ?? ""),
    text: q.Texto,
  });
}


//Principios del modulo por componentes
const principlesRes = await pool.request().query(`
  SELECT
    SubModuleId,
    PrincipioId,
    PrincipioTitulo,
    PreguntaGeneralNumero,
    PreguntaGeneralTexto
  FROM dbo.EvaluacionesPrincipioDGCI
  ORDER BY SubModuleId ASC, PrincipioId ASC
`);
// =========================
// AGRUPAR PRINCIPIOS
// =========================
const principlesBySubmodule = new Map<string, any[]>();

for (const p of principlesRes.recordset) {
  const key = String(p.SubModuleId);

  if (!principlesBySubmodule.has(key)) {
    principlesBySubmodule.set(key, []);
  }

  principlesBySubmodule.get(key)!.push({
    id: String(p.PrincipioId),
    title: p.PrincipioTitulo,
    number: String(p.PreguntaGeneralNumero ?? ""),
    text: p.PreguntaGeneralTexto,
  });
}

// =========================
// AGRUPAR SUBMÓDULOS
// =========================


const subByModule = new Map<string, any[]>();

for (const s of subRes.recordset) {
  const k = String(s.ModuleId);

  if (!subByModule.has(k)) {
    subByModule.set(k, []);
  }

 const subId = String(s.SubModuleId);


subByModule.get(k)!.push({
  id: subId,
  key: s.SubModuleKey,
  name: s.SubModuleName,
  principles: principlesBySubmodule.get(subId) ?? [],
  questions: questionsBySubmodule.get(subId) ?? [],
});
}


    const modules = modulesRes.recordset.map((m: any) => ({
      id: String(m.ModuleId),
      key: m.ModuleKey,
      name: m.ModuleName,
      submodules:
        subByModule.get(String(m.ModuleId)) || [],
    }));
console.log("QUESTIONS:", questionsBySubmodule);
    return NextResponse.json({ modules });

  } catch (error: any) {

    console.error(error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
