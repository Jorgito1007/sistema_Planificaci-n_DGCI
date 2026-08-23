"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Database,
  FileText,
  Clock,
} from "lucide-react";

type Auditoria = {
  AuditId: number;
  fecha: string;
  ActorUserId: string;
  Usuario: string;
  accion: string;
  tabla: string;
  EntityId: string | number | null;
  detalles: string | null;
};

export default function AuditoriaSistema() {
  const [data, setData] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    cargarAuditoria();
  }, []);

  async function cargarAuditoria() {
    try {
      setLoading(true);

      const res = await fetch("/api/informes/auditoria");

      if (!res.ok) {
        throw new Error("Error al obtener auditoría");
      }

      const json = await res.json();

      setData(json);
    } catch (error) {
      console.error(error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // FORMATEAR FECHA
  // =====================================================

  function formatearFecha(fecha: string) {
    const date = new Date(fecha);

    return {
      fecha: date.toLocaleDateString("es-NI", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      hora: date.toLocaleTimeString("es-NI", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  }

  // =====================================================
  // CONVERTIR DETAILS JSON
  // =====================================================

  function obtenerDetalles(detalles: string | null) {
    if (!detalles) return [];

    try {
      const json =
        typeof detalles === "string"
          ? JSON.parse(detalles)
          : detalles;

      return Object.entries(json);
    } catch {
      return [["Detalle", detalles]];
    }
  }

  // =====================================================
  // NOMBRE AMIGABLE DE LOS CAMPOS
  // =====================================================

  function nombreCampo(campo: string) {
    const nombres: Record<string, string> = {
      documento: "Documento",
      subModuleId: "Submódulo",
      elaborado: "Elaborado por",
      sesionActivaId: "Sesión activa",
      concurrencyStamp: "Concurrency Stamp",
      usuario: "Usuario",
      accion: "Acción",
    };

    return nombres[campo] || campo;
  }

  // =====================================================
  // ESTILO DE ACCIÓN
  // =====================================================

function estiloAccion(accion: string) {
  switch (accion) {
    case "Crear Usuario":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "Subir Documento":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "Actualizando Documento":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "Actualizando Implementado":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "Eliminar Documento":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-violet-50 text-violet-700 border-violet-200";
  }
}
  // =====================================================
  // BUSQUEDA
  // =====================================================

  const datosFiltrados = useMemo(() => {
    const texto = buscar.toLowerCase().trim();

    if (!texto) return data;

    return data.filter((item) => {
      return (
        item.Usuario?.toLowerCase().includes(texto) ||
        item.accion?.toLowerCase().includes(texto) ||
        item.tabla?.toLowerCase().includes(texto) ||
        String(item.EntityId ?? "")
          .toLowerCase()
          .includes(texto) ||
        item.detalles?.toLowerCase().includes(texto)
      );
    });
  }, [data, buscar]);

  // =====================================================
  // PAGINACIÓN
  // =====================================================

  const totalPaginas = Math.ceil(
    datosFiltrados.length / registrosPorPagina
  );

  const datosPaginados = datosFiltrados.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [buscar, registrosPorPagina]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-5">

      {/* =================================================
          ENCABEZADO
      ================================================= */}

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <ShieldCheck className="h-6 w-6 text-blue-700" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-blue-900">
            Auditoría del Sistema
          </h1>

          <p className="text-sm text-slate-500">
            Registro de acciones realizadas en el sistema
          </p>
        </div>
      </div>

      {/* =================================================
          TABLA
      ================================================= */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* CONTROLES */}

        <div className="flex flex-col gap-4 border-b bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">

          {/* REGISTROS */}

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Mostrar</span>

            <select
              value={registrosPorPagina}
              onChange={(e) =>
                setRegistrosPorPagina(Number(e.target.value))
              }
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <span>registros</span>
          </div>

          {/* BUSCAR */}

          <div className="relative w-full md:w-72">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

        </div>

        {/* TABLA */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px] text-sm">

            <thead>

              <tr className="bg-blue-900 text-white">

                <th className="px-4 py-3 text-left font-semibold">
                  Fecha
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Usuario
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Acción
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Tabla / ID
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Detalles de la Acción
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-slate-500"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
                      Cargando auditoría...
                    </div>
                  </td>
                </tr>

              ) : datosPaginados.length === 0 ? (

                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-slate-500"
                  >
                    No se encontraron registros.
                  </td>
                </tr>

              ) : (

                datosPaginados.map((item) => {

                  const fecha = formatearFecha(item.fecha);

                  const detalles = obtenerDetalles(
                    item.detalles
                  );

                  return (

                    <tr
                      key={item.AuditId}
                      className="border-b border-slate-200 transition-colors hover:bg-blue-50/30"
                    >

                      {/* FECHA */}

                      <td className="px-4 py-4 align-middle">

                        <div className="flex items-center gap-2">

                          <Clock className="h-4 w-4 text-slate-400" />

                          <div>

                            <div className="font-semibold text-slate-700">
                              {fecha.fecha}
                            </div>

                            <div className="text-xs text-slate-400">
                              {fecha.hora}
                            </div>

                          </div>

                        </div>

                      </td>

                      {/* USUARIO */}

                      <td className="px-4 py-4 align-middle">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                            <User className="h-4 w-4 text-slate-500" />
                          </div>

                          <span className="font-semibold text-blue-700">
                            {item.Usuario}
                          </span>

                        </div>

                      </td>

                      {/* ACCIÓN */}

                      <td className="px-4 py-4 align-middle">

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${estiloAccion(
                            item.accion
                          )}`}
                        >
                          {item.accion}
                        </span>

                      </td>

                      {/* TABLA / ID */}

                      <td className="px-4 py-4 align-middle">

                        <div className="space-y-2">

                          <div className="flex items-center gap-2">

                            <Database className="h-4 w-4 text-slate-400" />

                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                              {item.tabla}
                            </span>

                          </div>

                          <div className="text-xs text-slate-500">
                            ID Registro:{" "}
                            <span className="font-semibold text-slate-700">
                              {item.EntityId ?? "-"}
                            </span>
                          </div>

                        </div>

                      </td>

                      {/* DETALLES */}

                      <td className="px-4 py-4 align-middle">

                        {detalles.length === 0 ? (

                          <span className="text-xs text-slate-400">
                            Sin detalles
                          </span>

                        ) : (

                          <div className="min-w-[350px] space-y-2">

                            {detalles.map(
                              ([campo, valor]) => (

                                <div
                                  key={campo}
                                  className="grid grid-cols-[130px_1fr] items-start gap-3 rounded-md bg-slate-50 px-3 py-2"
                                >

                                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                    <FileText className="h-3.5 w-3.5 text-blue-500" />

                                    {nombreCampo(
                                      campo
                                    )}
                                  </div>

                                  <div className="break-words text-xs text-slate-700">
                                    {typeof valor ===
                                    "object"
                                      ? JSON.stringify(
                                          valor
                                        )
                                      : String(
                                          valor ?? "-"
                                        )}
                                  </div>

                                </div>

                              )
                            )}

                          </div>

                        )}

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>

        {/* =================================================
            PAGINACIÓN
        ================================================= */}

        {!loading && datosFiltrados.length > 0 && (

          <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">

            <div>
              Mostrando{" "}
              <span className="font-semibold text-slate-700">
                {(paginaActual - 1) *
                  registrosPorPagina +
                  1}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(
                  paginaActual * registrosPorPagina,
                  datosFiltrados.length
                )}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-slate-700">
                {datosFiltrados.length}
              </span>{" "}
              registros
            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                disabled={paginaActual === 1}
                onClick={() =>
                  setPaginaActual((p) =>
                    Math.max(1, p - 1)
                  )
                }
                className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              <span className="rounded-md bg-blue-900 px-3 py-1.5 text-sm font-semibold text-white">
                {paginaActual}
              </span>

              <button
                type="button"
                disabled={
                  paginaActual >= totalPaginas
                }
                onClick={() =>
                  setPaginaActual((p) =>
                    Math.min(totalPaginas, p + 1)
                  )
                }
                className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}