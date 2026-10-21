"use client";

import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Layers3,
  ShieldCheck,
  CircleDashed,
} from "lucide-react";

import Link from "next/link";


// ============================================================
// DATOS
// ============================================================

const grupos = [
  {
    no: 1,
    titulo: "Entorno de Control",
    principios: [
      {
        numero: "Principio 1",
        texto:
          "La Entidad demuestra compromiso con la integridad y los valores éticos.",
        preguntas: 6,
        respondidas: 0,
      },
      {
        numero: "Principio 2",
        texto:
          "La Máxima autoridad demuestra independencia de la dirección y ejerce la supervisión del desarrollo y funcionamiento del sistema de control interno.",
        preguntas: 4,
        respondidas: 0,
      },
      {
        numero: "Principio 3",
        texto:
          "La Máxima Autoridad establece supervisión en las estructuras, líneas de reporte y una apropiada asignación de autoridad y responsabilidad para la consecución de los objetivos.",
        preguntas: 3,
        respondidas: 0,
      },
      {
        numero: "Principio 4",
        texto:
          "La Máxima Autoridad demuestra compromiso para atraer, desarrollar y retener a profesionales competentes en concordancia con los objetivos de las entidades.",
        preguntas: 4,
        respondidas: 0,
      },
      {
        numero: "Principio 5",
        texto:
          "La Máxima Autoridad y la Administración definen las responsabilidades de los servidores públicos a nivel de control interno para la consecución de los objetivos.",
        preguntas: 2,
        respondidas: 0,
      },
    ],
  },

  {
    no: 2,
    titulo: "Evaluación de Riesgos",
    principios: [
      {
        numero: "Principio 6",
        texto:
          "Las entidades definen objetivos con la suficiente claridad para permitir la identificación y evaluación de los riesgos relacionados.",
        preguntas: 4,
        respondidas: 0,
      },
      {
        numero: "Principio 7",
        texto:
          "La Entidad identifica riesgos para el logro de sus objetivos y los analiza como base para determinar cómo deben ser administrados.",
        preguntas: 5,
        respondidas: 0,
      },
      {
        numero: "Principio 8",
        texto:
          "La Entidad considera la posibilidad de irregularidades en la evaluación de riesgos para el logro de objetivos.",
        preguntas: 2,
        respondidas: 0,
      },
      {
        numero: "Principio 9",
        texto:
          "La Entidad identifica y evalúa los cambios que podrían afectar significativamente al sistema de control interno.",
        preguntas: 1,
        respondidas: 0,
      },
    ],
  },

  {
    no: 3,
    titulo: "Actividades de Control",
    principios: [
      {
        numero: "Principio 10",
        texto:
          "La Entidad selecciona y desarrolla actividades de control que contribuyen en la mitigación de riesgos al logro de objetivos, a un nivel aceptable.",
        preguntas: 4,
        respondidas: 0,
      },
      {
        numero: "Principio 11",
        texto:
          "La Entidad selecciona y desarrolla actividades generales de control sobre la tecnología, para apoyar el logro de los objetivos.",
        preguntas: 7,
        respondidas: 0,
      },
      {
        numero: "Principio 12",
        texto:
          "La Entidad implementa actividades de control a través de políticas que establezcan lo requerido y procedimientos que pongan estas políticas en acción.",
        preguntas: 3,
        respondidas: 0,
      },
    ],
  },

  {
    no: 4,
    titulo: "Información y Comunicación",
    principios: [
      {
        numero: "Principio 13",
        texto:
          "La Entidad obtiene o genera y utiliza información relevante, y de calidad para apoyar el funcionamiento del control interno.",
        preguntas: 4,
        respondidas: 0,
      },
      {
        numero: "Principio 14",
        texto:
          "La Entidad comunica internamente información, incluyendo objetivos y responsabilidades sobre el Control Interno necesaria para soportar el funcionamiento del control interno.",
        preguntas: 4,
        respondidas: 0,
      },
      {
        numero: "Principio 15",
        texto:
          "La Entidad se comunica con los grupos de interés externos en relación con los aspectos que afectan el funcionamiento del control interno.",
        preguntas: 3,
        respondidas: 0,
      },
    ],
  },

  {
    no: 5,
    titulo: "Supervisión - Monitoreo",
    principios: [
      {
        numero: "Principio 16",
        texto:
          "La Entidad selecciona, desarrolla y realiza evaluaciones concurrentes o separadas para determinar si los componentes de control interno están presentes y funcionando.",
        preguntas: 2,
        respondidas: 0,
      },
      {
        numero: "Principio 17",
        texto:
          "La Entidad evalúa y comunica las deficiencias de control interno de manera oportuna a los responsables de tomar acciones correctivas.",
        preguntas: 2,
        respondidas: 0,
      },
    ],
  },
];


