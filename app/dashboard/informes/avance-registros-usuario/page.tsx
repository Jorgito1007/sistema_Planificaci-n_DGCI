"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Layers3,
  Loader2,
  Search,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
// ============================================================
// TIPO
// ============================================================

type UsuarioAvance = {
  usuarioId: string;
  nombreUsuario: string;
  email: string;
  cargo: string;

  asignadasSistema: number;
  registradasSistema: number;
  pendientesSistema: number;

  asignadasComponentes: number;
  registradasComponentes: number;
  pendientesComponentes: number;

  totalAsignadas: number;
  totalRegistradas: number;
  totalPendientes: number;

  porcentajeAvance: number;
};


// ============================================================
// PALETA DE COLORES POR USUARIO
// ============================================================

const coloresUsuarios = [
  {
    avatar: "bg-violet-100 text-violet-700",
    borde: "hover:border-violet-300",
    linea: "from-violet-600 to-purple-500",
    decoracion: "bg-violet-50/70",
    icono: "text-violet-500",
    texto: "text-violet-600",
    badge: "bg-violet-50 text-violet-700",
    barra: "from-violet-600 to-purple-500",
  },
  {
    avatar: "bg-blue-100 text-blue-700",
    borde: "hover:border-blue-300",
    linea: "from-blue-600 to-cyan-500",
    decoracion: "bg-blue-50/70",
    icono: "text-blue-500",
    texto: "text-blue-600",
    badge: "bg-blue-50 text-blue-700",
    barra: "from-blue-600 to-cyan-500",
  },
  {
    avatar: "bg-emerald-100 text-emerald-700",
    borde: "hover:border-emerald-300",
    linea: "from-emerald-600 to-teal-500",
    decoracion: "bg-emerald-50/70",
    icono: "text-emerald-500",
    texto: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
    barra: "from-emerald-600 to-teal-500",
  },
  {
    avatar: "bg-orange-100 text-orange-700",
    borde: "hover:border-orange-300",
    linea: "from-orange-500 to-amber-500",
    decoracion: "bg-orange-50/70",
    icono: "text-orange-500",
    texto: "text-orange-600",
    badge: "bg-orange-50 text-orange-700",
    barra: "from-orange-500 to-amber-500",
  },
  {
    avatar: "bg-rose-100 text-rose-700",
    borde: "hover:border-rose-300",
    linea: "from-rose-600 to-pink-500",
    decoracion: "bg-rose-50/70",
    icono: "text-rose-500",
    texto: "text-rose-600",
    badge: "bg-rose-50 text-rose-700",
    barra: "from-rose-600 to-pink-500",
  },
  {
    avatar: "bg-cyan-100 text-cyan-700",
    borde: "hover:border-cyan-300",
    linea: "from-cyan-600 to-sky-500",
    decoracion: "bg-cyan-50/70",
    icono: "text-cyan-500",
    texto: "text-cyan-600",
    badge: "bg-cyan-50 text-cyan-700",
    barra: "from-cyan-600 to-sky-500",
  },
  {
    avatar: "bg-indigo-100 text-indigo-700",
    borde: "hover:border-indigo-300",
    linea: "from-indigo-600 to-blue-500",
    decoracion: "bg-indigo-50/70",
    icono: "text-indigo-500",
    texto: "text-indigo-600",
    badge: "bg-indigo-50 text-indigo-700",
    barra: "from-indigo-600 to-blue-500",
  },
  {
    avatar: "bg-teal-100 text-teal-700",
    borde: "hover:border-teal-300",
    linea: "from-teal-600 to-emerald-500",
    decoracion: "bg-teal-50/70",
    icono: "text-teal-500",
    texto: "text-teal-600",
    badge: "bg-teal-50 text-teal-700",
    barra: "from-teal-600 to-emerald-500",
  },
];

// ============================================================
// COMPONENTE
// ============================================================

