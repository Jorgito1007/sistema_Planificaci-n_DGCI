"use client";

import { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";

import { useEffect, useState } from "react";
import { HoloPulse } from "@/components/ui/holo-pulse-loader";
import {
  FileDown,
  FileSpreadsheet,
  Loader2,
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
  ShieldCheck,
  Target,
  TrendingUp,
  CheckCircle2,
  CalendarDays,
  Building2,
  Layers3,
  ListChecks,
  MessageSquareText,
  PenLine,
} from "lucide-react";
import Swal from "sweetalert2";

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

export default function ResultadosSistemaAdministrativoPage() {
  const sistemas = [
    "ADMINISTRACIÓN DE LOS RECURSOS HUMANOS",
    "PLANEACIÓN Y PROGRAMACIÓN",
    "PRESUPUESTO",
    "ADMINISTRACIÓN FINANCIERA",
    "CONTABILIDAD INTEGRADA",
    "CONTRATACIÓN Y ADMINISTRACIÓN DE BIENES Y SERVICIOS",
    "INVERSIONES EN PROGRAMAS Y PROYECTOS",
    "TECNOLOGÍA DE LA INFORMACIÓN (TI)",
  ];

 const reportRef = useRef<HTMLDivElement>(null);
 const chartRef = useRef<HTMLDivElement>(null);

 const [data, setData] = useState<any[]>([]);

const [afirmativas, setAfirmativas] = useState<any[]>([]);

const [conclusiones, setConclusiones] = useState("");
const [recomendaciones, setRecomendaciones] = useState("");

const [resultadosAprobados, setResultadosAprobados] =
  useState(false);


const [aprobandoResultados, setAprobandoResultados] =
  useState(false);

const [cargandoResultadoGuardado, setCargandoResultadoGuardado] =
  useState(true);

//Cargando resultados
useEffect(() => {
  const cargarResultadoGuardado = async () => {
    try {
      setCargandoResultadoGuardado(true);

      const respuesta = await fetch(
        "/api/resultados/resultado-matriz-sa",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos?.ok) {
        console.error(
          "No se pudo cargar Resultado_MatrizSA:",
          datos
        );
        return;
      }

      // No existe todavía un resultado guardado
      if (!datos.existe || !datos.resultado) {
        setResultadosAprobados(false);
        return;
      }

      const resultado = datos.resultado;

      console.log(
        "Resultado_MatrizSA guardado:",
        resultado
      );

      // PERÍODO
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

      // CONCLUSIONES
      setConclusiones(
        resultado.Conclusiones ?? ""
      );

      // RECOMENDACIONES
      setRecomendaciones(
        resultado.Recomendaciones ?? ""
      );

      // ESTADO DE APROBACIÓN
      const aprobado =
        Number(
          resultado.Aprobado_General ?? 0
        ) === 1 ||
        resultado.Aprobado_General === true;

      setResultadosAprobados(aprobado);

    } catch (error) {
      console.error(
        "Error cargando Resultado_MatrizSA:",
        error
      );
    } finally {
      setCargandoResultadoGuardado(false);
    }
  };

  cargarResultadoGuardado();
}, []);


useEffect(() => {
  async function cargarResultadosUsuario() {
    try {
      const [
        respuestaSistemas,
        respuestaDetalle,
      ] = await Promise.all([
        fetch(
          "/api/resultados/sistemas",
          {
            method: "GET",
            credentials:
              "include",
            cache:
              "no-store",
          }
        ),

        fetch(
          "/api/resultados/sistemas-detalle",
          {
            method: "GET",
            credentials:
              "include",
            cache:
              "no-store",
          }
        ),
      ]);

      if (
        !respuestaSistemas.ok
      ) {
        throw new Error(
          "No se pudieron cargar los resultados de los sistemas."
        );
      }

      if (
        !respuestaDetalle.ok
      ) {
        throw new Error(
          "No se pudo cargar el detalle de los resultados."
        );
      }

      const sistemasData =
        await respuestaSistemas.json();

      const detalleData =
        await respuestaDetalle.json();

      console.log(
        "SISTEMAS DEL USUARIO:",
        sistemasData
      );

      console.log(
        "AFIRMATIVAS DEL USUARIO:",
        detalleData
      );

      setData(
        Array.isArray(
          sistemasData
        )
          ? sistemasData
          : []
      );

      setAfirmativas(
        Array.isArray(
          detalleData
        )
          ? detalleData
          : []
      );
    } catch (error) {
      console.error(
        "Error cargando resultados:",
        error
      );

      setData([]);
      setAfirmativas([]);
    }
  }

  cargarResultadosUsuario();
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

type SistemaData = {
  Sistema: number | string;
  TotalPreguntas?: number;
  SumaCalificacion?: number;
  Promedio: number;
  Responsables?: string;
};

const sistemasVisibles = data.map(
  (item: SistemaData) => {
    const codigo = Number(item.Sistema);

    const nombre =
      sistemas[codigo - 2] ||
      `Sistema ${codigo}`;

    return {
      codigo,
      nombre,

      totalPreguntas:
        Number(
          item.TotalPreguntas || 0
        ),

      sumaCalificacion:
        Number(
          item.SumaCalificacion || 0
        ),

      promedio:
        Number(
          item.Promedio || 0
        ),

          responsables:
        String(
          item.Responsables || ""
        ),
    };
  }
);



function getSistemaPorCodigo(
  codigoSistema: number
) {
  return data.find(
    (d: SistemaData) =>
      Number(d.Sistema) ===
      Number(codigoSistema)
  );
}

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

// ============================================================
// DATOS PARA EL GRÁFICO
// ============================================================

const chartData = sistemasVisibles.map(
  (item, index) => {
    return {
      codigo: item.codigo,

      sistemaCorto:
        item.nombre.length > 22
          ? item.nombre.substring(
              0,
              22
            ) + "..."
          : item.nombre,

      sistema: item.nombre,

      valor:
        Number(
          item.promedio || 0
        ),

      color:
        colores[
          index %
            colores.length
        ],
    };
  }
);

// ============================================================
// CONTROL INTERNO GLOBAL
// ============================================================

const calificacionesGlobales =
  sistemasVisibles.map(
    (item) =>
      Number(
        item.promedio || 0
      )
  );

const cantidadSistemas =
  calificacionesGlobales.length;

const sumaCalificaciones =
  calificacionesGlobales.reduce(
    (acc, val) =>
      acc + val,
    0
  );

const calificacionGlobal =
  cantidadSistemas > 0
    ? (
        sumaCalificaciones /
        cantidadSistemas
      ).toFixed(2)
    : "0.00";

const nivelGlobal =
  Number(calificacionGlobal) === 5
    ? "Alto"
    : Number(
        calificacionGlobal
      ) >= 3
    ? "Medio"
    : "Bajo";

const porcentajeGlobal =
  `${
    (
      (
        Number(
          calificacionGlobal
        ) / 5
      ) *
      100
    ).toFixed(2)
  }%`;

// ============================================================
// NIVEL DE CUMPLIMIENTO
// ============================================================

const resumenNiveles = {
  Alto:
    sistemasVisibles.map(
      (item) =>
        Number(
          item.promedio
        ) === 5
          ? 1
          : 0
    ),

  Medio:
    sistemasVisibles.map(
      (item) => {
        const valor =
          Number(
            item.promedio
          );

        return (
          valor >= 3 &&
          valor < 5
        )
          ? 1
          : 0;
      }
    ),

  Bajo:
    sistemasVisibles.map(
      (item) =>
        Number(
          item.promedio
        ) < 3
          ? 1
          : 0
    ),
};

const totalFila = (
  fila: number[]
) =>
  fila.reduce(
    (acc, val) =>
      acc + val,
    0
  );

const totalColumna = (
  i: number
) =>
  Number(
    resumenNiveles.Alto[i] ?? 0
  ) +
  Number(
    resumenNiveles.Medio[i] ?? 0
  ) +
  Number(
    resumenNiveles.Bajo[i] ?? 0
  );

const totalGeneralNiveles =
  sistemasVisibles.reduce(
    (
      acc,
      _,
      i
    ) =>
      acc +
      totalColumna(i),
    0
  );

function getAfirmativaPorSistema(
  codigoSistema: number
) {
  return afirmativas.find(
    (a: any) =>
      Number(a.Sistema) ===
      Number(codigoSistema)
  );
}


const totalPresente =
  afirmativas.reduce(
    (acc, cur) =>
      acc +
      Number(
        cur.TotalPresente ||
          0
      ),
    0
  );

const totalFuncionando =
  afirmativas.reduce(
    (acc, cur) =>
      acc +
      Number(
        cur.TotalFuncionando ||
          0
      ),
    0
  );

// ============================================================
// TOOLTIP
// ============================================================

const CustomTooltip = ({
  active,
  payload,
}: any) => {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  const dato =
    payload[0]?.payload;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-gray-800">
        {dato?.sistema}
      </p>

      <p className="text-sm text-gray-600">
        Calificación obtenida:{" "}
        <span className="font-bold">
          {Number(
            dato?.valor || 0
          ).toFixed(2)}
        </span>
      </p>
    </div>
  );
};

// ============================================================
// PROMEDIO GENERAL
// ============================================================

const promedioGeneral =
  cantidadSistemas > 0
    ? (
        sistemasVisibles.reduce(
          (
            acc,
            cur
          ) =>
            acc +
            Number(
              cur.promedio || 0
            ),
          0
        ) /
        cantidadSistemas
      ).toFixed(2)
    : "0.00";

const [exportandoPDF, setExportandoPDF] = useState(false);

const [puedeAprobarResultados, setPuedeAprobarResultados] =
  useState(false);

const [cargandoPermisos, setCargandoPermisos] =
  useState(true);



const [periodoInicio, setPeriodoInicio] = useState("");
const [periodoFin, setPeriodoFin] = useState("");



// ============================================================
// RESPONSABLES DEL INFORME
// ============================================================

const responsablesInforme =
  Array.from(
    new Set(
      sistemasVisibles
        .flatMap((sistema) =>
          String(
            sistema.responsables || ""
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

console.log(
  "ELABORADO POR:",
  elaboradoPor
);

// ============================================================
// EXPORTAR PDF
// ============================================================


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

    // Permitimos que React muestre el loader
    await new Promise((resolve) => setTimeout(resolve, 300));

    // ============================================================
    // CONFIGURACIÓN DEL PDF
    // ============================================================

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "legal",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const marginX = 12;
    const marginTop = 14;
    const marginBottom = 14;

    const contentWidth = pageWidth - marginX * 2;

    // ============================================================
    // COLORES
    // ============================================================

    const AZUL: [number, number, number] = [18, 61, 92];
    const AZUL_CLARO: [number, number, number] = [239, 246, 255];
    const AZUL_MEDIO: [number, number, number] = [11, 77, 162];

    const VERDE: [number, number, number] = [22, 163, 74];
    const VERDE_CLARO: [number, number, number] = [240, 253, 244];

    const AMARILLO: [number, number, number] = [245, 158, 11];
    const AMARILLO_CLARO: [number, number, number] = [255, 251, 235];

    const ROJO: [number, number, number] = [220, 38, 38];
    const ROJO_CLARO: [number, number, number] = [254, 242, 242];

    const GRIS: [number, number, number] = [71, 85, 105];
    const GRIS_CLARO: [number, number, number] = [248, 250, 252];

    const BLANCO: [number, number, number] = [255, 255, 255];

    // ============================================================
    // VARIABLES AUXILIARES
    // ============================================================

    let y = marginTop;

const agregarPagina = () => {
  pdf.addPage();
  y = marginTop;
};

    const verificarEspacio = (altoNecesario: number) => {
      if (y + altoNecesario > pageHeight - marginBottom) {
        agregarPagina();
      }
    };

    // ============================================================
    // FUNCIONES AUXILIARES
    // ============================================================

    const dibujarTituloSeccion = (
      titulo: string,
      subtitulo?: string
    ) => {
      verificarEspacio(subtitulo ? 24 : 18);

      pdf.setFillColor(...AZUL);
      pdf.roundedRect(
        marginX,
        y,
        contentWidth,
        subtitulo ? 22 : 16,
        2,
        2,
        "F"
      );

      pdf.setTextColor(...BLANCO);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);

      pdf.text(
        titulo,
        marginX + 5,
        y + 7
      );

      if (subtitulo) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);

        pdf.text(
          subtitulo,
          marginX + 5,
          y + 14
        );
      }

      y += subtitulo ? 27 : 21;
    };

    const formatoFecha = (fecha: string) => {
      if (!fecha) return "No especificado";

      const partes = fecha.split("-");

      if (partes.length !== 3) {
        return fecha;
      }

      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    };

    // ============================================================
    // PORTADA / ENCABEZADO
    // ============================================================

    pdf.setFillColor(...AZUL);

    pdf.roundedRect(
      marginX,
      y,
      contentWidth,
      32,
      3,
      3,
      "F"
    );

    pdf.setTextColor(...BLANCO);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);

    pdf.text(
      "INFORME DE EVALUACIÓN DE CONTROL INTERNO",
      pageWidth / 2,
      y + 12,
      {
        align: "center",
      }
    );

    pdf.setFontSize(11);

    pdf.text(
      "SISTEMAS DE ADMINISTRACIÓN",
      pageWidth / 2,
      y + 21,
      {
        align: "center",
      }
    );

    y += 38;

    // ============================================================
    // INFORMACIÓN GENERAL
    // ============================================================

    autoTable(pdf, {
      startY: y,

      body: [
        [
          "INSTITUCIÓN",
          "UNIVERSIDAD NACIONAL CASIMIRO SOTELO MONTENEGRO",
        ],
        [
          "PERÍODO",
          `Del ${formatoFecha(periodoInicio)} al ${formatoFecha(
            periodoFin
          )}`,
        ],
      ],

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 4,
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
        valign: "middle",
      },

      columnStyles: {
        0: {
          cellWidth: 45,
          fontStyle: "bold",
          fillColor: GRIS_CLARO,
          textColor: GRIS,
        },

        1: {
          textColor: [30, 41, 59],
        },
      },

      margin: {
        left: marginX,
        right: marginX,
      },
    });

    y = (pdf as any).lastAutoTable.finalY + 8;

    // ============================================================
    // RESULTADO GLOBAL
    // ============================================================

    dibujarTituloSeccion(
      "RESULTADO CONSOLIDADO",
      "Control Interno Global de los Sistemas de Administración"
    );

    const gap = 5;

    const cardWidth =
      (contentWidth - gap * 2) / 3;

    const cardHeight = 32;

    // ============================================================
    // TARJETA 1
    // ============================================================

    pdf.setFillColor(...AZUL_CLARO);

    pdf.roundedRect(
      marginX,
      y,
      cardWidth,
      cardHeight,
      3,
      3,
      "F"
    );

    pdf.setTextColor(...GRIS);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");

    pdf.text(
      "CALIFICACIÓN OBTENIDA",
      marginX + cardWidth / 2,
      y + 8,
      {
        align: "center",
      }
    );

    pdf.setTextColor(...AZUL_MEDIO);
    pdf.setFontSize(20);

    pdf.text(
      calificacionGlobal,
      marginX + cardWidth / 2,
      y + 20,
      {
        align: "center",
      }
    );

    pdf.setTextColor(...GRIS);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");

    pdf.text(
      "Puntaje máximo: 5",
      marginX + cardWidth / 2,
      y + 27,
      {
        align: "center",
      }
    );

    // ============================================================
    // TARJETA 2 - NIVEL
    // ============================================================

    const card2X =
      marginX + cardWidth + gap;

    let nivelColor:
      | [number, number, number]
      | undefined;

    let nivelFondo:
      | [number, number, number]
      | undefined;

    if (nivelGlobal === "Alto") {
      nivelColor = VERDE;
      nivelFondo = VERDE_CLARO;
    } else if (nivelGlobal === "Medio") {
      nivelColor = AMARILLO;
      nivelFondo = AMARILLO_CLARO;
    } else {
      nivelColor = ROJO;
      nivelFondo = ROJO_CLARO;
    }

    pdf.setFillColor(...nivelFondo);

    pdf.roundedRect(
      card2X,
      y,
      cardWidth,
      cardHeight,
      3,
      3,
      "F"
    );

    pdf.setTextColor(...GRIS);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");

    pdf.text(
      "NIVEL",
      card2X + cardWidth / 2,
      y + 8,
      {
        align: "center",
      }
    );

    pdf.setTextColor(...nivelColor);
    pdf.setFontSize(18);

    pdf.text(
      nivelGlobal,
      card2X + cardWidth / 2,
      y + 21,
      {
        align: "center",
      }
    );

    // ============================================================
    // TARJETA 3 - PORCENTAJE
    // ============================================================

    const card3X =
      card2X + cardWidth + gap;

    pdf.setFillColor(236, 254, 255);

    pdf.roundedRect(
      card3X,
      y,
      cardWidth,
      cardHeight,
      3,
      3,
      "F"
    );

    pdf.setTextColor(...GRIS);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");

    pdf.text(
      "% CUMPLIMIENTO",
      card3X + cardWidth / 2,
      y + 8,
      {
        align: "center",
      }
    );

    pdf.setTextColor(8, 145, 178);
    pdf.setFontSize(20);

    pdf.text(
      porcentajeGlobal,
      card3X + cardWidth / 2,
      y + 21,
      {
        align: "center",
      }
    );

    y += cardHeight + 10;

    // ============================================================
    // TABLA NIVEL DE CUMPLIMIENTO
    // ============================================================

    agregarPagina();

    dibujarTituloSeccion(
      "NIVEL DE CUMPLIMIENTO DEL CONTROL INTERNO",
      "Detalle de la calificación obtenida por cada Sistema de Administración"
    );

   const filasSistemas =
  sistemasVisibles.map(
    (
      sistema,
      index
    ) => {
      const val =
        Number(
          sistema.promedio ||
            0
        );

      const nivel =
        val === 5
          ? "Alto"
          : val >= 3
          ? "Medio"
          : "Bajo";

      return [
        index + 1,

        sistema.nombre,

        "5",

        val.toFixed(2),

        nivel,

        `${
          (
            (val / 5) *
            100
          ).toFixed(2)
        }%`,
      ];
    }
  );

const anchoTablaCumplimiento =
  sistemasVisibles.length <= 2
    ? 285
    : 300;

const margenTablaCumplimiento =
  (pageWidth -
    anchoTablaCumplimiento) /
  2;

    autoTable(pdf, {
      startY: y,

      head: [
        [
          "No.",
          "Sistema de Administración",
          "Puntaje máximo",
          "Calificación",
          "Nivel",
          "% Cumplimiento",
        ],
      ],

      body: filasSistemas,

      foot: [
        [
          "",
          "",
          "",
          "",
          "TOTAL",
          porcentajeGlobal,
        ],
      ],

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        valign: "middle",
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },

      headStyles: {
        fillColor: AZUL,
        textColor: BLANCO,
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
      },

      footStyles: {
        fillColor: GRIS_CLARO,
        textColor: AZUL_MEDIO,
        fontStyle: "bold",
      },

      columnStyles: {
  0: {
    cellWidth: 16,
    halign: "center",
  },

  1: {
    cellWidth:
      sistemasVisibles.length <= 2
        ? 140
        : 125,
  },

  2: {
    cellWidth: 32,
    halign: "center",
  },

  3: {
    cellWidth: 32,
    halign: "center",
  },

  4: {
    cellWidth: 30,
    halign: "center",
  },

  5: {
    cellWidth: 35,
    halign: "center",
  },
},

      didParseCell: (hookData) => {
        if (
          hookData.section === "body" &&
          hookData.column.index === 4
        ) {
          const valor = String(
            hookData.cell.raw
          );

          if (valor === "Alto") {
            hookData.cell.styles.textColor =
              VERDE;
            hookData.cell.styles.fillColor =
              VERDE_CLARO;
          } else if (valor === "Medio") {
            hookData.cell.styles.textColor =
              [180, 83, 9];
            hookData.cell.styles.fillColor =
              AMARILLO_CLARO;
          } else {
            hookData.cell.styles.textColor =
              ROJO;
            hookData.cell.styles.fillColor =
              ROJO_CLARO;
          }

          hookData.cell.styles.fontStyle =
            "bold";
        }
      },

     margin: {
  left: margenTablaCumplimiento,
  right: margenTablaCumplimiento,
},
    });

    y = (pdf as any).lastAutoTable.finalY + 6;

    pdf.setFontSize(7.5);
    pdf.setTextColor(...GRIS);

    const nota1 = pdf.splitTextToSize(
      "Nota 1: El porcentaje de cumplimiento se obtiene de la relación entre la calificación obtenida sobre el puntaje máximo.",
      contentWidth
    );

    pdf.text(
      nota1,
      marginX,
      y
    );

    y += 12;

    // ============================================================
// GRÁFICO
// ============================================================

const altoGraficoPDF =
  sistemasVisibles.length <= 2
    ? 58
    : sistemasVisibles.length <= 4
    ? 72
    : 90;

// Reservamos espacio para TÍTULO + GRÁFICO juntos
verificarEspacio(
  altoGraficoPDF + 35
);

dibujarTituloSeccion(
  "VALORACIÓN POR SISTEMA DE ADMINISTRACIÓN",
  "Comparación visual de la calificación obtenida por cada sistema"
);

if (chartRef.current) {
  try {
    const canvas =
      await html2canvas(
        chartRef.current,
        {
          scale: 2,
          useCORS: true,
          backgroundColor:
            "#ffffff",
          logging: false,
        }
      );

    const imgData =
      canvas.toDataURL(
        "image/png"
      );

    const maxGraphWidth =
      sistemasVisibles.length <= 2
        ? contentWidth * 0.65
        : sistemasVisibles.length <= 4
        ? contentWidth * 0.82
        : contentWidth - 10;

    const maxGraphHeight =
      altoGraficoPDF;

    let graphWidth =
      maxGraphWidth;

    let graphHeight =
      (canvas.height *
        graphWidth) /
      canvas.width;

    if (
      graphHeight >
      maxGraphHeight
    ) {
      const ratio =
        maxGraphHeight /
        graphHeight;

      graphHeight =
        maxGraphHeight;

      graphWidth *= ratio;
    }

    const graphX =
      (pageWidth -
        graphWidth) /
      2;

    pdf.addImage(
      imgData,
      "PNG",
      graphX,
      y,
      graphWidth,
      graphHeight
    );

    y +=
      graphHeight + 10;

  } catch (chartError) {
    console.error(
      "Error capturando gráfico:",
      chartError
    );
  }
}

    // ============================================================
    // NUEVA PÁGINA
    // NIVEL DE PREGUNTAS EVALUADAS
    // ============================================================

    agregarPagina();

    dibujarTituloSeccion(
      "NIVEL DE CUMPLIMIENTO DE LAS PREGUNTAS EVALUADAS",
      "Información para la implementación de acciones de mejora de las deficiencias de los Sistemas de Administración"
    );

 const nombresCortosCatalogo: Record<
  number,
  string
> = {
  2: "Recursos\nHumanos",

  3:
    "Planeación y\nProgramación",

  4:
    "Presupuesto",

  5:
    "Administración\nFinanciera",

  6:
    "Contabilidad\nIntegrada",

  7:
    "Contratación y\nBienes",

  8:
    "Inversiones y\nProyectos",

  9:
    "Tecnología de la\nInformación",
};

const nombresCortos =
  sistemasVisibles.map(
    (sistema) =>
      nombresCortosCatalogo[
        sistema.codigo
      ] ||
      sistema.nombre
  );

    const filasNiveles = [
      [
        "[5]",
        "Alto",
        ...resumenNiveles.Alto,
        totalFila(
          resumenNiveles.Alto
        ),
      ],

      [
        "[3 - 4]",
        "Medio",
        ...resumenNiveles.Medio,
        totalFila(
          resumenNiveles.Medio
        ),
      ],

      [
        "[0 - 2]",
        "Bajo",
        ...resumenNiveles.Bajo,
        totalFila(
          resumenNiveles.Bajo
        ),
      ],
[
  "",
  "TOTAL",

  ...Array.from({
    length:
      sistemasVisibles.length,
  }).map(
    (_, i) =>
      totalColumna(i)
  ),

  totalGeneralNiveles,
],
    ];

    autoTable(pdf, {
      startY: y,

      head: [
        [
          "Valor",
          "Nivel",
          ...nombresCortos,
          "TOTAL",
        ],
      ],

      body: filasNiveles,

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 7,
        cellPadding: 2.5,
        halign: "center",
        valign: "middle",
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },

      headStyles: {
        fillColor: AZUL,
        textColor: BLANCO,
        fontStyle: "bold",
        fontSize: 6.5,
        minCellHeight: 18,
      },

      didParseCell: (hookData) => {
        if (
          hookData.section === "body"
        ) {
          const row =
            hookData.row.index;

          if (
            hookData.column.index ===
            1
          ) {
            if (row === 0) {
              hookData.cell.styles.fillColor =
                VERDE;
              hookData.cell.styles.textColor =
                BLANCO;
            }

            if (row === 1) {
              hookData.cell.styles.fillColor =
                AMARILLO;
              hookData.cell.styles.textColor =
                [69, 26, 3];
            }

            if (row === 2) {
              hookData.cell.styles.fillColor =
                ROJO;
              hookData.cell.styles.textColor =
                BLANCO;
            }

            hookData.cell.styles.fontStyle =
              "bold";
          }

          if (row === 3) {
            hookData.cell.styles.fillColor =
              GRIS_CLARO;
            hookData.cell.styles.fontStyle =
              "bold";
          }
        }
      },

      margin: {
        left: marginX,
        right: marginX,
      },
    });

    y =
      (pdf as any).lastAutoTable
        .finalY + 12;

    // ============================================================
    // RESPUESTAS AFIRMATIVAS
    // ============================================================

    dibujarTituloSeccion(
      "RESPUESTAS AFIRMATIVAS DE LAS PREGUNTAS EVALUADAS",
      "Análisis de los elementos presentes y funcionando en cada Sistema de Administración"
    );

