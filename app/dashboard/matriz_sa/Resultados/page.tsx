"use client";

import { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

import { useEffect, useState } from "react";
import { HoloPulse } from "@/components/ui/holo-pulse-loader";
import {
  FileDown,
  BadgeCheck,
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

 const [data, setData] = useState<any[]>([]);

const [afirmativas, setAfirmativas] = useState<any[]>([]);

useEffect(() => {
  fetch("/api/resultados/sistemas")
    .then(res => res.json())
    .then(setData);

  fetch("/api/resultados/sistemas-detalle")
    .then(res => res.json())
    .then((res) => {
      console.log("AFIRMATIVAS API:", res);
      setAfirmativas(res);
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

type SistemaData = {
  Sistema: number | string;
  Promedio: number;
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


const chartData = data.map((item: SistemaData, index: number) => {
  const codigo = Number(item.Sistema);
  const nombreSistema = sistemas[codigo - 2] || `Sistema ${codigo}`;




  return {
    sistemaCorto:
      nombreSistema.length > 22
        ? nombreSistema.substring(0, 22) + "..."
        : nombreSistema,
    sistema: nombreSistema,
    valor: Number(item.Promedio) || 0,
    color: colores[index % colores.length],
  };
});

// CONTROL INTERNO GLOBAL DE LOS SISTEMAS DE INFORMACIÓN
const calificacionesGlobales = data.map((item) =>
  Number(item.Promedio || 0)
);

const calificacionGlobal = (
  calificacionesGlobales.reduce((acc, val) => acc + val, 0) /
  calificacionesGlobales.length
).toFixed(2);

const nivelGlobal =
  Number(calificacionGlobal) === 5
    ? "Alto"
    : Number(calificacionGlobal) >= 3
    ? "Medio"
    : "Bajo";

const porcentajeGlobal = `${((Number(calificacionGlobal) / 5) * 100).toFixed(2)}%`;


//NIVEL DE CUMPLIMEINTO DE LAS PREGUNTAS EVALUADAS DE LOS S.A//
  const resumenNiveles = {
    Alto: Array(8).fill(0),
    Medio: Array(8).fill(0),
    Bajo: Array(8).fill(0),
  };

  data.forEach((item: any) => {
    const sistema = Number(item.Sistema);
    const index = sistema - 2;

    if (index < 0 || index > 7) return;

    const valor = Number(item.Promedio || 0);

    if (valor === 5) {
      resumenNiveles.Alto[index]++;
    } else if (valor >= 3) {
      resumenNiveles.Medio[index]++;
    } else {
      resumenNiveles.Bajo[index]++;
    }
  });

  const totalFila = (fila: number[]) =>
    fila.reduce((acc, val) => acc + val, 0);

  const totalColumna = (i: number) =>
    resumenNiveles.Alto[i] +
    resumenNiveles.Medio[i] +
    resumenNiveles.Bajo[i];

const totalGeneralNiveles: number = Array.from({ length: 8 }).reduce(
  (acc: number, _: unknown, i: number) => acc + totalColumna(i),
  0
);


// RESPUESTAS AFIRMATIVAS DE LAS PREGUNTAS EVALUADAS
function getAfirmativa(index: number) {
  const sistema = index + 2;
  return afirmativas.find((a: any) => Number(a.Sistema) === sistema);
}

const totalPresente = afirmativas.reduce(
  (acc, cur) => acc + Number(cur.TotalPresente || 0),
  0
);

const totalFuncionando = afirmativas.reduce(
  (acc, cur) => acc + Number(cur.TotalFuncionando || 0),
  0
);

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

const promedioGeneral = (
  data.reduce((acc, cur) => acc + (Number(cur.Promedio) || 0), 0) / 8
).toFixed(2);


const [exportandoPDF, setExportandoPDF] = useState(false);

const [puedeAprobarResultados, setPuedeAprobarResultados] =
  useState(false);

const [cargandoPermisos, setCargandoPermisos] =
  useState(true);

const sistemaMap = [2, 3, 4, 5, 6, 7, 8, 9];

const [periodoInicio, setPeriodoInicio] = useState("");
const [periodoFin, setPeriodoFin] = useState("");

function getSistemaData(index: number) {
  const sistema = index + 2;
  return data.find((d) => Number(d.Sistema) === sistema);
}
console.log("DATA API:", data);


//Exportar a PDF
const exportarPDF = async () => {
  const input = reportRef.current;
  if (!input) return;
  
setExportandoPDF(true);
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "legal",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 10;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  let currentY = margin;

  const sections = input.querySelectorAll(".pdf-section");

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i] as HTMLElement;

    const isWide = section.classList.contains("pdf-wide-section");

    const sectionWidth = isWide
      ? Math.max(section.scrollWidth, section.offsetWidth, 1350)
      : section.offsetWidth;

    const originalWidth = section.style.width;
    const originalMaxWidth = section.style.maxWidth;
    const originalOverflow = section.style.overflow;

    try {
      if (isWide) {
        section.style.width = `${sectionWidth}px`;
        section.style.maxWidth = "none";
        section.style.overflow = "visible";
      }

      const canvas = await html2canvas(section, {
        scale: isWide ? 2 : 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: sectionWidth,
        windowWidth: sectionWidth,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

const pxToMm = 0.264583;

const imgWidth = isWide
  ? usableWidth
  : Math.min(canvas.width * pxToMm / 3, usableWidth);

      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (currentY + imgHeight > usableHeight + margin) {
        pdf.addPage();
        currentY = margin;
      }

      const imgX = isWide
        ? margin
        : (pageWidth - imgWidth) / 2;

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        currentY,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
      );

      currentY += imgHeight + 8;
    } finally {
   
      section.style.width = originalWidth;
      section.style.maxWidth = originalMaxWidth;
      section.style.overflow = originalOverflow;
    }
  }

  const totalPages = pdf.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);

    pdf.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - 40,
      pageHeight - 5
    );
  }
   setExportandoPDF(false);
  pdf.save("Informe_Control_Interno.pdf");
};

async function aprobarResultados() {
  const result = await Swal.fire({
    title: "¿Aprobar resultados?",
    text: "Una vez aprobados quedarán registrados oficialmente.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, aprobar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#16a34a",
    cancelButtonColor: "#64748b",
  });

  if (!result.isConfirmed) return;

  Swal.fire({
    icon: "success",
    title: "Resultados aprobados",
    text: "La evaluación fue aprobada correctamente.",
    confirmButtonColor: "#16a34a",
  });
}

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

    <div className="space-y-4 p-4">
      <div className="flex flex-wrap gap-2">
     <button
    type="button"
    onClick={exportarPDF}
    disabled={exportandoPDF}
    className="
      h-11
      rounded-xl
      bg-gradient-to-r
       inline-flex
        items-center
      justify-center
      from-red-600
      to-red-500
      px-5
      text-white
      shadow-lg
      transition-all
      duration-300
      hover:scale-105
      hover:from-red-700
      hover:to-red-600
      disabled:cursor-not-allowed
      disabled:opacity-60
    "
  >
    <FileDown className="mr-2 h-5 w-5" />
    {exportandoPDF ? "Exportando PDF..." : "Exportar PDF"}
  </button>

{puedeAprobarResultados && (
  <button
    type="button"
    onClick={aprobarResultados}
    disabled={cargandoPermisos}
    className="
      inline-flex
      h-11
      items-center
      justify-center
      gap-2
      rounded-xl
      bg-gradient-to-r
      from-emerald-600
      to-green-500
      px-5
      font-medium
      text-white
      shadow-lg
      transition-all
      duration-300
      hover:scale-105
      hover:from-emerald-700
      hover:to-green-600
      disabled:cursor-not-allowed
      disabled:opacity-60
      disabled:hover:scale-100
    "
  >
    <BadgeCheck className="h-5 w-5" />
    Aprobar resultados
  </button>
)}
      </div>

      

     <div ref={reportRef} className="bg-white">
  <div className="space-y-4 text-black">
      <div className="border-2 border-black  pdf-section pdf-wide-section">
        <div className="border-b-2 border-black px-4 py-3 text-center text-xl font-bold uppercase">
          INFORME DE EVALUACIÓN DE CONTROL INTERNO DE LOS SISTEMAS DE
          ADMINISTRACIÓN
        </div>

        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-3 border-r border-black px-3 py-2 text-center font-bold uppercase">
            INSTITUCIÓN:
          </div>
          <div className="col-span-9 px-3 py-2 ">UNIVERSIDAD NACIONAL CASIMIRO SOTELO MONTENEGRO</div>
        </div>

       <div className="grid grid-cols-12">
  <div className="col-span-3 border-r border-black px-3 py-2 text-center font-bold uppercase">
    PERIODO:
  </div>

  <div className="col-span-9 flex items-center gap-3 px-3 py-2">
    <span>Del</span>

    <input
      type="date"
      value={periodoInicio}
      onChange={(e) => setPeriodoInicio(e.target.value)}
      className="rounded border px-2 py-1"
    />

    <span>al</span>

    <input
      type="date"
      value={periodoFin}
      onChange={(e) => setPeriodoFin(e.target.value)}
      className="rounded border px-2 py-1"
    />
  </div>
</div>
      </div>

      <div className="grid grid-cols-14 gap-4 pdf-section pdf-wide-section">
        <div className="col-span-12 lg:col-span-7 border-2 border-black">
          <div className="grid grid-cols-12 ">
            <div className="col-span-6 border-r-2 border-b-2 border-black bg-[#efe3ba] px-2 py-2 text-center text-lg font-bold uppercase ">
              CONTROL INTERNO GLOBAL DE LOS SISTEMAS DE ADMINISTRACIÓN
            </div>

            <div className="col-span-2 border-r-2 border-b-2 border-black bg-[#efe3ba] px-2 py-3 text-center text-sm font-bold">
              Calificación obtenida
            </div>

            <div className="col-span-2 border-r-2 border-b-2 border-black bg-[#efe3ba] px-2 py-3 text-center text-sm font-bold">
              Nivel
            </div>

            <div className="col-span-2 border-b-2 border-black bg-[#efe3ba] px- py-4 text-center text-sm font-bold">
              % Cumplimiento
              <br />
              (Nota 1)
            </div>
          </div>

         <div className="grid min-h-[90px] grid-cols-12">
  <div className="col-span-6 border-r-2 border-black bg-[#f6edc7]"></div>

  <div className="col-span-2 border-r-2 border-black bg-white flex items-center justify-center text-lg font-bold">
    {calificacionGlobal}
  </div>

  <div
    className={`col-span-2 border-r-2 border-black flex items-center justify-center text-lg font-bold ${
      nivelGlobal === "Alto"
        ? "bg-green-500 text-white"
        : nivelGlobal === "Medio"
        ? "bg-yellow-400 text-black"
        : nivelGlobal === "Bajo"
        ? "bg-red-500 text-white"
        : "bg-white text-black"
    }`}
  >
    {nivelGlobal}
  </div>

  <div className="col-span-2 bg-white flex items-center justify-center text-lg font-bold">
    {porcentajeGlobal}
  </div>
</div>
        </div>
      </div>

      <div className="border-0 pdf-section pdf-wide-section">
        <div className="border-b-2 bg-[#dce7d4] px-4 py-2 text-center text-lg font-bold">
          Nivel de Cumplimiento del Control Interno de los Sistemas de
          Administración
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#dce7d4]">
              <th className="border border-black px-2 py-2 text-center">No</th>
              <th className="border border-black px-2 py-2 text-center">
                Sistema de Administración
              </th>
              <th className="border border-black px-2 py-2 text-center">
                Puntaje máximo
              </th>
              <th className="border border-black px-2 py-2 text-center">
                Calificación obtenida
              </th>
              <th className="border border-black px-2 py-2 text-center">
                Nivel
              </th>
              <th className="border border-black px-2 py-2 text-center">
                % cumplimiento
                <br />
                (Nota 1)
              </th>
            </tr>
          </thead>
          <tbody>
  {sistemas.map((sistema, index) => {
  const sistemaData = getSistemaData(index);
  const val = Number(sistemaData?.Promedio ?? 0);


  
  console.log("Sistema buscado:", index + 2, "Encontrado:", sistemaData);

  return (
    <tr key={sistema}>
      <td className="border border-black px-2 py-1 text-center">
        {index + 1}
      </td>

      <td className="border border-black px-2 py-1">{sistema}</td>

      <td className="border border-black px-2 py-1 text-center">5</td>

      <td className="border border-black px-2 py-1 text-center">
        {val.toFixed(2)}
      </td>

    <td
  className={`border border-black px-2 py-1 text-center font-bold ${
    val === 5
      ? "bg-green-500 text-white"
      : val >= 3
      ? "bg-yellow-400 text-black"
      : "bg-red-500 text-white"
  }`}
>
  {val === 5 ? "Alto" : val >= 3 ? "Medio" : "Bajo"}
</td>

      <td className="border border-black px-2 py-1 text-center">
        {((val / 5) * 100).toFixed(2)}%
      </td>
    </tr>
  );
})}

            <tr>
              <td
                colSpan={5}
                className="border border-black px-2 py-2 text-right font-bold"
              >
                TOTAL
              </td>
<td className="border border-black px-2 py-2 text-center font-bold">
  {(
    data.reduce((acc, cur) => acc + (((cur.Promedio || 0) / 5) * 100), 0) / 8
  ).toFixed(2)}%
</td>
            </tr>
          </tbody>
        </table>

        <div className="px-2 py-3 text-xs">
          <span className="font-bold">Nota 1:</span> El porcentaje de
          cumplimiento se obtiene de la relación entre la calificación obtenida
          sobre el puntaje máximo.
        </div>
      </div>

     <div className="border-2 border-black p-4 pdf-section pdf-wide-section ">
  <div className="mb-3 text-center text-xl font-bold">
    Valoración por sistema de administración
  </div>


  <div className="h-[500px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 70 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />

      <XAxis
  dataKey="sistemaCorto"
  angle={-10} // 🔽 menos inclinación
  textAnchor="end"
  interval={0}
  height={70} // 🔽 menos altura
  tick={{ fontSize: 10 }} // 🔽 más pequeño
/>

        <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />

        <Tooltip content={<CustomTooltip />} />

        <Bar dataKey="valor" radius={[8, 8, 0, 0]} barSize={45}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>



      <div className="border-0 pdf-section pdf-wide-section">
        <div className="border-b-2 border-black px-4 py-2 text-center text-xl font-bold">
          Nivel de Cumplimiento de las preguntas evaluadas de los Sistemas de
          Administración
        </div>

        <div className="grid grid-cols-1 border-2 mb-4 border-black">
          <div className="col-span-1 border-r-2  bg-[#44546a] px-1 py-1 text-center  font-bold text-white">
            Priorización:
          </div>
          <div className="col-span-10 px-3 py-2 text-sm">
            Para la implementación de acciones de mejora de las deficiencias de
            los Sistemas de Administración
          </div>
        </div>

        <table className="pdf-wide-table w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#dce7d4]">
              <th className="border border-black px-3 py-2 text-center">
                Valor
              </th>
              <th className="border border-black px-2 py-2 text-center">
                Nivel
              </th>
              <th className="border border-black px-2 py-2 text-center">
                ADMINISTRACIÓN
                <br />
                DE LOS RECURSOS
                <br />
                HUMANOS
              </th>
              <th className="border border-black px-2 py-2 text-center">
                PLANEACIÓN Y
                <br />
                PROGRAMACIÓN
              </th>
              <th className="border border-black px-2 py-2 text-center">
                PRESUPUESTO
              </th>
              <th className="border border-black px-2 py-2 text-center">
                ADMINISTRACIÓN
                <br />
                FINANCIERA
              </th>
              <th className="border border-black px-2 py-2 text-center">
                CONTABILIDAD
                <br />
                INTEGRADA
              </th>
              <th className="border border-black px-2 py-2 text-center">
                CONTRATACIÓN Y
                <br />
                ADMINISTRACIÓN
                <br />
                DE BIENES Y
                <br />
                SERVICIOS
              </th>
              <th className="border border-black px-2 py-2 text-center">
                INVERSIONES EN
                <br />
                PROGRAMAS Y
                <br />
                PROYECTOS
              </th>
              <th className="border border-black px-2 py-2 text-center">
                TECNOLOGÍA DE LA
                <br />
                INFORMACIÓN (TI)
              </th>
              <th className="border border-black bg-[#3c78b4] px-2 py-2 text-center font-bold text-white">
                TOTAL
              </th>
            </tr>
          </thead>
          
          <tbody>
  <tr>
    <td className="border border-black bg-[#00ff00] px-2 py-2 text-center font-bold">
      [5]
    </td>
    <td className="border border-black bg-[#00aa00] px-2 py-2 text-center text-white">
      Alto
    </td>
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="border border-black px-2 py-2 text-center">
        {resumenNiveles.Alto[i]}
      </td>
    ))}
    <td className="border border-black bg-[#d9eaf7] px-2 py-2 text-center font-bold">
      {totalFila(resumenNiveles.Alto)}
    </td>
  </tr>

  <tr>
    <td className="border border-black bg-[#ffff00] px-2 py-2 text-center font-bold">
      [3 - 4]
    </td>
    <td className="border border-black bg-[#ffe600] px-2 py-2 text-center">
      Medio
    </td>
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="border border-black px-2 py-2 text-center">
        {resumenNiveles.Medio[i]}
      </td>
    ))}
    <td className="border border-black bg-[#d9eaf7] px-2 py-2 text-center font-bold">
      {totalFila(resumenNiveles.Medio)}
    </td>
  </tr>

  <tr>
    <td className="border border-black bg-[#ff0000] px-2 py-2 text-center font-bold text-white">
      [0 - 2]
    </td>
    <td className="border border-black bg-[#ff1a1a] px-2 py-2 text-center text-white">
      Bajo
    </td>
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="border border-black px-2 py-2 text-center">
        {resumenNiveles.Bajo[i]}
      </td>
    ))}
    <td className="border border-black bg-[#d9eaf7] px-2 py-2 text-center font-bold">
      {totalFila(resumenNiveles.Bajo)}
    </td>
  </tr>

  <tr className="bg-[#d9eaf7] font-bold">
    <td colSpan={2} className="border border-black px-2 py-2 text-center">
      TOTAL
    </td>
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="border border-black px-2 py-2 text-center">
        {totalColumna(i)}
      </td>
    ))}
    <td className="border border-black px-2 py-2 text-center">
  {totalGeneralNiveles}