export default function AvanceRegistrosUsuarioPage() {

  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [usuarios, setUsuarios] = useState<UsuarioAvance[]>([]);

  const [busqueda, setBusqueda] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ==========================================================
  // CARGAR DATOS DESDE LA API
  // ==========================================================

  useEffect(() => {

    const cargarDatos = async () => {

      try {

        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/informes/avance-registros-usuario",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "No se pudo obtener la información del informe."
          );
        }

        const data = await response.json();

        setUsuarios(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          "Error cargando avance por usuario:",
          error
        );

        setError(
          "No fue posible cargar la información de los usuarios."
        );

      } finally {

        setLoading(false);

      }

    };

    cargarDatos();

  }, []);


  // ==========================================================
  // USUARIOS FILTRADOS
  // ==========================================================

  const usuariosFiltrados = useMemo(() => {

    const texto = busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      return usuarios;
    }

    return usuarios.filter((usuario) => {

      return (
        usuario.nombreUsuario
          .toLowerCase()
          .includes(texto) ||

        usuario.cargo
          .toLowerCase()
          .includes(texto) ||

        usuario.email
          .toLowerCase()
          .includes(texto)
      );

    });

  }, [busqueda, usuarios]);


  // ==========================================================
  // TOTALES GENERALES
  // ==========================================================

  const totalUsuarios = usuarios.length;


  const totalAsignadas = usuarios.reduce(
    (total, usuario) =>
      total + usuario.totalAsignadas,
    0
  );


  const totalRegistradas = usuarios.reduce(
    (total, usuario) =>
      total + usuario.totalRegistradas,
    0
  );


  const totalPendientes = usuarios.reduce(
    (total, usuario) =>
      total + usuario.totalPendientes,
    0
  );


  // ==========================================================
  // PORCENTAJE GENERAL
  // ==========================================================

  const porcentajeGeneral =
    totalAsignadas > 0
      ? Math.min(
          Math.round(
            (totalRegistradas / totalAsignadas) * 100
          ),
          100
        )
      : 0;


  // ==========================================================
  // INICIALES
  // ==========================================================

  const obtenerIniciales = (nombre: string) => {

    if (!nombre) {
      return "US";
    }

    const palabras = nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (palabras.length === 0) {
      return "US";
    }

    if (palabras.length === 1) {
      return palabras[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      palabras[0][0] +
      palabras[1][0]
    ).toUpperCase();

  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="flex min-h-[500px] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">

            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />

          </div>

          <p className="mt-4 text-sm font-bold text-slate-700">
            Cargando avance de usuarios
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Espere un momento...
          </p>

        </div>

      </div>
    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">

          <AlertCircle className="h-7 w-7 text-red-600" />

        </div>

        <h2 className="mt-4 font-bold text-red-800">
          No se pudo cargar el informe
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>

      </div>
    );

  }


  // ==========================================================
  // RETURN
  // ==========================================================

  return (

    <div className="min-h-screen">

      <div className="space-y-6">



  <div className="flex items-center justify-between">

    <Link
      href="/dashboard/informes"
      className="group inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md"
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />

      Volver a Informes
    </Link>

  </div>


        {/* ====================================================
            ENCABEZADO
        ==================================================== */}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B3D91] via-[#145DA0] to-[#168AAD] px-6 py-6 shadow-lg shadow-blue-900/10">

          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10" />

          <div className="pointer-events-none absolute right-40 top-10 h-24 w-24 rounded-full bg-white/5" />

          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-indigo-400/10" />


          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">


            {/* INFORMACIÓN */}

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/15 shadow-inner backdrop-blur-sm">

                <Users className="h-7 w-7 text-white" />

              </div>


              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-100">
                  Informe de seguimiento
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
                  Avance de Registros por Usuario
                </h1>

                <p className="mt-1 max-w-2xl text-sm text-violet-100">
                  Seguimiento general del cumplimiento de las preguntas
                  asignadas a cada usuario.
                </p>

              </div>

            </div>


            {/* AVANCE GENERAL */}

            <div className="flex items-center gap-5 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-sm">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-100">
                  Avance general
                </p>

                <div className="mt-1 flex items-end gap-2">

                  <span className="text-3xl font-black text-white">
                    {porcentajeGeneral}%
                  </span>

                  <span className="mb-1 text-xs text-violet-100">
                    completado
                  </span>

                </div>

              </div>


              <div className="h-10 w-px bg-white/20" />


              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">

                <TrendingUp className="h-5 w-5 text-white" />

              </div>

            </div>

          </div>

        </div>



        {/* ====================================================
            INDICADORES GENERALES
        ==================================================== */}

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">


          {/* USUARIOS */}

          <div className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-50 transition-transform duration-500 group-hover:scale-125" />

            <div className="relative flex items-center gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">

                <Users className="h-5 w-5" />

              </div>

              <div>

                <p className="text-2xl font-black text-violet-700">
                  {totalUsuarios}
                </p>

                <p className="text-xs font-semibold text-slate-500">
                  Usuarios
                </p>

              </div>

            </div>

          </div>


          {/* ASIGNADAS */}

          <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-50 transition-transform duration-500 group-hover:scale-125" />

            <div className="relative flex items-center gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <ClipboardList className="h-5 w-5" />

              </div>

              <div>

                <p className="text-2xl font-black text-blue-700">
                  {totalAsignadas}
                </p>

                <p className="text-xs font-semibold text-slate-500">
                  Asignadas
                </p>

              </div>

            </div>

          </div>


          {/* REGISTRADAS */}

          <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-50 transition-transform duration-500 group-hover:scale-125" />

            <div className="relative flex items-center gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

                <CheckCircle2 className="h-5 w-5" />

              </div>

              <div>

                <p className="text-2xl font-black text-emerald-700">
                  {totalRegistradas}
                </p>

                <p className="text-xs font-semibold text-slate-500">
                  Registradas
                </p>

              </div>

            </div>

          </div>


          {/* PENDIENTES */}

          <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">

            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-50 transition-transform duration-500 group-hover:scale-125" />

            <div className="relative flex items-center gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

                <CircleDashed className="h-5 w-5" />

              </div>

              <div>

                <p className="text-2xl font-black text-amber-600">
                  {totalPendientes}
                </p>

                <p className="text-xs font-semibold text-slate-500">
                  Pendientes
                </p>

              </div>

            </div>

          </div>

        </div>



        {/* ====================================================
    PROGRESO GLOBAL
==================================================== */}

<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

  <div className="mb-3 flex items-center justify-between">

    <div>

      <p className="text-sm font-bold text-slate-800">
        Progreso global
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {totalRegistradas} de {totalAsignadas} preguntas completadas
      </p>

    </div>


    {/* PORCENTAJE */}

    <span
      className={`rounded-full px-3 py-1.5 text-xs font-black ${
        porcentajeGeneral < 60
          ? "bg-red-50 text-red-700"
          : porcentajeGeneral < 80
            ? "bg-amber-50 text-amber-700"
            : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {porcentajeGeneral}%
    </span>

  </div>


  {/* BARRA DE PROGRESO */}

  <div className="h-3 overflow-hidden rounded-full bg-slate-100">

    <div
      className={`h-full rounded-full transition-[width] duration-700 ease-out ${
        porcentajeGeneral < 60
          ? "bg-gradient-to-r from-red-600 to-red-400"
          : porcentajeGeneral < 80
            ? "bg-gradient-to-r from-amber-500 to-yellow-400"
            : "bg-gradient-to-r from-emerald-600 to-green-400"
      }`}
      style={{
        width: `${Math.min(porcentajeGeneral, 100)}%`,
      }}
    />

  </div>


 

</div>



        {/* ====================================================
            CABECERA USUARIOS
        ==================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-600">
              Seguimiento individual
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-800">
              Avance por usuario
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulte las asignaciones, registros y pendientes de cada usuario.
            </p>

          </div>


          {/* BUSCADOR */}

          <div className="relative w-full sm:w-[340px]">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
              placeholder="Buscar por nombre, cargo o correo..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
            />

          </div>

        </div>



        {/* ====================================================
            TARJETAS
        ==================================================== */}

        {usuariosFiltrados.length > 0 ? (

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {usuariosFiltrados.map((usuario, index) => {

  const color =
    coloresUsuarios[
      index % coloresUsuarios.length
    ];

  const porcentaje = Math.min(
    Math.max(
      usuario.porcentajeAvance ?? 0,
      0
    ),
    100
  );

  const completado =
    porcentaje >= 100;

  return (
               <div
  key={usuario.usuarioId}
  className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${color.borde}`}
>

                  {/* LÍNEA SUPERIOR */}

                 <div
  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color.linea}`}
/>


                  {/* DECORACIÓN */}

                  <div
  className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full transition-transform duration-500 group-hover:scale-125 ${color.decoracion}`}
