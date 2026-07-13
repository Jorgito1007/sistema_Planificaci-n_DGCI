"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Layers,
  CheckCircle2,
  Clock,
  Hourglass,
  Activity,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StatItem = {
  title: string;
  value: number;
  description: string;
  icon: string;
  color: string;
  clickable?: boolean;
};

type SubmoduloDocumento = {
  SubModuleId: number;
  SubModuleName: string;
  TotalDocumentos: number;
};

type Props = {
  stats: StatItem[];
  documentosPorSubmodulo: SubmoduloDocumento[];
};

const iconMap = {
  FileText,
  Layers,
  CheckCircle2,
  Clock,
};

export default function DashboardStatsClient({
  stats,
  documentosPorSubmodulo,
}: Props) {
  const [open, setOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("es-NI", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      setCurrentDate(
        new Date().toLocaleDateString("es-NI", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateDateTime();

    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const totalDocumentos = stats[0]?.value ?? 0;
  const completados = stats[2]?.value ?? 0;
  const pendientes = stats[3]?.value ?? 0;

  const porcentajeAvance =
    totalDocumentos > 0
      ? Math.round((completados / totalDocumentos) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="rounded-2xl border bg-gradient-to-r from-slate-50 to-blue-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              ¡Bienvenid@s al Sistema de Control Interno!
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Gestión y seguimiento de documentos Institucionales.
            </p>
          </div>

          <div className="rounded-xl bg-white px-5 py-3 text-right shadow-sm">
            <p className="text-2xl font-bold text-blue-700">{currentTime}</p>
            <p className="text-xs capitalize text-slate-500">{currentDate}</p>
          </div>
        </div>
      </div>

      {/* Tarjetas estadísticas */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = iconMap[stat.icon as keyof typeof iconMap];

          const content = (
            <Card
              key={stat.title}
              className={`${stat.color} relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                stat.clickable ? "cursor-pointer" : ""
              }`}
            >
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20" />

              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-base font-bold opacity-95">
                  {stat.title}
                </CardTitle>

                {Icon && (
                  <div className="rounded-full bg-white/20 p-3">
                    <Icon className="h-8 w-8 opacity-80" />
                  </div>
                )}
              </CardHeader>

              <CardContent className="pb-5">
                <div className="text-5xl font-extrabold leading-none">
                  {stat.value}
                </div>

                <p className="mt-3 text-sm opacity-95">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );

          if (stat.title === "Sistema Administrativo") {
            return (
              <button
                key={stat.title}
                type="button"
                onClick={() => setOpen(true)}
                className="text-left"
              >
                {content}
              </button>
            );
          }

          return content;
        })}
      </div>

     

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documentos por submódulo</DialogTitle>
          </DialogHeader>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border px-3 py-2 text-left">Submódulo</th>
                  <th className="border px-3 py-2 text-center">Cantidad</th>
                </tr>
              </thead>

              <tbody>
                {documentosPorSubmodulo.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="border px-3 py-6 text-center text-slate-500"
                    >
                      No hay datos disponibles.
                    </td>
                  </tr>
                ) : (
                  documentosPorSubmodulo.map((item) => (
                    <tr key={item.SubModuleId} className="hover:bg-slate-50">
                      <td className="border px-3 py-2">
                        {item.SubModuleName}
                      </td>

                      <td className="border px-3 py-2 text-center font-semibold">
                        {item.TotalDocumentos}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}