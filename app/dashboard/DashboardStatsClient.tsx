"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Layers,
  CheckCircle2,
  Clock,
  Radar,
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Panel Principal
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = iconMap[stat.icon as keyof typeof iconMap];

          const content = (
            <Card
              key={stat.title}
              className={`${stat.color} overflow-hidden border-0 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                stat.clickable ? "cursor-pointer" : ""
              }`}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-base font-semibold opacity-95">
                  {stat.title}
                </CardTitle>

                {Icon && <Icon className="h-10 w-10 opacity-30" />}
              </CardHeader>

              <CardContent className="pb-4">
                <div className="text-4xl font-bold leading-none">
                  {stat.value}
                </div>

                <p className="mt-2 text-sm opacity-90">
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

  {/* Radar / Escáner institucional */}
<Card className="overflow-hidden border border-slate-200 bg-white shadow-md">
  <CardContent className="relative min-h-[280px] overflow-hidden p-8 text-slate-900">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.10),transparent_65%)]" />

    <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/30" />
    <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/25" />
    <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/20" />

    <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full">
      <div className="h-full w-full animate-spin rounded-full bg-[conic-gradient(from_0deg,rgba(14,165,233,0.35),transparent_35%)] [animation-duration:4s]" />
    </div>

    <div className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-sky-100 shadow-[0_0_35px_rgba(14,165,233,0.25)] backdrop-blur-md">
      <Radar className="h-12 w-12 animate-spin text-sky-600 [animation-duration:3s]" />
    </div>

    <div className="absolute right-6 top-6 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-md backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 shadow-inner">
          <Clock className="h-6 w-6 text-sky-600" />
        </div>

        <span className="font-mono text-2xl font-bold tracking-wider text-slate-800">
          {currentTime}
        </span>
      </div>
    </div>

    <div className="absolute bottom-6 left-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
        Bienvenido@s al
      </p>

      <h2 className="mt-1 text-2xl font-bold text-slate-900">
        Sistema de Control Interno
      </h2>

      <p className="mt-2 max-w-md text-sm text-slate-600">
        Este sistema cuenta con módulos para el control <br /> de documentos 
        internos y procesos administrativos.
      </p>
    </div>

    <div className="absolute bottom-6 right-6 flex items-center gap-3 rounded-full border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm">
      <span className="capitalize">
     {currentDate}
      </span>
    </div>

    <div className="absolute left-[35%] top-[35%] h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
    <div className="absolute right-[37%] top-[58%] h-2 w-2 animate-pulse rounded-full bg-sky-400" />
    <div className="absolute left-[45%] bottom-[30%] h-2 w-2 animate-pulse rounded-full bg-amber-400" />
  </CardContent>
</Card>
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