// ============================================================
// COMPONENTE
// ============================================================

export default function PreguntasSinResponderComponentesPage() {

  // ==========================================================
  // TOTALES
  // ==========================================================

  const totalPreguntas = grupos.reduce(
    (total, grupo) =>
      total +
      grupo.principios.reduce(
        (subtotal, principio) =>
          subtotal + principio.preguntas,
        0
      ),
    0
  );


  const totalRespondidas = grupos.reduce(
    (total, grupo) =>
      total +
      grupo.principios.reduce(
        (subtotal, principio) =>
          subtotal + principio.respondidas,
        0
      ),
    0
  );


  const totalPendientes =
    totalPreguntas - totalRespondidas;


  const porcentajeGeneral =
    totalPreguntas > 0
      ? Math.round(
          (totalRespondidas / totalPreguntas) * 100
        )
      : 0;


  // ==========================================================
  // COLOR SEGÚN PORCENTAJE
  // ==========================================================

  const obtenerColorProgreso = (
    porcentaje: number
  ) => {

    if (porcentaje < 60) {
      return {
        barra:
          "bg-gradient-to-r from-red-600 to-red-400",
        texto:
          "text-red-700",
        fondo:
          "bg-red-50",
      };
    }

    if (porcentaje < 80) {
      return {
        barra:
          "bg-gradient-to-r from-amber-500 to-yellow-400",
        texto:
          "text-amber-700",
        fondo:
          "bg-amber-50",
      };
    }

    return {
      barra:
        "bg-gradient-to-r from-emerald-600 to-green-400",
      texto:
        "text-emerald-700",
      fondo:
        "bg-emerald-50",
    };

  };


  const colorGeneral =
    obtenerColorProgreso(porcentajeGeneral);


  // ==========================================================
  // RETURN
  // ==========================================================

  return (

    <div className="min-h-screen">

      <div className="space-y-6">


        {/* ====================================================
            VOLVER
        ==================================================== */}

        <Link
          href="/dashboard/informes"
          className="group inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >

          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />

          Volver a Informes

        </Link>



        {/* ====================================================
            ENCABEZADO
        ==================================================== */}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#10469a] via-[#1768a7] to-[#2796ae] px-6 py-5 shadow-lg">


          {/* DECORACIÓN */}

          <div className="pointer-events-none absolute -right-12 -top-20 h-44 w-44 rounded-full bg-white/10" />

          <div className="pointer-events-none absolute right-28 top-10 h-24 w-24 rounded-full bg-white/5" />


          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">


            {/* TÍTULO */}

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/10">

                <Layers3 className="h-7 w-7" />

              </div>


              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100">
                  Matriz por Componentes
                </p>

                <h1 className="mt-1 text-2xl font-bold text-white">
                  Seguimiento de Evaluación
                </h1>

                <p className="mt-1 text-sm text-blue-50">
                  Estado general de preguntas respondidas y pendientes
                  por componentes.
                </p>

              </div>

            </div>


            {/* AVANCE */}

            <div className="flex items-center gap-5 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                  Avance general
                </p>

                <div className="mt-1 flex items-end gap-2">

                  <span className="text-3xl font-black text-white">
                    {porcentajeGeneral}%
                  </span>

                  <span className="mb-1 text-[10px] text-blue-100">
                    completado
                  </span>

                </div>

              </div>


              <div className="h-10 w-px bg-white/20" />


              <div>

                <p className="text-[9px] font-bold uppercase tracking-wider text-blue-100">
                  Estado
                </p>

                <span className="mt-1 inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold text-white">

                  {porcentajeGeneral >= 80
                    ? "Avance alto"
                    : porcentajeGeneral >= 60
                      ? "Avance medio"
                      : "Avance inicial"}

                </span>

              </div>

            </div>

          </div>

        </div>



        {/* ====================================================
            TARJETAS ESTADÍSTICAS
        ==================================================== */}

        <div className="grid gap-4 sm:grid-cols-3">


          {/* TOTAL */}

          <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">

            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-50" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <ClipboardList className="h-5 w-5" />
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-[9px] font-bold uppercase text-blue-700">
                  Total
                </span>

              </div>

              <p className="mt-5 text-3xl font-black text-[#073b72]">
                {totalPreguntas}
              </p>

              <p className="text-sm font-bold text-slate-800">
                Preguntas
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Total de preguntas registradas
              </p>

            </div>

          </div>



          {/* RESPONDIDAS */}

          <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-50" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-bold uppercase text-emerald-700">
                  Completadas
                </span>

              </div>

              <p className="mt-5 text-3xl font-black text-emerald-700">
                {totalRespondidas}
              </p>

              <p className="text-sm font-bold text-slate-800">
                Respondidas
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Preguntas que ya fueron evaluadas
              </p>

            </div>

          </div>



          {/* PENDIENTES */}

          <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">

            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-50" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <CircleDashed className="h-5 w-5" />
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-[9px] font-bold uppercase text-amber-700">
                  Pendientes
                </span>

              </div>

              <p className="mt-5 text-3xl font-black text-amber-600">
                {totalPendientes}
              </p>

              <p className="text-sm font-bold text-slate-800">
                Sin responder
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Preguntas pendientes de evaluación
              </p>

            </div>

          </div>

        </div>



        {/* ====================================================
            PROGRESO GLOBAL
        ==================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <BarChart3 className="h-4 w-4" />
              </div>

              <div>

                <p className="text-sm font-bold text-slate-800">
                  Progreso general de contestación
                </p>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  {totalRespondidas} de {totalPreguntas} preguntas
                  evaluables respondidas
                </p>

              </div>

            </div>


            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${colorGeneral.fondo} ${colorGeneral.texto}`}
            >
              {porcentajeGeneral}% completado
            </span>

          </div>


          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">

            <div
              className={`h-full rounded-full transition-[width] duration-700 ${colorGeneral.barra}`}
              style={{
                width: `${porcentajeGeneral}%`,
              }}
            />

          </div>


          <div className="mt-2 flex justify-between text-[9px] text-slate-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>

        </div>



        {/* ====================================================
            DETALLE POR COMPONENTES
        ==================================================== */}

        <div>

          <div className="mb-4">

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
              Detalle
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Detalle por Componentes
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Avance individual de cada componente y sus principios.
            </p>

          </div>


          <div className="space-y-5">

            {grupos.map((grupo) => {

              const totalGrupo =
                grupo.principios.reduce(
                  (total, principio) =>
                    total + principio.preguntas,
                  0
                );


              const respondidasGrupo =
                grupo.principios.reduce(
                  (total, principio) =>
                    total + principio.respondidas,
                  0
                );


              const pendientesGrupo =
                totalGrupo - respondidasGrupo;


              const porcentajeGrupo =
                totalGrupo > 0
                  ? Math.round(
                      (respondidasGrupo /
                        totalGrupo) *
                        100
                    )
                  : 0;


              const colorGrupo =
                obtenerColorProgreso(
                  porcentajeGrupo
                );


              return (

                <div
                  key={grupo.no}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >


                  {/* ==========================================
                      CABECERA COMPONENTE
                  ========================================== */}

                  <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">


                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 font-black text-blue-700">
                          {grupo.no}
                        </div>


                        <div>

                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-600">
                            Componente {grupo.no}
                          </p>

                          <h3 className="mt-1 font-bold text-slate-900">
                            {grupo.titulo}
                          </h3>

                        </div>

                      </div>


                      {/* ESTADÍSTICAS COMPONENTE */}

                      <div className="flex items-center gap-5">

                        <div className="text-center">
                          <p className="text-lg font-black text-blue-700">
                            {totalGrupo}
                          </p>
                          <p className="text-[9px] uppercase text-slate-400">
                            Total
                          </p>
                        </div>


                        <div className="h-8 w-px bg-slate-200" />


                        <div className="text-center">
                          <p className="text-lg font-black text-emerald-600">
                            {respondidasGrupo}
                          </p>
                          <p className="text-[9px] uppercase text-slate-400">
                            Respondidas
                          </p>
                        </div>


                        <div className="h-8 w-px bg-slate-200" />


                        <div className="text-center">
                          <p className="text-lg font-black text-amber-600">
                            {pendientesGrupo}
                          </p>
                          <p className="text-[9px] uppercase text-slate-400">
                            Pendientes
                          </p>
                        </div>


                        <span
                          className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${colorGrupo.fondo} ${colorGrupo.texto}`}
                        >
                          {porcentajeGrupo}%
                        </span>

                      </div>

                    </div>


                    {/* BARRA COMPONENTE */}

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">

                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ${colorGrupo.barra}`}
                        style={{
                          width: `${porcentajeGrupo}%`,
                        }}
                      />

                    </div>

                  </div>



                  {/* ==========================================
                      PRINCIPIOS
                  ========================================== */}

                  <div className="divide-y divide-slate-100">

                    {grupo.principios.map(
                      (principio) => {

                        const pendientes =
                          principio.preguntas -
                          principio.respondidas;


                        const porcentaje =
                          principio.preguntas > 0
                            ? Math.round(
                                (principio.respondidas /
                                  principio.preguntas) *
                                  100
                              )
                            : 0;


                        const color =
                          obtenerColorProgreso(
                            porcentaje
                          );


                        return (

                          <div
                            key={principio.numero}
                            className="px-5 py-4 transition-colors hover:bg-slate-50/70"
                          >

                            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">


                              {/* INFORMACIÓN */}

                              <div className="flex items-start gap-3">

                                <div className="mt-0.5 flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-100 px-2 text-[10px] font-black text-slate-600">

                                  {principio.numero.replace(
                                    "Principio ",
                                    "P"
                                  )}

                                </div>


                                <div>

                                  <p className="text-xs font-bold text-slate-800">
                                    {principio.numero}
                                  </p>

                                  <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500">
                                    {principio.texto}
                                  </p>

                                </div>

                              </div>



                              {/* ESTADÍSTICAS */}

                              <div className="flex items-center gap-4 lg:min-w-[310px] lg:justify-end">

                                <div className="text-center">

                                  <p className="text-sm font-black text-blue-700">
                                    {principio.preguntas}
                                  </p>

                                  <p className="text-[8px] uppercase tracking-wide text-slate-400">
                                    Total
                                  </p>

                                </div>


                                <div className="text-center">

                                  <p className="text-sm font-black text-emerald-600">
                                    {principio.respondidas}
                                  </p>

                                  <p className="text-[8px] uppercase tracking-wide text-slate-400">
                                    Respondidas
                                  </p>

                                </div>


                                <div className="text-center">

                                  <p className="text-sm font-black text-amber-600">
                                    {pendientes}
                                  </p>

                                  <p className="text-[8px] uppercase tracking-wide text-slate-400">
                                    Pendientes
                                  </p>

                                </div>


                                <div className="w-24">

                                  <div className="mb-1 flex justify-end">

                                    <span
                                      className={`text-[9px] font-bold ${color.texto}`}
                                    >
                                      {porcentaje}%
                                    </span>

                                  </div>

                                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">

                                    <div
                                      className={`h-full rounded-full ${color.barra}`}
                                      style={{
                                        width: `${porcentaje}%`,
                                      }}
                                    />

                                  </div>

                                </div>

                              </div>

                            </div>

                          </div>

                        );

                      }
                    )}

                  </div>

                </div>

              );

            })}

          </div>

        </div>

      </div>

    </div>

  );

}