</td>
  </tr>
</tbody>
        </table>
      </div>

      <div className="border-0 pdf-section pdf-wide-section">
        <div className="px-4 py-3 text-center text-xl font-bold">
          Respuestas Afirmativas de las Preguntas Evaluadas por cada Sistema de
          Administración
        </div>

        <div className="grid grid-cols-13 border-2 border-black">
          <div className="col-span-1 border-r-2  bg-[#44546a] px-1 py-2 text-center font-bold text-white">
            Explicación:
          </div>
          <div className="col-span-14 px-3 py-2 text-sm">
            ¿Los elementos que forman parte de cada uno de los sistemas de
            administración se encuentran operando juntos y de manera integrada?
          </div>
        </div>

<div className="grid grid-cols-12 gap-3 p-3">
<div className="col-span-12">
     <div >
      <table className="pdf-wide-table w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-[120px] border-none bg-transparent p-0"></th>

            <th className="w-[150px] border-2 border-black bg-[#dce7d4] px-2 py-3 text-center font-bold">
              ADMINISTRACIÓN
              <br />
              DE LOS RECURSOS
              <br />
              HUMANOS
            </th>

            <th className="w-[140px] border-2 border-black bg-[#dce7d4] px-2 py-3 text-center font-bold">
              PLANEACIÓN Y
              <br />
              PROGRAMACIÓN
            </th>

            <th className="w-[120px] border-2 border-black bg-[#dce7d4] px-2 py-3 text-center font-bold">
              PRESUPUESTO
            </th>

            <th className="w-[130px] border-2 border-black bg-[#dce7d4] px-2 py-3 text-center font-bold">
              ADMINISTRACIÓN
              <br />
              FINANCIERA
            </th>

            <th className="w-[130px] border-2 border-black bg-[#dce7d4] px-2 py-3 text-center font-bold">
              CONTABILIDAD
              <br />
              INTEGRADA
            </th>

            <th className="w-[160px] border-2 border-black bg-[#dce7d4] px-2 py-3 text-center font-bold">
              CONTRATACIÓN Y
              <br />
              ADMINISTRACIÓN
              <br />
              DE BIENES Y
              <br />
              SERVICIOS
            </th>

            <th className="w-[150px] border-2 border-black bg-[#dce7d4] px-2 py-3 text-center font-bold">
              INVERSIONES EN
              <br />
              PROGRAMAS Y
              <br />
              PROYECTOS
            </th>

            <th className="w-[140px] border-2 border-black bg-[#dce7d4] px-2 py-3 text-center font-bold">
              TECNOLOGÍA DE LA
              <br />
              INFORMACIÓN (TI)
            </th>

            <th className="w-[150px] border-2 border-black bg-[#3c78b4] px-2 py-3 text-center font-bold text-white">
              Total preguntas
              <br />
              afirmativas Sistemas
              <br />
              de Administración
            </th>

            <th className="w-[90px] border-none bg-transparent p-0"></th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td
              rowSpan={2}
              className="w-[120px] border-2 border-black bg-white px-2 py-3 text-center font-bold"
            >
              Está Presente
              <br />
              (Nota 2)
            </td>

