"use client";

import { useEffect, useState } from "react";
import { Eye, FileText, Loader2 } from "lucide-react";

type TipoPlan = "sistema-administrativo" | "por-componentes";

type PlanAccion = {
  UserId: string;
  FullName: string | null;
  Email: string | null;
  FechaEnvio: string | null;
  PeriodoInicio: string | null;
  PeriodoFin: string | null;
  TotalActividades: number;
};

export default function InformePlanesAccionPage() {
  const [tipo, setTipo] = useState<TipoPlan>("sistema-administrativo");
  const [planes, setPlanes] = useState<PlanAccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalPDF, setModalPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(""); 

  useEffect(() => {
    cargarPlanes(tipo);
  }, [tipo]);

  async function cargarPlanes(tipoPlan: TipoPlan) {
    setLoading(true);

    try {
      const res = await fetch(`/api/informes/planes-accion?tipo=${tipoPlan}`);
      const data = await res.json();

      setPlanes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando planes:", error);
      setPlanes([]);
    } finally {
      setLoading(false);
    }
  }

function verPDF(userId: string) {
  setPdfUrl(
    `/plan-accion-pdf?tipo=${tipo}&userId=${userId}`
  );
  setModalPDF(true);
}


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Informe de Planes de Acción
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Consulte los planes de acción enviados por cada usuario.
        </p>
      </div>

      
{modalPDF && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
    <div className="relative h-[90vh] w-full max-w-[1200px] overflow-hidden rounded-2xl bg-white shadow-2xl">
      
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-lg font-bold text-slate-800">
          Vista previa del Plan de Acción
        </h2>

        <button
          onClick={() => {
            setModalPDF(false);
            setPdfUrl("");
          }}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Cerrar
        </button>
      </div>

      <iframe
        src={pdfUrl}
        className="h-[calc(90vh-58px)] w-full"
      />
    </div>
  </div>
)}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setTipo("sistema-administrativo")}
          className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
            tipo === "sistema-administrativo"
              ? "bg-blue-600 text-white shadow"
              : "bg-white text-slate-700 border hover:bg-slate-50"
          }`}
        >
          Plan de Acción Sistema Administrativo
        </button>

        <button
          onClick={() => setTipo("por-componentes")}
          className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
            tipo === "por-componentes"
              ? "bg-emerald-600 text-white shadow"
              : "bg-white text-slate-700 border hover:bg-slate-50"
          }`}
        >
          Plan de Acción Por Componentes
        </button>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              tipo === "sistema-administrativo"
                ? "bg-blue-50 text-blue-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <FileText className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {tipo === "sistema-administrativo"
                ? "Planes de Acción Sistema Administrativo"
                : "Planes de Acción Por Componentes"}
            </h2>
            <p className="text-sm text-slate-500">
              Usuarios con planes enviados.
            </p>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando planes...
            </div>
          ) : planes.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-slate-500">
              No hay planes de acción enviados para este tipo.
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border p-3 text-left">Usuario</th>
    
                    <th className="border p-3 text-center">Fecha de envío</th>

                    <th className="border p-3 text-center">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {planes.map((plan, index) => (
  <tr key={`${plan.UserId}-${index}`} className="hover:bg-slate-50">
                      <td className="border p-3 font-medium text-slate-800">
                        {plan.FullName || "Sin nombre"}
                      </td>

                 

                      <td className="border p-3 text-center">
                        {plan.FechaEnvio
                          ? new Date(plan.FechaEnvio).toLocaleDateString()
                          : "-"}
                      </td>

                   

                      <td className="border p-3 text-center">
                       <button
  onClick={() => verPDF(plan.UserId)}
  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
>
  Ver
</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}