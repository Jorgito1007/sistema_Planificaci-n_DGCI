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

export default async function PlanAccionPDFPage({
  searchParams,
}: Props) {

  const params = await searchParams;

  const tipo = params.tipo;
  const userId = params.userId;

  console.log("TIPO:", tipo);
  console.log("USER:", userId);

  if (!tipo || !userId) {
    return (
      <div className="p-6 text-red-600">
        Faltan parámetros del plan.
      </div>
    );
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
      ? "PLAN DE ACCIÓN PARA LA IMPLEMENTACIÓN DE LAS ACTIVIDADES DE MEJORA DEL SISTEMA DE ADMINISTRACIÓN"
      : "PLAN DE ACCIÓN PARA LA IMPLEMENTACIÓN DE LAS ACTIVIDADES DE MEJORA POR COMPONENTES";

  return (
    <div className="min-h-screen bg-white p-6 text-black print:p-0">
      <div className="mb-4 flex justify-end print:hidden">


      </div>

      <div className="mx-auto max-w-[1400px] border border-black p-4">
        <h1 className="text-center text-sm font-bold uppercase">
          Contraloría General de la República
        </h1>

        <h2 className="mt-2 text-center text-xs font-bold uppercase">
          Guía especializada para la implementación del control interno en las
          instituciones gubernamentales
        </h2>

        <h3 className="mt-3 text-center text-sm font-bold uppercase">
          {titulo}
        </h3>

        <div className="mt-5 grid grid-cols-12 text-sm">
          <div className="col-span-2 font-bold">ENTIDAD:</div>
          <div className="col-span-10">
            Universidad Nacional Casimiro Sotelo Montenegro
          </div>

          <div className="col-span-2 mt-2 font-bold">PERÍODO:</div>
          <div className="col-span-10 mt-2">
            Del: {periodoInicio} Al: {periodoFin}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black p-1">Número Pregunta</th>
                <th className="border border-black p-1">Descripción</th>
                <th className="border border-black p-1">Clasificación</th>
                <th className="border border-black p-1">Nivel</th>
                <th className="border border-black p-1">Deficiencia</th>
                <th className="border border-black p-1">Actividades</th>
                <th className="border border-black p-1">Fecha Inicio</th>
                <th className="border border-black p-1">Fecha Fin</th>
                <th className="border border-black p-1">Nombre Cargo</th>
                <th className="border border-black p-1">Contacto</th>
                <th className="border border-black p-1">Recursos</th>
                <th className="border border-black p-1">Entregable</th>
              </tr>
            </thead>

            <tbody>
              {filas.map((fila, index) => (
                <tr key={index}>
                  <td className="border border-black p-1 text-center">
                    {fila.NumeroPregunta}
                  </td>
                  <td className="border border-black p-1">
                    {fila.DescripcionPregunta}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {fila.Clasificacion}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {fila.Nivel}
                  </td>
                  <td className="border border-black p-1">
                    {fila.Deficiencia}
                  </td>
                  <td className="border border-black p-1">
                    {fila.Actividades}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {fila.FechaInicio}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {fila.FechaFin}
                  </td>
                  <td className="border border-black p-1">
                    {fila.FullName}
                    <br />
                    {fila.Cargo}
                  </td>
                  <td className="border border-black p-1">
                    {fila.Contacto}
                  </td>
                  <td className="border border-black p-1">
                    {fila.Recursos}
                  </td>
                  <td className="border border-black p-1">
                    {fila.Entregable}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-[11px]">
          <strong>NOTA:</strong> Este anexo se imprimirá directamente desde la
          Matriz de Evaluación de Control Interno.
        </p>
      </div>
    </div>
  );
}