{Array.from({ length: 8 }).map((_, i) => (
  <td
    key={`presente-1-${i}`}
    className="border-2 border-black bg-[#d9e4f5] px-2 py-2 text-center"
  >
    {getAfirmativa(i)?.TotalPresente ?? 0}
  </td>
))}
          
<td className="border-2 border-black bg-[#d9e4f5] px-2 py-2 text-center font-bold">
  {totalPresente}
</td>

            <td
              rowSpan={2}
              className="w-[90px] border-2 border-black bg-[#f1d56b] px-2 py-2 text-center font-bold"
            >
              (Nota 3)
            </td>
          </tr>

          <tr>
            {Array.from({ length: 8 }).map((_, i) => (
              <td
                key={`presente-2-${i}`}
                className="border-2 border-black bg-[#d9e4f5] px-2 py-2 text-center font-bold"
              >
                0
              </td>
            ))}

            <td className="border-2 border-black bg-[#f1d56b] px-2 py-2 text-center font-bold">
              0
            </td>
          </tr>

          <tr>
            <td
              rowSpan={2}
              className="w-[120px] border-2 border-black bg-white px-2 py-3 text-center font-bold"
            >
              Está Funcionando
              <br />
              (Nota 2)
            </td>

{Array.from({ length: 8 }).map((_, i) => (
  <td
    key={`funciona-1-${i}`}
    className="border-2 border-black bg-[#dfead7] px-2 py-2 text-center"
  >
    {getAfirmativa(i)?.TotalFuncionando ?? 0}
  </td>
))}

           <td className="border-2 border-black bg-[#dfead7] px-2 py-2 text-center font-bold">
  {totalFuncionando}
