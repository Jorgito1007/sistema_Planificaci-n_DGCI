import { getPool, sql } from "@/lib/db";

type Props = {
  searchParams: Promise<{
    tipo?: string;
    userId?: string;
  }>;
};

type PlanRow = {
  NumeroPregunta: string;
  DescripcionPregunta: string;
  Clasificacion: number;
  Nivel: string;
  Deficiencia: string;
  Actividades: string;
  FechaInicio: string;
  FechaFin: string;
  Cargo: string;
  Contacto: string;
  Recursos: string;
  Entregable: string;
  PeriodoInicio: string;
  PeriodoFin: string;
  FullName: string;
};

export default async function PlanAccionPDFPage({ searchParams }: Props) {
  const params = await searchParams;

  const tipo = params.tipo;
  const userId = params.userId;

  if (!tipo || !userId) {
    return <div className="p-6 text-red-600">Faltan parámetros del plan.</div>;
  }

  const pool = await getPool();

  const tabla =
    tipo === "sistema-administrativo"
      ? "dbo.PlanAccionSAdministrativo"
      : "dbo.PlanAccionSPorComponentes";

  const result = await pool
    .request()
    .input("UserId", sql.UniqueIdentifier, userId)
    .query(`
      SELECT
        p.NumeroPregunta,
        p.DescripcionPregunta,
        p.Clasificacion,
        p.Nivel,
        p.Deficiencia,
        p.Actividades,
        CONVERT(varchar(10), p.FechaInicio, 120) AS FechaInicio,
        CONVERT(varchar(10), p.FechaFin, 120) AS FechaFin,
        p.Cargo,
        p.Contacto,
        p.Recursos,
        p.Entregable,
        CONVERT(varchar(10), p.PeriodoInicio, 120) AS PeriodoInicio,
        CONVERT(varchar(10), p.PeriodoFin, 120) AS PeriodoFin,
        u.FullName
      FROM ${tabla} p
      LEFT JOIN dbo.Usuarios_Dgci u
        ON u.UserId = p.ActorUserId
      WHERE p.ActorUserId = @UserId
      ORDER BY p.NumeroPregunta
    `);

  const filas = result.recordset as PlanRow[];

  const periodoInicio = filas[0]?.PeriodoInicio || "";
  const periodoFin = filas[0]?.PeriodoFin || "";

  const titulo =
    tipo === "sistema-administrativo"
      ? "Plan de Acción Sistema Administrativo"
      : "Plan de Acción por Componentes";

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-black print:bg-white print:p-0">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl print:rounded-none print:border-none print:shadow-none">
        <div className="bg-gradient-to-r from-[#061B33] via-[#0B3D91] to-[#1565C0] px-8 py-6 text-white">
          <h1 className="text-2xl font-extrabold uppercase tracking-wide">
            {titulo}
          </h1>

          <p className="mt-1 text-sm font-medium text-blue-100">
            Seguimiento institucional del Sistema de Control Interno
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-5 text-sm">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0B3D91]">
              Entidad
            </p>
            <p className="mt-1 font-semibold text-slate-800">
              Universidad Nacional Casimiro Sotelo Montenegro
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0B3D91]">
              Período
            </p>
            <p className="mt-1 font-semibold text-slate-800">
              Del: {periodoInicio} &nbsp;&nbsp; Al: {periodoFin}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto rounded-xl border border-slate-300">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#0B3D91] text-center text-white">
                  <th className="border border-slate-300 p-2">
                    Número Pregunta
                  </th>
                  <th className="border border-slate-300 p-2">
                    Descripción
                  </th>
                  <th className="border border-slate-300 p-2">
                    Clasificación
                  </th>
                  <th className="border border-slate-300 p-2">Nivel</th>
                  <th className="border border-slate-300 p-2">
                    Deficiencia
                  </th>
                  <th className="border border-slate-300 p-2">
                    Actividades
                  </th>
                  <th className="border border-slate-300 p-2">
                    Fecha Inicio
                  </th>
                  <th className="border border-slate-300 p-2">Fecha Fin</th>
                  <th className="border border-slate-300 p-2">Nombre</th>
                  <th className="border border-slate-300 p-2">Cargo</th>
                  <th className="border border-slate-300 p-2">Contacto</th>
                  <th className="border border-slate-300 p-2">Recursos</th>
                  <th className="border border-slate-300 p-2">Entregable</th>
                </tr>
              </thead>

              <tbody>
                {filas.map((fila, index) => (
                  <tr
                    key={index}
                    className="odd:bg-white even:bg-slate-50 print:odd:bg-white print:even:bg-white"
                  >
                    <td className="border border-slate-300 p-2 text-center font-semibold">
                      {fila.NumeroPregunta}
                    </td>

                    <td className="border border-slate-300 p-2 leading-relaxed">
                      {fila.DescripcionPregunta}
                    </td>

                    <td className="border border-slate-300 p-2 text-center">
                      {fila.Clasificacion}
                    </td>

                    <td className="border border-slate-300 p-2 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          fila.Nivel?.toLowerCase() === "bajo"
                            ? "bg-red-500 text-white"
                            : fila.Nivel?.toLowerCase() === "medio"
                            ? "bg-yellow-300 text-black"
                            : fila.Nivel?.toLowerCase() === "alto"
                            ? "bg-green-500 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {fila.Nivel}
                      </span>
                    </td>

                    <td className="border border-slate-300 p-2">
                      {fila.Deficiencia}
                    </td>

                    <td className="border border-slate-300 p-2">
                      {fila.Actividades}
                    </td>

                    <td className="border border-slate-300 p-2 text-center">
                      {fila.FechaInicio}
                    </td>

                    <td className="border border-slate-300 p-2 text-center">
                      {fila.FechaFin}
                    </td>

                    <td className="border border-slate-300 bg-blue-50 p-2 font-semibold text-slate-700">
                      {fila.FullName}
                    </td>

                    <td className="border border-slate-300 bg-blue-50 p-2 text-slate-700">
                      {fila.Cargo}
                    </td>

                    <td className="border border-slate-300 p-2">
                      {fila.Contacto}
                    </td>

                    <td className="border border-slate-300 p-2">
                      {fila.Recursos}
                    </td>

                    <td className="border border-slate-300 p-2">
                      {fila.Entregable}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl border-l-4 border-[#0B3D91] bg-blue-50 p-4 text-[12px] text-slate-700 print:border print:border-slate-300">
            <strong>NOTA:</strong> Este documento forma parte del seguimiento
            institucional del Sistema de Control Interno.
          </div>
        </div>
      </div>
    </div>
  );
}