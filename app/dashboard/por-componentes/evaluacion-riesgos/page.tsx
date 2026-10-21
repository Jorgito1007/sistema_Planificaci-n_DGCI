"use client";

import { Fragment, useEffect, useMemo, useState,useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationContext";


type Principio = {
  id: number;
  titulo: string;
  color: string;
  rowColor: string;
};

type PreguntaGeneralForm = {
  numero: string;
  texto: string;
};

type PreguntaDetalleForm = {
  numero: string;
  texto: string;
  cargo: string;
  existe: number;
  aprobado: number;
  difundido: number;
  estaPresente: "SI" | "NO";
  implementado: number;
  actualizado: number;
  estaFuncionando: "SI" | "NO";
  calificacion: number;
  nivel: string;
  tipoDocumento: string;
  descripcion: string;
  fechaEmision: string;
  interna: string;
  externa: string;
  habilitarInterna: boolean;
  habilitarExterna: boolean;
};

type RegistroPrincipio = {
  principioId: number;
  principioTitulo: string;
  color: string;
  rowColor: string;
  preguntaGeneral: PreguntaGeneralForm;
  preguntas: PreguntaDetalleForm[];
};


interface Cargo {
  Id: number;
  CargoKey: string;
  NombreCargo: string;
}


const PRINCIPIOS: Principio[] = [
  { id: 6, titulo: "Principio 6", color: "bg-blue-600", rowColor: "bg-[#cfe2f3]" },
  { id: 7, titulo: "Principio 7", color: "bg-green-600", rowColor: "bg-[#d9ead3]" },
  { id: 8, titulo: "Principio 8", color: "bg-yellow-500", rowColor: "bg-[#fff2cc]" },
  { id: 9, titulo: "Principio 9", color: "bg-red-600", rowColor: "bg-[#f4cccc]" },
];

function calcularCalificacion(p: {
  existe: number;
  aprobado: number;
  difundido: number;
  implementado: number;
  actualizado: number;
}) {
  return (
    Number(p.existe) +
    Number(p.aprobado) +
    Number(p.difundido) +
    Number(p.implementado) +
    Number(p.actualizado)
  );
}

function calcularEstaPresente(existe: number, aprobado: number): "SI" | "NO" {
  return Number(existe) === 1 && Number(aprobado) === 1 ? "SI" : "NO";
}

function calcularEstaFuncionando(
  implementado: number,
  actualizado: number
): "SI" | "NO" {
  return Number(implementado) === 1 && Number(actualizado) === 1 ? "SI" : "NO";
}

function calcularNivel(calificacion: number): string {
  if (calificacion <= 2) return "Bajo";
  if (calificacion <= 4) return "Medio";
  return "Alto";
}

function crearPreguntaDetalleVacia(
  principioId: number,
  correlativo: number
): PreguntaDetalleForm {
  const existe = 0;
  const aprobado = 0;
  const difundido = 0;
  const implementado = 0;
  const actualizado = 0;
  const calificacion = calcularCalificacion({
    existe,
    aprobado,
    difundido,
    implementado,
    actualizado,
  });

  return {
    numero: `${principioId}.1.${correlativo}`,
    texto: "",
    cargo: "",
    existe,
    aprobado,
    difundido,
    estaPresente: calcularEstaPresente(existe, aprobado),
    implementado,
    actualizado,
    estaFuncionando: calcularEstaFuncionando(implementado, actualizado),
    calificacion,
    nivel: calcularNivel(calificacion),
    tipoDocumento: "",
    descripcion: "",
    fechaEmision: "",
    interna: "",
    externa: "",
    habilitarInterna: false,
habilitarExterna: false,
  };
}

function recalcularPregunta(p: PreguntaDetalleForm): PreguntaDetalleForm {
  const calificacion = calcularCalificacion({
    existe: p.existe,
    aprobado: p.aprobado,
    difundido: p.difundido,
    implementado: p.implementado,
    actualizado: p.actualizado,
  });

  return {
    ...p,
    estaPresente: calcularEstaPresente(p.existe, p.aprobado),
    estaFuncionando: calcularEstaFuncionando(p.implementado, p.actualizado),
    calificacion,
    nivel: calcularNivel(calificacion),
  };
}

export default function EvaluacionRiesgosPage() {
  const SUBMODULE_KEY = "sa_ERiesgos";

  const tablaRef = useRef<HTMLTableElement>(null);
const scrollTablaRef = useRef<HTMLDivElement>(null);
const scrollFijoRef = useRef<HTMLDivElement>(null);
const [anchoTabla, setAnchoTabla] = useState(2200);

  const [cargos, setCargos] = useState<Cargo[]>([]);

  const [isFullAccess, setIsFullAccess] = useState(false);
  const [principiosPermitidos, setPrincipiosPermitidos] = useState<number[]>([]);

  const [open, setOpen] = useState(false);
  const [principioActual, setPrincipioActual] = useState<Principio | null>(null);

  const [preguntaGeneral, setPreguntaGeneral] = useState<PreguntaGeneralForm>({
    numero: "",
    texto: "",
  });

  const [preguntasDetalle, setPreguntasDetalle] = useState<PreguntaDetalleForm[]>([]);
const [registros, setRegistros] = useState<RegistroPrincipio[]>([]);

  const [puedeEditarPregunta, setPuedeEditarPregunta] = useState(false);
  const [preguntaEditando, setPreguntaEditando] =
  useState<number | null>(null);
  


  {/* estados de difusión */}
    const [modalDifusion, setModalDifusion] = useState(false);
  
  const [preguntaDifusion, setPreguntaDifusion] =
    useState<number | null>(null);
  
  const [difusionInterna, setDifusionInterna] = useState(false);
  
  const [difusionExterna, setDifusionExterna] = useState(false);

const { cargarNotificaciones } = useNotifications();

//permisos de usuario sobre la edicion de principios
const cargarPermisosPrincipios = async () => {
  
  const res = await fetch(
    
    `/api/permisos/principios?subModuleKey=${SUBMODULE_KEY}`,
    { credentials: "include" }
    
  );

  const data = await res.json();
console.log("PERMISOS PRINCIPIOS:", data);
  if (!res.ok || !data.ok) return;

  setIsFullAccess(data.isFullAccess);

    const role = (data.role || "").toLowerCase();

setPuedeEditarPregunta(
  role === "administrador" ||
  role === "subadministrador"
);


  const ids = (data.principios || []).map((p: any) =>
    Number(p.PrincipioId)
  );

  setPrincipiosPermitidos(ids);
};

const puedeUsarPrincipio = (principioId: number) => {
  return (
    isFullAccess ||
    principiosPermitidos.includes(Number(principioId))
  );
};

async function cargarCargos() {
  try {
    const res = await fetch("/api/cargos");

    if (!res.ok) {
      throw new Error("Error cargando cargos");
    }

    const data = await res.json();

    setCargos(data);
  } catch (error) {
    console.error(error);
  }
}


const cargarRegistros = async () => {
    try {
      const res = await fetch(
        `/api/control-interno/listar?subModuleKey=${SUBMODULE_KEY}`
      );

      const json = await res.json();

      if (!json.ok) {
        alert(json.message || "No se pudo cargar la información.");
        return;
      }

      setRegistros(json.data || []);
    } catch (error) {
      console.error(error);
      alert("Error al cargar los registros.");
    }
  };

    useEffect(() => {
    cargarRegistros();
     cargarPermisosPrincipios();
     cargarCargos();
  }, []);


useEffect(() => {
  localStorage.setItem("evaluacion_riesgos", JSON.stringify(registros));
}, [registros]);

  const abrirModal = (principio: Principio) => {
    setPrincipioActual(principio);

    const existente = registros.find((r) => r.principioId === principio.id);

    if (existente) {
      setPreguntaGeneral({
        numero: existente.preguntaGeneral.numero,
        texto: existente.preguntaGeneral.texto,
      });

      setPreguntasDetalle(
        existente.preguntas.map((p) => ({
          ...p,
        }))
      );
    } else {
      setPreguntaGeneral({
        numero: `${principio.id}.`,
        texto: "",
      });

      setPreguntasDetalle([crearPreguntaDetalleVacia(principio.id, 1)]);
    }

    setOpen(true);
  };

  const agregarPregunta = () => {
    if (!principioActual) return;

    const ultimoNumero =
      preguntasDetalle.length > 0
        ? preguntasDetalle[preguntasDetalle.length - 1].numero
        : `${principioActual.id}.1.0`;

    const partes = ultimoNumero.split(".");
    const ultimoCorrelativo = Number(partes[2] || 0);
    const siguiente = ultimoCorrelativo + 1;

    setPreguntasDetalle((prev) => [
      ...prev,
      crearPreguntaDetalleVacia(principioActual.id, siguiente),
    ]);
  };

  const eliminarPregunta = (index: number) => {
    setPreguntasDetalle((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarPreguntaDetalle = (
    index: number,
    campo: keyof PreguntaDetalleForm,
    valor: string | number
  ) => {
    setPreguntasDetalle((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const actualizada = {
          ...item,
          [campo]: valor,
        } as PreguntaDetalleForm;

        return recalcularPregunta(actualizada);
      })
    );
  };

  const guardarPrincipio = async () => {
    if (!principioActual) return;

    if (!preguntaGeneral.texto.trim()) {
      alert("Debe ingresar la pregunta general.");
      return;
    }

    const preguntasValidas = preguntasDetalle
      .filter((p) => p.texto.trim() !== "")
      .map((p) => recalcularPregunta(p));

    if (preguntasValidas.length === 0) {
      alert("Debe ingresar al menos una pregunta adicional.");
      return;
    }

    try {
      const res = await fetch("/api/control-interno/guardar", {
        method: "POST",
        credentials:"include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subModuleKey: SUBMODULE_KEY,
          principioId: principioActual.id,
          principioTitulo: principioActual.titulo,
          color: principioActual.color,
          rowColor: principioActual.rowColor,
          preguntaGeneral,
          preguntas: preguntasValidas,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.message || "No se pudo guardar.");
        return;
      }

      await cargarRegistros();
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Error al guardar.");
    }

    await cargarNotificaciones();
  };

  const registrosOrdenados = useMemo(() => {
    return [...registros].sort((a, b) => a.principioId - b.principioId);
  }, [registros]);

//SCROLL
useEffect(() => {
  const tabla = scrollTablaRef.current;
  const fijo = scrollFijoRef.current;

  if (!tabla || !fijo) return;

  const moverDesdeTabla = () => {
    fijo.scrollLeft = tabla.scrollLeft;
  };

  const moverDesdeFijo = () => {
    tabla.scrollLeft = fijo.scrollLeft;
  };

  tabla.addEventListener("scroll", moverDesdeTabla);
  fijo.addEventListener("scroll", moverDesdeFijo);

  return () => {
    tabla.removeEventListener("scroll", moverDesdeTabla);
    fijo.removeEventListener("scroll", moverDesdeFijo);
  };
}, []);

//ancho scroll
useEffect(() => {
  const actualizarAncho = () => {
    if (tablaRef.current) {
      setAnchoTabla(tablaRef.current.scrollWidth);
    }
  };

  actualizarAncho();

  window.addEventListener("resize", actualizarAncho);

  return () => {
    window.removeEventListener("resize", actualizarAncho);
  };
}, [registrosOrdenados]);

  return (
    <div className="space-y-6 p-6">
     
  {/* ============================================================
    ENCABEZADO DEL COMPONENTE
============================================================ */}

<div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

  {/* ==========================================================
      ENCABEZADO
  ========================================================== */}

  <div className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-r from-[#f1f7ff] via-[#eef8ff] to-[#e8f9fb] px-5 py-5">

    {/* Decoración derecha */}
    <div className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-blue-100/60" />

    <div className="pointer-events-none absolute right-16 -bottom-12 h-20 w-20 rounded-full bg-cyan-100/30" />


    <div className="relative flex items-center gap-4">

      {/* ========================================================
          NÚMERO DEL COMPONENTE
      ======================================================== */}

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0b4da2] text-base font-black text-white shadow-md shadow-blue-900/20">
        2
      </div>


      {/* ========================================================
          TÍTULO
      ======================================================== */}

      <div>

        <h1 className="mt-1 text-lg font-bold text-[#082f5b]">
          Evaluación de Riesgos
        </h1>

      </div>

    </div>

  </div>


  {/* ==========================================================
      DESCRIPCIÓN
  ========================================================== */}

  <div className="px-5 py-6">

    <div className="flex gap-4">

      {/* Línea lateral */}
      <div className="w-1 shrink-0 rounded-full bg-gradient-to-b from-[#0b4da2] to-[#1596aa]" />


      {/* Texto */}
      <p className="text-justify text-sm leading-7 text-slate-600">

     Se centra en identificar y analizar los riesgos considerando su criticidad y tolerancia para la consecución de los objetivos de la Entidad, de tal forma, que se disponga de una base 
   para dar respuesta a los mismos a través de una adecuada administración.

      </p>

    </div>

  </div>

</div>

    {/* ============================================================
    PRINCIPIOS DEL COMPONENTE
============================================================ */}

<div className="mt-5">



  {/* ==========================================================
      BOTONES
  ========================================================== */}

  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

    {PRINCIPIOS.map((principio, index) => {

      const habilitado =
        puedeUsarPrincipio(Number(principio.id));


      /*
        Colores visuales por principio.

        Ya no dependemos de principio.color para el diseño,
        pero NO modificamos ninguna función ni la lógica.
      */

      const estilos = [
        {
          fondo: "bg-blue-50/60",
          borde: "border-blue-200",
          icono: "bg-blue-600",
          numero: "text-blue-600",
          titulo: "text-blue-900",
          hover: "hover:border-blue-300 hover:shadow-blue-100",
          flecha: "group-hover:bg-blue-600 group-hover:text-white",
        },

        {
          fondo: "bg-emerald-50/60",
          borde: "border-emerald-200",
          icono: "bg-emerald-600",
          numero: "text-emerald-600",
          titulo: "text-emerald-900",
          hover: "hover:border-emerald-300 hover:shadow-emerald-100",
          flecha: "group-hover:bg-emerald-600 group-hover:text-white",
        },

        {
          fondo: "bg-amber-50/60",
          borde: "border-amber-200",
          icono: "bg-amber-500",
          numero: "text-amber-600",
          titulo: "text-amber-900",
          hover: "hover:border-amber-300 hover:shadow-amber-100",
          flecha: "group-hover:bg-amber-500 group-hover:text-white",
        },

        {
          fondo: "bg-violet-50/60",
          borde: "border-violet-200",
          icono: "bg-violet-600",
          numero: "text-violet-600",
          titulo: "text-violet-900",
          hover: "hover:border-violet-300 hover:shadow-violet-100",
          flecha: "group-hover:bg-violet-600 group-hover:text-white",
        },

        {
          fondo: "bg-rose-50/60",
          borde: "border-rose-200",
          icono: "bg-rose-600",
          numero: "text-rose-600",
          titulo: "text-rose-900",
          hover: "hover:border-rose-300 hover:shadow-rose-100",
          flecha: "group-hover:bg-rose-600 group-hover:text-white",
        },
      ];


      const estilo =
        estilos[index % estilos.length];


      return (

        <button
          key={principio.id}
          type="button"

          onClick={() => {

            if (!habilitado) return;

            abrirModal(principio);

          }}

          disabled={!habilitado}

          className={`
            group relative overflow-hidden rounded-2xl border
            p-4 text-left transition-all duration-300

            ${
              habilitado
                ? `
                  ${estilo.fondo}
                  ${estilo.borde}
                  ${estilo.hover}
                  cursor-pointer
                  hover:-translate-y-0.5
                  hover:bg-white
                  hover:shadow-lg
                `
                : `
                  cursor-not-allowed
                  border-slate-200
                  bg-slate-50
                  opacity-60
                `
            }
          `}
        >

          {/* ====================================================
              DECORACIÓN
          ==================================================== */}

          {habilitado && (

            <div
              className={`
                pointer-events-none
                absolute -right-8 -top-8
                h-20 w-20
                rounded-full
                opacity-[0.08]
                ${estilo.icono}
                transition-transform
                duration-500
                group-hover:scale-125
              `}
            />

          )}


          {/* ====================================================
              CONTENIDO
          ==================================================== */}

          <div className="relative flex items-center gap-3">


            {/* ==================================================
                NÚMERO
            ================================================== */}

            <div
              className={`
                flex h-11 w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                text-sm
                font-black
                text-white
                shadow-sm

                ${
                  habilitado
                    ? estilo.icono
                    : "bg-slate-400"
                }
              `}
            >

              {index + 1}

            </div>



            {/* ==================================================
                INFORMACIÓN
            ================================================== */}

            <div className="min-w-0 flex-1">


              <div className="flex items-center justify-between gap-3">


                {/* TÍTULO */}

                <h3
                  className={`
                    text-sm font-bold

                    ${
                      habilitado
                        ? estilo.titulo
                        : "text-slate-500"
                    }
                  `}
                >

                  {principio.titulo}

                </h3>



                {/* =================================================
                    FLECHA
                ================================================= */}

                {habilitado && (

                  <div
                    className={`
                      flex h-7 w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-white
                      text-slate-400
                      shadow-sm
                      ring-1
                      ring-slate-100
                      transition-all
                      duration-300

                      ${estilo.flecha}
                    `}
                  >

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 18l6-6-6-6"
                      />
                    </svg>

                  </div>

                )}

              </div>



              {/* =================================================
                  ESTADO
              ================================================= */}

              <div className="mt-1.5 flex items-center gap-2">

                {habilitado ? (

                  <>
                    <span
                      className={`
                        h-1.5 w-1.5
                        rounded-full
                        ${estilo.icono}
                      `}
                    />

                    <span className="text-[10px] font-medium text-slate-500">
                      Registrar o editar contenido
                    </span>
                  </>

                ) : (

                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />

                    <span className="text-[10px] font-medium text-slate-400">
                      Sin permisos
                    </span>
                  </>

                )}

              </div>

            </div>

          </div>

        </button>

      );

    })}

  </div>

</div>
      
{/* ============================================================
    MATRIZ DE EVALUACIÓN - ENTORNO DE CONTROL
============================================================ */}

<div className="w-full min-w-0">

  <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">


    {/* ==========================================================
        ENCABEZADO DE LA MATRIZ
    ========================================================== */}

    <div className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-r from-[#0b4da2] via-[#1767a8] to-[#1596aa] px-5 py-4">

      {/* Decoraciones */}

      <div className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-white/10" />

      <div className="pointer-events-none absolute right-16 top-8 h-16 w-16 rounded-full bg-white/5" />


      <div className="relative flex items-center gap-3">

        {/* Icono visual */}

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/15 shadow-sm">

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5 text-white"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>

        </div>


        {/* Título */}

        <div>

          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100">
            Componente 2
          </p>

          <h3 className="mt-0.5 text-base font-bold text-white">
            Matriz de Evaluación
          </h3>

        </div>

      </div>

    </div>


    {/* ==========================================================
        CONTENEDOR DE TABLA
    ========================================================== */}

    <div className="relative w-full min-w-0">


      {/* ========================================================
          SCROLL PRINCIPAL
      ======================================================== */}

      <div
        ref={scrollTablaRef}
        className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >

        <table
          ref={tablaRef}
          className="min-w-[2200px] border-collapse text-[12px] text-slate-700"
        >


          {/* ====================================================
              ENCABEZADO DE TABLA
          ==================================================== */}

          <thead>


            {/* ==================================================
                NIVEL 1
            ================================================== */}

            <tr className="bg-[#0e456f] text-center font-bold uppercase tracking-wide text-white">

              <th
                rowSpan={4}
                className="w-[70px] border border-[#326486] px-3 py-3"
              >
                N°
              </th>


              <th
                rowSpan={4}
                className="min-w-[500px] border border-[#326486] px-4 py-3 text-left"
              >
                Punto de enfoque
              </th>


              <th className="min-w-[180px] border border-[#326486] px-3 py-3">
                Responsable
              </th>


              <th
                colSpan={7}
                className="border border-[#326486] bg-[#15577f] px-3 py-3"
              >
                Criterios de valoración
              </th>


              <th
                colSpan={2}
                rowSpan={2}
                className="border border-[#326486] bg-[#117985] px-3 py-3"
              >
                Nivel de cumplimiento
                <span className="mt-1 block text-[9px] font-medium normal-case tracking-normal text-cyan-100">
                  del principio
                </span>
              </th>


              <th
                colSpan={3}
                rowSpan={2}
                className="border border-[#326486] bg-[#174e70] px-3 py-3"
              >
                Evidencias de cumplimiento
                <span className="mt-1 block text-[9px] font-medium normal-case tracking-normal text-blue-100">
                  de los puntos de enfoque
                </span>
              </th>


              <th
                colSpan={2}
                className="border border-[#326486] bg-[#15577f] px-3 py-3"
              >
                Difusión / Comunicación
              </th>

            </tr>



            {/* ==================================================
                NIVEL 2
            ================================================== */}

            <tr className="bg-[#e9f3f9] text-center font-bold text-[#123d5c]">

              <th
                rowSpan={3}
                className="min-w-[180px] border border-slate-300 px-3 py-3 align-middle"
              >
                Cargo
              </th>


              <th
                colSpan={3}
                className="border border-slate-300 bg-[#e7f4f8] px-3 py-2.5 text-[#0e6074]"
              >
                Presente
              </th>


              <th
                rowSpan={3}
                className="min-w-[100px] border border-slate-300 px-3 py-3"
              >
                Está
                <span className="block">presente</span>
              </th>


              <th
                colSpan={2}
                className="border border-slate-300 bg-[#edf7f3] px-3 py-2.5 text-emerald-800"
              >
                Funcionando
              </th>


              <th
                rowSpan={3}
                className="min-w-[105px] border border-slate-300 px-3 py-3"
              >
                Está
                <span className="block">funcionando</span>
              </th>


              <th
                rowSpan={3}
                className="min-w-[110px] border border-slate-300 bg-[#eef6fb] px-3 py-3"
              >
                Interna
              </th>


              <th
                rowSpan={3}
                className="min-w-[110px] border border-slate-300 bg-[#eef6fb] px-3 py-3"
              >
                Externa
              </th>

            </tr>



            {/* ==================================================
                NIVEL 3
            ================================================== */}

            <tr className="bg-[#f5f9fc] text-center font-semibold text-slate-700">

              <th
                rowSpan={2}
                className="min-w-[75px] border border-slate-300 px-2 py-3"
              >
                Existe
              </th>


              <th
                rowSpan={2}
                className="min-w-[80px] border border-slate-300 px-2 py-3"
              >
                Aprobado
              </th>


              <th
                rowSpan={2}
                className="min-w-[80px] border border-slate-300 px-2 py-3"
              >
                Difundido
              </th>


              <th
                rowSpan={2}
                className="min-w-[95px] border border-slate-300 px-2 py-3"
              >
                Implementado
              </th>


              <th
                rowSpan={2}
                className="min-w-[90px] border border-slate-300 px-2 py-3"
              >
                Actualizado
              </th>


              {/* CALIFICACIÓN */}

              <th
                rowSpan={2}
                className="min-w-[100px] border border-cyan-200 bg-[#dff3f6] px-2 py-3 font-bold text-[#087183]"
              >
                Calificación
              </th>


              {/* NIVEL */}

              <th
                rowSpan={2}
                className="min-w-[110px] border border-cyan-200 bg-[#dff3f6] px-2 py-3 font-bold text-[#087183]"
              >
                Nivel
              </th>


              <th
                rowSpan={2}
                className="min-w-[180px] border border-slate-300 bg-[#f1f6fa] px-3 py-3"
              >
                Tipo de documento
              </th>


              <th
                rowSpan={2}
                className="min-w-[280px] border border-slate-300 bg-[#f1f6fa] px-3 py-3"
              >
                Descripción
              </th>


              <th
                rowSpan={2}
                className="min-w-[180px] border border-slate-300 bg-[#f1f6fa] px-3 py-3"
              >
                Fecha de emisión /
                <span className="block">
                  aprobación
                </span>
              </th>

            </tr>


            {/* ==================================================
                NIVEL 4
            ================================================== */}

            <tr className="bg-[#f5f9fc] text-center">
            </tr>

          </thead>



          {/* ====================================================
              CUERPO
          ==================================================== */}

          <tbody>

            {registrosOrdenados.length === 0 ? (

              /* ==================================================
                  SIN REGISTROS
              ================================================== */

              <tr>

                <td
                  colSpan={17}
                  className="border border-slate-200 bg-slate-50 px-4 py-12 text-center"
                >

                  <div className="flex flex-col items-center justify-center">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-6 w-6 text-blue-500"
                      >
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>

                    </div>


                    <p className="mt-3 text-sm font-bold text-slate-700">
                      Aún no hay registros
                    </p>


                    <p className="mt-1 text-xs text-slate-400">
                      Los puntos de enfoque aparecerán en esta sección.
                    </p>

                  </div>

                </td>

              </tr>

            ) : (

              registrosOrdenados.map((registro) => (

                <Fragment key={registro.principioId}>


                  {/* ==================================================
                      FILA DEL PRINCIPIO
                  ================================================== */}

                  <tr>

                    <td
                      colSpan={17}
                      className="border border-blue-200 bg-gradient-to-r from-[#e8f2fb] via-[#edf7fb] to-[#e8f8f6] px-4 py-3"
                    >

                      <div className="flex items-start gap-3">

                        {/* IDENTIFICADOR */}

                        <div className="mt-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-[#0b4da2] px-2 text-[10px] font-black text-white shadow-sm">

                          {registro.preguntaGeneral.numero}

                        </div>


                        {/* TEXTO */}

                        <div>

                         

                          <p className="mt-1 text-xs font-bold leading-5 text-[#123d5c]">
                            {registro.preguntaGeneral.texto}
                          </p>

                        </div>

                      </div>

                    </td>

                  </tr>



                  {/* ==================================================
                      PREGUNTAS
                  ================================================== */}

                  {registro.preguntas.map((pregunta, index) => (

                    <tr
                      key={`${registro.principioId}-${index}`}
                      className="bg-white transition-colors duration-150 hover:bg-[#f7fbfd]"
                    >


                      {/* NÚMERO */}

                      <td className="border border-slate-200 px-3 py-3 text-center align-top">

                        <span className="inline-flex min-w-[32px] items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                          {pregunta.numero}
                        </span>

                      </td>



                      {/* PREGUNTA */}

                      <td className="border border-slate-200 px-4 py-3 align-top">

                        <p className="text-xs leading-5 text-slate-700">
                          {pregunta.texto}
                        </p>

                      </td>



                      {/* CARGO */}

                      <td className="border border-slate-200 px-3 py-3 align-top">

                        {pregunta.cargo ? (

                          <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                            {pregunta.cargo}
                          </span>

                        ) : (

                          <span className="text-xs text-slate-400">
                            Sin asignar
                          </span>

                        )}

                      </td>



                      {/* EXISTE */}

                      <td className="border border-slate-200 px-2 py-3 text-center align-middle">

                        <span className="inline-flex min-w-[32px] items-center justify-center rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-700">
                          {pregunta.existe}
                        </span>

                      </td>



                      {/* APROBADO */}

                      <td className="border border-slate-200 px-2 py-3 text-center align-middle">

                        <span className="inline-flex min-w-[32px] items-center justify-center rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-700">
                          {pregunta.aprobado}
                        </span>

                      </td>



                      {/* DIFUNDIDO */}

                      <td className="border border-slate-200 px-2 py-3 text-center align-middle">

                        <span className="inline-flex min-w-[32px] items-center justify-center rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-700">
                          {pregunta.difundido}
                        </span>

                      </td>



                      {/* ESTÁ PRESENTE */}

                      <td className="border border-slate-200 px-2 py-3 text-center align-middle">

                        <span
                          className={`inline-flex min-w-[45px] items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            pregunta.estaPresente === "SI"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-red-50 text-red-600 ring-1 ring-red-200"
                          }`}
                        >
                          {pregunta.estaPresente}
                        </span>

                      </td>



                      {/* IMPLEMENTADO */}

                      <td className="border border-slate-200 px-2 py-3 text-center align-middle">

                        <span className="inline-flex min-w-[32px] items-center justify-center rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-700">
                          {pregunta.implementado}
                        </span>

                      </td>



                      {/* ACTUALIZADO */}

                      <td className="border border-slate-200 px-2 py-3 text-center align-middle">

                        <span className="inline-flex min-w-[32px] items-center justify-center rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-700">
                          {pregunta.actualizado}
                        </span>

                      </td>



                      {/* ESTÁ FUNCIONANDO */}

                      <td className="border border-slate-200 px-2 py-3 text-center align-middle">

                        <span
                          className={`inline-flex min-w-[45px] items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            pregunta.estaFuncionando === "SI"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-red-50 text-red-600 ring-1 ring-red-200"
                          }`}
                        >
                          {pregunta.estaFuncionando}
                        </span>

                      </td>



                      {/* CALIFICACIÓN */}

                      <td className="border border-slate-200 bg-cyan-50/30 px-2 py-3 text-center align-middle">

                        <span className="inline-flex min-w-[36px] items-center justify-center rounded-lg bg-[#e0f2f4] px-2 py-1.5 font-black text-[#087183]">
                          {pregunta.calificacion}
                        </span>

                      </td>



                      {/* NIVEL */}

                      <td className="border border-slate-200 bg-cyan-50/20 px-2 py-3 text-center align-middle">

                        <span
                          className={`inline-flex min-w-[65px] items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
                            pregunta.nivel === "Bajo"
                              ? "bg-red-50 text-red-600 ring-red-200"
                              : pregunta.nivel === "Medio"
                              ? "bg-amber-50 text-amber-700 ring-amber-200"
                              : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          }`}
                        >
                          {pregunta.nivel}
                        </span>

                      </td>



                      {/* TIPO DOCUMENTO */}

                      <td className="border border-slate-200 px-3 py-3 align-top">

                        {pregunta.tipoDocumento ? (

                          <span className="inline-flex rounded-lg bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                            {pregunta.tipoDocumento}
                          </span>

                        ) : (

                          <span className="text-[10px] text-slate-400">
                            Sin especificar
                          </span>

                        )}

                      </td>



                      {/* DESCRIPCIÓN */}

                      <td className="border border-slate-200 px-4 py-3 align-top">

                        {pregunta.descripcion ? (

                          <p className="text-xs leading-5 text-slate-600">
                            {pregunta.descripcion}
                          </p>

                        ) : (

                          <span className="text-[10px] text-slate-400">
                            Sin descripción
                          </span>

                        )}

                      </td>



                      {/* FECHA */}

                      <td className="border border-slate-200 px-3 py-3 text-center align-middle">

                        {pregunta.fechaEmision ? (

                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-medium text-slate-700">
                            {pregunta.fechaEmision}
                          </span>

                        ) : (

                          <span className="text-[10px] text-slate-400">
                            Sin fecha
                          </span>

                        )}

                      </td>



                      {/* INTERNA */}

                      <td className="border border-slate-200 px-3 py-3 text-center align-top">

                        {pregunta.interna || (
                          <span className="text-slate-300">—</span>
                        )}

                      </td>



                      {/* EXTERNA */}

                      <td className="border border-slate-200 px-3 py-3 text-center align-top">

                        {pregunta.externa || (
                          <span className="text-slate-300">—</span>
                        )}

                      </td>

                    </tr>

                  ))}

                </Fragment>

              ))

            )}

          </tbody>

        </table>

      </div>



      {/* ========================================================
          SCROLL HORIZONTAL FIJO
          SE MANTIENE TU MISMA LÓGICA
      ======================================================== */}

      <div
        ref={scrollFijoRef}
        className="fixed bottom-0 left-[var(--sidebar-width)] right-0 z-50 h-5 overflow-x-auto border-t border-slate-200 bg-white shadow-[0_-4px_12px_rgba(15,23,42,0.08)]"
      >

        <div
          style={{
            width: `${anchoTabla + 180}px`,
          }}
          className="h-1"
        />

      </div>

    </div>

  </div>

</div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {principioActual?.titulo} - Registro del principio
            </DialogTitle>
          </DialogHeader>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
  <div className="border-b bg-slate-100 px-5 py-3">
    <h3 className="text-base font-semibold text-slate-700">
      📋 Información de la pregunta
    </h3>
  </div>

  <div className="p-5">
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Número
        </label>

        <input
          className={`w-full rounded-lg border border-slate-300 px-3 py-2 ${
            !puedeEditarPregunta
              ? "bg-slate-100 text-slate-600 cursor-not-allowed"
              : "focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          }`}
          value={preguntaGeneral.numero}
          readOnly={!puedeEditarPregunta}
          onChange={(e) =>
            setPreguntaGeneral((prev) => ({
              ...prev,
              numero: e.target.value,
            }))
          }
        />
      </div>
                       <div className="lg:col-span-3">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Texto de la pregunta
        </label>

        <textarea
          rows={3}
          className={`w-full rounded-lg border border-slate-300 px-3 py-2 ${
            !puedeEditarPregunta
              ? "bg-slate-100 text-slate-600 cursor-not-allowed"
              : "focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          }`}
          value={preguntaGeneral.texto}
          readOnly={!puedeEditarPregunta}
          onChange={(e) =>
            setPreguntaGeneral((prev) => ({
              ...prev,
              texto: e.target.value,
            }))
          }
        />
      </div>
    </div>
  </div>
</div>




<div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
  {/* CABECERA SECCIÓN PRINCIPAL */}
  <div className="border-b bg-slate-100 px-5 py-3 flex items-center justify-between">
    <h4 className="text-base font-semibold text-slate-800">Preguntas adicionales</h4>
    {puedeEditarPregunta && (
      <Button
        type="button"
        onClick={agregarPregunta}
      >
        Agregar pregunta
      </Button>
    )}
  </div>

  {/* LISTADO DE PREGUNTAS */}
  <div className="p-5 space-y-5">
    {preguntasDetalle.map((pregunta, index) => (
      <div
        key={index}
        className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs transition-all"
      >
        {/* CABECERA PREGUNTA */}
        <div className="p-4 flex items-center justify-between bg-white border-b border-slate-200">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block">
              Pregunta
            </span>
            <span className="text-xl font-bold text-slate-900 block">
              {pregunta.numero}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPreguntaEditando(
                  preguntaEditando === index ? null : index
                )
              }
            >
              {preguntaEditando === index
                ? "Cerrar"
                : puedeEditarPregunta
                ? "Editar"
                : "Ver"}
            </Button>

            {puedeEditarPregunta && preguntasDetalle.length > 1 && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => eliminarPregunta(index)}
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>

        {/* CONTENIDO/FORMULARIO DE EDICIÓN */}
        {preguntaEditando === index && (
          <div className="p-5 space-y-6 bg-white">
            {/* NUMERO Y TEXTO */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Número
                </label>
                <input
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                    !puedeEditarPregunta
                      ? "bg-slate-100 text-slate-600 cursor-not-allowed"
                      : ""
                  }`}
                  value={pregunta.numero}
                  readOnly={!puedeEditarPregunta}
                  onChange={(e) =>
                    actualizarPreguntaDetalle(index, "numero", e.target.value)
                  }
                />
              </div>

              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Texto
                </label>
                <textarea
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                    !puedeEditarPregunta
                      ? "bg-slate-100 text-slate-600 cursor-not-allowed"
                      : ""
                  }`}
                  rows={2}
                  value={pregunta.texto}
                  readOnly={!puedeEditarPregunta}
                  onChange={(e) =>
                    actualizarPreguntaDetalle(index, "texto", e.target.value)
                  }
                />
              </div>
            </div>

            {/* CARGO RESPONSABLE */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Cargo Responsable
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={pregunta.cargo || ""}
                onChange={(e) =>
                  actualizarPreguntaDetalle(index, "cargo", e.target.value)
                }
              >
                <option value="">Seleccione un cargo</option>
                {cargos.map((cargo) => (
                  <option key={cargo.Id} value={cargo.NombreCargo}>
                    {cargo.NombreCargo}
                  </option>
                ))}
              </select>
            </div>

            {/* GRILLA DE EVALUACIÓN BINARIA */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              <CampoBinario
                label="Existe"
                value={pregunta.existe}
                onChange={(v) => actualizarPreguntaDetalle(index, "existe", v)}
              />

              <CampoBinario
                label="Aprobado"
                value={pregunta.aprobado}
                onChange={(v) => actualizarPreguntaDetalle(index, "aprobado", v)}
              />

              <CampoBinario
                label="Difundido"
                value={pregunta.difundido}
                onChange={(v) => {
                  if (v === 1) {
                    actualizarPreguntaDetalle(index, "difundido", 1);
                    setPreguntaDifusion(index);
                    setDifusionInterna(false);
                    setDifusionExterna(false);
                    setModalDifusion(true);
                  } else {
                    setPreguntasDetalle((prev) =>
                      prev.map((p, i) => {
                        if (i !== index) return p;
                        return {
                          ...p,
                          difundido: 0,
                          interna: "",
                          externa: "",
                          habilitarInterna: false,
                          habilitarExterna: false,
                        };
                      })
                    );
                  }
                }}
              />

              <CampoLectura
                label="Está presente"
                value={pregunta.estaPresente}
                tipo={pregunta.estaPresente === "SI" ? "success" : "danger"}
              />

              <CampoBinario
                label="Implementado"
                value={pregunta.implementado}
                onChange={(v) =>
                  actualizarPreguntaDetalle(index, "implementado", v)
                }
              />

              <CampoBinario
                label="Actualizado"
                value={pregunta.actualizado}
                onChange={(v) =>
                  actualizarPreguntaDetalle(index, "actualizado", v)
                }
              />
            </div>

            {/* GRILLA DE RESULTADOS */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <CampoLectura
                label="Está funcionando"
                value={pregunta.estaFuncionando}
                tipo={pregunta.estaFuncionando === "SI" ? "success" : "danger"}
              />

              <CampoLectura
                label="Calificación"
                value={String(pregunta.calificacion)}
              />

              <CampoLectura
                label="Nivel"
                value={pregunta.nivel}
                tipo={
                  pregunta.nivel === "Bajo"
                    ? "danger"
                    : pregunta.nivel === "Medio"
                    ? "warning"
                    : "success"
                }
              />
            </div>

          {/* SECCIÓN DOCUMENTACIÓN Y DIVULGACIÓN (2 FILAS x 2 COLUMNAS) */}
<div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-start">
  
  {/* FILA 1 - IZQUIERDA: Tipo de documento */}
  <div className="md:col-span-4">
    <TipoDocumento
      label="Tipo de documento"
      value={pregunta.tipoDocumento}
      onChange={(v) =>
        actualizarPreguntaDetalle(index, "tipoDocumento", v)
      }
    />
  </div>

  {/* FILA 1 - DERECHA: Descripción */}
  <div className="md:col-span-8">
    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700">
      Descripción
    </label>
    <input
      type="text"
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      value={pregunta.descripcion}
      onChange={(e) =>
        actualizarPreguntaDetalle(index, "descripcion", e.target.value)
      }
    />
  </div>

  {/* FILA 2 - IZQUIERDA: Fecha de emisión / aprobación */}
  <div className="md:col-span-4">
    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700">
      Fecha de emisión / aprobación
    </label>
    <input
      type="date"
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-slate-700"
      value={pregunta.fechaEmision}
      onChange={(e) =>
        actualizarPreguntaDetalle(index, "fechaEmision", e.target.value)
      }
    />
  </div>

  {/* FILA 2 - DERECHA: Divulgación (Interna / Externa) */}
  <div className="md:col-span-8">
    <label className="mb-1 block text-xs font-bold tracking-wide text-slate-800">
      Divulgación
    </label>
    
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs text-slate-600">Interna</label>
        <CampoDifusion
          label=""
          value={pregunta.interna}
          disabled={!pregunta.habilitarInterna}
          onChange={(v) =>
            actualizarPreguntaDetalle(index, "interna", v)
          }
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-600">Externa</label>
        <CampoDifusion
          label=""
          value={pregunta.externa}
          disabled={!pregunta.habilitarExterna}
          onChange={(v) =>
            actualizarPreguntaDetalle(index, "externa", v)
          }
        />
      </div>
    </div>
  </div>
  </div>
</div>
        )}
      </div>
    ))}
  </div>
</div>
            
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={guardarPrincipio}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

<Dialog
  open={modalDifusion}
  onOpenChange={setModalDifusion}
>
  <DialogContent className="max-w-md">

    <DialogHeader>
      <DialogTitle>
        Medio de divulgación
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">

      <label className="flex items-center gap-2">

        <input
          type="checkbox"
          checked={difusionInterna}
          onChange={(e) =>
            setDifusionInterna(e.target.checked)
          }
        />

        Difusión interna

      </label>

      <label className="flex items-center gap-2">

        <input
          type="checkbox"
          checked={difusionExterna}
          onChange={(e) =>
            setDifusionExterna(e.target.checked)
          }
        />

        Difusión externa

      </label>

    </div>

    <DialogFooter>

      <Button
        type="button"
        variant="outline"
        onClick={() => setModalDifusion(false)}
      >
        Cancelar
      </Button>

     <Button
  type="button"
  onClick={() => {

    if (preguntaDifusion !== null) {

      setPreguntasDetalle(prev =>
        prev.map((p, i) => {

          if (i !== preguntaDifusion) return p;

          return {
            ...p,

            habilitarInterna: difusionInterna,
            habilitarExterna: difusionExterna,

            interna: difusionInterna ? p.interna : "",
            externa: difusionExterna ? p.externa : "",
          };

        })
      );

    }

    setModalDifusion(false);

  }}
>
        Aceptar
      </Button>

    </DialogFooter>

  </DialogContent>
</Dialog>

    </div>
  );
}

function CampoBinario({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <select
        className="w-full rounded-md border px-3 py-2"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value={0}>0</option>
        <option value={1}>1</option>
      </select>
    </div>
  );
}

function TipoDocumento({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <select
        className="w-full rounded-md border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seleccione</option>
        <option value="Acta">Acta</option>
        <option value="Acuerdo">Acuerdo</option>
        <option value="Análisis">Análisis</option>
        <option value="Autoevaluación">Autoevaluación</option>
        <option value="Autorizaciones de baja">Autorizaciones de baja</option>
        <option value="Calendario de vacaciones">Calendario de vacaciones</option>
        <option value="Informativo">Informativo</option>
        <option value="Catálogo de cuentas">Catálogo de cuentas</option>
        <option value="Certificación">Certificación</option>
        <option value="Clasificador">Clasificador</option>
        <option value="Código">Código</option>
        <option value="Comprobantes">Comprobantes</option>
        <option value="Comunicación">Comunicación</option>
        <option value="Conciliaciones">Conciliaciones</option>
        <option value="Confirmación">Confirmación</option>
        <option value="Constataciones">Constataciones</option>
        <option value="Contrato">Contrato</option>
        <option value="Control">Control</option>
        <option value="Convenio">Convenio</option>
        <option value="Cuestionario">Cuestionario</option>
        <option value="Decreto">Decreto</option>
        <option value="Disposición">Disposición</option>
        <option value="Documento (s)">Documento (s)</option>
        <option value="Estados">Estados</option>
        <option value="Estatuto">Estatuto</option>
        <option value="Estudio">Estudio</option>
        <option value="Evaluación">Evaluación</option>
        <option value="Flujo">Flujo</option>
        <option value="Formato">Formato</option>
        <option value="Formulario">Formulario</option>
        <option value="Guía">Guía</option>
         <option value="Hoja de Ruta">Hoja de Ruta</option>
          <option value="Informe">Informe</option>
           <option value="Instructivo">Instructivo</option>
            <option value="Inventario">Inventario</option>
             <option value="Ley">Ley</option>
        <option value="Lineamiento">Lineamiento</option>
        <option value="Lista">Lista</option>
        <option value="Lista de verificación">Lista de verificación</option>
        <option value="Manual">Manual</option>
        <option value="Metodología">Metodología</option>
        <option value="Modificaciones">Modificaciones</option>
        <option value="Norma">Norma</option>
        <option value="Ordenanza">Ordenanza</option>
        <option value="Organigrama">Organigrama</option>
        <option value="Pistas de Auditoría">Pistas de Auditoría</option>
        <option value="Plan">Plan</option>
        <option value="Política">Política</option>
        <option value="Pólizas">Pólizas</option>
        <option value="Presupuesto">Presupuesto</option>
        <option value="Procedimiento">Procedimiento</option>
        <option value="Programas">Programas</option>
        <option value="Protocolo">Protocolo</option>
        <option value="Proyecto">Proyecto</option>
        <option value="Registro">Registro</option>
        <option value="Reglamento">Reglamento</option>
        <option value="Reporte">Reporte</option>
        <option value="Resolución">Resolución</option>
        <option value="Resumen ejecutivo">Resumen ejecutivo</option>
        <option value="Tabla">Tabla</option>
      </select>
    </div>
  );
}

function CampoDifusion({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <select
       disabled={disabled}
        className="w-full rounded-md border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seleccione</option>
        <option value="Boletines">Boletines</option>
        <option value="Carteles">Carteles</option>
        <option value="Comunicaciones">Comunicaciones</option>
        <option value="Correo electrónico">Correo electrónico</option>
        <option value="Dípticos">Dípticos</option>
        <option value="Folletos">Folletos</option>
        <option value="Informativo">Informativo</option>
        <option value="Intranet">Intranet</option>
        <option value="Lonas Impresas">Lonas Impresas</option>
        <option value="Otros medios de difusión ">Otros medios de difusión </option>
        <option value="Páginas de transparencia">Páginas de transparencia</option>
        <option value="Pantallas">Pantallas</option>
        <option value="Periódicos murales">Periódicos murales</option>
        <option value="Prensa escrita">Prensa escrita</option>
        <option value="Prospectos">Prospectos</option>
        <option value="Radio">Radio</option>
        <option value="Redes sociales">Redes sociales</option>
        <option value="Revista institucional">Revista institucional</option>
        <option value="Sistemas de información">Sistemas de información</option>
        <option value="Sitio web institucional">Sitio web institucional</option>
        <option value="Televisión">Televisión</option>
        <option value="Trípticos">Trípticos</option>
      </select>
    </div>
  );
}

function CampoLectura({
  label,
  value,
  tipo,
}: {
  label: string;
  value: string;
  tipo?: "success" | "danger" | "warning";
}) {
  const clases =
    tipo === "success"
      ? "bg-green-100 text-green-700 border-green-200"
      : tipo === "danger"
      ? "bg-red-100 text-red-700 border-red-200"
      : tipo === "warning"
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div className={`w-full rounded-md border px-3 py-2 font-medium ${clases}`}>
        {value || "-"}
      </div>
    </div>
  );
}