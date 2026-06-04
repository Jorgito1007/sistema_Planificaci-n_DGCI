"use client";

import { useEffect, useState } from "react";

export default function PreguntasSresponderPage() {
  const sistemas = [
    {
      sistema: 2,
      nombre: "ADMINISTRACIÓN DE LOS RECURSOS HUMANOS",
      preguntas: 21,
      noAplica: 0,
    },
    {
      sistema: 3,
      nombre: "PLANEACIÓN Y PROGRAMACIÓN",
      preguntas: 9,
      noAplica: 0,
    },
    {
      sistema: 4,
      nombre: "PRESUPUESTO",
      preguntas: 11,
      noAplica: 0,
    },
    {
      sistema: 5,
      nombre: "ADMINISTRACIÓN FINANCIERA",
      preguntas: 25,
      noAplica: 0,
    },
    {
      sistema: 6,
      nombre: "CONTABILIDAD INTEGRADA",
      preguntas: 12,
      noAplica: 0,
    },
    {
      sistema: 7,
      nombre: "CONTRATACIÓN Y ADMINISTRACIÓN DE BIENES Y SERVICIOS",
      preguntas: 30,
      noAplica: 0,
    },
    {
      sistema: 8,
      nombre: "INVERSIONES EN PROGRAMAS Y PROYECTOS",
      preguntas: 5,
      noAplica: 0,
    },
    {
      sistema: 9,
      nombre: "TECNOLOGÍA DE LA INFORMACIÓN (TI)",
      preguntas: 18,
      noAplica: 0,
    },
  ];

  const [dataAPI, setDataAPI] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/P_sinresponder/S_Administrativo")
      .then((res) => res.json())
      .then((data) => {
        console.log("DATA API:", data);
        setDataAPI(data);
      });
  }, []);

  const getRespondidas = (sistema: number) => {
    const item = dataAPI.find((x: any) => Number(x.Sistema) === sistema);
    return Number(item?.Respondidas ?? 0);
  };

  const totalPreguntas = sistemas.reduce(
    (acc, item) => acc + item.preguntas,
    0
  );

  const totalRespondidas = sistemas.reduce(
    (acc, item) => acc + getRespondidas(item.sistema),
    0
  );

  const totalNoAplica = sistemas.reduce(
    (acc, item) => acc + item.noAplica,
    0
  );

  const totalSinResponder = sistemas.reduce((acc, item) => {
    const respondidas = getRespondidas(item.sistema);
    return acc + (item.preguntas - respondidas - item.noAplica);
  }, 0);

  return (
    <div className="min-h-screen  p-6 text-black">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 text-center">
          <h2 className="inline-block rounded-md bg-[#5b9bd5] px-8 py-3 text-lg font-bold text-white shadow-md">
            Preguntas sin Responder - Matriz Sistema de Administración
          </h2>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-2 border-black bg-[#fbe5d6] px-2 py-2 text-center text-base font-bold">
                SISTEMAS DE ADMINISTRACIÓN
              </th>

              <th className="border-2 border-black bg-[#fbe5d6] px-2 py-2 text-center font-bold">
                No. de
                <br />
                preguntas
              </th>

              <th className="border-2 border-black bg-[#9dc3e6] px-2 py-2 text-center font-bold">
                Respondidas
              </th>

              <th className="border-2 border-black bg-[#9dc3e6] px-2 py-2 text-center font-bold">
                NO APLICA
              </th>

              <th className="border-2 border-black bg-[#fbe5d6] px-2 py-2 text-center font-bold">
                No. de preguntas sin
                <br />
                responder
              </th>
            </tr>
          </thead>

          <tbody>
            {sistemas.map((item) => {
              const respondidas = getRespondidas(item.sistema);
              const sinResponder =
                item.preguntas - respondidas - item.noAplica;

              return (
                <tr key={item.sistema}>
                  <td className="border-2 border-black bg-[#fbe5d6] px-2 py-1 font-medium">
                    {item.nombre}
                  </td>

                  <td className="border-2 border-black bg-[#fbe5d6] px-2 py-1 text-center font-bold">
                    {item.preguntas}
                  </td>

                  <td className="border-2 border-black bg-[#9dc3e6] px-2 py-1 text-center font-bold">
                    {respondidas}
                  </td>

                  <td className="border-2 border-black bg-[#9dc3e6] px-2 py-1 text-center font-bold">
                    {item.noAplica}
                  </td>

                  <td className="border-2 border-black bg-[#fbe5d6] px-2 py-1 text-center font-bold">
                    {sinResponder}
                  </td>
                </tr>
              );
            })}

            <tr>
              <td className="border-2 border-black bg-[#fbe5d6] px-2 py-1 text-center text-lg font-bold">
                TOTAL
              </td>

              <td className="border-2 border-black bg-[#fbe5d6] px-2 py-1 text-center text-lg font-bold">
                {totalPreguntas}
              </td>

              <td className="border-2 border-black bg-[#9dc3e6] px-2 py-1 text-center text-lg font-bold">
                {totalRespondidas}
              </td>

              <td className="border-2 border-black bg-[#9dc3e6] px-2 py-1 text-center text-lg font-bold">
                {totalNoAplica}
              </td>

              <td className="border-2 border-black bg-[#fbe5d6] px-2 py-1 text-center text-lg font-bold">
                {totalSinResponder}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}