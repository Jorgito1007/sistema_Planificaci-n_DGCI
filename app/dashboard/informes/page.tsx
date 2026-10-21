import Link from "next/link";

import {
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileBarChart,
  FileText,
  Layers3,
  PieChart,
  TrendingUp,
  Users,
} from "lucide-react";

// ============================================================
// PÁGINA DE INFORMES
// ============================================================

export default function InformesPage() {
  return (
    <div className="min-h-screen">
      <div className="space-y-7">

        {/* ====================================================
            ENCABEZADO PRINCIPAL
        ==================================================== */}

        <div className="relative overflow-hidden rounded-2xl border border-blue-200/40 bg-gradient-to-r from-[#0B3D91] via-[#145DA0] to-[#168AAD] px-6 py-6 shadow-lg shadow-blue-900/10">

          {/* DECORACIONES */}

          <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-white/10" />

          <div className="pointer-events-none absolute right-32 top-8 h-24 w-24 rounded-full bg-white/5" />

          <div className="pointer-events-none absolute bottom-[-50px] left-[40%] h-32 w-32 rounded-full bg-cyan-300/5" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            {/* TÍTULO */}

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/15 shadow-inner backdrop-blur-sm">
                <FileBarChart className="h-7 w-7 text-white" />
              </div>

              <div>

                <p className="text-[11px] font-bold uppercase tracking-[0.20em] text-cyan-100">
                  Análisis y seguimiento
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
                  Informes
                </h1>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-100">
                  Consulte información consolidada, avances y resultados
                  de los diferentes procesos de evaluación.
                </p>

              </div>

            </div>

            {/* INDICADOR */}

            <div className="hidden items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-sm md:flex">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-100">
                  Centro de información
                </p>

                <p className="mt-0.5 text-sm font-semibold text-white">
                  Reportes y estadísticas
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ====================================================
            INTRODUCCIÓN
        ==================================================== */}

        <div className="flex items-center justify-between gap-4">

          <div>

            <h2 className="text-lg font-bold text-slate-800">
              Informes disponibles
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Seleccione el informe que desea consultar.
            </p>

          </div>

        </div>

        {/* ====================================================
            GRID PRINCIPAL
        ==================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">

          {/* ==================================================
              COLUMNA IZQUIERDA
          ================================================== */}

          <div className="space-y-6">

            {/* ==================================================
                INFORME 1
                PLANES DE ACCIÓN
            ================================================== */}

            <Link
              href="/dashboard/informes/planes-accion"
              className="group block"
            >

              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl">

                {/* LÍNEA SUPERIOR */}

                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400" />

                {/* DECORACIÓN */}

                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-50 transition-transform duration-500 group-hover:scale-125" />

                <div className="relative p-6">

                  {/* ICONO */}

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <ClipboardList className="h-7 w-7" />
                  </div>

                  {/* INFORMACIÓN */}

                  <div className="mt-5">

                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Gestión
                    </span>

                    <h3 className="mt-3 text-xl font-bold text-slate-900">
                      Informe de Planes de Acción
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Visualiza los planes de acción enviados por cada
                      usuario, incluyendo su período y detalle
                      correspondiente.
                    </p>

                  </div>

                  {/* DETALLE */}

                  <div className="mt-6 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-white px-4 py-3">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
                        <FileText className="h-4 w-4 text-emerald-600" />
                      </div>

                      <div>

                        <p className="text-xs font-semibold text-slate-700">
                          Planes enviados por usuario
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Consulta y seguimiento
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </Link>

            {/* ==================================================
                INFORME 3
                AVANCE DE REGISTROS POR USUARIO
            ================================================== */}

            <Link
              href="/dashboard/informes/avance-registros-usuario"
              className="group block"
            >

              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl">

                {/* LÍNEA SUPERIOR */}

                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-400" />

                {/* DECORACIÓN */}

                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-50 transition-transform duration-500 group-hover:scale-110" />

                <div className="relative p-6">

                  {/* ICONO */}

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                    <Users className="h-7 w-7" />
                  </div>

                  {/* ETIQUETA */}

                  <div className="mt-5">

                    <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-700">
                      Seguimiento
                    </span>

                  </div>

                  {/* TÍTULO */}

                  <h3 className="mt-3 text-xl font-bold text-slate-900">
                    Avance de Registros por Usuario
                  </h3>

                  {/* DESCRIPCIÓN */}

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Consulte el avance individual de los usuarios en el
                    registro de información, identificando preguntas
                    completadas, pendientes y su porcentaje general de
                    cumplimiento.
                  </p>

                  {/* DETALLE */}

                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50/80 to-white px-4 py-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
                      <BarChart3 className="h-4 w-4" />
                    </div>

                    <div>

                      <p className="text-xs font-bold text-slate-700">
                        Seguimiento por usuario
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Asignadas, completadas y pendientes
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </Link>

          </div>

          {/* ==================================================
              COLUMNA DERECHA
              INFORME 2 - AVANCE GENERAL
          ================================================== */}

          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-xl">

            {/* LÍNEA SUPERIOR */}

            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0B3D91] via-[#168AAD] to-cyan-400" />

            {/* DECORACIÓN */}

            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-50 transition-transform duration-500 group-hover:scale-125" />

            <div className="relative p-6">

              {/* ICONO */}

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0B3D91] ring-1 ring-blue-100">
                <TrendingUp className="h-7 w-7" />
              </div>

              {/* ETIQUETA */}

              <div className="mt-5">

                <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-700">
                  Estadísticas
                </span>

              </div>

              {/* INFORMACIÓN */}

              <div className="mt-3">

                <h3 className="text-xl font-bold text-slate-900">
                  Avance General de las Preguntas
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Consulte el nivel de avance, preguntas respondidas,
                  pendientes y porcentaje de cumplimiento de las
                  matrices de evaluación.
                </p>

              </div>

              {/* =================================================
                  SUBINFORMES
              ================================================= */}

              <div className="mt-6 space-y-3">

                {/* ===============================================
                    SISTEMA ADMINISTRATIVO
                =============================================== */}

                <Link
                  href="/dashboard/informes/avance-general/sistema-administrativo"
                  className="group/admin block"
                >

                  <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-white p-4 transition-all duration-300 hover:border-blue-300 hover:shadow-md">

                    <div className="flex items-center gap-4">

                      {/* ICONO */}

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B3D91] text-white shadow-sm">
                        <Building2 className="h-5 w-5" />
                      </div>

                      {/* TEXTO */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2">

                          <p className="font-bold text-slate-800">
                            Matriz Sistema Administrativo
                          </p>

                          <span className="hidden rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold uppercase text-blue-700 sm:inline-flex">
                            General
                          </span>

                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Avance consolidado de los Sistemas de Administración.
                        </p>

                      </div>

                      {/* FLECHA */}

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 group-hover/admin:bg-[#0B3D91]">

                        <ChevronRight className="h-4 w-4 text-slate-400 transition-all duration-300 group-hover/admin:translate-x-0.5 group-hover/admin:text-white" />

                      </div>

                    </div>

                  </div>

                </Link>

                {/* ===============================================
                    MATRIZ POR COMPONENTES
                =============================================== */}

                <Link
                  href="/dashboard/informes/avance-general/componentes"
                  className="group/componentes block"
                >

                  <div className="relative overflow-hidden rounded-xl border border-cyan-100 bg-gradient-to-r from-cyan-50/70 via-white to-white p-4 transition-all duration-300 hover:border-cyan-300 hover:shadow-md">

                    <div className="flex items-center gap-4">

                      {/* ICONO */}

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#168AAD] text-white shadow-sm">
                        <Layers3 className="h-5 w-5" />
                      </div>

                      {/* TEXTO */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2">

                          <p className="font-bold text-slate-800">
                            Matriz por Componentes
                          </p>

                          <span className="hidden rounded-full bg-cyan-100 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan-700 sm:inline-flex">
                            Componentes
                          </span>

                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Avance y seguimiento de las preguntas organizadas
                          por componentes.
                        </p>

                      </div>

                      {/* FLECHA */}

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 group-hover/componentes:bg-[#168AAD]">

                        <ChevronRight className="h-4 w-4 text-slate-400 transition-all duration-300 group-hover/componentes:translate-x-0.5 group-hover/componentes:text-white" />

                      </div>

                    </div>

                  </div>

                </Link>

              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="mt-5 border-t border-slate-100 pt-4">

                <div className="flex items-center gap-2 text-xs text-slate-500">

                  <PieChart className="h-4 w-4 text-[#168AAD]" />

                  <span>
                    Seleccione una matriz para consultar sus estadísticas.
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ====================================================
            INFORMACIÓN INFERIOR
        ==================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>

            <div>

              <p className="text-sm font-semibold text-slate-700">
                Información actualizada
              </p>

              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                Los informes presentan información consolidada de los
                registros disponibles en el sistema.
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}