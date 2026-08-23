import { NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({
        ok: false,
        total: 0,
        notificaciones: [],
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, currentUser.userId)
      .query(`
       SELECT
(
    SELECT COUNT(*)
    FROM dbo.Matriz_SistemaAdministrativoDetalle M
    WHERE M.ActorUserId = @UserId
      AND TRY_CONVERT(INT, M.Calificacion) BETWEEN 1 AND 4

      AND NOT EXISTS (
          SELECT 1
          FROM dbo.PlanAccionSAdministrativo P
          WHERE P.ActorUserId = M.ActorUserId
            AND P.NumeroPregunta = M.Numero
      )

) AS PendientesSA,

(
    SELECT COUNT(*)
    FROM dbo.EvaluacionesPrincipioDetalleDGCI E
    WHERE E.ActorUserId = @UserId
      AND TRY_CONVERT(INT, E.Calificacion) BETWEEN 1 AND 4

      AND NOT EXISTS (
          SELECT 1
          FROM dbo.PlanAccionSPorComponentes P
          WHERE P.ActorUserId = E.ActorUserId
            AND P.NumeroPregunta = E.Numero
      )

) AS PendientesPC

      `);

    const row = result.recordset[0];

    const pendientesSA = Number(row?.PendientesSA || 0);
    const pendientesPC = Number(row?.PendientesPC || 0);

    const notificaciones = [];

    if (pendientesSA > 0) {
      notificaciones.push({
        tipo: "sistema-administrativo",
        titulo: "Plan de Acción pendiente",
        mensaje: `Tiene ${pendientesSA} elemento(s) del Sistema Administrativo con baja calificación. Debe elaborar un Plan de Acción.`,
        href: "/dashboard/matriz_sa/Plan_Accion",
      });
    }

    if (pendientesPC > 0) {
      notificaciones.push({
        tipo: "por-componentes",
        titulo: "Plan de Acción pendiente",
        mensaje: `Tiene ${pendientesPC} elemento(s) por Componentes con baja calificación. Debe elaborar un Plan de Acción.`,
        href: "/dashboard/por-componentes/Plan_Accion",
      });
    }

    return NextResponse.json({
      ok: true,
      total: notificaciones.length,
      notificaciones,
    });
  } catch (error) {
    console.error("Error notificaciones plan acción:", error);

    return NextResponse.json({
      ok: false,
      total: 0,
      notificaciones: [],
    });
  }
}