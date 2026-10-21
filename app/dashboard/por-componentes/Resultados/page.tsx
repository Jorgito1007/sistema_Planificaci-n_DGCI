"use client";

import { useRef } from "react";
import { jsPDF } from "jspdf";
import React from "react";

import { useEffect, useState } from "react";
import { HoloPulse } from "@/components/ui/holo-pulse-loader";
import Swal from "sweetalert2";
import {
  FileDown,
  Loader2,
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
  CheckCircle2,
  CalendarDays,
  Building2,
  Layers3,
  ListChecks,
  MessageSquareText,
  PenLine,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function ResultadosComponentesPage() {
const componentes = [
  "Entorno de Control",
  "Evaluación de Riesgos",
  "Actividades de Control",
  "Información y comunicación",
  "Supervisión - Monitoreo",
];

 const reportRef = useRef<HTMLDivElement>(null);

const [componentesData, setComponentesData] = useState<any[]>([]);
const [principiosData, setPrincipiosData] = useState<any[]>([]);
const [afirmativasPrincipios, setAfirmativasPrincipios] = useState<any[]>([]);

const componentesVisibles = componentesData
  .map((item: any) => {
    const componenteId = Number(item.ComponenteId);

    return {
      componenteId,
      nombre:
        item.Componente ||
        componentes[componenteId - 1] ||
        `Componente ${componenteId}`,
      totalPreguntas: Number(item.TotalPreguntas || 0),
      sumaCalificacion: Number(item.SumaCalificacion || 0),
      promedio: Number(item.Promedio || 0),
      responsables: String(item.Responsables || "").trim(),
    };
  })
  .sort(
    (a, b) =>
      a.componenteId - b.componenteId
  );


const [conclusiones, setConclusiones] = useState("");
const [recomendaciones, setRecomendaciones] = useState("");

const [resultadosAprobados, setResultadosAprobados] =
  useState(false);

  const [cargandoResultadoGuardado, setCargandoResultadoGuardado] =
  useState(true);

const [aprobandoResultados, setAprobandoResultados] =
  useState(false);

  useEffect(() => {
  const cargarResultadoGuardado = async () => {
    try {
      setCargandoResultadoGuardado(true);

      const respuesta = await fetch(
        "/api/resultados/resultado-componente",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos?.ok) {
        console.error(
          "No se pudo cargar el resultado guardado:",
          datos
        );
        return;
      }

      // ========================================================
      // NO EXISTE RESULTADO GUARDADO
      // ========================================================

      if (!datos.existe || !datos.resultado) {
        setResultadosAprobados(false);
        return;
      }

      const resultado = datos.resultado;

      console.log(
        "Resultado consolidado guardado:",
        resultado
      );

      // ========================================================
      // CARGAR PERÍODO
      // ========================================================

      if (resultado.Periodo_Inicio) {
        setPeriodoInicio(
          String(resultado.Periodo_Inicio).substring(0, 10)
        );
      }

      if (resultado.Periodo_Fin) {
        setPeriodoFin(
          String(resultado.Periodo_Fin).substring(0, 10)
        );
      }

      // ========================================================
      // CARGAR CONCLUSIONES
      // ========================================================

      setConclusiones(
        resultado.Conclusiones ?? ""
      );

      // ========================================================
      // CARGAR RECOMENDACIONES
      // ========================================================

      setRecomendaciones(
        resultado.Recomendaciones ?? ""
      );

      // ========================================================
      // VERIFICAR APROBACIÓN
      // ========================================================

      const aprobado =
        Number(resultado.Aprobado_General ?? 0) === 1 ||
        resultado.Aprobado_General === true;

      setResultadosAprobados(aprobado);

    } catch (error) {
      console.error(
        "Error cargando Resultado_Componente:",
        error
      );
    } finally {
      setCargandoResultadoGuardado(false);
    }
  };

  cargarResultadoGuardado();
}, []);

useEffect(() => {
 fetch("/api/resultados/componente")
    .then((res) => res.json())
    .then((res) => {
      console.log("COMPONENTES API:", res);
      setComponentesData(res);
    });

    fetch("/api/resultados/componente-cumplimiento")
    .then((res) => res.json())
    .then(setPrincipiosData);

  fetch("/api/resultados/componente-respuestas")
    .then((res) => res.json())
    .then((res) => {
      console.log("COMPONENTE RESPUESTAS:", res);
      setAfirmativasPrincipios(res);
    });
}, []);

useEffect(() => {
  async function cargarPermisoAprobacion() {
    try {
      setCargandoPermisos(true);

      const res = await fetch(
        "/api/matriz-sistema-administrativo/permisos",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const texto = await res.text();

      const respuesta = texto
        ? JSON.parse(texto)
        : null;

      if (!res.ok || !respuesta?.ok) {
        throw new Error(
          respuesta?.message ||
            "No se pudo consultar el permiso de aprobación."
        );
      }

      setPuedeAprobarResultados(
        Boolean(
          respuesta.permisos?.puedeAprobarResultados
        )
      );
    } catch (error) {
      console.error(
        "Error cargando permiso de aprobación:",
        error
      );

      setPuedeAprobarResultados(false);
    } finally {
      setCargandoPermisos(false);
    }
  }

  cargarPermisoAprobacion();
}, []);

const getComponenteData = (componenteId: number) => {
  return componentesData.find(
    (c: any) =>
      Number(c.ComponenteId) ===
      Number(componenteId)
  );
};

const getPrincipioData = (numero: number) => {
  return principiosData.find(
    (p: any) =>
      Number(String(p.PreguntaGeneralNumero).replace(".", "")) === numero
  );
};


const colores = [
  "#3b82f6", // azul
  "#22c55e", // verde
  "#f59e0b", // naranja
  "#ef4444", // rojo
  "#8b5cf6", // morado
  "#06b6d4", // celeste
  "#84cc16", // lima
  "#f97316", // anaranjado
];


const chartData =
  componentesVisibles.map(
    (item, index) => ({
      componenteId:
        item.componenteId,

      sistemaCorto:
        item.nombre.length > 22
          ? item.nombre.substring(0, 22) + "..."
          : item.nombre,

      sistema:
        item.nombre,

      valor:
        Number(item.promedio || 0),

      color:
        colores[index % colores.length],
    })
  );

// CONTROL INTERNO GLOBAL DE LOS SISTEMAS DE INFORMACIÓN

const calificacionesGlobales =
  componentesVisibles.map(
    (item) => Number(item.promedio || 0)
  );

const cantidadComponentes =
  calificacionesGlobales.length;

const sumaCalificaciones =
  calificacionesGlobales.reduce(
    (acc, val) => acc + val,
    0
  );

const calificacionGlobal =
  cantidadComponentes > 0
    ? (
        sumaCalificaciones /
        cantidadComponentes
      ).toFixed(2)
    : "0.00";

const nivelGlobal =
  Number(calificacionGlobal) === 5
    ? "Alto"
    : Number(calificacionGlobal) >= 3
    ? "Medio"
    : "Bajo";

const porcentajeGlobal =
  `${(
    (Number(calificacionGlobal) / 5) *
    100
  ).toFixed(2)}%`;




//Nivel de Cumplimiento de Puntos de Enfoque Evaluados//
const resumenNivelesComponentes = {
  Alto: componentesVisibles.map(() => 0),
  Medio: componentesVisibles.map(() => 0),
  Bajo: componentesVisibles.map(() => 0),
};

principiosData.forEach((item: any) => {
  const principio = Number(
    String(
      item.PreguntaGeneralNumero
    ).replace(".", "")
  );

  const valor =
    Number(item.Promedio || 0);

  let componenteId = 0;

  if (principio >= 1 && principio <= 5) {
    componenteId = 1;
  } else if (
    principio >= 6 &&
    principio <= 9
  ) {
    componenteId = 2;
  } else if (
    principio >= 10 &&
    principio <= 12
  ) {
    componenteId = 3;
  } else if (
    principio >= 13 &&
    principio <= 15
  ) {
    componenteId = 4;
  } else if (
    principio >= 16 &&
    principio <= 17
  ) {
    componenteId = 5;
  }

  const componenteIndex =
    componentesVisibles.findIndex(
      (c) =>
        c.componenteId ===
        componenteId
    );

  if (componenteIndex === -1) {
    return;
  }

  if (valor === 5) {
    resumenNivelesComponentes
      .Alto[componenteIndex]++;
  } else if (valor >= 3) {
    resumenNivelesComponentes
      .Medio[componenteIndex]++;
  } else {
    resumenNivelesComponentes
      .Bajo[componenteIndex]++;
  }
});

const totalFilaComponentes = (
  fila: number[]
) =>
  fila.reduce(
    (acc, val) => acc + val,
    0
  );

const totalColumnaComponentes = (
  index: number
) =>
  Number(
    resumenNivelesComponentes.Alto[
      index
    ] ?? 0
  ) +
  Number(
    resumenNivelesComponentes.Medio[
      index
    ] ?? 0
  ) +
  Number(
    resumenNivelesComponentes.Bajo[
      index
    ] ?? 0
  );

const totalGeneralComponentes =
  totalFilaComponentes(
    resumenNivelesComponentes.Alto
  ) +
  totalFilaComponentes(
    resumenNivelesComponentes.Medio
  ) +
  totalFilaComponentes(
    resumenNivelesComponentes.Bajo
  );


//Nivel de Cumplimiento por principios//

// Respuestas Afirmativas de los Puntos de Enfoque Evaluados
const getAfirmativaPrincipio = (
  componenteId: number
) => {
  return afirmativasPrincipios.find(
    (a: any) =>
      Number(a.ComponenteId) ===
      Number(componenteId)
  );
};

const totalPresentePrincipios = afirmativasPrincipios.reduce(
  (acc, cur) => acc + Number(cur.TotalPresente || 0),
  0
);

const totalFuncionandoPrincipios = afirmativasPrincipios.reduce(
  (acc, cur) => acc + Number(cur.TotalFuncionando || 0),
  0
);

const totalPreguntasPrincipios = afirmativasPrincipios.reduce(
  (acc, cur) => acc + Number(cur.TotalPreguntas || 0),
  0
);

const porcentajeTotalPresentePrincipios =
  totalPreguntasPrincipios > 0
    ? ((totalPresentePrincipios / totalPreguntasPrincipios) * 100).toFixed(0)
    : "0";

const porcentajeTotalFuncionandoPrincipios =
  totalPreguntasPrincipios > 0
    ? ((totalFuncionandoPrincipios / totalPreguntasPrincipios) * 100).toFixed(0)
    : "0";


const obtenerComponentePrincipio = (
  numeroPrincipio: number
) => {
  if (
    numeroPrincipio >= 1 &&
    numeroPrincipio <= 5
  ) {
    return {
      componenteId: 1,
      nombre: "Entorno de Control",
    };
  }

  if (
    numeroPrincipio >= 6 &&
    numeroPrincipio <= 9
  ) {
    return {
      componenteId: 2,
      nombre: "Evaluación de Riesgos",
    };
  }

  if (
    numeroPrincipio >= 10 &&
    numeroPrincipio <= 12
  ) {
    return {
      componenteId: 3,
      nombre: "Actividades de Control",
    };
  }

  if (
    numeroPrincipio >= 13 &&
    numeroPrincipio <= 15
  ) {
    return {
      componenteId: 4,
      nombre: "Información y Comunicación",
    };
  }

  if (
    numeroPrincipio >= 16 &&
    numeroPrincipio <= 17
  ) {
    return {
      componenteId: 5,
      nombre: "Supervisión - Monitoreo",
    };
  }

  return {
    componenteId: 0,
    nombre: "Sin componente",
  };
};

const principiosVisibles =
  principiosData
    .map((item: any) => {

      const numero = Number(
        String(
          item.PreguntaGeneralNumero ?? ""
        ).replace(".", "")
      );

      const componente =
        obtenerComponentePrincipio(
          numero
        );

      return {
        principioId:
          Number(item.PrincipioId),

        numero,

        titulo:
          String(
            item.PrincipioTitulo || ""
          ),

        texto:
          String(
            item.PreguntaGeneralTexto || ""
          ),

        promedio:
          Number(
            item.Promedio || 0
          ),

        componenteId:
          componente.componenteId,

        componenteNombre:
          componente.nombre,
      };
    })
    .filter(
      (item) =>
        item.numero >= 1 &&
        item.numero <= 17
    )
    .sort(
      (a, b) =>
        a.numero - b.numero
    );

    const gruposPrincipiosVisibles =
  componentesVisibles
    .map((componente) => ({
      componenteId:
        componente.componenteId,

      titulo:
        componente.nombre,

      principios:
        principiosVisibles.filter(
          (principio) =>
            principio.componenteId ===
            componente.componenteId
        ),
    }))
    .filter(
      (grupo) =>
        grupo.principios.length > 0
    );


    // totltip
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const dato = payload[0]?.payload;



  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-gray-800">
        {dato?.sistema}
      </p>
      <p className="text-sm text-gray-600">
        Calificación obtenida:{" "}
        <span className="font-bold">
          {Number(dato?.valor || 0).toFixed(2)}
        </span>
      </p>
    </div>
  );
};



const [exportandoPDF, setExportandoPDF] = useState(false);

const [puedeAprobarResultados, setPuedeAprobarResultados] =
  useState(false);

const [cargandoPermisos, setCargandoPermisos] =
  useState(true);



const [periodoInicio, setPeriodoInicio] = useState("");
const [periodoFin, setPeriodoFin] = useState("");


const responsablesInforme =
  Array.from(
    new Set(
      componentesVisibles
        .flatMap((componente) =>
          String(
            componente.responsables || ""
          )
            .split(",")
            .map((nombre) =>
              nombre.trim()
            )
        )
        .filter(Boolean)
    )
  );

const elaboradoPor =
  responsablesInforme.length > 0
    ? responsablesInforme.join(", ")
    : "";

//Exportar a PDF
const exportarPDF = async () => {

// ==========================================================
  // VALIDAR PERÍODO
  // ==========================================================
  if (!periodoInicio || !periodoFin) {
    await Swal.fire({
      icon: "warning",
      title: "Período requerido",
      text: "Debe seleccionar la fecha de inicio y la fecha de fin antes de exportar el informe.",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#0B4DA2",
    });

    return;
  }

  // ==========================================================
  // VALIDAR RANGO DE FECHAS
  // ==========================================================
  if (
    new Date(periodoInicio) >
    new Date(periodoFin)
  ) {
    await Swal.fire({
      icon: "warning",
      title: "Período no válido",
      text: "La fecha de inicio no puede ser posterior a la fecha de fin.",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#0B4DA2",
    });

    return;
  }


  try {
    setExportandoPDF(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    // ==========================================================
    // CREAR PDF
    // ==========================================================
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "legal",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const marginX = 14;
    const marginTop = 14;
    const marginBottom = 14;

    const contentWidth = pageWidth - marginX * 2;

    // ==========================================================
    // COLORES
    // ==========================================================
    const azul: [number, number, number] = [18, 63, 93];
    const azulFuerte: [number, number, number] = [11, 77, 162];
    const azulClaro: [number, number, number] = [239, 246, 255];

    const gris: [number, number, number] = [71, 85, 105];
    const grisClaro: [number, number, number] = [248, 250, 252];
    const borde: [number, number, number] = [203, 213, 225];

    const verde: [number, number, number] = [22, 163, 74];
    const amarillo: [number, number, number] = [217, 119, 6];
    const rojo: [number, number, number] = [220, 38, 38];

    // ==========================================================
    // FUNCIONES AUXILIARES
    // ==========================================================
    const texto = (
      value: unknown,
      x: number,
      y: number,
      options?: {
        size?: number;
        bold?: boolean;
        color?: [number, number, number];
        align?: "left" | "center" | "right";
      }
    ) => {
      const {
        size = 8,
        bold = false,
        color = gris,
        align = "left",
      } = options || {};

      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(size);
      pdf.setTextColor(...color);

      pdf.text(String(value ?? ""), x, y, {
        align,
      });
    };

    const linea = (
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ) => {
      pdf.setDrawColor(...borde);
      pdf.setLineWidth(0.25);
      pdf.line(x1, y1, x2, y2);
    };

    const nuevaPagina = () => {
      pdf.addPage();
    };

    const tituloSeccion = (
      titulo: string,
      subtitulo?: string,
      y = marginTop
    ) => {
      const alto = subtitulo ? 21 : 16;

      pdf.setFillColor(...azul);
      pdf.roundedRect(
        marginX,
        y,
        contentWidth,
        alto,
        2,
        2,
        "F"
      );

      texto(titulo, marginX + 5, y + 7, {
        size: 11,
        bold: true,
        color: [255, 255, 255],
      });

      if (subtitulo) {
        texto(subtitulo, marginX + 5, y + 14, {
          size: 7,
          color: [226, 232, 240],
        });
      }

      return y + alto + 5;
    };

    const formatoFecha = (fecha: string) => {
      if (!fecha) return "No definido";

      const partes = fecha.split("-");

      if (partes.length !== 3) return fecha;

      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    };

    const obtenerNivel = (valor: number) => {
      if (valor === 5) return "Alto";
      if (valor >= 3) return "Medio";
      return "Bajo";
    };

    const colorNivel = (
      nivel: string
    ): [number, number, number] => {
      if (nivel === "Alto") return verde;
      if (nivel === "Medio") return amarillo;
      return rojo;
    };

    // ==========================================================
    // TABLA GENÉRICA
    // ==========================================================
    const dibujarTabla = ({
      headers,
      rows,
      widths,
      startY,
      rowHeight = 8,
      fontSize = 7,
      repeatHeader = true,
    }: {
      headers: string[];
      rows: (string | number)[][];
      widths: number[];
      startY: number;
      rowHeight?: number;
      fontSize?: number;
      repeatHeader?: boolean;
    }) => {
      let y = startY;

      const tableWidth = widths.reduce(
        (acc, width) => acc + width,
        0
      );

      // CENTRAR TABLA
      const startX = (pageWidth - tableWidth) / 2;

      const headerHeight = 10;

     const drawHeader = () => {
  let x = startX;

  headers.forEach((header, index) => {

    // IMPORTANTE:
    // volver a establecer el color en CADA celda
    pdf.setFillColor(...azul);
    pdf.setDrawColor(...borde);
    pdf.setLineWidth(0.25);

    pdf.rect(
      x,
      y,
      widths[index],
      headerHeight,
      "FD"
    );

    const lines = pdf.splitTextToSize(
      header,
      widths[index] - 4
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(fontSize);
    pdf.setTextColor(255, 255, 255);

    const lineHeight = 3.2;

    const totalTextHeight =
      lines.length * lineHeight;

    const textStartY =
      y +
      (headerHeight - totalTextHeight) / 2 +
      2.5;

    lines.forEach(
      (line: string, lineIndex: number) => {

        pdf.text(
          line,
          x + widths[index] / 2,
          textStartY +
            lineIndex * lineHeight,
          {
            align: "center",
          }
        );

      }
    );

    x += widths[index];
  });

  y += headerHeight;
};
      drawHeader();

      rows.forEach((row, rowIndex) => {
        const wrappedCells = row.map((cell, index) =>
          pdf.splitTextToSize(
            String(cell ?? ""),
            widths[index] - 4
          )
        );

        const maxLines = Math.max(
          ...wrappedCells.map((cell) => cell.length)
        );

        const actualHeight = Math.max(
          rowHeight,
          maxLines * 3.6 + 3
        );

        // SALTO DE PÁGINA
        if (
          y + actualHeight >
          pageHeight - marginBottom - 6
        ) {
          nuevaPagina();

          y = marginTop;

          if (repeatHeader) {
            drawHeader();
          }
        }

        let x = startX;

        row.forEach((cell, index) => {
          if (rowIndex % 2 === 1) {
            pdf.setFillColor(...grisClaro);
          } else {
            pdf.setFillColor(255, 255, 255);
          }

          pdf.setDrawColor(...borde);

          pdf.rect(
            x,
            y,
            widths[index],
            actualHeight,
            "FD"
          );

          const align =
            index === 1
              ? "left"
              : "center";

          const textX =
            align === "center"
              ? x + widths[index] / 2
              : x + 2;

        
              pdf.setFont(
  "helvetica",
  "normal"
);

pdf.setFontSize(fontSize);

pdf.setTextColor(
  ...gris
);

pdf.text(
  wrappedCells[index],
  textX,
  y + 4.5,
  {
    align,
  }
);

          x += widths[index];
        });

        y += actualHeight;
      });

      return {
        y,
        startX,
        tableWidth,
      };
    };

    // ==========================================================
    // PÁGINA 1
    // INFORMACIÓN GENERAL
    // ==========================================================
    let y = marginTop;

    y = tituloSeccion(
      "INFORME DE EVALUACIÓN DE CONTROL INTERNO A NIVEL DE ENTIDAD",
      "Resultados consolidados de la evaluación por componentes",
      y
    );

    // ----------------------------------------------------------
    // INSTITUCIÓN
    // ----------------------------------------------------------
    pdf.setFillColor(...grisClaro);
    pdf.setDrawColor(...borde);

    pdf.roundedRect(
      marginX,
      y,
      contentWidth,
      18,
      2,
      2,
      "FD"
    );

    texto(
      "INSTITUCIÓN",
      marginX + 5,
      y + 6,
      {
        size: 7,
        bold: true,
        color: gris,
      }
    );

    texto(
      "UNIVERSIDAD NACIONAL CASIMIRO SOTELO MONTENEGRO",
      marginX + 38,
      y + 6,
      {
        size: 9,
        bold: true,
        color: azul,
      }
    );

    y += 23;

    // ----------------------------------------------------------
    // PERÍODO
    // ----------------------------------------------------------
    pdf.setFillColor(...grisClaro);

    pdf.roundedRect(
      marginX,
      y,
      contentWidth,
      18,
      2,
      2,
      "FD"
    );

    texto(
      "PERÍODO",
      marginX + 5,
      y + 6,
      {
        size: 7,
        bold: true,
      }
    );

    texto(
      `${formatoFecha(periodoInicio)} al ${formatoFecha(
        periodoFin
      )}`,
      marginX + 38,
      y + 6,
      {
        size: 9,
        bold: true,
        color: azulFuerte,
      }
    );

    y += 27;

    // ==========================================================
    // RESULTADO GLOBAL
    // ==========================================================
    texto(
      "NIVEL DE CUMPLIMIENTO DEL SISTEMA DE CONTROL INTERNO",
      marginX,
      y,
      {
        size: 11,
        bold: true,
        color: azul,
      }
    );

    y += 7;

    const cardGap = 5;
    const cardWidth =
      (contentWidth - cardGap * 2) / 3;

    const cardHeight = 34;

    // CALIFICACIÓN
    pdf.setFillColor(239, 246, 255);
    pdf.roundedRect(
      marginX,
      y,
      cardWidth,
      cardHeight,
      2,
      2,
      "F"
    );

    texto(
      "CALIFICACIÓN OBTENIDA",
      marginX + cardWidth / 2,
      y + 8,
      {
        size: 7,
        bold: true,
        color: gris,
        align: "center",
      }
    );

    texto(
      calificacionGlobal,
      marginX + cardWidth / 2,
      y + 20,
      {
        size: 19,
        bold: true,
        color: azulFuerte,
        align: "center",
      }
    );

    texto(
      "Puntaje máximo: 5",
      marginX + cardWidth / 2,
      y + 27,
      {
        size: 7,
        color: gris,
        align: "center",
      }
    );

    // NIVEL
    const xNivel =
      marginX + cardWidth + cardGap;

    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(
      xNivel,
      y,
      cardWidth,
      cardHeight,
      2,
      2,
      "F"
    );

    texto(
      "NIVEL",
      xNivel + cardWidth / 2,
      y + 8,
      {
        size: 7,
        bold: true,
        color: gris,
        align: "center",
      }
    );

    texto(
      nivelGlobal,
      xNivel + cardWidth / 2,
      y + 20,
      {
        size: 16,
        bold: true,
        color: colorNivel(nivelGlobal),
        align: "center",
      }
    );

    // PORCENTAJE
    const xPorcentaje =
      xNivel + cardWidth + cardGap;

    pdf.setFillColor(236, 254, 255);
    pdf.roundedRect(
      xPorcentaje,
      y,
      cardWidth,
      cardHeight,
      2,
      2,
      "F"
    );

    texto(
      "% CUMPLIMIENTO",
      xPorcentaje + cardWidth / 2,
      y + 8,
      {
        size: 7,
        bold: true,
        color: gris,
        align: "center",
      }
    );

    texto(
      porcentajeGlobal,
      xPorcentaje + cardWidth / 2,
      y + 20,
      {
        size: 19,
        bold: true,
        color: [8, 145, 178],
        align: "center",
      }
    );

    y += cardHeight + 10;

    // ==========================================================
// PÁGINA DE ANÁLISIS
// CUMPLIMIENTO POR COMPONENTE
// ==========================================================

nuevaPagina();

y = tituloSeccion(
  "NIVEL DE CUMPLIMIENTO DEL CONTROL INTERNO",
  "Detalle de la calificación obtenida por cada componente",
  marginTop
);

  const filasComponentes =
  componentesVisibles.map(
    (componente, index) => {

      const val =
        Number(
          componente.promedio || 0
        );

      const porcentaje =
        (val / 5) * 100;

      return [
        index + 1,
        componente.nombre,
        5,
        val.toFixed(2),
        obtenerNivel(val),
        `${porcentaje.toFixed(2)}%`,
      ];
    }
  );

    const totalCumplimientoComponentes =
  componentesVisibles.length > 0
    ? componentesVisibles.reduce(
        (acc, componente) => {

          const valor =
            Number(
              componente.promedio || 0
            );

          return (
            acc +
            (valor / 5) * 100
          );
        },
        0
      ) /
      componentesVisibles.length
    : 0;


    filasComponentes.push([
      "",
      "",
      "",
      "",
      "TOTAL",
      `${totalCumplimientoComponentes.toFixed(
        2
      )}%`,
    ]);

    const resultadoTablaComponentes =
      dibujarTabla({
        headers: [
          "No.",
          "Componente",
          "Puntaje máximo",
          "Calificación",
          "Nivel",
          "% Cumplimiento",
        ],

        rows: filasComponentes,

        widths: [
          15,
          105,
          30,
          30,
          28,
          35,
        ],

        startY: y,

        rowHeight: 9,
        fontSize: 7,
      });

    y =
      resultadoTablaComponentes.y +
      7;

    texto(
      "Nota 1: El porcentaje de cumplimiento se obtiene de la relación entre la calificación obtenida sobre el puntaje máximo.",
      resultadoTablaComponentes.startX,
      y,
      {
        size: 6.5,
        color: gris,
      }
    );

    // ==========================================================
// PRINCIPIOS
// CONTINUAR EN LA MISMA PÁGINA CUANDO EXISTA ESPACIO
// ==========================================================

y += 10;

const espacioMinimoPrincipios = 50;

if (
  y + espacioMinimoPrincipios >
  pageHeight - marginBottom - 8
) {
  nuevaPagina();
  y = marginTop;
}

y = tituloSeccion(
  "NIVEL DE CUMPLIMIENTO POR PRINCIPIOS",
  "Detalle de los principios evaluados que conforman los componentes del Control Interno",
  y
);
    


    // ==========================================================
// TABLA DE PRINCIPIOS AGRUPADA POR COMPONENTE
// ==========================================================

const headersPrincipios = [
  "No.",
  "Principio",
  "Calificación",
  "Nivel",
  "% Cumplimiento",
];

const widthsPrincipios = [
  15,
  150,
  32,
  30,
  38,
];

const tableWidthPrincipios =
  widthsPrincipios.reduce(
    (acc, width) => acc + width,
    0
  );

const startXPrincipios =
  (pageWidth - tableWidthPrincipios) / 2;

const headerHeightPrincipios = 10;


// ==========================================================
// ENCABEZADO
// ==========================================================

const dibujarHeaderPrincipios = () => {

  let x = startXPrincipios;

  headersPrincipios.forEach(
    (header, index) => {

      pdf.setFillColor(...azul);
      pdf.setDrawColor(...borde);
      pdf.setLineWidth(0.25);

      pdf.rect(
        x,
        y,
        widthsPrincipios[index],
        headerHeightPrincipios,
        "FD"
      );

      const lines =
        pdf.splitTextToSize(
          header,
          widthsPrincipios[index] - 4
        );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(6.5);

      pdf.setTextColor(
        255,
        255,
        255
      );

      const lineHeight = 3;

      const totalHeight =
        lines.length *
        lineHeight;

      const startTextY =
        y +
        (headerHeightPrincipios -
          totalHeight) /
          2 +
        2.4;

      lines.forEach(
        (
          line: string,
          lineIndex: number
        ) => {

          pdf.text(
            line,
            x +
              widthsPrincipios[index] /
                2,
            startTextY +
              lineIndex *
                lineHeight,
            {
              align: "center",
            }
          );

        }
      );

      x +=
        widthsPrincipios[index];
    }
  );

  y +=
    headerHeightPrincipios;
};


// ==========================================================
// ENCABEZADO INICIAL
// ==========================================================

dibujarHeaderPrincipios();


// ==========================================================
// COMPONENTES + PRINCIPIOS
// ==========================================================

gruposPrincipiosVisibles.forEach((grupo) => {

  // ========================================================
  // VERIFICAR ESPACIO PARA COMPONENTE
  // ========================================================
  if (
    y + 15 >
    pageHeight -
      marginBottom -
      8
  ) {
    nuevaPagina();

    y = marginTop;

    dibujarHeaderPrincipios();
  }

  // ========================================================
  // FILA DEL COMPONENTE
  // ========================================================
  pdf.setFillColor(
    239,
    246,
    255
  );

  pdf.setDrawColor(...borde);

  pdf.rect(
    startXPrincipios,
    y,
    tableWidthPrincipios,
    9,
    "FD"
  );

  texto(
    grupo.titulo,
    startXPrincipios + 5,
    y + 6,
    {
      size: 8,
      bold: true,
      color: azulFuerte,
    }
  );

  y += 9;

  // ========================================================
  // PRINCIPIOS
  // ========================================================
  grupo.principios.forEach(
    (principio) => {

      const numero =
        Number(
          principio.numero || 0
        );

      const val =
        Number(
          principio.promedio || 0
        );

      const nivel =
        obtenerNivel(val);

      const porcentaje =
        `${(
          (val / 5) *
          100
        ).toFixed(2)}%`;

      // ====================================================
      // TEXTO DEL PRINCIPIO
      // ====================================================
      const principioLinesRaw =
        pdf.splitTextToSize(
          String(
            principio.texto || ""
          ),
          widthsPrincipios[1] - 5
        );

      const principioLines: string[] =
        Array.isArray(
          principioLinesRaw
        )
          ? principioLinesRaw.map(
              (linea: unknown) =>
                String(linea)
            )
          : [
              String(
                principioLinesRaw
              ),
            ];

      const lineHeight = 3.4;

      const rowHeight =
        Math.max(
          9,
          principioLines.length *
            lineHeight +
            4
        );

      // ====================================================
      // SALTO DE PÁGINA
      // ====================================================
      if (
        y + rowHeight >
        pageHeight -
          marginBottom -
          8
      ) {
        nuevaPagina();

        y = marginTop;

        dibujarHeaderPrincipios();

        // COMPONENTE EN CONTINUACIÓN
        pdf.setFillColor(
          239,
          246,
          255
        );

        pdf.setDrawColor(
          ...borde
        );

        pdf.rect(
          startXPrincipios,
          y,
          tableWidthPrincipios,
          9,
          "FD"
        );

        texto(
          `${grupo.titulo} (continuación)`,
          startXPrincipios + 5,
          y + 6,
          {
            size: 8,
            bold: true,
            color: azulFuerte,
          }
        );

        y += 9;
      }

      // ====================================================
      // COLOR DE FILA
      // ====================================================
      const filaPar =
        numero % 2 === 0;

      const colorFila:
        [number, number, number] =
        filaPar
          ? [248, 250, 252]
          : [255, 255, 255];

      // ====================================================
      // CELDA NO.
      // ====================================================
      let x =
        startXPrincipios;

      pdf.setFillColor(
        ...colorFila
      );

      pdf.setDrawColor(
        ...borde
      );

      pdf.rect(
        x,
        y,
        widthsPrincipios[0],
        rowHeight,
        "FD"
      );

      texto(
        numero,
        x +
          widthsPrincipios[0] /
            2,
        y +
          rowHeight / 2 +
          1,
        {
          size: 6.5,
          color: gris,
          align: "center",
        }
      );

      x +=
        widthsPrincipios[0];

      // ====================================================
      // PRINCIPIO
      // ====================================================
      pdf.setFillColor(
        ...colorFila
      );

      pdf.rect(
        x,
        y,
        widthsPrincipios[1],
        rowHeight,
        "FD"
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(6.2);

      pdf.setTextColor(
        ...gris
      );

      pdf.text(
        principioLines,
        x + 3,
        y + 5
      );

      x +=
        widthsPrincipios[1];

      // ====================================================
      // CALIFICACIÓN
      // ====================================================
      pdf.setFillColor(
        ...colorFila
      );

      pdf.rect(
        x,
        y,
        widthsPrincipios[2],
        rowHeight,
        "FD"
      );

      texto(
        val.toFixed(2),
        x +
          widthsPrincipios[2] /
            2,
        y +
          rowHeight / 2 +
          1,
        {
          size: 7,
          bold: true,
          color: azulFuerte,
          align: "center",
        }
      );

      x +=
        widthsPrincipios[2];

      // ====================================================
      // NIVEL
      // ====================================================
      let fondoNivel:
        [number, number, number];

      let textoNivel:
        [number, number, number];

      if (nivel === "Alto") {
        fondoNivel = [
          220,
          252,
          231,
        ];

        textoNivel = [
          21,
          128,
          61,
        ];
      } else if (
        nivel === "Medio"
      ) {
        fondoNivel = [
          254,
          243,
          199,
        ];

        textoNivel = [
          180,
          83,
          9,
        ];
      } else {
        fondoNivel = [
          254,
          226,
          226,
        ];

        textoNivel = [
          220,
          38,
          38,
        ];
      }

      pdf.setFillColor(
        ...fondoNivel
      );

      pdf.rect(
        x,
        y,
        widthsPrincipios[3],
        rowHeight,
        "FD"
      );

      texto(
        nivel,
        x +
          widthsPrincipios[3] /
            2,
        y +
          rowHeight / 2 +
          1,
        {
          size: 7,
          bold: true,
          color: textoNivel,
          align: "center",
        }
      );

      x +=
        widthsPrincipios[3];

      // ====================================================
      // PORCENTAJE
      // ====================================================
      pdf.setFillColor(
        ...colorFila
      );

      pdf.rect(
        x,
        y,
        widthsPrincipios[4],
        rowHeight,
        "FD"
      );

      texto(
        porcentaje,
        x +
          widthsPrincipios[4] /
            2,
        y +
          rowHeight / 2 +
          1,
        {
          size: 7,
          bold: true,
          color: gris,
          align: "center",
        }
      );

      y += rowHeight;
    }
  );
});


// ==========================================================
// GRÁFICA - VALORACIÓN POR COMPONENTE
// ==========================================================

nuevaPagina();

y = tituloSeccion(
  "VALORACIÓN POR COMPONENTE",
  "Comparación visual de la calificación obtenida por cada componente",
  marginTop
);

const chartX = marginX + 20;
const chartY = y + 8;

const chartWidth =
  contentWidth - 40;

const chartHeight = 105;

const maxValor = 5;

// ==========================================================
// ÁREA DE LA GRÁFICA
// ==========================================================

pdf.setFillColor(
  248,
  250,
  252
);

pdf.setDrawColor(
  ...borde
);

pdf.roundedRect(
  chartX,
  chartY,
  chartWidth,
  chartHeight,
  2,
  2,
  "FD"
);

// ==========================================================
// MÁRGENES INTERNOS
// ==========================================================

const graphLeft =
  chartX + 18;

const graphRight =
  chartX +
  chartWidth -
  10;

const graphTop =
  chartY + 10;

const graphBottom =
  chartY +
  chartHeight -
  28;

const graphWidth =
  graphRight -
  graphLeft;

const graphHeight =
  graphBottom -
  graphTop;

// ==========================================================
// LÍNEAS HORIZONTALES 0 - 5
// ==========================================================

for (
  let valor = 0;
  valor <= 5;
  valor++
) {
  const lineY =
    graphBottom -
    (valor / maxValor) *
      graphHeight;

  pdf.setDrawColor(
    226,
    232,
    240
  );

  pdf.setLineWidth(0.2);

  pdf.line(
    graphLeft,
    lineY,
    graphRight,
    lineY
  );

  texto(
    valor,
    graphLeft - 5,
    lineY + 1.5,
    {
      size: 6,
      color: gris,
      align: "right",
    }
  );
}

// ==========================================================
// EJE VERTICAL
// ==========================================================

pdf.setDrawColor(
  148,
  163,
  184
);

pdf.line(
  graphLeft,
  graphTop,
  graphLeft,
  graphBottom
);

// ==========================================================
// EJE HORIZONTAL
// ==========================================================

pdf.line(
  graphLeft,
  graphBottom,
  graphRight,
  graphBottom
);

// ==========================================================
// BARRAS
// ==========================================================

const cantidadBarras =
  componentesVisibles.length;

if (cantidadBarras > 0) {

  const espacioPorBarra =
    graphWidth /
    cantidadBarras;

  const anchoBarra =
    Math.min(
      28,
      espacioPorBarra * 0.45
    );

  componentesVisibles.forEach(
    (componente, index) => {

      const valor =
        Math.min(
          5,
          Math.max(
            0,
            Number(
              componente.promedio || 0
            )
          )
        );

      const alturaBarra =
        (valor / maxValor) *
        graphHeight;

      const xBarra =
        graphLeft +
        espacioPorBarra *
          index +
        espacioPorBarra / 2 -
        anchoBarra / 2;

      const yBarra =
        graphBottom -
        alturaBarra;

      // ======================================================
      // COLOR SEGÚN NIVEL
      // ======================================================

      if (valor === 5) {
        pdf.setFillColor(
          22,
          163,
          74
        );
      } else if (
        valor >= 3
      ) {
        pdf.setFillColor(
          217,
          119,
          6
        );
      } else {
        pdf.setFillColor(
          220,
          38,
          38
        );
      }

      // ======================================================
      // BARRA
      // ======================================================

      pdf.roundedRect(
        xBarra,
        yBarra,
        anchoBarra,
        alturaBarra,
        1.5,
        1.5,
        "F"
      );

      // ======================================================
      // VALOR ENCIMA DE LA BARRA
      // ======================================================

      texto(
        valor.toFixed(2),
        xBarra +
          anchoBarra / 2,
        Math.max(
          graphTop + 4,
          yBarra - 2
        ),
        {
          size: 7,
          bold: true,
          color: azul,
          align: "center",
        }
      );

      // ======================================================
      // NOMBRE DEL COMPONENTE
      // ======================================================

      const nombreLines =
        pdf.splitTextToSize(
          componente.nombre,
          espacioPorBarra - 5
        );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(5.8);

      pdf.setTextColor(
        ...gris
      );

      pdf.text(
        nombreLines,
        xBarra +
          anchoBarra / 2,
        graphBottom + 6,
        {
          align: "center",
        }
      );
    }
  );
}

y =
  chartY +
  chartHeight +
  8;


    // ==========================================================
    // NUEVA PÁGINA
    // PUNTOS DE ENFOQUE
    // ==========================================================
    nuevaPagina();

    y = tituloSeccion(
      "NIVEL DE CUMPLIMIENTO DE PUNTOS DE ENFOQUE EVALUADOS",
      "Priorización para la implementación de acciones de mejora",
      marginTop
    );

    const filasPuntos = [
      [
        "[5]",
        "Alto",
        ...resumenNivelesComponentes.Alto,
        totalFilaComponentes(
          resumenNivelesComponentes.Alto
        ),
      ],

      [
        "[3 - 4]",
        "Medio",
        ...resumenNivelesComponentes.Medio,
        totalFilaComponentes(
          resumenNivelesComponentes.Medio
        ),
      ],

      [
        "[0 - 2]",
        "Bajo",
        ...resumenNivelesComponentes.Bajo,
        totalFilaComponentes(
          resumenNivelesComponentes.Bajo
        ),
      ],

   [
  "",
  "TOTAL",

  ...componentesVisibles.map(
    (_, index) =>
      totalColumnaComponentes(index)
  ),

  totalGeneralComponentes,
],
    ];

 const nombresCortos =
  componentesVisibles.map(
    (componente) =>
      componente.nombre
  );
  
const anchoValor = 18;
const anchoNivel = 25;
const anchoTotal = 25;

const espacioComponentes =
  contentWidth -
  anchoValor -
  anchoNivel -
  anchoTotal;

const anchoComponente =
  componentesVisibles.length > 0
    ? espacioComponentes /
      componentesVisibles.length
    : espacioComponentes;

const widthsPuntos = [
  anchoValor,
  anchoNivel,

  ...componentesVisibles.map(
    () => anchoComponente
  ),

  anchoTotal,
];

    const tablaPuntos =
      dibujarTabla({
        headers: [
          "Valor",
          "Nivel",
          ...nombresCortos,
          "TOTAL",
        ],

        rows: filasPuntos,

     widths: widthsPuntos,

        startY: y,

        rowHeight: 10,
        fontSize: 6,
      });

    y = tablaPuntos.y + 8;

    texto(
      "La priorización permite identificar los componentes que requieren mayor atención para la implementación de acciones de mejora.",
      tablaPuntos.startX,
      y,
      {
        size: 6.5,
        color: gris,
      }
    );

    // ==========================================================
    // NUEVA PÁGINA
    // RESPUESTAS AFIRMATIVAS
    // ==========================================================
    nuevaPagina();

    y = tituloSeccion(
      "RESPUESTAS AFIRMATIVAS DE LOS PUNTOS DE ENFOQUE EVALUADOS",
      "Evaluación de presencia y funcionamiento por componente",
      marginTop
    );

   const filaPresente = [
  "Está Presente",

  ...componentesVisibles.map(
    (componente) =>
      getAfirmativaPrincipio(
        componente.componenteId
      )?.TotalPresente ?? 0
  ),

  totalPresentePrincipios,
];

    const filaPorcentajePresente = [
  "% Está Presente",

  ...componentesVisibles.map(
    (componente) =>
      `${Number(
        getAfirmativaPrincipio(
          componente.componenteId
        )?.PorcentajePresente ?? 0
      ).toFixed(0)}%`
  ),

  `${porcentajeTotalPresentePrincipios}%`,
];

    const filaFuncionando = [
  "Está Funcionando",

  ...componentesVisibles.map(
    (componente) =>
      getAfirmativaPrincipio(
        componente.componenteId
      )?.TotalFuncionando ?? 0
  ),

  totalFuncionandoPrincipios,
];

    const filaPorcentajeFuncionando = [
  "% Está Funcionando",

  ...componentesVisibles.map(
    (componente) =>
      `${Number(
        getAfirmativaPrincipio(
          componente.componenteId
        )?.PorcentajeFuncionando ?? 0
      ).toFixed(0)}%`
  ),

  `${porcentajeTotalFuncionandoPrincipios}%`,
];

const anchoCriterioAfirmativas = 42;
const anchoTotalAfirmativas = 28;

const espacioComponentesAfirmativas =
  contentWidth -
  anchoCriterioAfirmativas -
  anchoTotalAfirmativas;

const anchoComponenteAfirmativas =
  componentesVisibles.length > 0
    ? espacioComponentesAfirmativas /
      componentesVisibles.length
    : espacioComponentesAfirmativas;

const widthsAfirmativas = [
  anchoCriterioAfirmativas,

  ...componentesVisibles.map(
    () =>
      anchoComponenteAfirmativas
  ),

  anchoTotalAfirmativas,
];


    const tablaAfirmativas =
      dibujarTabla({
        headers: [
          "Criterio",
          ...nombresCortos,
          "TOTAL",
        ],

        rows: [
          filaPresente,
          filaPorcentajePresente,
          filaFuncionando,
          filaPorcentajeFuncionando,
        ],

       widths: widthsAfirmativas,

        startY: y,

        rowHeight: 11,
        fontSize: 6,
      });

    y = tablaAfirmativas.y + 8;

    texto(
      "Nota 2: Corresponde a la relación entre el número de puntos de enfoque evaluados afirmativamente y el total de puntos de enfoque de cada componente.",
      tablaAfirmativas.startX,
      y,
      {
        size: 6.2,
        color: gris,
      }
    );

    y += 5;

    texto(
      "Nota 3: Corresponde a la relación entre el total de puntos de enfoque evaluados afirmativamente y el número total de puntos de enfoque del Sistema de Control Interno.",
      tablaAfirmativas.startX,
      y,
      {
        size: 6.2,
        color: gris,
      }
    );

   // ==========================================================
// ÚLTIMA PÁGINA
// CONCLUSIONES / RECOMENDACIONES / CRITERIO / FIRMAS
// ==========================================================

nuevaPagina();

y = tituloSeccion(
  "CONCLUSIONES Y RECOMENDACIONES",
  "Síntesis de los resultados obtenidos en la evaluación",
  marginTop
);

// ==========================================================
// CONCLUSIONES
// ==========================================================

const textoConclusiones =
  conclusiones?.trim()
    ? conclusiones.trim()
    : "Sin conclusiones registradas.";

const conclusionesLines =
  pdf.splitTextToSize(
    textoConclusiones,
    contentWidth - 12
  );

const altoConclusiones =
  Math.max(
    22,
    conclusionesLines.length * 4 + 14
  );

// CABECERA
pdf.setFillColor(
  239,
  246,
  255
);

pdf.roundedRect(
  marginX,
  y,
  contentWidth,
  10,
  2,
  2,
  "F"
);

texto(
  "CONCLUSIONES",
  marginX + 5,
  y + 6.5,
  {
    size: 7.5,
    bold: true,
    color: azulFuerte,
  }
);

y += 12;

// CONTENIDO
pdf.setFont(
  "helvetica",
  "normal"
);

pdf.setFontSize(7);

pdf.setTextColor(
  ...gris
);

pdf.text(
  conclusionesLines,
  marginX + 5,
  y + 4
);

y += altoConclusiones;

// ==========================================================
// RECOMENDACIONES
// ==========================================================

const textoRecomendaciones =
  recomendaciones?.trim()
    ? recomendaciones.trim()
    : "Sin recomendaciones registradas.";

const recomendacionesLines =
  pdf.splitTextToSize(
    textoRecomendaciones,
    contentWidth - 12
  );

const altoRecomendaciones =
  Math.max(
    22,
    recomendacionesLines.length * 4 + 14
  );

// CABECERA
pdf.setFillColor(
  236,
  253,
  245
);

pdf.roundedRect(
  marginX,
  y,
  contentWidth,
  10,
  2,
  2,
  "F"
);

texto(
  "RECOMENDACIONES",
  marginX + 5,
  y + 6.5,
  {
    size: 7.5,
    bold: true,
    color: verde,
  }
);

y += 12;

// CONTENIDO
pdf.setFont(
  "helvetica",
  "normal"
);

pdf.setFontSize(7);

pdf.setTextColor(
  ...gris
);

pdf.text(
  recomendacionesLines,
  marginX + 5,
  y + 4
);

y += altoRecomendaciones;


// ==========================================================
// VERIFICAR ESPACIO PARA CRITERIO
// ==========================================================

const espacioCriterio = 65;

if (
  y + espacioCriterio >
  pageHeight -
    marginBottom -
    8
) {
  nuevaPagina();
  y = marginTop;
}


// ==========================================================
// CRITERIO DE VALORACIÓN
// ==========================================================

y = tituloSeccion(
  "CRITERIO DE VALORACIÓN",
  "Parámetros utilizados para determinar el cumplimiento",
  y
);

const filasCriterio = [
  [
    "SÍ",
    "Presente y Funcionando",
    "Cumplimiento igual o superior al 75%",
  ],
  [
    "NO",
    "No cumple el criterio",
    "Cumplimiento menor al 75%",
  ],
];

const tablaCriterio =
  dibujarTabla({
    headers: [
      "Criterio",
      "Condición",
      "Resultado",
    ],

    rows: filasCriterio,

    widths: [
      32,
      135,
      150,
    ],

    startY: y,

    rowHeight: 12,
    fontSize: 7,
  });

y =
  tablaCriterio.y +
  14;


// ==========================================================
// VALIDACIÓN DEL INFORME
// ==========================================================

if (
  y + 55 >
  pageHeight -
    marginBottom -
    8
) {
  nuevaPagina();
  y = marginTop;
}

texto(
  "VALIDACIÓN DEL INFORME",
  marginX,
  y,
  {
    size: 10,
    bold: true,
    color: azul,
  }
);

y += 28;

const firmaWidth =
  (contentWidth - 20) / 3;

const firmas = [
  "ELABORADO POR",
  "REVISADO POR",
  "APROBADO POR",
];

firmas.forEach(
  (firma, index) => {

    const x =
      marginX +
      index *
        (firmaWidth + 10);

    // LÍNEA DE FIRMA
    linea(
      x,
      y,
      x + firmaWidth,
      y
    );

    // TÍTULO
    texto(
      firma,
      x + firmaWidth / 2,
      y + 6,
      {
        size: 7,
        bold: true,
        color: gris,
        align: "center",
      }
    );

    // ======================================================
    // ELABORADO POR
    // ======================================================

    if (
      index === 0 &&
      elaboradoPor
    ) {
      const nombres =
        pdf.splitTextToSize(
          elaboradoPor,
          firmaWidth - 10
        );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(12);

      pdf.setTextColor(
        ...gris
      );

      pdf.text(
        nombres,
        x + firmaWidth / 2,
        y + 12,
        {
          align: "center",
        }
      );
    }
  }
);

y += 24;

    // FECHA COMPACTA
    const fechaActual =
      new Date().toLocaleDateString(
        "es-NI"
      );

    const fechaWidth = 70;
    const fechaX =
      pageWidth -
      marginX -
      fechaWidth;

    pdf.setFillColor(...azul);

    pdf.roundedRect(
      fechaX,
      y,
      24,
      10,
      2,
      0,
      "F"
    );

    texto(
      "FECHA",
      fechaX + 12,
      y + 6.5,
      {
        size: 7,
        bold: true,
        color: [255, 255, 255],
        align: "center",
      }
    );

    pdf.setFillColor(...grisClaro);
    pdf.setDrawColor(...borde);

    pdf.rect(
      fechaX + 24,
      y,
      fechaWidth - 24,
      10,
      "FD"
    );

    texto(
      fechaActual,
      fechaX + 47,
      y + 6.5,
      {
        size: 8,
        bold: true,
        color: gris,
        align: "center",
      }
    );

    // ==========================================================
    // PIE DE PÁGINA
    // ==========================================================
    const totalPages =
      pdf.getNumberOfPages();

    for (
      let pagina = 1;
      pagina <= totalPages;
      pagina++
    ) {
      pdf.setPage(pagina);

      linea(
        marginX,
        pageHeight - 10,
        pageWidth - marginX,
        pageHeight - 10
      );

      texto(
        "Informe de Evaluación de Control Interno por Componentes",
        marginX,
        pageHeight - 5.5,
        {
          size: 5.8,
          color: [100, 116, 139],
        }
      );

      texto(
        `Página ${pagina} de ${totalPages}`,
        pageWidth - marginX,
        pageHeight - 5.5,
        {
          size: 5.8,
          color: [100, 116, 139],
          align: "right",
        }
      );
    }

    // ==========================================================
    // GUARDAR
    // ==========================================================
    pdf.save(
      "Informe_Evaluacion_Control_Interno_Componentes.pdf"
    );

    await Swal.fire({
      icon: "success",
      title: "PDF generado",
      text: "El informe por componentes se exportó correctamente.",
      confirmButtonColor: "#0B4DA2",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error(
      "ERROR EXPORTANDO PDF:",
      error
    );

    await Swal.fire({
      icon: "error",
      title: "No se pudo generar el PDF",
      text:
        error instanceof Error
          ? error.message
          : "Ocurrió un error al generar el informe.",
      confirmButtonColor: "#0B4DA2",
    });
  } finally {
    setExportandoPDF(false);
  }
};

const aprobarResultados = async () => {
  // ============================================================
  // 1. EVITAR DOBLE EJECUCIÓN
  // ============================================================

  if (resultadosAprobados || aprobandoResultados) {
    return;
  }

  // ============================================================
  // 2. VALIDAR PERÍODO EVALUADO
  // ============================================================

  if (!periodoInicio || !periodoFin) {
    await Swal.fire({
      icon: "warning",
      title: "Período evaluado requerido",
      text: "Debe seleccionar la fecha de inicio y la fecha de finalización del período evaluado antes de aprobar los resultados.",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#0B4DA2",
    });

    return;
  }

  // ============================================================
  // 3. VALIDAR ORDEN DE LAS FECHAS
  // ============================================================

  if (new Date(periodoInicio) > new Date(periodoFin)) {
    await Swal.fire({
      icon: "warning",
      title: "Período no válido",
      text: "La fecha de inicio del período evaluado no puede ser posterior a la fecha de finalización.",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#0B4DA2",
    });

    return;
  }

  // ============================================================
  // 4. FORMATEAR FECHAS PARA MOSTRAR EN LA CONFIRMACIÓN
  // ============================================================

  const fechaInicioMostrar = new Date(
    `${periodoInicio}T00:00:00`
  ).toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const fechaFinMostrar = new Date(
    `${periodoFin}T00:00:00`
  ).toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // ============================================================
  // 5. CONFIRMAR APROBACIÓN
  // ============================================================

  const confirmacion = await Swal.fire({
    icon: "warning",
    title: "¿Aprobar resultados?",
    html: `
      <div style="text-align:left; line-height:1.7; color:#475569;">

        Está a punto de aprobar los resultados consolidados
        de la evaluación.

        <div
          style="
            margin-top:16px;
            padding:14px;
            border-radius:10px;
            background:#eff6ff;
            border:1px solid #bfdbfe;
          "
        >
          <strong style="color:#0B4DA2;">
            Período evaluado
          </strong>

          <br/>

          ${fechaInicioMostrar}
          &nbsp; al &nbsp;
          ${fechaFinMostrar}
        </div>

        <div style="margin-top:16px;">
          Al continuar:
        </div>

        <ul style="margin:10px 0 0 20px;">
          <li>Se guardarán los resultados consolidados.</li>
          <li>Se guardará el período evaluado.</li>
          <li>Se guardarán las conclusiones.</li>
          <li>Se guardarán las recomendaciones.</li>
          <li>Las preguntas de la evaluación quedarán aprobadas.</li>
          <li>La evaluación quedará cerrada.</li>
        </ul>

        <div
          style="
            margin-top:18px;
            font-weight:600;
            color:#b45309;
          "
        >
          Después de aprobar los resultados no podrán ser modificados.
        </div>

      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Sí, aprobar resultados",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#059669",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
    focusCancel: true,
    allowOutsideClick: false,
  });

  // ============================================================
  // 6. SI CANCELA, NO HACER NADA
  // ============================================================

  if (!confirmacion.isConfirmed) {
    return;
  }

  try {
    // ==========================================================
    // 7. ACTIVAR LOADER
    // ==========================================================

    setAprobandoResultados(true);

    // ==========================================================
    // 8. PREPARAR RESULTADO CONSOLIDADO
    // ==========================================================

    const resultadoGuardar = {
      periodoInicio,
      periodoFin,

      calificacionGlobal:
        Number(calificacionGlobal) || 0,

      nivelGlobal,

      porcentajeGlobal:
        Number(
          String(porcentajeGlobal).replace("%", "")
        ) || 0,

      // ========================================================
      // RESULTADOS DE LOS 5 COMPONENTES
      // ========================================================

      entornoControl:
  Number(
    getComponenteData(1)?.Promedio ?? 0
  ),

evaluacionRiesgos:
  Number(
    getComponenteData(2)?.Promedio ?? 0
  ),

actividadesControl:
  Number(
    getComponenteData(3)?.Promedio ?? 0
  ),

informacionComunicacion:
  Number(
    getComponenteData(4)?.Promedio ?? 0
  ),

supervisionMonitoreo:
  Number(
    getComponenteData(5)?.Promedio ?? 0
  ),

      // ========================================================
      // OBSERVACIONES
      // ========================================================

      conclusiones:
        conclusiones.trim(),

      recomendaciones:
        recomendaciones.trim(),
    };

    console.log(
      "Resultado que se enviará:",
      resultadoGuardar
    );

    // ============================================================
    // 9. GUARDAR EN Resultado_Componente
    // ============================================================

    const respuestaGuardar = await fetch(
      "/api/resultados/resultado-componente",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify(
          resultadoGuardar
        ),
      }
    );

    const datosGuardado =
      await respuestaGuardar.json();

    console.log(
      "Respuesta guardado:",
      datosGuardado
    );

    // ============================================================
    // 10. VERIFICAR GUARDADO
    // ============================================================

    if (
      !respuestaGuardar.ok ||
      !datosGuardado?.ok
    ) {
      throw new Error(
        datosGuardado?.message ||
          "No se pudieron guardar los resultados consolidados."
      );
    }

    // ============================================================
    // 11. OBTENER ID DEL RESULTADO GUARDADO
    // ============================================================

    const resultadoId = Number(
      datosGuardado?.resultado?.Id ?? 0
    );

    if (!resultadoId) {
      throw new Error(
        "Los resultados fueron guardados, pero no se recibió el identificador del registro."
      );
    }

    console.log(
      "Resultado_Componente Id:",
      resultadoId
    );

    // ============================================================
    // 12. LLAMAR API DE APROBACIÓN
    // ============================================================

    const respuestaAprobar = await fetch(
      "/api/evaluacion-componentes/aprobar",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          resultadoId,
        }),
      }
    );

    const datosAprobacion =
      await respuestaAprobar.json();

    console.log(
      "Respuesta aprobación:",
      datosAprobacion
    );

    // ============================================================
    // 13. VERIFICAR APROBACIÓN
    // ============================================================

    if (
      !respuestaAprobar.ok ||
      !datosAprobacion?.ok
    ) {
      throw new Error(
        datosAprobacion?.message ||
          "Los resultados fueron guardados, pero no pudieron ser aprobados."
      );
    }

    // ============================================================
    // 14. MARCAR COMO APROBADO EN EL FRONTEND
    // ============================================================

    setResultadosAprobados(true);

    // ============================================================
    // 15. MENSAJE FINAL
    // ============================================================

    await Swal.fire({
      icon: "success",
      title: "Resultados aprobados",
      html: `
        <div style="line-height:1.7; color:#475569;">

          Los resultados de la evaluación fueron
          <strong style="color:#059669;">
            guardados y aprobados correctamente.
          </strong>

          <div
            style="
              margin-top:16px;
              padding:14px;
              border-radius:10px;
              background:#ecfdf5;
              border:1px solid #a7f3d0;
            "
          >
            <strong>Período evaluado:</strong>
            <br/>
            ${fechaInicioMostrar}
            &nbsp; al &nbsp;
            ${fechaFinMostrar}
          </div>

          <div style="margin-top:16px;">
            La evaluación ha quedado cerrada y
            ya no podrá ser modificada.
          </div>

        </div>
      `,
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#059669",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

  } catch (error) {
    // ============================================================
    // 16. ERROR
    // ============================================================

    console.error(
      "Error guardando/aprobando resultados:",
      error
    );

    await Swal.fire({
      icon: "error",
      title: "No se pudo completar la aprobación",
      text:
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar y aprobar los resultados.",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#0B4DA2",
    });

  } finally {
    // ============================================================
    // 17. DESACTIVAR LOADER
    // ============================================================

    setAprobandoResultados(false);
  }
};

return (
  <div className="min-h-screen bg-slate-50/70 p-4 md:p-6">

    {/* =========================================================
        BARRA SUPERIOR DEL INFORME
    ========================================================= */}
    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B4DA2] via-[#1268A8] to-[#1597A8] shadow-lg">

      <div className="relative px-6 py-5">

        {/* Decoración */}
        <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-20 top-10 h-28 w-28 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          {/* TÍTULO */}
          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Layers3 className="h-7 w-7 text-white" />
            </div>

            <div>
             

              <h1 className="mt-1 text-xl font-black text-white md:text-xl">
                Evaluación de Control Interno por Componentes
              </h1>

              <p className="mt-1 text-sm text-blue-50">
                Resultados consolidados de la evaluación por componentes.
              </p>
            </div>

          </div>

          {/* BOTONES */}
          <div className="flex flex-wrap gap-2">


      <button
  type="button"
  onClick={exportarPDF}
  disabled={exportandoPDF}
    className="
                inline-flex h-10 items-center justify-center gap-2
                rounded-xl border border-white/20 bg-white/10 px-4
                text-sm font-semibold text-white backdrop-blur-sm
                transition-all duration-300
                hover:-translate-y-0.5 hover:bg-white/20
                disabled:cursor-not-allowed disabled:opacity-60
              "
>
  {exportandoPDF ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Generando PDF...
    </>
  ) : (
    <>
      <FileDown className="mr-2 h-4 w-4" />
      Exportar PDF
    </>
  )}
</button>


           {puedeAprobarResultados && (
  <button
    type="button"
    onClick={aprobarResultados}
    disabled={
       cargandoPermisos ||
  cargandoResultadoGuardado ||
  aprobandoResultados ||
  resultadosAprobados
    }
    className={`
      inline-flex h-10 items-center justify-center gap-2
      rounded-xl px-4
      text-sm font-bold text-white shadow-md
      transition-all duration-300

      ${
        resultadosAprobados
          ? `
            cursor-not-allowed
            bg-slate-400
            shadow-none
          `
          : `
            bg-emerald-500
            hover:-translate-y-0.5
            hover:bg-emerald-600
          `
      }

      disabled:opacity-70
    `}
  >
    {aprobandoResultados ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Aprobando...
      </>
    ) : resultadosAprobados ? (
      <>
        <BadgeCheck className="h-4 w-4" />
        Resultados aprobados
      </>
    ) : (
      <>
        <BadgeCheck className="h-4 w-4" />
        Aprobar resultados
      </>
    )}
  </button>
)}

          </div>
        </div>
      </div>
    </div>


    {/* =========================================================
        CONTENIDO DEL INFORME
    ========================================================= */}
    <div
      ref={reportRef}
      id="informe-control-interno-componentes"
      className="mx-auto max-w-[1600px] space-y-6 bg-slate-50/70"
    >

      {/* =====================================================
          INFORMACIÓN GENERAL
      ===================================================== */}
      <section className="pdf-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="bg-[#123F5D] px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>

            <div>
              <h2 className="text-base font-bold uppercase tracking-wide text-white">
                Informe de Evaluación de Control Interno a Nivel de Entidad
              </h2>

              <p className="mt-0.5 text-xs text-slate-200">
                Información general de la evaluación
              </p>
            </div>

          </div>
        </div>


        <div className="grid md:grid-cols-2">

          {/* INSTITUCIÓN */}
          <div className="border-b border-slate-200 p-5 md:border-b-0 md:border-r">

            <div className="flex gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Institución
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  UNIVERSIDAD NACIONAL CASIMIRO SOTELO MONTENEGRO
                </p>
              </div>

            </div>
          </div>


          {/* PERÍODO */}
          <div className="p-5">

            <div className="flex gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div className="flex-1">

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Período evaluado
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">

                  <span className="text-xs font-semibold text-slate-500">
                    Del
                  </span>

                 <input
  type="date"
  value={periodoInicio}
  onChange={(e) =>
    setPeriodoInicio(e.target.value)
  }
  disabled={
    resultadosAprobados ||
    cargandoResultadoGuardado
  }
  className={`
    h-10 rounded-xl border px-3 text-sm
    outline-none transition-all

    ${
      resultadosAprobados
        ? `
          cursor-not-allowed
          border-slate-200
          bg-slate-100
          text-slate-500
        `
        : `
          border-slate-300
          bg-white
          text-slate-700
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-100
        `
    }
  `}
/>

                  <span className="text-xs font-semibold text-slate-500">
                    al
                  </span>

                  <input
  type="date"
  value={periodoFin}
  onChange={(e) =>
    setPeriodoFin(e.target.value)
  }
  disabled={
    resultadosAprobados ||
    cargandoResultadoGuardado
  }
  className={`
    h-10 rounded-xl border px-3 text-sm
    outline-none transition-all

    ${
      resultadosAprobados
        ? `
          cursor-not-allowed
          border-slate-200
          bg-slate-100
          text-slate-500
        `
        : `
          border-slate-300
          bg-white
          text-slate-700
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-100
        `
    }
  `}
/>

                </div>
              </div>

            </div>
          </div>

        </div>
      </section>


      {/* =====================================================
          RESULTADO GENERAL
      ===================================================== */}
      <section className="pdf-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-5 py-4">

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Nivel de Cumplimiento del Sistema de Control Interno
          </h2>

        </div>


        <div className="grid md:grid-cols-3">

          {/* CALIFICACIÓN */}
          <div className="relative p-6 text-center md:border-r">

        

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Calificación obtenida
            </p>

            <p className="mt-2 text-4xl font-black text-[#0B4DA2]">
              {calificacionGlobal}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Puntaje máximo: 5
            </p>

          </div>


          {/* NIVEL */}
          <div className="p-6 text-center md:border-r">

          
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Nivel
            </p>

            <div className="mt-4 flex justify-center">

              <span
                className={`rounded-full px-5 py-2 text-sm font-black ${
                  nivelGlobal === "Alto"
                    ? "bg-emerald-100 text-emerald-700"
                    : nivelGlobal === "Medio"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {nivelGlobal}
              </span>

            </div>

          </div>


          {/* PORCENTAJE */}
          <div className="p-6 text-center">

      

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              % Cumplimiento
            </p>

            <p className="mt-2 text-4xl font-black text-cyan-700">
              {porcentajeGlobal}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Resultado general
            </p>

          </div>

        </div>
      </section>


      {/* =====================================================
          CUMPLIMIENTO POR COMPONENTE
      ===================================================== */}
      <section className="pdf-section pdf-wide-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Layers3 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Detalle de resultados
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Cumplimiento por Componente
              </h2>
            </div>

          </div>
        </div>


        <div className="overflow-x-auto p-4">

          <table className="w-full min-w-[900px] border-collapse text-sm">

            <thead>
              <tr className="bg-[#123F5D] text-white">

                <th className="w-16 border-r border-white/20 px-3 py-3 text-center">
                  No.
                </th>

                <th className="border-r border-white/20 px-4 py-3 text-left">
                  Componente
                </th>

                <th className="border-r border-white/20 px-3 py-3 text-center">
                  Puntaje máximo
                </th>

                <th className="border-r border-white/20 px-3 py-3 text-center">
                  Calificación
                </th>

                <th className="border-r border-white/20 px-3 py-3 text-center">
                  Nivel
                </th>

                <th className="px-3 py-3 text-center">
                  % Cumplimiento
                </th>

              </tr>
            </thead>


            <tbody>

              {componentesVisibles.map(
  (componente, index) => {

    const val =
      Number(
        componente.promedio || 0
      );

    const porcentaje =
      (val / 5) * 100;

    return (
      <tr
        key={componente.componenteId}
        className="border-b border-slate-200 transition hover:bg-slate-50"
      >
        <td className="px-3 py-3 text-center font-semibold text-slate-500">
          {index + 1}
        </td>

        <td className="px-4 py-3 font-semibold text-slate-800">
          {componente.nombre}
        </td>

        <td className="px-3 py-3 text-center font-semibold">
          5
        </td>

        <td className="px-3 py-3 text-center font-black text-blue-700">
          {val.toFixed(2)}
        </td>

        <td className="px-3 py-3 text-center">
          <span
            className={`inline-flex min-w-[70px] justify-center rounded-full px-3 py-1 text-xs font-bold ${
              val === 5
                ? "bg-emerald-100 text-emerald-700"
                : val >= 3
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {val === 5
              ? "Alto"
              : val >= 3
              ? "Medio"
              : "Bajo"}
          </span>
        </td>

        <td className="px-3 py-3">
          <div className="flex items-center justify-center gap-3">
            <span className="w-16 text-center text-xs font-black text-slate-700">
              {porcentaje.toFixed(2)}%
            </span>
          </div>
        </td>
      </tr>
    );
  }
)}


              <tr className="bg-slate-50">

                <td
                  colSpan={5}
                  className="px-4 py-3 text-right text-sm font-black uppercase text-slate-700"
                >
                  Total
                </td>

                <td className="px-4 py-3 text-center font-black text-blue-700">
               {(
  componentesVisibles.length > 0
    ? componentesVisibles.reduce(
        (acc, cur) =>
          acc +
          (
            Number(
              cur.promedio || 0
            ) / 5
          ) *
            100,
        0
      ) /
      componentesVisibles.length
    : 0
).toFixed(2)}
%
                </td>

              </tr>

            </tbody>
          </table>
        </div>


        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">

          <span className="font-bold text-slate-700">
            Nota 1:
          </span>{" "}

          El porcentaje de cumplimiento se obtiene de la relación
          entre la calificación obtenida sobre el puntaje máximo.

        </div>

      </section>


      {/* =====================================================
          GRÁFICA
      ===================================================== */}
      <section className="pdf-section pdf-wide-section rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-5 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <BarChart3 className="h-5 w-5" />
          </div>

          <div>

      
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Valoración por Componente
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Comparación visual de la calificación obtenida por cada componente.
            </p>

          </div>
        </div>


        <div className="h-[430px] rounded-xl bg-slate-50 p-4">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={chartData}
              margin={{
                top: 15,
                right: 20,
                left: 0,
                bottom: 65,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="sistemaCorto"
                angle={-10}
                textAnchor="end"
                interval={0}
                height={70}
                tick={{ fontSize: 10 }}
              />

              <YAxis
                domain={[0, 5]}
                tick={{ fontSize: 11 }}
              />

              <Tooltip
                content={<CustomTooltip />}
              />

              <Bar
                dataKey="valor"
                radius={[8, 8, 0, 0]}
                barSize={48}
              >

                {chartData.map(
                  (entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  )
                )}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

        </div>
      </section>


      {/* =====================================================
          NIVEL POR PRINCIPIOS
      ===================================================== */}
      <section className="pdf-section pdf-wide-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <ListChecks className="h-5 w-5" />
            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
                Evaluación detallada
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Nivel de Cumplimiento por Principios
              </h2>

            </div>
          </div>
        </div>


        <div className="overflow-x-auto p-4">

          <table className="w-full min-w-[1100px] border-collapse text-sm">

            <thead>

              <tr className="bg-[#123F5D] text-white">

                <th className="w-[65px] px-3 py-3 text-center">
                  No.
                </th>

                <th className="px-4 py-3 text-left">
                  Principio
                </th>

                <th className="w-[130px] px-3 py-3 text-center">
                  Calificación
                </th>

                <th className="w-[120px] px-3 py-3 text-center">
                  Nivel
                </th>

                <th className="w-[140px] px-3 py-3 text-center">
                  % Cumplimiento
                </th>

              </tr>

            </thead>


            <tbody>

  {gruposPrincipiosVisibles.map(
    (grupo) => (

      <React.Fragment
        key={grupo.componenteId}
      >

        {/* COMPONENTE */}
        <tr>
          <td
            colSpan={5}
            className="border-y border-blue-100 bg-blue-50 px-4 py-2 font-black text-[#0B4DA2]"
          >
            {grupo.titulo}
          </td>
        </tr>

        {/* PRINCIPIOS VISIBLES */}
        {grupo.principios.map(
          (principio) => {

            const val =
              Number(
                principio.promedio || 0
              );

            const nivel =
              val === 5
                ? "Alto"
                : val >= 3
                ? "Medio"
                : "Bajo";

            const porcentaje =
              (val / 5) * 100;

            return (
              <tr
                key={
                  principio.principioId
                }
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >

                <td className="px-3 py-3 text-center font-bold text-slate-500">
                  {principio.numero}
                </td>

                <td className="px-4 py-3 text-justify text-xs leading-5 text-slate-700">
                  {principio.texto}
                </td>

                <td className="px-3 py-3 text-center font-black text-blue-700">
                  {val.toFixed(2)}
                </td>

                <td className="px-3 py-3 text-center">

                  <span
                    className={`inline-flex min-w-[70px] justify-center rounded-full px-3 py-1 text-xs font-bold ${
                      nivel === "Alto"
                        ? "bg-emerald-100 text-emerald-700"
                        : nivel === "Medio"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {nivel}
                  </span>

                </td>

                <td className="px-3 py-3 text-center font-bold text-slate-700">
                  {porcentaje.toFixed(2)}%
                </td>

              </tr>
            );
          }
        )}

      </React.Fragment>
    )
  )}

</tbody>
          </table>

        </div>
      </section>


      {/* =====================================================
          NIVEL DE CUMPLIMIENTO DE PUNTOS DE ENFOQUE
      ===================================================== */}
      <section className="pdf-section pdf-wide-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-4">

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700">
            Puntos de enfoque
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Nivel de Cumplimiento de Puntos de Enfoque Evaluados
          </h2>

        </div>


        {/* PRIORIZACIÓN */}
        <div className="m-4 flex overflow-hidden rounded-xl border border-blue-100 bg-blue-50">

          <div className="flex items-center bg-[#123F5D] px-4 py-3 text-xs font-bold text-white">
            Priorización
          </div>

          <div className="px-4 py-3 text-xs leading-5 text-slate-600">
            Para la implementación de las acciones de mejora de las
            deficiencias de los puntos de enfoque.
          </div>

        </div>


        <div className="overflow-x-auto p-4 pt-0">

          <table className="w-full min-w-[1000px] border-collapse text-sm">

            <thead>

              <tr className="bg-[#123F5D] text-white">

                <th className="px-3 py-3 text-center">
                  Valor
                </th>

                <th className="px-3 py-3 text-center">
                  Nivel
                </th>

                {componentesVisibles.map(
  (componente) => (
    <th
      key={componente.componenteId}
      className="px-3 py-3 text-center text-xs"
    >
      {componente.nombre}
    </th>
  )
)}

                <th className="bg-blue-700 px-3 py-3 text-center">
                  TOTAL
                </th>

              </tr>

            </thead>


            <tbody>

              {/* ALTO */}
              <tr className="border-b">

                <td className="px-3 py-3 text-center font-black text-emerald-700">
                  [5]
                </td>

                <td className="px-3 py-3 text-center">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    Alto
                  </span>
                </td>

          {componentesVisibles.map(
  (componente, i) => (
    <td
      key={
        `alto-${componente.componenteId}`
      }
      className="px-3 py-3 text-center font-semibold"
    >
      {resumenNivelesComponentes
        .Alto[i] ?? 0}
    </td>
  )
)}

                <td className="bg-blue-50 px-3 py-3 text-center font-black text-blue-700">
                  {totalFilaComponentes(
                    resumenNivelesComponentes.Alto
                  )}
                </td>

              </tr>


              {/* MEDIO */}
              <tr className="border-b">

                <td className="px-3 py-3 text-center font-black text-amber-600">
                  [3 - 4]
                </td>

                <td className="px-3 py-3 text-center">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                    Medio
                  </span>
                </td>

             {componentesVisibles.map(
  (componente, i) => (
    <td
      key={
        `medio-${componente.componenteId}`
      }
      className="px-3 py-3 text-center font-semibold"
    >
      {resumenNivelesComponentes
        .Medio[i] ?? 0}
    </td>
  )
)}

                <td className="bg-blue-50 px-3 py-3 text-center font-black text-blue-700">
                  {totalFilaComponentes(
                    resumenNivelesComponentes.Medio
                  )}
                </td>

              </tr>


              {/* BAJO */}
              <tr className="border-b">

                <td className="px-3 py-3 text-center font-black text-red-600">
                  [0 - 2]
                </td>

                <td className="px-3 py-3 text-center">
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                    Bajo
                  </span>
                </td>

              {componentesVisibles.map(
  (componente, i) => (
    <td
      key={
        `bajo-${componente.componenteId}`
      }
      className="px-3 py-3 text-center font-semibold"
    >
      {resumenNivelesComponentes
        .Bajo[i] ?? 0}
    </td>
  )
)}
                <td className="bg-blue-50 px-3 py-3 text-center font-black text-blue-700">
                  {totalFilaComponentes(
                    resumenNivelesComponentes.Bajo
                  )}
                </td>

              </tr>


              {/* TOTAL */}
              <tr className="bg-slate-50 font-black">

                <td
                  colSpan={2}
                  className="px-3 py-3 text-center"
                >
                  TOTAL
                </td>

          {componentesVisibles.map(
  (componente, i) => (
    <td
      key={
        `total-${componente.componenteId}`
      }
      className="px-3 py-3 text-center text-blue-700"
    >
      {totalColumnaComponentes(i)}
    </td>
  )
)}

                <td className="bg-blue-100 px-3 py-3 text-center text-blue-800">
                  {totalGeneralComponentes}
                </td>

              </tr>

            </tbody>
          </table>

        </div>
      </section>


      {/* =====================================================
          RESPUESTAS AFIRMATIVAS
      ===================================================== */}
      <section className="pdf-section pdf-wide-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Evaluación afirmativa
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Respuestas Afirmativas de los Puntos de Enfoque Evaluados
              </h2>

            </div>
          </div>

        </div>


        <div className="m-4 flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

          <div className="flex items-center bg-[#123F5D] px-4 py-3 text-xs font-bold text-white">
            Explicación
          </div>

          <p className="px-4 py-3 text-xs leading-5 text-slate-600">
            ¿Los puntos de enfoque de cada uno de los componentes
            se encuentran operando juntos y de manera integrada?
          </p>

        </div>


        <div className="overflow-x-auto p-4 pt-0">

          <table className="w-full min-w-[1100px] border-collapse text-sm">

            <thead>

              <tr className="bg-[#123F5D] text-white">

                <th className="px-3 py-3 text-center">
                  Criterio
                </th>

                {componentesVisibles.map(
  (componente) => (
    <th
      key={componente.componenteId}
      className="px-3 py-3 text-center text-xs"
    >
      {componente.nombre}
    </th>
  )
)}

                <th className="bg-blue-700 px-3 py-3 text-center">
                  Total
                </th>

              </tr>

            </thead>


            <tbody>

  {/* =====================================================
      ESTÁ PRESENTE
  ===================================================== */}
  <tr className="border-b">

    <td className="px-4 py-3 font-bold text-slate-700">
      Está Presente
    </td>

    {componentesVisibles.map(
      (componente) => {

        const item =
          getAfirmativaPrincipio(
            componente.componenteId
          );

        return (
          <td
            key={`presente-${componente.componenteId}`}
            className="px-3 py-3 text-center font-semibold"
          >
            {item?.TotalPresente ?? 0}
          </td>
        );
      }
    )}

    <td className="bg-blue-50 px-3 py-3 text-center font-black text-blue-700">
      {totalPresentePrincipios}
    </td>

  </tr>


  {/* =====================================================
      % ESTÁ PRESENTE
  ===================================================== */}
  <tr className="border-b bg-slate-50">

    <td className="px-4 py-3 text-xs font-bold text-slate-500">
      % Está Presente
    </td>

    {componentesVisibles.map(
      (componente) => {

        const item =
          getAfirmativaPrincipio(
            componente.componenteId
          );

        return (
          <td
            key={`presente-p-${componente.componenteId}`}
            className="px-3 py-3 text-center font-bold"
          >
            {Number(
              item?.PorcentajePresente ?? 0
            ).toFixed(0)}
            %
          </td>
        );
      }
    )}

    <td className="bg-blue-100 px-3 py-3 text-center font-black text-blue-800">
      {porcentajeTotalPresentePrincipios}%
    </td>

  </tr>


  {/* =====================================================
      ESTÁ FUNCIONANDO
  ===================================================== */}
  <tr className="border-b">

    <td className="px-4 py-3 font-bold text-slate-700">
      Está Funcionando
    </td>

    {componentesVisibles.map(
      (componente) => {

        const item =
          getAfirmativaPrincipio(
            componente.componenteId
          );

        return (
          <td
            key={`func-${componente.componenteId}`}
            className="px-3 py-3 text-center font-semibold"
          >
            {item?.TotalFuncionando ?? 0}
          </td>
        );
      }
    )}

    <td className="bg-emerald-50 px-3 py-3 text-center font-black text-emerald-700">
      {totalFuncionandoPrincipios}
    </td>

  </tr>


  {/* =====================================================
      % ESTÁ FUNCIONANDO
  ===================================================== */}
  <tr className="bg-slate-50">

    <td className="px-4 py-3 text-xs font-bold text-slate-500">
      % Está Funcionando
    </td>

    {componentesVisibles.map(
      (componente) => {

        const item =
          getAfirmativaPrincipio(
            componente.componenteId
          );

        return (
          <td
            key={`func-p-${componente.componenteId}`}
            className="px-3 py-3 text-center font-bold"
          >
            {Number(
              item?.PorcentajeFuncionando ?? 0
            ).toFixed(0)}
            %
          </td>
        );
      }
    )}

    <td className="bg-emerald-100 px-3 py-3 text-center font-black text-emerald-800">
      {porcentajeTotalFuncionandoPrincipios}%
    </td>

  </tr>

</tbody>
          </table>

        </div>


        <div className="space-y-1 border-t bg-slate-50 px-5 py-4 text-xs leading-5 text-slate-500">

          <p>
            <span className="font-bold text-slate-700">
              Nota 2:
            </span>{" "}
            Corresponde a la relación entre el número de puntos
            de enfoque evaluados afirmativamente y el total de
            puntos de enfoque de cada componente.
          </p>

          <p>
            <span className="font-bold text-slate-700">
              Nota 3:
            </span>{" "}
            Corresponde a la relación entre el total de puntos
            de enfoque evaluados afirmativamente y el número
            total de puntos de enfoque del Sistema de Control
            Interno.
          </p>

        </div>

      </section>


      
        {/* ========================================================
            CRITERIO PRESENTE Y FUNCIONANDO
        ======================================================== */}
        <div className="pdf-section pdf-wide-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              Criterio de Evaluación
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-900">
              Sistemas de Administración
            </h2>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2">

            <div className="border-b border-slate-200 p-5 md:border-b-0 md:border-r">

              <div className="flex items-center gap-3">

                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-lg font-black text-emerald-700">
                  SI
                </span>

                <div>
                  <p className="font-black text-slate-800">
                    Presente y Funcionando
                  </p>

                  <p className="text-sm text-slate-500">
                    Cumplimiento igual o superior al 75%
                  </p>
                </div>

              </div>
            </div>


            <div className="p-5">

              <div className="flex items-center gap-3">

                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-lg font-black text-red-700">
                  NO
                </span>

                <div>
                  <p className="font-black text-slate-800">
                    No cumple el criterio
                  </p>

                  <p className="text-sm text-slate-500">
                    Cumplimiento menor al 75%
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>


      {/* =====================================================
          CONCLUSIONES Y RECOMENDACIONES
      ===================================================== */}
      <section className="pdf-section grid gap-5 xl:grid-cols-2">

        {/* CONCLUSIONES */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center gap-3 border-b bg-slate-50 px-5 py-4">

            <MessageSquareText className="h-5 w-5 text-blue-700" />

            <h3 className="font-bold text-slate-800">
              Conclusiones
            </h3>

          </div>

      <textarea
  value={conclusiones}
  onChange={(e) =>
    setConclusiones(e.target.value)
  }
  disabled={
    resultadosAprobados ||
    cargandoResultadoGuardado
  }
  className={`
    min-h-[170px] w-full resize-none p-5
    text-sm leading-6 outline-none
    transition-all duration-200

    ${
      resultadosAprobados
        ? `
          cursor-not-allowed
          bg-slate-100
          text-slate-600
        `
        : `
          bg-white
          text-slate-700
          focus:bg-blue-50/20
        `
    }
  `}
  placeholder="Escriba aquí las conclusiones..."
/>

        </div>


        {/* RECOMENDACIONES */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center gap-3 border-b bg-slate-50 px-5 py-4">

            <PenLine className="h-5 w-5 text-emerald-700" />

            <h3 className="font-bold text-slate-800">
              Recomendaciones
            </h3>

          </div>
<textarea
  value={recomendaciones}
  onChange={(e) =>
    setRecomendaciones(e.target.value)
  }
  disabled={
    resultadosAprobados ||
    cargandoResultadoGuardado
  }
  className={`
    min-h-[170px] w-full resize-none p-5
    text-sm leading-6 outline-none
    transition-all duration-200

    ${
      resultadosAprobados
        ? `
          cursor-not-allowed
          bg-slate-100
          text-slate-600
        `
        : `
          bg-white
          text-slate-700
          focus:bg-blue-50/20
        `
    }
  `}
  placeholder="Escriba aquí las recomendaciones..."
/>
        </div>

      </section>


      {/* =====================================================
          FIRMAS
      ===================================================== */}
      <section className="pdf-section rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

        <div className="grid gap-12 pt-10 md:grid-cols-3">

          {[
            "ELABORADO POR",
            "REVISADO POR",
            "APROBADO POR",
          ].map((titulo) => (

            <div
              key={titulo}
              className="text-center"
            >

              <div className="mx-auto mb-3 h-px max-w-[230px] bg-slate-500" />

              <p className="text-xs font-black uppercase tracking-wide text-slate-700">
                {titulo}
              </p>

            </div>

          ))}

        </div>


        {/* FECHA */}
        <div className="mt-12 flex justify-start">

          <div className="flex overflow-hidden rounded-xl border border-slate-200">

            <div className="bg-[#123F5D] px-5 py-2 text-xs font-bold uppercase text-white">
              Fecha
            </div>

            <div className="bg-slate-50 px-6 py-2 text-xs font-bold text-slate-700">
              {new Date().toLocaleDateString(
                "es-NI"
              )}
            </div>

          </div>

        </div>

      </section>

    </div>


    {/* =========================================================
        LOADER PDF
    ========================================================= */}
    {exportandoPDF && (

      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">

        <div className="rounded-3xl bg-white p-8 shadow-2xl">

          <HoloPulse />

          <p className="mt-5 text-center text-sm font-bold text-slate-700">
            Generando informe
          </p>

          <p className="mt-1 text-center text-xs text-slate-400">
            Espere un momento...
          </p>

        </div>

      </div>
    )}

  </div>
);
}