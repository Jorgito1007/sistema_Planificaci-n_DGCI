import Link from "next/link";
import {
  ShieldCheck,
  ClipboardList,
  ArrowRight,
  Users,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const informes = [
 
  {
    title: "Informe de Planes de Acción",
    description:
      "Visualiza los planes de acción enviados por cada usuario, con su periodo y detalle correspondiente.",
    href: "/dashboard/informes/planes-accion",
    icon: ClipboardList,
    color: "from-emerald-600 to-green-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    detail: "Planes enviados por usuario",
    statsIcon: FileText,
  },
];

export default function InformesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Informes
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Seleccione el tipo de informe que desea consultar.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {informes.map((informe) => {
          const Icon = informe.icon;
          const StatsIcon = informe.statsIcon;

          return (
            <Link key={informe.href} href={informe.href}>
              <Card className="group relative overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${informe.color}`}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${informe.bg}`}
                    >
                      <Icon className={`h-7 w-7 ${informe.text}`} />
                    </div>

                    <div className="rounded-full bg-slate-100 p-2 transition group-hover:bg-slate-200">
                      <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-slate-800" />
                    </div>
                  </div>

                  <CardTitle className="mt-4 text-xl font-bold text-slate-900">
                    {informe.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5">
                  <p className="text-sm leading-6 text-slate-600">
                    {informe.description}
                  </p>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <StatsIcon className={`h-5 w-5 ${informe.text}`} />
                    <span className="text-sm font-medium text-slate-700">
                      {informe.detail}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Ver informe
                    </span>

                    <span
                      className={`text-sm font-semibold ${informe.text}`}
                    >
                      Abrir
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}