const filaPresente = [
  "Está Presente",

  ...sistemasVisibles.map(
    (sistema) =>
      getAfirmativaPorSistema(
        sistema.codigo
      )?.TotalPresente ?? 0
  ),

  totalPresente,
];

   const filaFuncionando = [
  "Está Funcionando",

  ...sistemasVisibles.map(
    (sistema) =>
      getAfirmativaPorSistema(
        sistema.codigo
      )
        ?.TotalFuncionando ??
      0
  ),

  totalFuncionando,
];

    autoTable(pdf, {
      startY: y,

      head: [
        [
          "Evaluación",
          ...nombresCortos,
          "TOTAL",
        ],
      ],

      body: [
        filaPresente,
        filaFuncionando,
      ],

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 7,
        cellPadding: 3,
        halign: "center",
        valign: "middle",
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },

      headStyles: {
        fillColor: AZUL,
        textColor: BLANCO,
        fontStyle: "bold",
        fontSize: 6.5,
        minCellHeight: 18,
      },

      columnStyles: {
        0: {
          cellWidth: 35,
          fontStyle: "bold",
        },
      },

      didParseCell: (hookData) => {
        if (
          hookData.section ===
            "body" &&
          hookData.column.index === 0
        ) {
          if (
            hookData.row.index === 0
          ) {
            hookData.cell.styles.fillColor =
              AZUL_CLARO;

            hookData.cell.styles.textColor =
              AZUL_MEDIO;
          } else {
            hookData.cell.styles.fillColor =
              VERDE_CLARO;

            hookData.cell.styles.textColor =
              VERDE;
          }
        }
      },

      margin: {
        left: marginX,
        right: marginX,
      },
    });

    y =
      (pdf as any).lastAutoTable
        .finalY + 7;

    pdf.setTextColor(...GRIS);
    pdf.setFontSize(7.5);

    const nota2 = pdf.splitTextToSize(
      "Nota 2: Corresponde a la relación entre el número de preguntas evaluadas afirmativamente y el total de preguntas respondidas de cada Sistema de Administración.",
      contentWidth
    );

    pdf.text(
      nota2,
      marginX,
      y
    );

    y += 8;

    const nota3 = pdf.splitTextToSize(
      "Nota 3: Corresponde a la relación entre el total de preguntas evaluadas afirmativamente y el número total de preguntas respondidas.",
      contentWidth
    );

    pdf.text(
      nota3,
      marginX,
      y
    );

    y += 13;

    

    // ============================================================
    // CRITERIOS DE VALORACIÓN
    // ============================================================

  verificarEspacio(90);

