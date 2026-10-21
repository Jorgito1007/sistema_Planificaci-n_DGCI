"use client";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  DoorOpen,
  History,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import Swal from "sweetalert2";
import { HashLoader } from "react-spinners";

// ============================================================
// TIPOS
// ============================================================

type Apertura = {
  Id: number;
  FechaInicio: string;
  FechaCierre: string;
  Observaciones: string | null;
  ActorUserId: string;
  Estado: boolean;
  CreateDay: string;
  Usuario: string;
};

type EstadoActual = {
  sistemaAbierto: boolean;
  estado:
    | "ABIERTO"
    | "PROGRAMADO"
    | "VENCIDO"
    | "CERRADO"
    | "SIN_APERTURA"
    | "ERROR";
  message: string;
  apertura: {
    id: number;
    fechaInicio: string;
    fechaCierre: string;
    observaciones: string | null;
    estadoRegistro: boolean;
    usuario: string;
    createDay: string;
  } | null;
};

// ============================================================
// PAGE
// ============================================================

export default function AperturaPage() {
  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [fechaInicio, setFechaInicio] =
    useState("");

  const [fechaCierre, setFechaCierre] =
    useState("");

  const [observaciones, setObservaciones] =
    useState("");

  const [historico, setHistorico] =
    useState<Apertura[]>([]);

  const [estadoActual, setEstadoActual] =
    useState<EstadoActual>({
      sistemaAbierto: false,
      estado: "SIN_APERTURA",
      message: "",
      apertura: null,
    });

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [cerrando, setCerrando] =
    useState(false);

  // ==========================================================
  // FORMATEAR FECHA PARA MOSTRAR
  // ==========================================================

  const formatearFecha = (
    fecha?: string | null
  ) => {
    if (!fecha) return "—";

    try {
      const fechaLimpia =
        String(fecha).substring(0, 10);

      const [year, month, day] =
        fechaLimpia.split("-");

      if (!year || !month || !day) {
        return fechaLimpia;
      }

      return `${day}/${month}/${year}`;
    } catch {
      return String(fecha);
    }
  };

  // ==========================================================
  // FORMATEAR FECHA Y HORA
  // ==========================================================

  const formatearFechaHora = (
    fecha?: string | null
  ) => {
    if (!fecha) return "—";

    try {
      return new Date(fecha).toLocaleString(
        "es-NI",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return String(fecha);
    }
  };

  // ==========================================================
  // CARGAR HISTÓRICO
  // ==========================================================

  const cargarHistorico =
    useCallback(async () => {
      const response = await fetch(
        "/api/apertura",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ||
            "No se pudo cargar el histórico."
        );
      }

      setHistorico(
        Array.isArray(data.data)
          ? data.data
          : []
      );
    }, []);

  // ==========================================================
  // CARGAR ESTADO ACTUAL
  // ==========================================================

  const cargarEstado =
    useCallback(async () => {
      const response = await fetch(
        "/api/apertura/estado",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ||
            "No se pudo consultar el estado del sistema."
        );
      }

      setEstadoActual({
        sistemaAbierto:
          Boolean(data.sistemaAbierto),

        estado:
          data.estado ||
          "SIN_APERTURA",

        message:
          data.message || "",

        apertura:
          data.apertura || null,
      });
    }, []);

  // ==========================================================
  // CARGAR TODO
  // ==========================================================

  const cargarDatos =
    useCallback(async () => {
      try {
        setCargando(true);

        await Promise.all([
          cargarHistorico(),
          cargarEstado(),
        ]);
      } catch (error: any) {
        console.error(
          "ERROR CARGANDO APERTURA:",
          error
        );

        await Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error?.message ||
            "No se pudo cargar la información.",
          confirmButtonColor: "#0B4DA2",
        });
      } finally {
        setCargando(false);
      }
    }, [
      cargarHistorico,
      cargarEstado,
    ]);

  // ==========================================================
  // INICIAL
  // ==========================================================

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ==========================================================
  // LIMPIAR FORMULARIO
  // ==========================================================

  const limpiarFormulario = () => {
    setFechaInicio("");
    setFechaCierre("");
    setObservaciones("");
  };

  // ==========================================================
  // CREAR APERTURA
  // ==========================================================

  const guardarApertura = async () => {
    if (guardando || cerrando) return;

    // ========================================================
    // VALIDAR CAMPOS
    // ========================================================

    if (!fechaInicio || !fechaCierre) {
      await Swal.fire({
        icon: "warning",
        title: "Fechas requeridas",
        text:
          "Debe seleccionar la fecha de inicio y la fecha de cierre.",
        confirmButtonColor: "#0B4DA2",
      });

      return;
    }

    // ========================================================
    // VALIDAR ORDEN
    // ========================================================

    if (
      new Date(fechaInicio) >
      new Date(fechaCierre)
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Período no válido",
        text:
          "La fecha de cierre no puede ser anterior a la fecha de inicio.",
        confirmButtonColor: "#0B4DA2",
      });

      return;
    }

    // ========================================================
    // CONFIRMAR
    // ========================================================

    const confirmacion =
      await Swal.fire({
        icon: "question",
        title: "¿Abrir período?",
        html: `
          Se habilitará un nuevo período del sistema.

          <br/><br/>

          <strong>
            Inicio:
          </strong>
          ${formatearFecha(fechaInicio)}

          <br/>

          <strong>
            Cierre:
          </strong>
          ${formatearFecha(fechaCierre)}
        `,
        showCancelButton: true,
        confirmButtonText:
          "Sí, registrar apertura",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#0B4DA2",
        cancelButtonColor: "#64748B",
        reverseButtons: true,
      });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      setGuardando(true);

      const response = await fetch(
        "/api/apertura",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            fechaInicio,
            fechaCierre,
            observaciones,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        await Swal.fire({
          icon:
            response.status === 409
              ? "warning"
              : "error",

          title:
            response.status === 409
              ? "Apertura existente"
              : "No se pudo registrar",

          text:
            data.message ||
            "No se pudo registrar la apertura.",

          confirmButtonColor: "#0B4DA2",
        });

        return;
      }

      limpiarFormulario();

      await cargarDatos();

      await Swal.fire({
        icon: "success",
        title: "Apertura registrada",
        text:
          data.message ||
          "El período fue registrado correctamente.",
        confirmButtonColor: "#0B4DA2",
      });
    } catch (error) {
      console.error(
        "ERROR REGISTRANDO APERTURA:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          "Ocurrió un error al registrar la apertura.",
        confirmButtonColor: "#0B4DA2",
      });
    } finally {
      setGuardando(false);
    }
  };

  // ==========================================================
  // CERRAR APERTURA
  // ==========================================================

  const cerrarApertura =
    async (id: number) => {
      if (
        cerrando ||
        guardando
      ) {
        return;
      }

      const confirmacion =
        await Swal.fire({
          icon: "warning",

          title:
            "¿Cerrar este período?",

          html: `
            Esta acción cerrará manualmente
            el período seleccionado.

            <br/><br/>

            <strong>
              Los módulos asociados dejarán de estar disponibles
              cuando conectemos el control de apertura.
            </strong>
          `,

          showCancelButton: true,

          confirmButtonText:
            "Sí, cerrar período",

          cancelButtonText:
            "Cancelar",

          confirmButtonColor:
            "#DC2626",

          cancelButtonColor:
            "#64748B",

          reverseButtons: true,
        });

      if (
        !confirmacion.isConfirmed
      ) {
        return;
      }

      try {
        setCerrando(true);

        const response =
          await fetch(
            "/api/cerrar",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body: JSON.stringify({
                id,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.ok
        ) {
          await Swal.fire({
            icon: "error",
            title:
              "No se pudo cerrar",
            text:
              data.message ||
              "No se pudo cerrar el período.",
            confirmButtonColor:
              "#0B4DA2",
          });

          return;
        }

        await cargarDatos();

        await Swal.fire({
          icon: "success",
          title:
            "Período cerrado",
          text:
            data.message ||
            "El período fue cerrado correctamente.",
          confirmButtonColor:
            "#0B4DA2",
        });
      } catch (error) {
        console.error(
          "ERROR CERRANDO APERTURA:",
          error
        );

        await Swal.fire({
          icon: "error",
          title: "Error",
          text:
            "Ocurrió un error al cerrar el período.",
          confirmButtonColor:
            "#0B4DA2",
        });
      } finally {
        setCerrando(false);
      }
    };

  // ==========================================================
  // CONFIGURACIÓN VISUAL DEL ESTADO
  // ==========================================================

  const obtenerConfiguracionEstado =
    () => {
      switch (estadoActual.estado) {
        case "ABIERTO":
          return {
            titulo:
              "Sistema abierto",
            descripcion:
              "El período se encuentra habilitado actualmente.",
            icono:
              <DoorOpen
                className="h-6 w-6"
              />,
            contenedor:
              "border-emerald-200 bg-emerald-50",
            iconoContenedor:
              "bg-emerald-100 text-emerald-700",
            tituloColor:
              "text-emerald-800",
            textoColor:
              "text-emerald-700",
            badge:
              "bg-emerald-100 text-emerald-700 ring-emerald-200",
          };

        case "PROGRAMADO":
          return {
            titulo:
              "Apertura programada",
            descripcion:
              "El período está registrado, pero todavía no ha iniciado.",
            icono:
              <Clock3
                className="h-6 w-6"
              />,
            contenedor:
              "border-amber-200 bg-amber-50",
            iconoContenedor:
              "bg-amber-100 text-amber-700",
            tituloColor:
              "text-amber-800",
            textoColor:
              "text-amber-700",
            badge:
              "bg-amber-100 text-amber-700 ring-amber-200",
          };

        case "VENCIDO":
          return {
            titulo:
              "Período vencido",
            descripcion:
              "La fecha establecida para el cierre del período ya finalizó.",
            icono:
              <CalendarRange
                className="h-6 w-6"
              />,
            contenedor:
              "border-orange-200 bg-orange-50",
            iconoContenedor:
              "bg-orange-100 text-orange-700",
            tituloColor:
              "text-orange-800",
            textoColor:
              "text-orange-700",
            badge:
              "bg-orange-100 text-orange-700 ring-orange-200",
          };

        case "CERRADO":
          return {
            titulo:
              "Sistema cerrado",
            descripcion:
              "El último período registrado se encuentra cerrado.",
            icono:
              <LockKeyhole
                className="h-6 w-6"
              />,
            contenedor:
              "border-red-200 bg-red-50",
            iconoContenedor:
              "bg-red-100 text-red-700",
            tituloColor:
              "text-red-800",
            textoColor:
              "text-red-700",
            badge:
              "bg-red-100 text-red-700 ring-red-200",
          };

        default:
          return {
            titulo:
              "Sin apertura",
            descripcion:
              "Actualmente no existe un período de apertura disponible.",
            icono:
              <LockKeyhole
                className="h-6 w-6"
              />,
            contenedor:
              "border-slate-200 bg-slate-50",
            iconoContenedor:
              "bg-slate-200 text-slate-600",
            tituloColor:
              "text-slate-800",
            textoColor:
              "text-slate-600",
            badge:
              "bg-slate-100 text-slate-600 ring-slate-200",
          };
      }
    };

  const estadoVisual =
    obtenerConfiguracionEstado();

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
  

    
      <div className="min-h-screen bg-slate-100 p-4 md:p-6">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B4DA2] via-[#126CB1] to-[#25A7BC] shadow-lg">

          <div className="pointer-events-none absolute -right-12 -top-24 h-56 w-56 rounded-full bg-white/[0.06]" />

          <div className="pointer-events-none absolute -bottom-24 right-16 h-48 w-48 rounded-full bg-white/[0.05]" />

          <div className="relative flex min-h-[110px] flex-col justify-between gap-4 px-6 py-5 md:flex-row md:items-center">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-sm">
                <DoorOpen className="h-7 w-7" />
              </div>

              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white md:text-2xl">
                  Control de Apertura y Cierre
                </h1>

                <p className="mt-1 text-sm font-medium text-blue-50">
                  Administración de períodos de acceso al sistema.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cargarDatos}
              disabled={
                cargando ||
                guardando ||
                cerrando
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* ====================================================
            ESTADO ACTUAL
        ==================================================== */}

        <div
          className={`
            mb-6
            rounded-2xl
            border
            p-5
            shadow-sm
            ${estadoVisual.contenedor}
          `}
        >
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

            <div className="flex items-start gap-4">

              <div
                className={`
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  ${estadoVisual.iconoContenedor}
                `}
              >
                {estadoVisual.icono}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">

                  <h2
                    className={`
                      text-lg
                      font-extrabold
                      ${estadoVisual.tituloColor}
                    `}
                  >
                    {estadoVisual.titulo}
                  </h2>

                  <span
                    className={`
                      inline-flex
                      rounded-full
                      px-3
                      py-1
                      text-[11px]
                      font-extrabold
                      uppercase
                      tracking-wide
                      ring-1
                      ${estadoVisual.badge}
                    `}
                  >
                    {estadoActual.estado}
                  </span>
                </div>

                <p
                  className={`
                    mt-1
                    text-sm
                    ${estadoVisual.textoColor}
                  `}
                >
                  {estadoVisual.descripcion}
                </p>
              </div>
            </div>

            {estadoActual.apertura && (
              <div className="flex flex-wrap items-center gap-3">

                <div className="rounded-xl border border-white/60 bg-white/70 px-4 py-2.5 shadow-sm">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Inicio
                  </span>

                  <span className="text-sm font-extrabold text-slate-700">
                    {formatearFecha(
                      estadoActual.apertura
                        .fechaInicio
                    )}
                  </span>
                </div>

                <div className="rounded-xl border border-white/60 bg-white/70 px-4 py-2.5 shadow-sm">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Cierre
                  </span>

                  <span className="text-sm font-extrabold text-slate-700">
                    {formatearFecha(
                      estadoActual.apertura
                        .fechaCierre
                    )}
                  </span>
                </div>

                {estadoActual.apertura
                  .estadoRegistro && (
                  <button
                    type="button"
                    onClick={() =>
                      cerrarApertura(
                        estadoActual
                          .apertura!.id
                      )
                    }
                    disabled={
                      cerrando ||
                      guardando
                    }
                    className="inline-flex h-[48px] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cerrando ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Cerrando...
                      </>
                    ) : (
                      <>
                        <LockKeyhole className="h-4 w-4" />
                        Cerrar período
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ====================================================
            FORMULARIO
        ==================================================== */}

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* CABECERA FORMULARIO */}

          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#0B4DA2]">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                Nueva apertura
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Defina el período durante el cual estará habilitado el sistema.
              </p>
            </div>
          </div>

          {/* CAMPOS */}

          <div className="p-6">

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

              {/* FECHA INICIO */}

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CalendarDays className="h-4 w-4 text-[#0B4DA2]" />
                  Fecha de inicio
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) =>
                    setFechaInicio(
                      e.target.value
                    )
                  }
                  disabled={
                    guardando ||
                    cerrando
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#0B4DA2] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              {/* FECHA CIERRE */}

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CalendarRange className="h-4 w-4 text-[#0B4DA2]" />
                  Fecha de cierre
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="date"
                  value={fechaCierre}
                  min={
                    fechaInicio ||
                    undefined
                  }
                  onChange={(e) =>
                    setFechaCierre(
                      e.target.value
                    )
                  }
                  disabled={
                    guardando ||
                    cerrando
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#0B4DA2] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* OBSERVACIONES */}

            <div className="mt-5">
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                <MessageSquareText className="h-4 w-4 text-[#0B4DA2]" />
                Observaciones
              </label>

              <textarea
                value={observaciones}
                onChange={(e) =>
                  setObservaciones(
                    e.target.value
                  )
                }
                disabled={
                  guardando ||
                  cerrando
                }
                maxLength={1000}
                rows={4}
                placeholder="Ingrese una observación relacionada con la apertura del período..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0B4DA2] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <div className="mt-1 text-right text-[11px] font-medium text-slate-400">
                {observaciones.length}/1000
              </div>
            </div>

            {/* BOTÓN */}

            <div className="mt-5 flex justify-end">

              <button
                type="button"
                onClick={guardarApertura}
                disabled={
                  guardando ||
                  cerrando ||
                  estadoActual.apertura
                    ?.estadoRegistro ===
                    true
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B4DA2] px-5 text-sm font-bold text-white shadow-md shadow-blue-900/10 transition-all hover:-translate-y-0.5 hover:bg-[#083D82] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {guardando ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Registrando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />

                    Registrar apertura
                  </>
                )}
              </button>
            </div>

            {estadoActual.apertura
              ?.estadoRegistro ===
              true && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />

                Ya existe un período activo o programado. Para registrar una nueva apertura, primero debe cerrar el período actual.
              </div>
            )}
          </div>
        </div>

        {/* ====================================================
            HISTÓRICO
        ==================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* HEADER HISTÓRICO */}

          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                <History className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-extrabold text-slate-800">
                  Histórico de aperturas
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Registro de los períodos creados en el sistema.
                </p>
              </div>
            </div>

            <div className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0B4DA2] ring-1 ring-blue-100">
              {historico.length}{" "}
              {historico.length === 1
                ? "registro"
                : "registros"}
            </div>
          </div>

          {/* TABLA */}

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[1000px]">

              <thead>
                <tr className="bg-[#123F60] text-left text-[11px] font-extrabold uppercase tracking-wide text-white">

                  <th className="px-5 py-3.5 text-center">
                    #
                  </th>

                  <th className="px-5 py-3.5">
                    Fecha inicio
                  </th>

                  <th className="px-5 py-3.5">
                    Fecha cierre
                  </th>

                  <th className="px-5 py-3.5">
                    Observaciones
                  </th>

                  <th className="px-5 py-3.5">
                    Usuario
                  </th>

                  <th className="px-5 py-3.5">
                    Fecha registro
                  </th>

                  <th className="px-5 py-3.5 text-center">
                    Estado
                  </th>

                  <th className="px-5 py-3.5 text-center">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">

                {historico.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-14 text-center"
                    >
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <History className="h-7 w-7" />
                      </div>

                      <p className="mt-4 font-bold text-slate-600">
                        No existen aperturas registradas
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Los períodos creados aparecerán en este histórico.
                      </p>
                    </td>
                  </tr>
                ) : (
                  historico.map(
                    (item, index) => (
                      <tr
                        key={item.Id}
                        className="bg-white transition-colors hover:bg-blue-50/40"
                      >

                        {/* NÚMERO */}

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-600">
                            {index + 1}
                          </span>
                        </td>

                        {/* INICIO */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-[#0B4DA2]" />

                            <span className="whitespace-nowrap text-sm font-bold text-slate-700">
                              {formatearFecha(
                                item.FechaInicio
                              )}
                            </span>
                          </div>
                        </td>

                        {/* CIERRE */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <CalendarRange className="h-4 w-4 text-slate-400" />

                            <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                              {formatearFecha(
                                item.FechaCierre
                              )}
                            </span>
                          </div>
                        </td>

                        {/* OBSERVACIONES */}

                        <td className="max-w-[330px] px-5 py-4">
                          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                            {item.Observaciones ||
                              "Sin observaciones"}
                          </p>
                        </td>

                        {/* USUARIO */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0B4DA2]">
                              <UserRound className="h-4 w-4" />
                            </div>

                            <span className="text-sm font-semibold text-slate-700">
                              {item.Usuario ||
                                "Usuario no disponible"}
                            </span>
                          </div>
                        </td>

                        {/* FECHA REGISTRO */}

                        <td className="px-5 py-4">
                          <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                            {formatearFechaHora(
                              item.CreateDay
                            )}
                          </span>
                        </td>

                        {/* ESTADO */}

                        <td className="px-5 py-4 text-center">
                          {item.Estado ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              ACTIVO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-600 ring-1 ring-slate-200">
                              <XCircle className="h-3.5 w-3.5" />
                              CERRADO
                            </span>
                          )}
                        </td>

                        {/* ACCIÓN */}

                        <td className="px-5 py-4 text-center">

                          {item.Estado ? (
                            <button
                              type="button"
                              onClick={() =>
                                cerrarApertura(
                                  item.Id
                                )
                              }
                              disabled={
                                cerrando ||
                                guardando
                              }
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <LockKeyhole className="h-3.5 w-3.5" />
                              Cerrar
                            </button>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">
                              Finalizado
                            </span>
                          )}

                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ====================================================
            PIE
        ==================================================== */}

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-slate-600">

          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0B4DA2]" />

          <div>
            <strong className="text-[#0B4DA2]">
              Control institucional:
            </strong>{" "}
            los períodos registrados en este módulo determinarán posteriormente cuándo estarán disponibles los módulos de evaluación del sistema.
          </div>
        </div>
      </div>
    </>
  );
}