"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
   ArrowLeft,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  MinusCircle,
  TrendingUp,
  Database,
} from "lucide-react";

export default function PreguntasSresponderPage() {

  // ============================================================
  // SISTEMAS ADMINISTRATIVOS
  // ============================================================

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


  // ============================================================
  // ESTADOS
  // ============================================================

  const [dataAPI, setDataAPI] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);


  // ============================================================
  // CARGAR DATOS
  // ============================================================

  useEffect(() => {

    const cargarDatos = async () => {

      try {

        setCargando(true);

        const res = await fetch(
          "/api/P_sinresponder/S_Administrativo"
        );

        if (!res.ok) {
          throw new Error("Error al consultar los datos");
        }

        const data = await res.json();

        console.log("DATA API:", data);

        setDataAPI(Array.isArray(data) ? data : []);

      } catch (error) {

        console.error(
          "Error cargando estadísticas:",
          error
        );

        setDataAPI([]);

      } finally {

        setCargando(false);

      }

    };

    cargarDatos();

  }, []);


  // ============================================================
  // OBTENER RESPONDIDAS POR SISTEMA
  // ============================================================

  const getRespondidas = (sistema: number) => {

    const item = dataAPI.find(
      (x: any) => Number(x.Sistema) === sistema
    );

    return Number(item?.Respondidas ?? 0);
  };


  // ============================================================
  // CALCULAR PREGUNTAS PENDIENTES
  // ============================================================

  const getSinResponder = (
    preguntas: number,
    respondidas: number,
    noAplica: number
  ) => {

    return Math.max(
      preguntas - respondidas - noAplica,
      0
    );

  };


  // ============================================================
  // PORCENTAJE POR SISTEMA
  // ============================================================

  const getPorcentaje = (
    preguntas: number,
    respondidas: number,
    noAplica: number
  ) => {

    const evaluables = Math.max(
      preguntas - noAplica,
      0
    );

    if (evaluables === 0) {
      return 100;
    }

    const porcentaje =
      (respondidas / evaluables) * 100;

    return Math.min(
      Math.round(porcentaje),
      100
    );

  };


  // ============================================================
  // TOTALES
  // ============================================================

  const totalPreguntas = sistemas.reduce(
    (acc, item) => acc + item.preguntas,
    0
  );


  const totalRespondidas = sistemas.reduce(
    (acc, item) =>
      acc + getRespondidas(item.sistema),
    0
  );


  const totalNoAplica = sistemas.reduce(
    (acc, item) => acc + item.noAplica,
    0
  );


  const totalSinResponder = sistemas.reduce(
    (acc, item) => {

      const respondidas =
        getRespondidas(item.sistema);

      return (
        acc +
        getSinResponder(
          item.preguntas,
          respondidas,
          item.noAplica
        )
      );

    },
    0
  );


  // ============================================================
  // TOTAL EVALUABLE
  // ============================================================

  const totalEvaluables = Math.max(
    totalPreguntas - totalNoAplica,
    0
  );


  // ============================================================
  // PORCENTAJE GENERAL
  // ============================================================

  const porcentajeGeneral =
    totalEvaluables > 0
      ? Math.min(
          Math.round(
            (totalRespondidas /
              totalEvaluables) *
              100
          ),
          100
        )
      : 0;


  // ============================================================
  // ESTADO GENERAL
  // ============================================================

  const estadoGeneral =
    porcentajeGeneral === 100
      ? "Completado"
      : porcentajeGeneral >= 75
        ? "Avance alto"
        : porcentajeGeneral >= 50
          ? "En progreso"
          : porcentajeGeneral > 0
            ? "Avance inicial"
            : "Sin iniciar";


  // ============================================================
  // RETURN
  // ============================================================

  return (


    <div className="min-h-screen bg-slate-50/50 p-4 text-slate-800 md:p-6">

      <div className="flex items-center justify-between mb-4">

    <Link
      href="/dashboard/informes"
      className="group inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md"
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />

      Volver a Informes
    </Link>

  </div>

      <div className="mx-auto w-full max-w-7xl space-y-6">


        {/* ====================================================
            ENCABEZADO PRINCIPAL
        ==================================================== */}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B3D91] via-[#145DA0] to-[#168AAD] px-6 py-6 shadow-lg shadow-blue-900/10">

          {/* Decoraciones */}
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10" />

          <div className="pointer-events-none absolute right-32 top-8 h-24 w-24 rounded-full bg-white/5" />


          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">


            {/* TÍTULO */}

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur-sm">

                <BarChart3 className="h-7 w-7 text-white" />

              </div>


              <div>

                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100">
                  Sistemas de Administración
                </p>

                <h1 className="mt-1 text-xl font-bold tracking-tight text-white md:text-2xl">
                  Seguimiento de Evaluación
                </h1>

                <p className="mt-1 text-sm text-blue-100">
                  Estado general de preguntas respondidas y pendientes
                </p>

              </div>

            </div>


            {/* AVANCE GENERAL */}

            <div className="flex items-center gap-5 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-sm">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-100">
                  Avance general
                </p>

                <div className="mt-1 flex items-end gap-2">

                  <span className="text-3xl font-black text-white">
                    {cargando
                      ? "--"
                      : `${porcentajeGeneral}%`}
                  </span>

                  <span className="mb-1 text-xs text-blue-100">
                    completado
                  </span>

                </div>

              </div>


              <div className="h-10 w-px bg-white/20" />


              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-100">
                  Estado
                </p>

                <span className="mt-1 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">

                  {cargando
                    ? "Cargando..."
                    : estadoGeneral}

                </span>

              </div>

            </div>

          </div>

        </div>



        {/* ====================================================
            TARJETAS ESTADÍSTICAS
        ==================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 text-aling">


          {/* TOTAL PREGUNTAS */}

          <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

            <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-blue-100/70" />


            <div className="relative">

              <div className="mb-5 flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">

                  <ClipboardList className="h-5 w-5" />

                </div>

                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                  Total
                </span>

              </div>


              <p className="text-3xl font-black text-[#123B5D]">
                {totalPreguntas}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                Preguntas
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Total de preguntas registradas
              </p>

            </div>

          </div>



          {/* RESPONDIDAS */}

          <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

            <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-emerald-100/70" />


            <div className="relative">

              <div className="mb-5 flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">

                  <CheckCircle2 className="h-5 w-5" />

                </div>

                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  Completadas
                </span>

              </div>


              <p className="text-3xl font-black text-emerald-700">
                {cargando
                  ? "--"
                  : totalRespondidas}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                Respondidas
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Preguntas que ya fueron evaluadas
              </p>

            </div>

          </div>



          {/* SIN RESPONDER */}

          <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

            <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-amber-100/70" />


            <div className="relative">

              <div className="mb-5 flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">

                  <CircleDashed className="h-5 w-5" />

                </div>

                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Pendientes
                </span>

              </div>


              <p className="text-3xl font-black text-amber-600">
                {cargando
                  ? "--"
                  : totalSinResponder}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                Sin responder
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Preguntas pendientes de evaluación
              </p>

            </div>

          </div>


 </div>



        {/* ====================================================
            PROGRESO GENERAL
        ==================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">


          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">


            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-[#168AAD]">

                <TrendingUp className="h-5 w-5" />

              </div>


              <div>

                <p className="text-sm font-bold text-slate-800">
                  Progreso general de contestación
                </p>

                <p className="mt-0.5 text-xs text-slate-500">

                  {cargando
                    ? "Consultando información..."
                    : `${totalRespondidas} de ${totalEvaluables} preguntas evaluables respondidas`}

                </p>

              </div>

            </div>


            <span className="rounded-full bg-[#E6F2F7] px-3 py-1.5 text-xs font-bold text-[#0B5F76]">

              {cargando
                ? "Cargando..."
                : `${porcentajeGeneral}% completado`}

            </span>

          </div>



          {/* BARRA */}

          <div className="mt-5">

            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">

              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0B3D91] via-[#168AAD] to-emerald-500 transition-[width] duration-700 ease-out"
                style={{
                  width: cargando
                    ? "0%"
                    : `${porcentajeGeneral}%`,
                }}
              />

            </div>


            <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-400">

              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>

            </div>

          </div>

        </div>



        {/* ====================================================
            DETALLE POR SISTEMA
        ==================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">


          {/* ENCABEZADO TABLA */}

          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">


            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F2F8] text-[#0B3D91]">

                <Database className="h-4 w-4" />

              </div>


              <div>

                <h2 className="text-sm font-bold text-slate-800">
                  Detalle por Sistema de Administración
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Seguimiento individual del avance de cada sistema
                </p>

              </div>

            </div>


            <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {sistemas.length} sistemas
            </span>

          </div>



          {/* ==================================================
              TABLA RESPONSIVE
          ================================================== */}

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[1000px] border-collapse text-sm">


              {/* ==============================================
                  HEAD
              ============================================== */}

              <thead>

                <tr className="bg-[#123B5D] text-xs uppercase tracking-wide text-white">

                  <th className="px-5 py-4 text-left font-bold">
                    Sistema de Administración
                  </th>

                  <th className="px-4 py-4 text-center font-bold">
                    Total
                  </th>

                  <th className="px-4 py-4 text-center font-bold">
                    Respondidas
                  </th>

                  <th className="px-4 py-4 text-center font-bold">
                    No aplica
                  </th>

                  <th className="px-4 py-4 text-center font-bold">
                    Pendientes
                  </th>

                  <th className="min-w-[220px] px-5 py-4 text-left font-bold">
                    Progreso
                  </th>

                </tr>

              </thead>



              {/* ==============================================
                  BODY
              ============================================== */}

              <tbody>

                {sistemas.map((item, index) => {

                  const respondidas =
                    getRespondidas(item.sistema);


                  const sinResponder =
                    getSinResponder(
                      item.preguntas,
                      respondidas,
                      item.noAplica
                    );


                  const porcentaje =
                    getPorcentaje(
                      item.preguntas,
                      respondidas,
                      item.noAplica
                    );


                  return (

                    <tr
                      key={item.sistema}
                      className={`
                        border-b border-slate-100
                        transition-colors
                        hover:bg-blue-50/50
                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/40"
                        }
                      `}
                    >


                      {/* SISTEMA */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F2F8] text-xs font-black text-[#0B3D91]">

                            {item.sistema}

                          </div>


                          <span className="font-semibold leading-5 text-slate-700">

                            {item.nombre}

                          </span>

                        </div>

                      </td>



                      {/* TOTAL */}

                      <td className="px-4 py-4 text-center">

                        <span className="inline-flex min-w-[42px] items-center justify-center rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-blue-700">

                          {item.preguntas}

                        </span>

                      </td>



                      {/* RESPONDIDAS */}

                      <td className="px-4 py-4 text-center">

                        <span className="inline-flex min-w-[42px] items-center justify-center rounded-lg bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">

                          {cargando
                            ? "-"
                            : respondidas}

                        </span>

                      </td>



                      {/* NO APLICA */}

                      <td className="px-4 py-4 text-center">

                        <span className="inline-flex min-w-[42px] items-center justify-center rounded-lg bg-violet-50 px-3 py-1.5 font-bold text-violet-700">

                          {item.noAplica}

                        </span>

                      </td>



                      {/* PENDIENTES */}

                      <td className="px-4 py-4 text-center">

                        <span
                          className={`
                            inline-flex min-w-[42px]
                            items-center justify-center
                            rounded-lg px-3 py-1.5
                            font-bold
                            ${
                              sinResponder === 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }
                          `}
                        >

                          {cargando
                            ? "-"
                            : sinResponder}

                        </span>

                      </td>



                      {/* ========================================
                          PROGRESO
                      ======================================== */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">


                          {/* BARRA */}

                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">

                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#0B3D91] to-[#168AAD] transition-[width] duration-700"
                              style={{
                                width: cargando
                                  ? "0%"
                                  : `${porcentaje}%`,
                              }}
                            />

                          </div>



                          {/* PORCENTAJE */}

                          <span
                            className={`
                              min-w-[48px]
                              text-right
                              text-xs
                              font-black
                              ${
                                porcentaje === 100
                                  ? "text-emerald-600"
                                  : porcentaje >= 50
                                    ? "text-blue-700"
                                    : "text-amber-600"
                              }
                            `}
                          >

                            {cargando
                              ? "--"
                              : `${porcentaje}%`}

                          </span>

                        </div>

                      </td>

                    </tr>

                  );

                })}



               
              </tbody>

            </table>

          </div>

        </div>



     
      </div>

    </div>

  );

}