</td>

            <td
              rowSpan={2}
              className="w-[90px] border-2 border-black bg-[#f1d56b] px-2 py-2 text-center font-bold"
            >
              (Nota 3)
            </td>
          </tr>

          <tr>
            {Array.from({ length: 8 }).map((_, i) => (
              <td
                key={`funciona-2-${i}`}
                className="border-2 border-black bg-[#dfead7] px-2 py-2 text-center font-bold"
              >
                0
              </td>
            ))}

            <td className="border-2 border-black bg-[#f1d56b] px-2 py-2 text-center font-bold">
              0
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="mt-3 space-y-1 text-xs">
      <div>
        <span className="font-bold">Nota 2:</span> Corresponde a la relación
        entre el número de preguntas evaluadas afirmativamente y el total de
        preguntas respondidas de cada sistema de administración.
      </div>
      <div>
        <span className="font-bold">Nota 3:</span> Corresponde a la relación
        entre el total de preguntas evaluadas afirmativamente y el número total
        de preguntas respondidas.
      </div>
    </div>
  </div>
</div>
        
      </div>

       <div className="col-span-12 xl:col-span-2 pdf-section pdf-wide-section">
  <div className="border-2 border-black">
    <div className="border-b-2 border-black bg-[#d9eaf7] px-3 py-2 text-center font-bold">
      Sistemas de Administración
    </div>

    <table className="w-full border-collapse text-sm">
      <tbody>
        <tr>
          <td
            rowSpan={2}
            className="border border-black px-2 py-2 text-center font-bold"
          >
            Presente y
            <br />
            Funcionando
          </td>

          <td className="border border-black bg-[#92d050] px-2 py-2 text-center font-bold">
            SI
          </td>

          <td className="border border-black px-2 py-2 text-center font-bold">
            ≥ 75%
          </td>
        </tr>

        <tr>
          <td className="border border-black bg-[#ff6600] px-2 py-2 text-center font-bold">
            NO
          </td>

          <td className="border border-black px-2 py-2 text-center font-bold">
            &lt; 75%
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

      <div className="space-y-4 pdf-section pdf-wide-section">
  <div className="border-2 border-black">
    <div className="border-b border-black px-3 py-2 font-bold">
      Conclusiones:
    </div>

    <textarea
      className="w-full min-h-[140px] p-3 outline-none resize-none"
      placeholder="Escriba aquí las conclusiones..."
    ></textarea>
  </div>

  <div className="border-2 border-black">
    <div className="border-b border-black px-3 py-2 font-bold">
      Recomendaciones:
    </div>

    <textarea
      className="w-full min-h-[140px] p-3 outline-none resize-none"
      placeholder="Escriba aquí las recomendaciones..."
    ></textarea>
  </div>
</div>

      <div className="grid grid-cols-1 gap-10 pt-10 md:grid-cols-3 pdf-section pdf-wide-section">
        <div className="text-center">
          <div className="mx-auto mb-2 h-[2px] w-[180px] bg-black"></div>
          <div className="font-bold uppercase">ELABORADO POR:</div>
        </div>

        <div className="text-center">
          <div className="mx-auto mb-2 h-[2px] w-[180px] bg-black"></div>
          <div className="font-bold uppercase">REVISADO POR:</div>
        </div>

        <div className="text-center">
          <div className="mx-auto mb-2 h-[2px] w-[180px] bg-black"></div>
          <div className="font-bold uppercase">APROBADO POR:</div>
        </div>
      </div>

 <div className="w-[260px] border border-black pdf-section ">
  <div className="grid grid-cols-12">
    
    <div className="col-span-5 border-r border-black px-3 py-1 text-center font-bold uppercase">
      FECHA:
    </div>

    <div className="col-span-7 px-3 py-1 text-center">
      {new Date().toLocaleDateString()}
    </div>

  </div>
</div>

    </div>
 
      </div>

       {/* LOADER */}
    {exportandoPDF && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <HoloPulse />
      </div>
    )}

    </div>
    
    ); 
}