dibujarTituloSeccion(
  "CRITERIO DE VALORACIÓN"
);

    autoTable(pdf, {
      startY: y,

      head: [
        [
          "Criterio",
          "Condición",
          "Resultado",
        ],
      ],

      body: [
        [
          "SI",
          "Presente y Funcionando",
          "Cumplimiento igual o superior al 75%",
        ],

        [
          "NO",
          "No cumple el criterio",
          "Cumplimiento menor al 75%",
        ],
      ],

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 4,
        valign: "middle",
        lineColor: [226, 232, 240],
      },

      headStyles: {
        fillColor: AZUL,
        textColor: BLANCO,
        fontStyle: "bold",
      },

      columnStyles: {
        0: {
          cellWidth: 30,
          halign: "center",
          fontStyle: "bold",
        },
      },

      didParseCell: (hookData) => {
        if (
          hookData.section ===
            "body" &&
          hookData.column.index === 0
        ) {
          if (
            hookData.row.index === 0
          ) {
            hookData.cell.styles.fillColor =
              VERDE_CLARO;

            hookData.cell.styles.textColor =
              VERDE;
          } else {
            hookData.cell.styles.fillColor =
              ROJO_CLARO;

            hookData.cell.styles.textColor =
              ROJO;
          }
        }
      },

      margin: {
        left: marginX,
        right: marginX,
      },
    });

  
    // ============================================================
