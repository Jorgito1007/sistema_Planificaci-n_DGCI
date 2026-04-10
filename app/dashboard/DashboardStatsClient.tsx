"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Layers,
  CheckCircle2,
  Clock,
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">
          Panel Principal
        </h1>
  
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = iconMap[stat.icon as keyof typeof iconMap];

          const content = (
            <Card
              key={stat.title}
              className={`${stat.color} overflow-hidden border-0 shadow-md transition-transform duration-200 hover:scale-[1.02] ${
                stat.clickable ? "cursor-pointer" : ""
              }`}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-semibold opacity-95">
                    {stat.title}
                  </CardTitle>
                </div>
                <Icon className="h-10 w-10 opacity-30" />
              </CardHeader>

              <CardContent className="pb-4">
                <div className="text-4xl font-bold leading-none">{stat.value}</div>
                <p className="mt-2 text-sm opacity-90">{stat.description}</p>
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

      <Card>
        <CardContent className="bg-slate-50 rounded-lg p-4 shadow-inner">
          <p className="text-sm text-slate-700">
            Bienvenido al Sistema de Control Interno. Utilice el menú lateral
            para navegar entre los diferentes módulos del sistema.
          </p>
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
                    <td colSpan={2} className="border px-3 py-6 text-center text-slate-500">
                      No hay datos disponibles.
                    </td>
                  </tr>
                ) : (
                  documentosPorSubmodulo.map((item) => (
                    <tr key={item.SubModuleId} className="hover:bg-slate-50">
                      <td className="border px-3 py-2">{item.SubModuleName}</td>
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