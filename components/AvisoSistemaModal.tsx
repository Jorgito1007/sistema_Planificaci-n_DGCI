"use client";

import { useEffect, useState } from "react";
import {
  Info,
  TriangleAlert,
  CircleAlert,
  CircleCheck,
  X,
  Check,
} from "lucide-react";

type Aviso = {
  Id: number;
  Titulo: string;
  Mensaje: string;
  Tipo: "informativo" | "advertencia" | "urgente" | "exito";
  FechaInicio: string;
  FechaFin: string;
  FechaActualizacion: string | null;
};

export default function AvisoSistemaModal() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [avisoActual, setAvisoActual] = useState<Aviso | null>(null);

const cargarAvisos = async () => {
  try {
    const res = await fetch("/api/avisos/activos", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.ok) {
      const nuevosAvisos = data.avisos || [];

     const vistos = JSON.parse(
  sessionStorage.getItem("avisos_vistos") || "{}"
);

const pendientes = nuevosAvisos.filter((aviso: Aviso) => {
  const versionVista = vistos[aviso.Id];

  // Nunca lo ha visto
  if (!versionVista) {
    return true;
  }

  // Si fue actualizado después de que lo vio
  return versionVista !== aviso.FechaActualizacion;
});

      setAvisos(pendientes);

      if (pendientes.length > 0) {
        setAvisoActual(pendientes[0]);
      } else {
        setAvisoActual(null);
      }
    }

  } catch (error) {
    console.error("Error cargando avisos:", error);
  }
};

  
  useEffect(() => {
  cargarAvisos();

  const manejarNuevoAviso = () => {
    cargarAvisos();
  };

  window.addEventListener(
    "aviso-creado",
    manejarNuevoAviso
  );

  const intervalo = setInterval(() => {
    cargarAvisos();
  }, 5000);

  return () => {
    window.removeEventListener(
      "aviso-creado",
      manejarNuevoAviso
    );

    clearInterval(intervalo);
  };
}, []);


  if (!avisoActual) {
    return null;
  }

  const configuracion = {
    informativo: {
      icon: Info,
      color: "text-blue-600",
      fondo: "bg-blue-50",
      borde: "border-blue-500",
    },

    advertencia: {
      icon: TriangleAlert,
      color: "text-yellow-500",
      fondo: "bg-yellow-50",
      borde: "border-yellow-500",
    },

    urgente: {
      icon: CircleAlert,
      color: "text-red-600",
      fondo: "bg-red-50",
      borde: "border-red-500",
    },

    exito: {
      icon: CircleCheck,
      color: "text-green-600",
      fondo: "bg-green-50",
      borde: "border-green-500",
    },
  };

  const config = configuracion[avisoActual.Tipo];

  const Icono = config.icon;

const cerrarAviso = () => {
  if (!avisoActual) return;

  const vistos = JSON.parse(
    sessionStorage.getItem("avisos_vistos") || "{}"
  );

  vistos[avisoActual.Id] =
    avisoActual.FechaActualizacion;

  sessionStorage.setItem(
    "avisos_vistos",
    JSON.stringify(vistos)
  );

  const restantes = avisos.filter(
    (aviso) => aviso.Id !== avisoActual.Id
  );

  setAvisos(restantes);

  if (restantes.length > 0) {
    setAvisoActual(restantes[0]);
  } else {
    setAvisoActual(null);
  }
};

  return (
<div
  className={`
    fixed bottom-5 left-5 z-[9999]
    w-[360px] max-w-[calc(100vw-2rem)]
    overflow-hidden
    rounded-2xl
    border border-slate-200
    border-l-4 ${config.borde}
    bg-white
    shadow-[0_10px_35px_rgba(0,0,0,0.20)]
    animate-in slide-in-from-left-5 fade-in
    duration-300
  `}
>

     <div className="p-5">

  {/* ENCABEZADO */}
  <div className="flex items-start justify-between gap-3">

    <div className="flex items-center gap-3">

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.fondo} ${config.color}`}
      >
        <Icono className="h-6 w-6" />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Aviso del sistema
        </p>

        <h2 className={`mt-0.5 text-base font-bold ${config.color}`}>
          {avisoActual.Titulo}
        </h2>
      </div>

    </div>

    <button
      type="button"
      onClick={cerrarAviso}
      className="rounded-full p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
    >
      <X className="h-5 w-5" />
    </button>

  </div>


  {/* MENSAJE */}
  <div className="mt-4">

    <p className="whitespace-pre-line text-sm leading-5 text-slate-600">
      {avisoActual.Mensaje}
    </p>

  </div>


  {/* ACCIÓN */}
  <div className="mt-5 flex justify-end">

    <button
      type="button"
      onClick={cerrarAviso}
      className="flex items-center gap-2 rounded-full bg-[#0b1226] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#17213c]"
    >
      <Check className="h-3.5 w-3.5" />
      Entendido
    </button>

  </div>

</div>
    </div>
  );

  
}