// POSICIÓN DESPUÉS DE CRITERIO DE VALORACIÓN
// ============================================================

y =
  (pdf as any).lastAutoTable
    .finalY + 10;

// ============================================================
// VERIFICAMOS SI CABE CONCLUSIONES Y RECOMENDACIONES
// ============================================================

if (
  y + 75 >
  pageHeight - marginBottom
) {
  agregarPagina();
}

// ============================================================
// CONCLUSIONES Y RECOMENDACIONES
// ============================================================

dibujarTituloSeccion(
  "CONCLUSIONES Y RECOMENDACIONES"
);

    // Obtenemos lo escrito actualmente en los textarea
    const textareas =
      reportRef.current?.querySelectorAll(
        "textarea"
      );

    const conclusiones =
      textareas?.[0]?.value?.trim() ||
      "Sin conclusiones registradas.";

    const recomendaciones =
      textareas?.[1]?.value?.trim() ||
      "Sin recomendaciones registradas.";

    // ============================================================
    // CONCLUSIONES
    // ============================================================

    pdf.setFillColor(...AZUL_CLARO);

    pdf.roundedRect(
      marginX,
      y,
      contentWidth,
      10,
      2,
      2,
      "F"
    );

    pdf.setTextColor(...AZUL_MEDIO);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);

    pdf.text(
      "CONCLUSIONES",
      marginX + 4,
      y + 6.5
    );

    y += 14;

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(9);
    pdf.setTextColor(
      30,
      41,
      59
    );

    const textoConclusiones =
      pdf.splitTextToSize(
        conclusiones,
        contentWidth - 10
      );

    pdf.text(
      textoConclusiones,
      marginX + 5,
      y
    );

    y +=
      textoConclusiones.length *
        5 +
      10;

    // ============================================================
    // RECOMENDACIONES
    // ============================================================

    verificarEspacio(35);

    pdf.setFillColor(...VERDE_CLARO);

    pdf.roundedRect(
      marginX,
      y,
      contentWidth,
      10,
      2,
      2,
      "F"
    );

    pdf.setTextColor(...VERDE);
    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(10);

    pdf.text(
      "RECOMENDACIONES",
      marginX + 4,
      y + 6.5
    );

    y += 14;

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(9);

    pdf.setTextColor(
      30,
      41,
      59
    );

    const textoRecomendaciones =
      pdf.splitTextToSize(
        recomendaciones,
        contentWidth - 10
      );

    pdf.text(
      textoRecomendaciones,
      marginX + 5,
      y
    );

    y +=
      textoRecomendaciones.length *
        5 +
      18;

    // ============================================================
    // FIRMAS
    // ============================================================

   verificarEspacio(55);

    const firmaWidth =
      contentWidth / 3;

    const firmaY =
      y + 18;

    pdf.setDrawColor(
      100,
      116,
      139
    );

    pdf.setLineWidth(0.3);

    // Elaborado
    pdf.line(
      marginX + 10,
      firmaY,
      marginX +
        firmaWidth -
        10,
      firmaY
    );

    // Revisado
    pdf.line(
      marginX +
        firmaWidth +
        10,
      firmaY,
      marginX +
        firmaWidth * 2 -
        10,
      firmaY
    );

    // Aprobado
    pdf.line(
      marginX +
        firmaWidth * 2 +
        10,
      firmaY,
      pageWidth -
        marginX -
        10,
      firmaY
    );

 // ============================================================
