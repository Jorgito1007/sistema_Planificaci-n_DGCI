"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Eye,
  FileText,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ClipboardCheck,
  ShieldCheck,
  Users,
  CalendarDays,
  X,
  MessageSquareText,
} from "lucide-react";

import Link from "next/link";
import Swal from "sweetalert2";

// ============================================================
// TIPOS
// ============================================================

type TipoPlan =
  | "sistema-administrativo"
  | "por-componentes";

type PlanAccion = {
  UserId: string;
  FullName: string | null;
  Email: string | null;
  FechaEnvio: string | null;
  PeriodoInicio: string | null;
  PeriodoFin: string | null;
  TotalActividades: number;
};

// ============================================================
// COMPONENTE
// ============================================================

export default function InformePlanesAccionPage() {
  const router = useRouter();

  // ============================================================
  // ESTADOS
  // ============================================================

  const [tipo, setTipo] =
    useState<TipoPlan>("sistema-administrativo");

  const [planes, setPlanes] =
    useState<PlanAccion[]>([]);

  const [loading, setLoading] =
    useState(false);

  // ============================================================
  // MODAL PDF
  // ============================================================

  const [modalPDF, setModalPDF] =
    useState(false);

  const [pdfUrl, setPdfUrl] =
    useState("");

  // ============================================================
  // MODAL APROBACIÓN
  // ============================================================

  const [modalAprobar, setModalAprobar] =
    useState(false);

  const [usuarioAprobar, setUsuarioAprobar] =
    useState<PlanAccion | null>(null);

  const [observaciones, setObservaciones] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

  // ============================================================
  // CARGAR PLANES
  // ============================================================

  useEffect(() => {
    cargarPlanes(tipo);
  }, [tipo]);

  async function cargarPlanes(
    tipoPlan: TipoPlan
  ) {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/informes/planes-accion?tipo=${tipoPlan}`
      );

      const data = await res.json();

      setPlanes(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Error cargando planes:",
        error
      );

      setPlanes([]);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // VER PDF
  // ============================================================

  function verPDF(userId: string) {
    setPdfUrl(
      `/plan-accion-pdf?tipo=${tipo}&userId=${userId}`
    );

    setModalPDF(true);
  }

  // ============================================================
  // CERRAR PDF
  // ============================================================

  function cerrarPDF() {
    setModalPDF(false);
    setPdfUrl("");
  }

  // ============================================================
  // ABRIR MODAL APROBAR
  // ============================================================

  function abrirModalAprobar(
    plan: PlanAccion
  ) {
    setUsuarioAprobar(plan);
    setObservaciones("");
    setModalAprobar(true);
  }

  // ============================================================
  // CERRAR MODAL APROBACIÓN
  // ============================================================

  function cerrarModalAprobar() {
    if (guardando) return;

    setModalAprobar(false);
    setUsuarioAprobar(null);
    setObservaciones("");
  }

  // ============================================================
  // GUARDAR APROBACIÓN
  // ============================================================

  async function guardarAprobacion() {
    if (!usuarioAprobar) return;

    if (!observaciones.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Observaciones requeridas",
        text: "Debe ingresar las observaciones de aprobación.",
        confirmButtonColor: "#0B3D91",
      });

      return;
    }

    try {
      setGuardando(true);

      const res = await fetch(
        "/api/informes/planes-accion/aprobar",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            tipo,
            userId:
              usuarioAprobar.UserId,
            observaciones:
              observaciones.trim(),
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(
          data.message ||
            "No se pudo aprobar el plan."
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Plan aprobado",
        text: "La aprobación fue guardada correctamente.",
        confirmButtonColor: "#0B3D91",
      });

      setModalAprobar(false);
      setUsuarioAprobar(null);
      setObservaciones("");

      await cargarPlanes(tipo);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.message ||
          "Ocurrió un error al guardar.",
        confirmButtonColor: "#0B3D91",
      });
    } finally {
      setGuardando(false);
    }
  }

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-6">

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



        {/* ===================================================== */}
        {/* ENCABEZADO */}
        {/* ===================================================== */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#061B33] via-[#0B3D91] to-[#1261C9] p-6 shadow-lg md:p-8">

          {/* DECORACIÓN */}

          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />

          <div className="pointer-events-none absolute -bottom-20 right-32 h-52 w-52 rounded-full bg-blue-300/10" />

          <div className="pointer-events-none absolute bottom-0 left-1/2 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            {/* TÍTULO */}

            <div className="flex items-start gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-inner backdrop-blur">
                <ClipboardCheck className="h-7 w-7" />
              </div>

              <div>

                <div className="mb-2 flex flex-wrap items-center gap-2">

                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50 backdrop-blur">
                    Control y seguimiento
                  </span>

                </div>

                <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                  Informe de Planes de Acción
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                  Consulte, revise y apruebe
                  los planes de acción enviados
                  por los usuarios del sistema.
                </p>

              </div>
            </div>

          

          </div>
        </section>

        {/* ===================================================== */}
        {/* SELECTOR DEL TIPO DE PLAN */}
        {/* ===================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">

          <div className="grid gap-2 md:grid-cols-2">

            {/* SISTEMA ADMINISTRATIVO */}

            <button
              type="button"
              onClick={() =>
                setTipo(
                  "sistema-administrativo"
                )
              }
              className={`
                group flex items-center gap-4
                rounded-xl px-5 py-4
                text-left
                transition-all duration-200

                ${
                  tipo ===
                  "sistema-administrativo"
                    ? `
                      bg-gradient-to-r
                      from-blue-600
                      to-blue-500
                      text-white
                      shadow-md
                      shadow-blue-100
                    `
                    : `
                      bg-white
                      text-slate-700
                      hover:bg-slate-50
                    `
                }
              `}
            >

              <div
                className={`
                  flex h-11 w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl

                  ${
                    tipo ===
                    "sistema-administrativo"
                      ? "bg-white/15 text-white"
                      : "bg-blue-50 text-blue-600"
                  }
                `}
              >
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <p className="font-bold">
                  Sistema Administrativo
                </p>

                <p
                  className={`mt-0.5 text-xs ${
                    tipo ===
                    "sistema-administrativo"
                      ? "text-blue-100"
                      : "text-slate-500"
                  }`}
                >
                  Planes de acción de los
                  sistemas administrativos
                </p>
              </div>

            </button>

            {/* POR COMPONENTES */}

            <button
              type="button"
              onClick={() =>
                setTipo(
                  "por-componentes"
                )
              }
              className={`
                group flex items-center gap-4
                rounded-xl px-5 py-4
                text-left
                transition-all duration-200

                ${
                  tipo ===
                  "por-componentes"
                    ? `
                      bg-gradient-to-r
                      from-emerald-600
                      to-emerald-500
                      text-white
                      shadow-md
                      shadow-emerald-100
                    `
                    : `
                      bg-white
                      text-slate-700
                      hover:bg-slate-50
                    `
                }
              `}
            >

              <div
                className={`
                  flex h-11 w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl

                  ${
                    tipo ===
                    "por-componentes"
                      ? "bg-white/15 text-white"
                      : "bg-emerald-50 text-emerald-600"
                  }
                `}
              >
                <ClipboardCheck className="h-6 w-6" />
              </div>

              <div>
                <p className="font-bold">
                  Por Componentes
                </p>

                <p
                  className={`mt-0.5 text-xs ${
                    tipo ===
                    "por-componentes"
                      ? "text-emerald-100"
                      : "text-slate-500"
                  }`}
                >
                  Planes de acción organizados
                  por componentes
                </p>
              </div>

            </button>

          </div>
        </section>

        {/* ===================================================== */}
        {/* CONTENEDOR DE PLANES */}
        {/* ===================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* CABECERA */}

          <div className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div
                className={`
                  flex h-12 w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl

                  ${
                    tipo ===
                    "sistema-administrativo"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-emerald-100 text-emerald-600"
                  }
                `}
              >
                <FileText className="h-6 w-6" />
              </div>

              <div>

                <h2 className="font-bold text-slate-900 md:text-lg">
                  {tipo ===
                  "sistema-administrativo"
                    ? "Planes de Acción · Sistema Administrativo"
                    : "Planes de Acción · Por Componentes"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Revise los documentos enviados
                  y gestione su aprobación.
                </p>

              </div>

            </div>

            {/* CONTADOR */}

            {!loading && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">

                <Users className="h-4 w-4" />

                {planes.length}{" "}

                {planes.length === 1
                  ? "plan enviado"
                  : "planes enviados"}

              </div>
            )}

          </div>

          {/* CONTENIDO */}

          <div className="p-4 md:p-6">

            {/* LOADER */}

            {loading ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>

                <div className="text-center">
                  <p className="font-semibold text-slate-700">
                    Cargando planes
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Espere un momento...
                  </p>
                </div>

              </div>
            ) : planes.length === 0 ? (

              /* SIN REGISTROS */

              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">

                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <FileText className="h-7 w-7" />
                </div>

                <h3 className="font-bold text-slate-700">
                  No hay planes enviados
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Actualmente no existen planes
                  de acción enviados para este
                  tipo de evaluación.
                </p>

              </div>

            ) : (

              /* TABLA */

              <div className="overflow-auto rounded-xl border border-slate-200">

                <table className="w-full min-w-[720px] text-sm">

                  {/* ENCABEZADO */}

                  <thead>
                    <tr className="bg-[#0B3D91] text-white">

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide">
                        Usuario
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide">
                        Fecha de envío
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide">
                        Acciones
                      </th>

                    </tr>
                  </thead>

                  {/* CUERPO */}

                  <tbody className="divide-y divide-slate-100">

                    {planes.map(
                      (plan, index) => (
                        <tr
                          key={`${plan.UserId}-${index}`}
                          className="transition-colors hover:bg-blue-50/40"
                        >

                          {/* USUARIO */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">

                                {(plan.FullName ||
                                  "U")
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}

                              </div>

                              <div>

                                <p className="font-semibold text-slate-800">
                                  {plan.FullName ||
                                    "Sin nombre"}
                                </p>

                                {plan.Email && (
                                  <p className="mt-0.5 text-xs text-slate-400">
                                    {plan.Email}
                                  </p>
                                )}

                              </div>

                            </div>

                          </td>

                          {/* FECHA */}

                          <td className="px-5 py-4 text-center">

                            {plan.FechaEnvio ? (
                              <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">

                                <CalendarDays className="h-4 w-4 text-blue-500" />

                                {new Date(
                                  plan.FechaEnvio
                                ).toLocaleDateString(
                                  "es-NI"
                                )}

                              </div>
                            ) : (
                              <span className="text-slate-400">
                                Sin fecha
                              </span>
                            )}

                          </td>

                          {/* ACCIONES */}

                          <td className="px-5 py-4">

                            <div className="flex justify-center gap-2">

                              {/* VER */}

                              <button
                                type="button"
                                onClick={() =>
                                  verPDF(
                                    plan.UserId
                                  )
                                }
                                className="
                                  inline-flex h-9
                                  items-center gap-2
                                  rounded-lg
                                  border border-blue-200
                                  bg-blue-50 px-4
                                  text-xs font-bold
                                  text-blue-700
                                  transition-all
                                  hover:border-blue-300
                                  hover:bg-blue-100
                                "
                              >
                                <Eye className="h-4 w-4" />
                                Ver plan
                              </button>

                              {/* APROBAR */}

                              <button
                                type="button"
                                onClick={() =>
                                  abrirModalAprobar(
                                    plan
                                  )
                                }
                                className="
                                  inline-flex h-9
                                  items-center gap-2
                                  rounded-lg
                                  bg-emerald-500 px-4
                                  text-xs font-bold
                                  text-white
                                  shadow-sm
                                  transition-all
                                  hover:-translate-y-0.5
                                  hover:bg-emerald-600
                                "
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Aprobar
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </section>

      </div>

      {/* ======================================================= */}
      {/* MODAL PDF */}
      {/* ======================================================= */}

      {modalPDF && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm md:p-6">

          <div className="relative flex h-[92vh] w-full max-w-[1250px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">

            {/* HEADER MODAL */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#061B33] to-[#0B3D91] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-white">
                    Vista previa del Plan de Acción
                  </h2>

                  <p className="text-xs text-blue-100">
                    Documento enviado por el usuario
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={cerrarPDF}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* PDF */}

            <iframe
              src={pdfUrl}
              title="Vista previa del Plan de Acción"
              className="min-h-0 flex-1 w-full bg-slate-100"
            />

          </div>

        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL APROBAR */}
      {/* ======================================================= */}

      {modalAprobar &&
        usuarioAprobar && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">

            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">

              {/* HEADER */}

              <div className="relative overflow-hidden bg-gradient-to-r from-[#061B33] via-[#0B3D91] to-[#1261C9] px-6 py-5">

                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />

                <div className="relative flex items-start justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Aprobar Plan de Acción
                      </h2>

                      <p className="mt-1 text-sm text-blue-100">
                        {usuarioAprobar.FullName ||
                          "Sin nombre"}
                      </p>
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={
                      cerrarModalAprobar
                    }
                    disabled={guardando}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>

                </div>

              </div>

              {/* BODY */}

              <div className="space-y-5 p-6">

                {/* INFORMACIÓN */}

                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">

                  <div className="flex gap-3">

                    <div className="mt-0.5 text-blue-600">
                      <MessageSquareText className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Observaciones de aprobación
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Registre las observaciones
                        correspondientes antes de
                        aprobar el plan de acción.
                      </p>
                    </div>

                  </div>

                </div>

                {/* TEXTAREA */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Observaciones
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <textarea
                    value={observaciones}
                    onChange={(e) =>
                      setObservaciones(
                        e.target.value
                      )
                    }
                    rows={6}
                    disabled={guardando}
                    placeholder="Escriba las observaciones de la aprobación..."
                    className="
                      w-full resize-none
                      rounded-xl
                      border border-slate-300
                      bg-white p-4
                      text-sm leading-6
                      text-slate-700
                      outline-none
                      transition-all
                      placeholder:text-slate-400
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                      disabled:cursor-not-allowed
                      disabled:bg-slate-100
                    "
                  />

                </div>

                {/* BOTONES */}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={
                      cerrarModalAprobar
                    }
                    disabled={guardando}
                    className="
                      inline-flex h-11
                      items-center
                      justify-center
                      rounded-xl
                      border border-slate-300
                      bg-white px-5
                      text-sm font-semibold
                      text-slate-700
                      transition
                      hover:bg-slate-50
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={
                      guardarAprobacion
                    }
                    disabled={guardando}
                    className="
                      inline-flex h-11
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-emerald-500 px-5
                      text-sm font-bold
                      text-white
                      shadow-sm
                      transition-all
                      hover:-translate-y-0.5
                      hover:bg-emerald-600
                      disabled:cursor-not-allowed
                      disabled:translate-y-0
                      disabled:opacity-60
                    "
                  >

                    {guardando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Aprobar plan
                      </>
                    )}

                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}