"use client";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  CalendarDays,
  Clock3,
  Home,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import { HashLoader } from "react-spinners";

/* ============================================================
   TIPOS
============================================================ */

type Apertura = {
  id: number;
  fechaInicio: string | null;
  fechaCierre: string | null;
  observaciones: string | null;
  estadoRegistro: boolean;
  createDay?: string | null;
};

type AccesoModulo = {
  ok: boolean;
  puedeAcceder: boolean;
  esExento: boolean;
  moduleId?: number;
  role?: string;
  roleName?: string;
  estado: string;
  sistemaAbierto: boolean;
  message: string;
  apertura: Apertura | null;
};

/* ============================================================
   COMPONENTE
============================================================ */

export default function MatrizSistemaAdministrativoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* ==========================================================
     ESTADOS
  ========================================================== */

  const [cargando, setCargando] =
    useState(true);

  const [acceso, setAcceso] =
    useState<AccesoModulo | null>(null);

  const [error, setError] =
    useState("");

  /* ==========================================================
     FORMATEAR FECHA
  ========================================================== */

  const formatearFecha = (
    fecha?: string | null
  ) => {
    if (!fecha) {
      return "No disponible";
    }

    try {
      const fechaLimpia =
        String(fecha).substring(0, 10);

      const [
        year,
        month,
        day,
      ] = fechaLimpia.split("-");

      if (
        !year ||
        !month ||
        !day
      ) {
        return fechaLimpia;
      }

      return `${day}/${month}/${year}`;
    } catch {
      return String(fecha);
    }
  };

  /* ==========================================================
     VERIFICAR ACCESO
     MODULE ID = 6
  ========================================================== */

  const verificarAcceso =
    useCallback(async () => {
      try {
        setCargando(true);
        setError("");

        const response =
          await fetch(
            "/api/apertura/acceso?moduleId=6",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        /* ====================================================
           RESPUESTA CORRECTA
        ==================================================== */

        if (
          response.ok &&
          data?.ok
        ) {
          setAcceso({
            ok: true,

            puedeAcceder:
              Boolean(
                data.puedeAcceder
              ),

            esExento:
              Boolean(
                data.esExento
              ),

            moduleId:
              data.moduleId,

            role:
              data.role,

            roleName:
              data.roleName,

            estado:
              data.estado ||
              "SIN_APERTURA",

            sistemaAbierto:
              Boolean(
                data.sistemaAbierto
              ),

            message:
              data.message ||
              "",

            apertura:
              data.apertura ||
              null,
          });

          return;
        }

        /* ====================================================
           ERROR DE AUTENTICACIÓN / ROL / API
        ==================================================== */

        setAcceso(null);

        setError(
          data?.message ||
            "No fue posible verificar el acceso al módulo."
        );
      } catch (error) {
        console.error(
          "Error verificando acceso a Matriz Sistema Administrativo:",
          error
        );

        setAcceso(null);

        setError(
          "No fue posible verificar el estado de apertura del sistema."
        );
      } finally {
        setCargando(false);
      }
    }, []);

  /* ==========================================================
     CARGAR AL ENTRAR
  ========================================================== */

  useEffect(() => {
    verificarAcceso();
  }, [verificarAcceso]);

  /* ==========================================================
     CARGANDO
  ========================================================== */

  if (cargando) {
    return (
      <div className="flex min-h-[calc(100vh-70px)] w-full items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-xl shadow-slate-200/50">

          <div className="flex justify-center">
            <HashLoader
              color="#0B4DA2"
              loading={true}
              size={48}
              speedMultiplier={1}
            />
          </div>

          <h2 className="mt-6 text-lg font-extrabold text-slate-800">
            Verificando acceso
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Estamos comprobando el período de apertura de la
            Matriz Sistema Administrativo.
          </p>

        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR DE VERIFICACIÓN
  ========================================================== */

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-70px)] w-full items-center justify-center bg-slate-50 p-6">

        <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-red-100 bg-white shadow-xl shadow-slate-200/60">

          <div className="h-2 bg-gradient-to-r from-red-500 to-orange-400" />

          <div className="p-8 text-center md:p-10">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-800">
              No se pudo verificar el acceso
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              {error}
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

              <button
                type="button"
                onClick={
                  verificarAcceso
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B4DA2] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#083D82]"
              >
                <RefreshCw className="h-4 w-4" />

                Intentar nuevamente
              </button>

              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <Home className="h-4 w-4" />

                Panel Principal
              </Link>

            </div>

          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ACCESO PERMITIDO

     Aquí entran:
     - administrador
     - subadministrador
     - usuario normal con período ABIERTO
  ========================================================== */

  if (
    acceso?.puedeAcceder
  ) {
    return <>{children}</>;
  }

  /* ==========================================================
     MÓDULO CERRADO
  ========================================================== */

  return (
    <div className="min-h-[calc(100vh-70px)] w-full bg-slate-50 p-4 md:p-8">

      <div className="mx-auto flex min-h-[calc(100vh-135px)] max-w-5xl items-center justify-center">

        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">

          {/* ================================================
              CABECERA
          ================================================ */}

          <div className="relative overflow-hidden bg-gradient-to-r from-[#0B3D6E] via-[#0B4DA2] to-[#1685A8] px-7 py-8 text-white md:px-10 md:py-10">

            <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/10" />

            <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/[0.04]" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur-sm">
                <LockKeyhole className="h-8 w-8" />
              </div>

              <div>

                <div className="mb-2 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-100">
                  Control de acceso
                </div>

                <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                  Período cerrado
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50/90">
                  La Matriz Sistema Administrativo no se encuentra
                  disponible actualmente.
                </p>

              </div>

            </div>
          </div>

          {/* ================================================
              CONTENIDO
          ================================================ */}

          <div className="p-7 md:p-10">

            {/* ================================================
                MENSAJE
            ================================================ */}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Clock3 className="h-5 w-5" />
                </div>

                <div>

                  <h2 className="font-extrabold text-amber-900">
                    Acceso temporalmente restringido
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-amber-800/80">
                    {acceso?.message ||
                      "El módulo se encuentra fuera del período establecido por la administración."}
                  </p>

                </div>

              </div>
            </div>

            {/* ================================================
                INFORMACIÓN DEL PERÍODO
            ================================================ */}

            {acceso?.apertura && (
              <div className="mt-6">

                <div className="mb-3 flex items-center gap-2">

                  <CalendarDays className="h-4 w-4 text-[#0B4DA2]" />

                  <h3 className="text-sm font-extrabold text-slate-700">
                    Información del período
                  </h3>

                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* ==========================================
                      FECHA INICIO
                  ========================================== */}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                      Fecha de inicio
                    </span>

                    <div className="mt-2 flex items-center gap-2">

                      <CalendarDays className="h-4 w-4 text-[#0B4DA2]" />

                      <span className="text-base font-extrabold text-slate-700">
                        {formatearFecha(
                          acceso.apertura
                            .fechaInicio
                        )}
                      </span>

                    </div>

                  </div>

                  {/* ==========================================
                      FECHA CIERRE
                  ========================================== */}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                      Fecha de cierre
                    </span>

                    <div className="mt-2 flex items-center gap-2">

                      <CalendarDays className="h-4 w-4 text-[#0B4DA2]" />

                      <span className="text-base font-extrabold text-slate-700">
                        {formatearFecha(
                          acceso.apertura
                            .fechaCierre
                        )}
                      </span>

                    </div>

                  </div>

                </div>

                {/* ============================================
                    OBSERVACIONES
                ============================================ */}

                {acceso.apertura
                  .observaciones && (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">

                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#0B4DA2]">
                      Observaciones
                    </span>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {
                        acceso.apertura
                          .observaciones
                      }
                    </p>

                  </div>
                )}

              </div>
            )}

            {/* ================================================
                ESTADO
            ================================================ */}

            <div className="mt-6 flex flex-wrap items-center gap-3">

              <span className="text-xs font-bold text-slate-500">
                Estado actual:
              </span>

              <span
                className={`
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  px-3
                  py-1.5
                  text-[11px]
                  font-extrabold
                  uppercase
                  tracking-wide

                  ${
                    acceso?.estado ===
                    "PROGRAMADO"
                      ? "bg-amber-100 text-amber-700"

                      : acceso?.estado ===
                        "VENCIDO"

                      ? "bg-orange-100 text-orange-700"

                      : "bg-red-100 text-red-700"
                  }
                `}
              >

                <LockKeyhole className="h-3.5 w-3.5" />

                {acceso?.estado ||
                  "CERRADO"}

              </span>

            </div>

            {/* ================================================
                ACCIONES
            ================================================ */}

            <div className="mt-8 flex flex-col justify-end gap-3 border-t border-slate-100 pt-6 sm:flex-row">

              <button
                type="button"
                onClick={
                  verificarAcceso
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0B4DA2]"
              >
                <RefreshCw className="h-4 w-4" />

                Verificar nuevamente
              </button>

              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B4DA2] px-5 text-sm font-bold text-white shadow-md shadow-blue-900/10 transition hover:bg-[#083D82]"
              >
                <Home className="h-4 w-4" />

                Volver al Panel Principal
              </Link>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}