/>


                  <div className="relative p-5">


                    {/* ==========================================
                        USUARIO
                    ========================================== */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex min-w-0 items-center gap-3">


                        {/* AVATAR */}

                      <div
  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black shadow-sm ${color.avatar}`}
>

                          {obtenerIniciales(
                            usuario.nombreUsuario
                          )}

                        </div>


                        {/* NOMBRE */}

                        <div className="min-w-0">

                          <p
                            className="truncate font-bold text-slate-800"
                            title={usuario.nombreUsuario}
                          >
                            {usuario.nombreUsuario}
                          </p>

                          <p
                            className="mt-1 truncate text-xs text-slate-500"
                            title={usuario.cargo}
                          >
                            {usuario.cargo}
                          </p>

                        </div>

                      </div>


                      {/* ESTADO */}

                      {completado ? (

                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">

                          <CheckCircle2 className="h-3 w-3" />

                          Completo

                        </span>

                      ) : (

                        <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-700">
                          En progreso
                        </span>

                      )}

                    </div>



                    {/* ==========================================
                        TOTAL GENERAL
                    ========================================== */}

                    <div className="mt-5 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/70">

                      <div className="px-2 py-3 text-center">

                        <p className="text-xl font-black text-blue-700">
                          {usuario.totalAsignadas}
                        </p>

                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Asignadas
                        </p>

                      </div>


                      <div className="px-2 py-3 text-center">

                        <p className="text-xl font-black text-emerald-600">
                          {usuario.totalRegistradas}
                        </p>

                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Registradas
                        </p>

                      </div>


                      <div className="px-2 py-3 text-center">

                        <p
                          className={`text-xl font-black ${
                            usuario.totalPendientes === 0
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {usuario.totalPendientes}
                        </p>

                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Pendientes
                        </p>

                      </div>

                    </div>



                    {/* ==========================================
                        DESGLOSE POR MATRIZ
                    ========================================== */}

                    <div className="mt-4 grid grid-cols-2 gap-3">


                      {/* SISTEMA ADMINISTRATIVO */}

                      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">

                        <div className="mb-3 flex items-center gap-2">

                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">

                            <ClipboardList className="h-3.5 w-3.5 text-blue-700" />

                          </div>

                          <p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-blue-700">
                            Sistema Administrativo
                          </p>

                        </div>


                        <div className="space-y-1.5 text-xs">

                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Asignadas
                            </span>

                            <span className="font-bold text-slate-700">
                              {usuario.asignadasSistema}
                            </span>
                          </div>


                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Registradas
                            </span>

                            <span className="font-bold text-emerald-600">
                              {usuario.registradasSistema}
                            </span>
                          </div>


                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Pendientes
                            </span>

                            <span className="font-bold text-amber-600">
                              {usuario.pendientesSistema}
                            </span>
                          </div>

                        </div>

                      </div>



                      {/* COMPONENTES */}

                      <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3">

                        <div className="mb-3 flex items-center gap-2">

                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100">

                            <Layers3 className="h-3.5 w-3.5 text-purple-700" />

                          </div>

                          <p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-purple-700">
                            Por Componentes
                          </p>

                        </div>


                        <div className="space-y-1.5 text-xs">

                          <div className="flex justify-between">

                            <span className="text-slate-500">
                              Asignadas
                            </span>

                            <span className="font-bold text-slate-700">
                              {usuario.asignadasComponentes}
                            </span>

                          </div>


                          <div className="flex justify-between">

                            <span className="text-slate-500">
                              Registradas
                            </span>

                            <span className="font-bold text-emerald-600">
                              {usuario.registradasComponentes}
                            </span>

                          </div>


                          <div className="flex justify-between">

                            <span className="text-slate-500">
                              Pendientes
                            </span>

                            <span className="font-bold text-amber-600">
                              {usuario.pendientesComponentes}
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>



                    {/* ==========================================
                        PROGRESO
                    ========================================== */}

                    <div className="mt-5">

                      <div className="mb-2 flex items-center justify-between">

                        <div className="flex items-center gap-2">

                         <BarChart3
  className={`h-4 w-4 ${color.icono}`}
/>

                          <span className="text-xs font-semibold text-slate-600">
                            Avance general
                          </span>

                        </div>


                      <span
  className={`text-sm font-black ${color.texto}`}
>
  {porcentaje}%
</span>

                      </div>


                      {/* BARRA */}

                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">

                       <div
  className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ${color.barra}`}
  style={{
    width: `${porcentaje}%`,
  }}
/>

                      </div>

                    </div>



                    {/* ==========================================
                        FOOTER
                    ========================================== */}

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                      <span
                        className="max-w-[55%] truncate text-xs text-slate-400"
                        title={usuario.email}
                      >
                        {usuario.email}
                      </span>


                      {completado ? (

                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">

                          <UserCheck className="h-3.5 w-3.5" />

                          Completado

                        </span>

                      ) : (

                        <span className="flex items-center gap-1 text-xs font-bold text-amber-600">

                          <CircleDashed className="h-3.5 w-3.5" />

                          {usuario.totalPendientes} pendientes

                        </span>

                      )}

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        ) : (

          /* ==================================================
              SIN RESULTADOS
          ================================================== */

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">

              <Search className="h-5 w-5 text-slate-400" />

            </div>

            <p className="mt-4 font-bold text-slate-700">
              No se encontraron usuarios
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Intente realizar la búsqueda con otro nombre, cargo o correo.
            </p>

          </div>

        )}

      </div>

    </div>

  );

}