// ELABORADO POR
// ============================================================

pdf.setFont(
  "helvetica",
  "bold"
);

pdf.setFontSize(12);

pdf.setTextColor(...AZUL);

pdf.text(
  "ELABORADO POR:",
  marginX +
    firmaWidth / 2,
  firmaY + 6,
  {
    align: "center",
  }
);

// ============================================================
// NOMBRE DEL RESPONSABLE
// Solo aparece cuando existe un usuario responsable.
// Administrador / Subadministrador queda vacío.
// ============================================================

if (elaboradoPor) {
  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(9);

  pdf.setTextColor(...GRIS);

  const nombresElaboradores =
    pdf.splitTextToSize(
      elaboradoPor,
      firmaWidth - 20
    );

  pdf.text(
    nombresElaboradores,
    marginX +
      firmaWidth / 2,
    firmaY + 12,
    {
      align: "center",
    }
  );
}
    pdf.text(
      "REVISADO POR:",
      marginX +
        firmaWidth +
        firmaWidth / 2,
      firmaY + 6,
      {
        align: "center",
      }
    );

    pdf.text(
      "APROBADO POR:",
      marginX +
        firmaWidth * 2 +
        firmaWidth / 2,
      firmaY + 6,
      {
        align: "center",
      }
    );

    y = firmaY + 16;

    // ============================================================
    // FECHA
    // ============================================================

    const fechaActual =
      new Date().toLocaleDateString(
        "es-NI",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

    const fechaBoxWidth = 65;
    const fechaBoxHeight = 10;

    pdf.setFillColor(...AZUL);

    pdf.roundedRect(
      marginX,
      y,
      22,
      fechaBoxHeight,
      1,
      1,
      "F"
    );

    pdf.setTextColor(...BLANCO);

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(8);

    pdf.text(
      "FECHA",
      marginX + 11,
      y + 6.5,
      {
        align: "center",
      }
    );

    pdf.setDrawColor(
      203,
      213,
      225
    );

    pdf.rect(
      marginX + 22,
      y,
      fechaBoxWidth - 22,
      fechaBoxHeight
    );

    pdf.setTextColor(...GRIS);

    pdf.text(
      fechaActual,
      marginX +
        22 +
        (fechaBoxWidth - 22) / 2,
      y + 6.5,
      {
        align: "center",
      }
    );

    // ============================================================
    // PIE DE PÁGINA EN TODAS LAS HOJAS
    // ============================================================

    const totalPages =
      pdf.getNumberOfPages();

    for (
      let pagina = 1;
      pagina <= totalPages;
      pagina++
    ) {
      pdf.setPage(pagina);

      // Línea
      pdf.setDrawColor(
        226,
        232,
        240
      );

      pdf.setLineWidth(0.2);

      pdf.line(
        marginX,
        pageHeight - 9,
        pageWidth - marginX,
        pageHeight - 9
      );

      // Izquierda
      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(7);

      pdf.setTextColor(
        100,
        116,
        139
      );

      pdf.text(
        "Informe de Evaluación de Control Interno",
        marginX,
        pageHeight - 5
      );

      // Derecha
      pdf.text(
        `Página ${pagina} de ${totalPages}`,
        pageWidth - marginX,
        pageHeight - 5,
        {
          align: "right",
        }
      );
    }

    // ============================================================
    // GUARDAR
    // ============================================================

    pdf.save(
      "Informe_Control_Interno.pdf"
    );

    await Swal.fire({
      icon: "success",
      title: "PDF generado",
      text: "El informe se exportó correctamente.",
      confirmButtonColor: "#0B4DA2",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error(
      "ERROR EXPORTANDO PDF:",
      error
    );

    const mensaje =
      error instanceof Error
        ? error.message
        : "Ocurrió un error desconocido al generar el PDF.";

    await Swal.fire({
      icon: "error",
      title:
        "No se pudo generar el PDF",
      text: mensaje,
      confirmButtonColor:
        "#0B4DA2",
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
  // 4. FORMATEAR FECHAS PARA MOSTRAR
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
  // 5. CONFIRMACIÓN
  // ============================================================

  const confirmacion = await Swal.fire({
    icon: "warning",
    title: "¿Aprobar resultados?",
    html: `
      <div style="text-align:left; line-height:1.7; color:#475569;">

        Está a punto de aprobar los resultados consolidados
        de los <strong>Sistemas de Administración</strong>.

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
          <li>Se guardarán los resultados de los 8 Sistemas de Administración.</li>
          <li>Se guardará el período evaluado.</li>
          <li>Se guardarán las conclusiones.</li>
          <li>Se guardarán las recomendaciones.</li>
          <li>La evaluación quedará aprobada y cerrada.</li>
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
  // 6. SI CANCELA
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

      // RESULTADO GLOBAL
      calificacionGlobal:
        Number(calificacionGlobal) || 0,

      nivelGlobal,

      porcentajeGlobal:
        Number(
          String(porcentajeGlobal).replace("%", "")
        ) || 0,

      // ========================================================
      // 8 SISTEMAS DE ADMINISTRACIÓN
      // ========================================================

     recursosHumanos:
  Number(
    getSistemaPorCodigo(2)?.Promedio ?? 0
  ),

planeacionProgramacion:
  Number(
    getSistemaPorCodigo(3)?.Promedio ?? 0
  ),

presupuesto:
  Number(
    getSistemaPorCodigo(4)?.Promedio ?? 0
  ),

administracionFinanciera:
  Number(
    getSistemaPorCodigo(5)?.Promedio ?? 0
  ),

contabilidadIntegrada:
  Number(
    getSistemaPorCodigo(6)?.Promedio ?? 0
  ),

contratacionBienesServicios:
  Number(
    getSistemaPorCodigo(7)?.Promedio ?? 0
  ),

inversionesProgramasProyectos:
  Number(
    getSistemaPorCodigo(8)?.Promedio ?? 0
  ),

tecnologiaInformacion:
  Number(
    getSistemaPorCodigo(9)?.Promedio ?? 0
  ),

      // ========================================================
      // CONCLUSIONES Y RECOMENDACIONES
      // ========================================================

      conclusiones:
        conclusiones.trim(),

      recomendaciones:
        recomendaciones.trim(),
    };

    console.log(
      "Resultado Matriz SA que se enviará:",
      resultadoGuardar
    );

    // ============================================================
    // 9. GUARDAR EN Resultado_MatrizSA
    // ============================================================

    const respuestaGuardar = await fetch(
      "/api/resultados/resultado-matriz-sa",
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
      "Respuesta guardado Matriz SA:",
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
          "No se pudieron guardar los resultados de los Sistemas de Administración."
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
      "Resultado_MatrizSA Id:",
      resultadoId
    );

    // ============================================================
    // 12. APROBAR RESULTADOS
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
          tipo: "MATRIZ_SA",
        }),
      }
    );

    const datosAprobacion =
      await respuestaAprobar.json();

    console.log(
      "Respuesta aprobación Matriz SA:",
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
    // 14. MARCAR COMO APROBADO EN FRONTEND
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

          Los resultados de los
          <strong>Sistemas de Administración</strong>
          fueron
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
      "Error guardando/aprobando Matriz SA:",
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

//Exportar a excel
/*const exportarExcel = () => {
  const input = reportRef.current;
  if (!input) return;

  const cloned = input.cloneNode(true) as HTMLElement;

  // Copiar estilos reales de pantalla
  const copiarEstilos = (original: Element, copia: Element) => {
    const style = window.getComputedStyle(original as HTMLElement);

    const props = [
      "background-color",
      "color",
      "font-size",
      "font-weight",
      "font-family",
      "text-align",
      "vertical-align",
      "border",
      "border-top",
      "border-right",
      "border-bottom",
      "border-left",
      "padding",
      "width",
      "height",
    ];

    props.forEach((prop) => {
      (copia as HTMLElement).style.setProperty(
        prop,
        style.getPropertyValue(prop)
      );
    });

    Array.from(original.children).forEach((child, index) => {
      const clonedChild = copia.children[index];
      if (clonedChild) copiarEstilos(child, clonedChild);
    });
  };

  copiarEstilos(input, cloned);

  // Quitar botones, inputs y controles
  cloned.querySelectorAll("button, select, textarea").forEach((el) => {
    el.remove();
  });

  cloned.querySelectorAll("input").forEach((el) => {
    const inputEl = el as HTMLInputElement;
    const span = document.createElement("span");
    span.textContent = inputEl.value || "";
    el.replaceWith(span);
  });

  // Quitar gráficos para que Excel no se deforme
  cloned.querySelectorAll("svg, canvas, .recharts-wrapper").forEach((el) => {
    el.remove();
  });

  // Corregir textos verticales / columnas estrechas
  cloned.querySelectorAll("*").forEach((el) => {
    const item = el as HTMLElement;
    item.style.whiteSpace = "normal";
    item.style.wordBreak = "normal";
    item.style.overflow = "visible";
    item.style.height = "auto";
    item.style.minHeight = "0";
    item.style.maxHeight = "none";
  });

  // Reemplazar firmas para Excel
  const fecha = new Date().toLocaleDateString();

  const firmasExcel = document.createElement("table");
  firmasExcel.style.width = "100%";
  firmasExcel.style.borderCollapse = "collapse";

  firmasExcel.innerHTML = `
    <tr>
      <td style="border:none;text-align:center;font-weight:bold;padding-top:30px;">
        ____________________<br/>ELABORADO POR:
      </td>
      <td style="border:none;text-align:center;font-weight:bold;padding-top:30px;">
        ____________________<br/>REVISADO POR:
      </td>
      <td style="border:none;text-align:center;font-weight:bold;padding-top:30px;">
        ____________________<br/>APROBADO POR:
      </td>
    </tr>
    <tr>
      <td colspan="3" style="border:none;padding-top:20px;text-align:left;">
        <table style="border-collapse:collapse;width:260px;">
          <tr>
            <td style="border:1px solid #000;font-weight:bold;text-align:center;width:100px;padding:4px;">
              FECHA:
            </td>
            <td style="border:1px solid #000;text-align:center;width:160px;padding:4px;">
              ${fecha}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  const firmasOriginal = cloned.querySelector(".excel-firmas");
  if (firmasOriginal) {
    firmasOriginal.replaceWith(firmasExcel);
  }

  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
          }

          table {
            border-collapse: collapse;
          }

          th, td {
            border: 1px solid #000;
            padding: 6px;
            text-align: center;
            vertical-align: middle;
            mso-number-format: "\\@";
          }

          .pdf-section {
            margin-bottom: 18px;
          }
        </style>
      </head>

      <body>
        ${cloned.innerHTML}
      </body>
    </html>
  `;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "Informe_Control_Interno.xls";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};*/

 return (
  <div className="min-h-screen bg-slate-50/70 p-4 md:p-6">

    {/* ============================================================
        CABECERA DE LA PÁGINA
    ============================================================ */}
    <div className="mx-auto mb-5 max-w-[1600px]">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B4DA2] via-[#1268A8] to-[#0891B2] px-6 py-5 text-white shadow-lg">

        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-24 top-12 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
         
            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
              Evaluación de Control Interno
            </h1>

            <p className="mt-1 text-sm text-blue-50">
              Resultados consolidados de los Sistemas de Administración.
            </p>
          </div>

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
      inline-flex h-11 items-center justify-center gap-2
      rounded-xl px-5
      text-sm font-bold text-white shadow-sm
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
        <span
          className="
            h-4 w-4
            animate-spin
            rounded-full
            border-2
            border-white/40
            border-t-white
          "
        />

        Aprobando...
      </>
    ) : resultadosAprobados ? (
      <>
        <BadgeCheck className="h-5 w-5" />
        Resultados aprobados
      </>
    ) : (
      <>
        <BadgeCheck className="h-5 w-5" />
        Aprobar resultados
      </>
    )}
  </button>
)}

          </div>
        </div>
      </div>
    </div>


    {/* ============================================================
        CONTENIDO DEL INFORME
    ============================================================ */}
  <div
  id="informe-control-interno"
  ref={reportRef}
  className="mx-auto max-w-[1600px] bg-transparent"
>
      <div className="space-y-6 text-slate-900">


        {/* ========================================================
            INFORMACIÓN GENERAL
        ======================================================== */}
        <div className="pdf-section pdf-wide-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="bg-[#123D5C] px-6 py-4 text-center">
          

            <h2 className="mt-1 text-lg font-black uppercase tracking-wide text-white md:text-xl">
              Informe de Evaluación de Control Interno de los Sistemas de Administración
            </h2>
          </div>

          <div className="grid grid-cols-1 border-b border-slate-200 md:grid-cols-12">
            <div className="bg-slate-50 px-4 py-3 font-bold uppercase text-slate-600 md:col-span-3">
              Institución
            </div>

            <div className="px-4 py-3 font-semibold text-slate-800 md:col-span-9">
              UNIVERSIDAD NACIONAL CASIMIRO SOTELO MONTENEGRO
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="bg-slate-50 px-4 py-3 font-bold uppercase text-slate-600 md:col-span-3">
              Periodo
            </div>

            <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:col-span-9">

              <span className="text-sm font-medium text-slate-500">
                Del
              </span>

              <input
  type="date"
  value={periodoInicio}
  onChange={(e) =>
    setPeriodoInicio(e.target.value)
  }
  disabled={
    cargandoPermisos ||
  cargandoResultadoGuardado ||
  aprobandoResultados ||
  resultadosAprobados
  }
  className={`
    rounded-lg border px-3 py-2 text-sm
    outline-none transition

    ${
      resultadosAprobados
        ? `
          cursor-not-allowed
          border-slate-200
          bg-slate-100
          text-slate-500
        `
        : `
          border-slate-200
          bg-white
          focus:border-blue-400
          focus:ring-2
          focus:ring-blue-100
        `
    }
  `}
/>

              <span className="text-sm font-medium text-slate-500">
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
    rounded-lg border px-3 py-2 text-sm
    outline-none transition

    ${
      resultadosAprobados
        ? `
          cursor-not-allowed
          border-slate-200
          bg-slate-100
          text-slate-500
        `
        : `
          border-slate-200
          bg-white
          focus:border-blue-400
          focus:ring-2
          focus:ring-blue-100
        `
    }
  `}
/>

            </div>
          </div>
        </div>


        {/* ========================================================
            RESULTADO GLOBAL
        ======================================================== */}
        <div className="pdf-section pdf-wide-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              Resultado consolidado
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-900">
              Control Interno Global de los Sistemas de Administración
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">

            <div className="border-b border-slate-200 p-6 text-center md:border-b-0 md:border-r">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Calificación obtenida
              </p>

              <p className="mt-2 text-4xl font-black text-blue-700">
                {calificacionGlobal}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Puntaje máximo: 5
              </p>
            </div>


            <div className="border-b border-slate-200 p-6 text-center md:border-b-0 md:border-r">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Nivel
              </p>

              <div className="mt-3 flex justify-center">
                <span
                  className={`inline-flex rounded-full px-5 py-2 text-sm font-black ${
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


            <div className="p-6 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                % Cumplimiento
              </p>

              <p className="mt-2 text-4xl font-black text-cyan-700">
                {porcentajeGlobal}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Resultado general
              </p>
            </div>

          </div>
        </div>


        {/* ========================================================
            NIVEL DE CUMPLIMIENTO POR SISTEMA
        ======================================================== */}
        <div className="pdf-section pdf-wide-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">
          
            <h2 className="mt-1 text-lg font-black text-slate-900">
              Nivel de Cumplimiento del Control Interno
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Detalle de la calificación obtenida por cada Sistema de Administración.
            </p>
          </div>


          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">

              <thead>
                <tr className="bg-[#123D5C] text-white">

                  <th className="border-r border-white/10 px-3 py-3 text-center">
                    No.
                  </th>

                  <th className="border-r border-white/10 px-4 py-3 text-left">
                    Sistema de Administración
                  </th>

                  <th className="border-r border-white/10 px-3 py-3 text-center">
                    Puntaje máximo
                  </th>

                  <th className="border-r border-white/10 px-3 py-3 text-center">
                    Calificación
                  </th>

                  <th className="border-r border-white/10 px-3 py-3 text-center">
                    Nivel
                  </th>

                  <th className="px-3 py-3 text-center">
                    % Cumplimiento
                  </th>

                </tr>
              </thead>


              <tbody>
                {sistemasVisibles.map((sistema, index) => {

  const val =
    Number(
      sistema.promedio || 0
    );

  return (
                    <tr
                      key={sistema.codigo}
                      className="border-b border-slate-100 transition hover:bg-blue-50/40"
                    >

                      <td className="px-3 py-3 text-center font-bold text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {sistema.nombre}
                      </td>

                      <td className="px-3 py-3 text-center font-bold">
                        5
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span className="font-black text-blue-700">
                          {val.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-center">

                        <span
                          className={`inline-flex min-w-[75px] justify-center rounded-full px-3 py-1 text-xs font-black ${
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

                      <td className="px-3 py-3 text-center font-black text-slate-700">
                        {((val / 5) * 100).toFixed(2)}%
                      </td>

                    </tr>
                  );
                })}


                <tr className="bg-slate-50">

                  <td
                    colSpan={5}
                    className="px-4 py-4 text-right text-sm font-black uppercase text-slate-700"
                  >
                    Total
                  </td>

                  <td className="px-4 py-4 text-center text-base font-black text-blue-700">
  {porcentajeGlobal}
</td>

                </tr>

              </tbody>
            </table>
          </div>


          <div className="border-t border-slate-100 bg-blue-50/40 px-5 py-3 text-xs text-slate-600">
            <span className="font-black text-blue-700">
              Nota 1:
            </span>{" "}
            El porcentaje de cumplimiento se obtiene de la relación entre la
            calificación obtenida sobre el puntaje máximo.
          </div>

        </div>


        {/* ========================================================
            GRÁFICO
        ======================================================== */}
        <div className="pdf-section pdf-wide-section rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-5">

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              Representación gráfica
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-900">
              Valoración por Sistema de Administración
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Comparación visual de la calificación obtenida por cada sistema.
            </p>

          </div>


        <div
  className={`w-full rounded-xl bg-slate-50/70 p-3 ${
    chartData.length <= 2
      ? "h-[330px]"
      : "h-[500px]"
  }`}
>
  <div ref={chartRef}>
    <ResponsiveContainer
      width="100%"
      height={
        chartData.length <= 2
          ? 270
          : 430
      }
    >
      
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 70,
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
                  tick={{ fontSize: 12 }}
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

              <Bar
  dataKey="valor"
  radius={[8, 8, 0, 0]}
  barSize={
    chartData.length <= 2
      ? 80
      : chartData.length <= 4
      ? 60
      : 45
  }
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
          </div>
        </div>


        {/* ========================================================
            NIVEL DE PREGUNTAS EVALUADAS
        ======================================================== */}
        <div className="pdf-section pdf-wide-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">

      

            <h2 className="mt-1 text-lg font-black text-slate-900">
              Nivel de Cumplimiento de las Preguntas Evaluadas
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Para la implementación de acciones de mejora de las deficiencias de los Sistemas de Administración.
            </p>

          </div>


         <div className="overflow-x-auto">
  <table className="pdf-wide-table w-full border-collapse text-xs">

    <thead>
      <tr className="bg-[#123D5C] text-white">

        <th className="border-r border-white/10 px-3 py-3">
          Valor
        </th>

        <th className="border-r border-white/10 px-3 py-3">
          Nivel
        </th>

        {sistemasVisibles.map((sistema) => (
          <th
            key={`nivel-head-${sistema.codigo}`}
            className="border-r border-white/10 px-3 py-3"
          >
            {sistema.nombre}
          </th>
        ))}

        <th className="bg-blue-700 px-3 py-3">
          TOTAL
        </th>

      </tr>
    </thead>

    <tbody>

      {/* ALTO */}
      <tr className="border-b border-slate-100">

        <td className="bg-emerald-50 px-3 py-3 text-center font-black text-emerald-700">
          [5]
        </td>

        <td className="bg-emerald-500 px-3 py-3 text-center font-black text-white">
          Alto
        </td>

        {sistemasVisibles.map((sistema, i) => (
          <td
            key={`alto-${sistema.codigo}`}
            className="px-3 py-3 text-center font-semibold"
          >
            {resumenNiveles.Alto[i] ?? 0}
          </td>
        ))}

        <td className="bg-blue-50 px-3 py-3 text-center font-black text-blue-700">
          {totalFila(resumenNiveles.Alto)}
        </td>

      </tr>

      {/* MEDIO */}
      <tr className="border-b border-slate-100">

        <td className="bg-amber-50 px-3 py-3 text-center font-black text-amber-700">
          [3 - 4]
        </td>

        <td className="bg-amber-400 px-3 py-3 text-center font-black text-amber-950">
          Medio
        </td>

        {sistemasVisibles.map((sistema, i) => (
          <td
            key={`medio-${sistema.codigo}`}
            className="px-3 py-3 text-center font-semibold"
          >
            {resumenNiveles.Medio[i] ?? 0}
          </td>
        ))}

        <td className="bg-blue-50 px-3 py-3 text-center font-black text-blue-700">
          {totalFila(resumenNiveles.Medio)}
        </td>

      </tr>

      {/* BAJO */}
      <tr className="border-b border-slate-100">

        <td className="bg-red-50 px-3 py-3 text-center font-black text-red-700">
          [0 - 2]
        </td>

        <td className="bg-red-500 px-3 py-3 text-center font-black text-white">
          Bajo
        </td>

        {sistemasVisibles.map((sistema, i) => (
          <td
            key={`bajo-${sistema.codigo}`}
            className="px-3 py-3 text-center font-semibold"
          >
            {resumenNiveles.Bajo[i] ?? 0}
          </td>
        ))}

        <td className="bg-blue-50 px-3 py-3 text-center font-black text-blue-700">
          {totalFila(resumenNiveles.Bajo)}
        </td>

      </tr>

      {/* TOTAL */}
      <tr className="bg-slate-100 font-black">

        <td
          colSpan={2}
          className="px-3 py-3 text-center uppercase"
        >
          Total
        </td>

        {sistemasVisibles.map((sistema, i) => (
          <td
            key={`total-${sistema.codigo}`}
            className="px-3 py-3 text-center"
          >
            {totalColumna(i)}
          </td>
        ))}

        <td className="bg-blue-100 px-3 py-3 text-center text-blue-800">
          {totalGeneralNiveles}
        </td>

      </tr>

    </tbody>
  </table>
</div>
        </div>


        {/* ========================================================
            RESPUESTAS AFIRMATIVAS
        ======================================================== */}
        <div className="pdf-section pdf-wide-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600">
              Análisis de respuestas
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-900">
              Respuestas Afirmativas de las Preguntas Evaluadas
            </h2>

            <p className="mt-2 max-w-5xl text-xs leading-5 text-slate-500">
              ¿Los elementos que forman parte de cada uno de los sistemas de
              administración se encuentran operando juntos y de manera integrada?
            </p>

          </div>


        <div className="overflow-x-auto p-4">

  <table className="pdf-wide-table w-full border-collapse text-xs">

    <thead>
      <tr className="bg-[#123D5C] text-white">

        <th className="min-w-[130px] px-3 py-3">
          Evaluación
        </th>

        {sistemasVisibles.map((sistema) => (
          <th
            key={`afirmativa-head-${sistema.codigo}`}
            className="px-3 py-3"
          >
            {sistema.nombre}
          </th>
        ))}

        <th className="bg-blue-700 px-3 py-3">
          Total preguntas afirmativas
        </th>

        <th className="bg-amber-500 px-3 py-3 text-amber-950">
          Nota
        </th>

      </tr>
    </thead>

    <tbody>

      {/* PRESENTE */}
      <tr className="border-b border-slate-100">

        <td
          rowSpan={2}
          className="bg-blue-50 px-3 py-3 text-center font-black text-blue-800"
        >
          Está Presente
          <br />

          <span className="text-[10px]">
            (Nota 2)
          </span>
        </td>

        {sistemasVisibles.map((sistema) => (
          <td
            key={`presente-1-${sistema.codigo}`}
            className="bg-blue-50/40 px-3 py-3 text-center font-bold"
          >
            {getAfirmativaPorSistema(
              sistema.codigo
            )?.TotalPresente ?? 0}
          </td>
        ))}

        <td className="bg-blue-100 px-3 py-3 text-center font-black text-blue-800">
          {totalPresente}
        </td>

        <td
          rowSpan={2}
          className="bg-amber-50 px-3 py-3 text-center font-black text-amber-700"
        >
          Nota 3
        </td>

      </tr>

      {/* FILA SECUNDARIA PRESENTE */}
      <tr className="border-b border-slate-200">

        {sistemasVisibles.map((sistema) => (
          <td
            key={`presente-2-${sistema.codigo}`}
            className="px-3 py-2 text-center font-semibold text-slate-400"
          >
            0
          </td>
        ))}

        <td className="bg-slate-50 px-3 py-2 text-center font-bold">
          0
        </td>

      </tr>

      {/* FUNCIONANDO */}
      <tr className="border-b border-slate-100">

        <td
          rowSpan={2}
          className="bg-emerald-50 px-3 py-3 text-center font-black text-emerald-800"
        >
          Está Funcionando
          <br />

          <span className="text-[10px]">
            (Nota 2)
          </span>
        </td>

        {sistemasVisibles.map((sistema) => (
          <td
            key={`funciona-1-${sistema.codigo}`}
            className="bg-emerald-50/40 px-3 py-3 text-center font-bold"
          >
            {getAfirmativaPorSistema(
              sistema.codigo
            )?.TotalFuncionando ?? 0}
          </td>
        ))}

        <td className="bg-emerald-100 px-3 py-3 text-center font-black text-emerald-800">
          {totalFuncionando}
        </td>

        <td
          rowSpan={2}
          className="bg-amber-50 px-3 py-3 text-center font-black text-amber-700"
        >
          Nota 3
        </td>

      </tr>

      {/* FILA SECUNDARIA FUNCIONANDO */}
      <tr>

        {sistemasVisibles.map((sistema) => (
          <td
            key={`funciona-2-${sistema.codigo}`}
            className="px-3 py-2 text-center font-semibold text-slate-400"
          >
            0
          </td>
        ))}

        <td className="bg-slate-50 px-3 py-2 text-center font-bold">
          0
        </td>

      </tr>

    </tbody>
  </table>
</div>

          <div className="space-y-2 border-t border-slate-100 bg-slate-50 px-5 py-4 text-xs leading-5 text-slate-600">

            <div>
              <span className="font-black text-blue-700">
                Nota 2:
              </span>{" "}
              Corresponde a la relación entre el número de preguntas evaluadas
              afirmativamente y el total de preguntas respondidas de cada
              sistema de administración.
            </div>

            <div>
              <span className="font-black text-blue-700">
                Nota 3:
              </span>{" "}
              Corresponde a la relación entre el total de preguntas evaluadas
              afirmativamente y el número total de preguntas respondidas.
            </div>

          </div>
        </div>


        {/* ========================================================
            CRITERIO PRESENTE Y FUNCIONANDO
        ======================================================== */}
        <div className="pdf-section pdf-wide-section overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              Criterio de valoración
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


        {/* ========================================================
            CONCLUSIONES Y RECOMENDACIONES
        ======================================================== */}
        <div className="pdf-section pdf-wide-section grid grid-cols-1 gap-5 lg:grid-cols-2">

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 bg-blue-50 px-5 py-3">
                          <MessageSquareText className="h-5 w-5 text-blue-700" />
              <p className="text-sm font-black text-blue-900">
                Conclusiones
              </p>
            </div>

         <textarea
  value={conclusiones}
  onChange={(e) => setConclusiones(e.target.value)}
  disabled={
    resultadosAprobados ||
    cargandoResultadoGuardado
  }
  className={`
    min-h-[170px] w-full resize-none p-5
    text-sm leading-6 outline-none
    transition-all duration-200
    placeholder:text-slate-400

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


          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 bg-emerald-50 px-5 py-3">
               <PenLine className="h-5 w-5 text-emerald-700" />
              <p className="text-sm font-black text-emerald-900">
                Recomendaciones
              </p>
            </div>

            <textarea
  value={recomendaciones}
  onChange={(e) => setRecomendaciones(e.target.value)}
  disabled={
    resultadosAprobados ||
    cargandoResultadoGuardado
  }
  className={`
    min-h-[170px] w-full resize-none p-5
    text-sm leading-6 outline-none
    transition-all duration-200
    placeholder:text-slate-400

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
          focus:bg-emerald-50/20
        `
    }
  `}
  placeholder="Escriba aquí las recomendaciones..."
/>
          </div>

        </div>


        {/* ========================================================
            FIRMAS
        ======================================================== */}
        <div className="pdf-section pdf-wide-section rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">

        
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">

            <div className="text-center">
              <div className="mx-auto mb-3 h-px w-[200px] bg-slate-500" />
              <div className="text-xs font-black uppercase tracking-wide text-slate-700">
                Elaborado por:
              </div>
            </div>


            <div className="text-center">
              <div className="mx-auto mb-3 h-px w-[200px] bg-slate-500" />
              <div className="text-xs font-black uppercase tracking-wide text-slate-700">
                Revisado por:
              </div>
            </div>


            <div className="text-center">
              <div className="mx-auto mb-3 h-px w-[200px] bg-slate-500" />
              <div className="text-xs font-black uppercase tracking-wide text-slate-700">
                Aprobado por:
              </div>
            </div>

          </div>
        </div>


        {/* ========================================================
            FECHA
        ======================================================== */}
        <div className="pdf-section w-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="grid grid-cols-12">

            <div className="col-span-5 bg-[#123D5C] px-3 py-2 text-center text-xs font-black uppercase text-white">
              Fecha
            </div>

            <div className="col-span-7 px-3 py-2 text-center text-sm font-bold text-slate-700">
              {new Date().toLocaleDateString()}
            </div>

          </div>
        </div>

      </div>
    </div>


    {/* ============================================================
        LOADER PDF
    ============================================================ */}
    {exportandoPDF && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
        <div className="rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur-md">
          <HoloPulse />
        </div>
      </div>
    )}

  </div>
);
}
