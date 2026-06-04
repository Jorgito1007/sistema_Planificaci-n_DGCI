
import React from "react";



export default function PreguntasSinResponderComponentesPage() {
  const grupos = [
    {
      no: 1,
      titulo: "Entorno de Control",
      color: "bg-[#d9eaf7]",
      principios: [
        ["Principio 1", "La Entidad demuestra compromiso con la integridad y los valores éticos.", 6],
        ["Principio 2", "La Máxima autoridad demuestra independencia de la dirección y ejerce la supervisión del desarrollo y funcionamiento del sistema de control interno.", 4],
        ["Principio 3", "La Máxima Autoridad establece supervisión en las estructuras, líneas de reporte y una apropiada asignación de autoridad y responsabilidad para la consecución de los objetivos.", 3],
        ["Principio 4", "La Máxima Autoridad demuestra compromiso para atraer, desarrollar y retener a profesionales competentes en concordancia con los objetivos de las entidades.", 4],
        ["Principio 5", "La Máxima Autoridad y la Administración definen las responsabilidades de los servidores públicos a nivel de control interno para la consecución de los objetivos.", 2],
      ],
    },
    {
      no: 2,
      titulo: "Evaluación de Riesgos",
      color: "bg-[#dcead5]",
      principios: [
        ["Principio 6", "Las entidades definen objetivos con la suficiente claridad para permitir la identificación y evaluación de los riesgos relacionados.", 4],
        ["Principio 7", "La Entidad identifica riesgos para el logro de sus objetivos y los analiza como base para determinar cómo deben ser administrados.", 5],
        ["Principio 8", "La Entidad considera la posibilidad de irregularidades en la evaluación de riesgos para el logro de objetivos.", 2],
        ["Principio 9", "La Entidad identifica y evalúa los cambios que podrían afectar significativamente al sistema de control interno.", 1],
      ],
    },
    {
      no: 3,
      titulo: "Actividades de Control",
      color: "bg-[#d9eaf7]",
      principios: [
        ["Principio 10", "La Entidad selecciona y desarrolla actividades de control que contribuyen en la mitigación de riesgos al logro de objetivos, a un nivel aceptable.", 4],
        ["Principio 11", "La Entidad selecciona y desarrolla actividades generales de control sobre la tecnología, para apoyar el logro de los objetivos.", 7],
        ["Principio 12", "La Entidad implementa actividades de control a través de políticas que establezcan lo requerido y procedimientos que pongan estas políticas en acción.", 3],
      ],
    },
    {
      no: 4,
      titulo: "Información y Comunicación",
      color: "bg-[#dcead5]",
      principios: [
        ["Principio 13", "La Entidad obtiene o genera y utiliza información relevante, y de calidad para apoyar el funcionamiento del control interno.", 4],
        ["Principio 14", "La Entidad comunica internamente información, incluyendo objetivos y responsabilidades sobre el Control Interno necesaria para soportar el funcionamiento del control interno.", 4],
        ["Principio 15", "La Entidad se comunica con los grupos de interés externos en relación con los aspectos que afectan el funcionamiento del control interno.", 3],
      ],
    },
    {
      no: 5,
      titulo: "Supervisión - Monitoreo",
      color: "bg-[#d9eaf7]",
      principios: [
        ["Principio 16", "La Entidad selecciona, desarrolla y realiza evaluaciones concurrentes o separadas para determinar si los componentes de control interno están presentes y funcionando.", 2],
        ["Principio 17", "La Entidad evalúa y comunica las deficiencias de control interno de manera oportuna a los responsables de tomar acciones correctivas.", 2],
      ],
    },
  ];

  const totalPreguntas = grupos.reduce(
    (acc, g) => acc + g.principios.reduce((s, p) => s + Number(p[2]), 0),
    0
  );

  const totalSinResponder = totalPreguntas;

  return (
    <div className="min-h-screen bg-white p-6 text-black">
      <div className="mx-auto max-w-7xl">

        {/* TÍTULO */}
        <div className="mb-4 text-center">
          <h2 className="inline-block rounded-md bg-[#5b9bd5] px-8 py-3 text-lg font-bold text-white shadow-md">
            Preguntas sin responder - Matriz por componentes
          </h2>
        </div>

        <table className="w-full border-collapse text-sm">

          {/* HEADER */}
          <thead>
            <tr>
              <th className="border-2 border-black bg-[#fbe5d6] px-2 py-2 text-center font-bold">
                No.-
              </th>

              <th className="border-2 border-black bg-[#fbe5d6] px-2 py-2 text-center text-base font-bold">
                Componentes
              </th>

              <th className="border-2 border-black bg-[#fbe5d6] px-2 py-2 text-center font-bold">
                No. de
                <br /> preguntas
              </th>

              <th className="border-2 border-black bg-[#fbe5d6] px-2 py-2 text-center font-bold">
                No. de preguntas
                <br /> sin responder
              </th>
            </tr>

            {/* TOTAL */}
            <tr>
              <th colSpan={2} className="border-2 border-black bg-[#fbe5d6] px-2 py-1 text-center font-bold">
                TOTAL
              </th>

              <th className="border-2 border-black bg-[#fbe5d6] px-2 py-1 text-center font-bold">
                {totalPreguntas}
              </th>

              <th className="border-2 border-black bg-[#fbe5d6] px-2 py-1 text-center font-bold">
                {totalSinResponder}
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {grupos.map((grupo) => {
              const totalGrupo = grupo.principios.reduce(
                (acc, p) => acc + Number(p[2]),
                0
              );

              return (
                <React.Fragment key={grupo.no}>
                  {/* FILA COMPONENTE */}
                  <tr key={grupo.no}>
                    <td className={`border-2 border-black ${grupo.color} px-2 py-1 text-center font-bold`}>
                      {grupo.no}
                    </td>

                    <td className={`border-2 border-black ${grupo.color} px-2 py-1 text-center font-bold`}>
                      {grupo.titulo}
                    </td>

                    <td className={`border-2 border-black ${grupo.color} px-2 py-1 text-center font-bold`}>
                      {totalGrupo}
                    </td>

                    <td className={`border-2 border-black ${grupo.color} px-2 py-1 text-center font-bold`}>
                      {totalGrupo}
                    </td>
                  </tr>

                  {/* FILAS PRINCIPIOS */}
                  {grupo.principios.map((p, idx) => (
                    <tr key={grupo.no + "-" + idx}>
                      <td className={`border-2 border-black ${grupo.color} px-2 py-1 text-center`}>
                        {p[0]}
                      </td>

                      <td className={`border-2 border-black ${grupo.color} px-2 py-1 text-justify`}>
                        {p[1]}
                      </td>

                      <td className={`border-2 border-black ${grupo.color} px-2 py-1 text-center font-bold`}>
                        {p[2]}
                      </td>

                      <td className={`border-2 border-black ${grupo.color} px-2 py-1 text-center font-bold`}>
                        {p[2]}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}