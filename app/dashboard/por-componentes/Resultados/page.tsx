"use client";

import { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import React from "react";

import { useEffect, useState } from "react";
import { HoloPulse } from "@/components/ui/holo-pulse-loader";

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

const getComponenteData = (index: number) => {
  const componenteId = index + 1;
  return componentesData.find(
    (c: any) => Number(c.ComponenteId) === componenteId
  );
};

const getPrincipioData = (numero: number) => {
  return principiosData.find(
    (p: any) =>
      Number(String(p.PreguntaGeneralNumero).replace(".", "")) === numero
  );
};

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


const chartData = componentesData.map((item: any, index: number) => {
  const nombreComponente =
    item.Componente || componentes[index] || `Componente ${index + 1}`;

  const valor = Number(item.Promedio) || 0;

  return {
    sistemaCorto:
      nombreComponente.length > 22
        ? nombreComponente.substring(0, 22) + "..."
        : nombreComponente,
    sistema: nombreComponente,
    valor,
    color: colores[index % colores.length],
  };
});

// CONTROL INTERNO GLOBAL DE LOS SISTEMAS DE INFORMACIÓN
const calificacionesGlobales = componentesData.map((item) =>
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


//Nivel de Cumplimiento de Puntos de Enfoque Evaluados//
 const resumenNivelesComponentes = {
  Alto: Array(5).fill(0),
  Medio: Array(5).fill(0),
  Bajo: Array(5).fill(0),
};

principiosData.forEach((item: any) => {
  const principio = Number(String(item.PreguntaGeneralNumero).replace(".", ""));
  const valor = Number(item.Promedio || 0);

  let componenteIndex = -1;

  if (principio >= 1 && principio <= 5) componenteIndex = 0;
  else if (principio >= 6 && principio <= 9) componenteIndex = 1;
  else if (principio >= 10 && principio <= 12) componenteIndex = 2;
  else if (principio >= 13 && principio <= 15) componenteIndex = 3;
  else if (principio >= 16 && principio <= 17) componenteIndex = 4;

  if (componenteIndex === -1) return;

  if (valor === 5) {
    resumenNivelesComponentes.Alto[componenteIndex]++;
  } else if (valor >= 3) {
    resumenNivelesComponentes.Medio[componenteIndex]++;
  } else {
    resumenNivelesComponentes.Bajo[componenteIndex]++;
  }
});

const totalFilaComponentes = (fila: number[]) =>
  fila.reduce((acc, val) => acc + val, 0);

const totalColumnaComponentes = (i: number) =>
  resumenNivelesComponentes.Alto[i] +
  resumenNivelesComponentes.Medio[i] +
  resumenNivelesComponentes.Bajo[i];

const totalGeneralComponentes =
  totalFilaComponentes(resumenNivelesComponentes.Alto) +
  totalFilaComponentes(resumenNivelesComponentes.Medio) +
  totalFilaComponentes(resumenNivelesComponentes.Bajo);

//Nivel de Cumplimiento por principios//

// Respuestas Afirmativas de los Puntos de Enfoque Evaluados
const getAfirmativaPrincipio = (index: number) => {
  const componenteId = index + 1;
  return afirmativasPrincipios.find(
    (a: any) => Number(a.ComponenteId) === componenteId
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

const promedioGeneral = (
  componentesData.reduce((acc, cur) => acc + (Number(cur.Promedio) || 0), 0) / 8
).toFixed(2);


const [exportandoPDF, setExportandoPDF] = useState(false);

const sistemaMap = [2, 3, 4, 5, 6, 7, 8, 9];

const [periodoInicio, setPeriodoInicio] = useState("");
const [periodoFin, setPeriodoFin] = useState("");

function getSistemaData(index: number) {
  const sistema = index + 2;
  return componentesData.find((d) => Number(d.Sistema) === sistema);
}
console.log("DATA API:", componentesData);


//Exportar a PDF
const exportarPDF = async () => {
  const input = reportRef.current;
  if (!input) return;

  setExportandoPDF(true);

  try {
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

        const pxToMm = 0.264583;

        const imgWidth = isWide
          ? usableWidth
          : Math.min((canvas.width * pxToMm) / 3, usableWidth);

        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const imgX = isWide ? margin : (pageWidth - imgWidth) / 2;

        // ==============================
        // SECCIÓN NORMAL QUE CABE
        // ==============================
        if (imgHeight <= usableHeight) {
          if (currentY + imgHeight > pageHeight - margin) {
            pdf.addPage();
            currentY = margin;
          }

          const imgData = canvas.toDataURL("image/png", 1.0);

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
        } else {
          // ==============================
          // SECCIÓN GRANDE / TABLA LARGA
          // ==============================

          // Si ya no hay espacio suficiente, saltar a nueva página
          if (isWide && currentY > margin + 15) {
            pdf.addPage();
            currentY = margin;
          }

          const pxPerMm = canvas.width / imgWidth;

          let sourceY = 0;

          while (sourceY < canvas.height) {
            const availableHeightMm = pageHeight - currentY - margin;

            const sliceHeightPx = Math.floor(
              availableHeightMm * pxPerMm
            );

            const remainingPx = canvas.height - sourceY;

            const finalSliceHeightPx = Math.min(
              sliceHeightPx,
              remainingPx
            );

            const sliceCanvas = document.createElement("canvas");

            sliceCanvas.width = canvas.width;
            sliceCanvas.height = finalSliceHeightPx;

            const ctx = sliceCanvas.getContext("2d");

            if (!ctx) return;

            ctx.drawImage(
              canvas,
              0,
              sourceY,
              canvas.width,
              finalSliceHeightPx,
              0,
              0,
              canvas.width,
              finalSliceHeightPx
            );

            const sliceData = sliceCanvas.toDataURL("image/png", 1.0);

            const sliceHeightMm =
              (finalSliceHeightPx * imgWidth) / canvas.width;

            pdf.addImage(
              sliceData,
              "PNG",
              imgX,
              currentY,
              imgWidth,
              sliceHeightMm,
              undefined,
              "FAST"
            );

            sourceY += finalSliceHeightPx;

            if (sourceY < canvas.height) {
              pdf.addPage();
              currentY = margin;
            } else {
              currentY += sliceHeightMm + 8;
            }
          }
        }
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

    pdf.save("Informe_Por_Componentes.pdf");
  } finally {
    setExportandoPDF(false);
  }
};

  return (

    <div className="space-y-4 p-4">
      <div className="flex flex-wrap gap-2">
   <button
        onClick={exportarPDF}
        disabled={exportandoPDF}
        className="rounded bg-red-600 px-4 py-2 text-white transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {exportandoPDF ? "Exportando..." : "Exportar PDF"}
      </button>

   
      </div>

     <div ref={reportRef} className="bg-white">
  <div className="space-y-6 text-black">
      <div className="border-2 border-black pdf-section pdf-wide-section">
        <div className="border-b-2 border-black px-4 py-3 text-center text-xl font-bold uppercase">
          INFORME DE EVALUACIÓN DE CONTROL INTERNO A NIVEL DE ENTIDAD
        </div>

        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-3 border-r border-black px-3 py-2 text-center font-bold uppercase">
            INSTITUCIÓN:
          </div>
          <div className="col-span-9 px-3 py-2">UNIVERSIDAD NACIONAL CASIMIRO SOTELO MONTENEGRO</div>
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
          <div className="grid grid-cols-12">
            <div className="col-span-6 border-r-2 border-b-2 border-black bg-[#efe3ba] px-4 py-6 text-center text-lg font-bold uppercase">
              NIVEL DE CUMPLIMIENTO DEL SISTEMA DE CONTROL INTERNO
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
         Cumplimiento por Componente
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#dce7d4]">
              <th className="border border-black px-2 py-2 text-center">No</th>
              <th className="border border-black px-2 py-2 text-center">
                Componente
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
            
{componentes.map((componente, index) => {
  const item = getComponenteData(index);
  const val = Number(item?.Promedio ?? 0);

  return (
    <tr key={componente}>
      <td className="border border-black px-2 py-1 text-center">{index + 1}</td>
      <td className="border border-black px-2 py-1">{componente}</td>
      <td className="border border-black px-2 py-1 text-center">5</td>
      <td className="border border-black px-2 py-1 text-center">{val.toFixed(2)}</td>
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
    componentesData.reduce((acc, cur) => acc + (((cur.Promedio || 0) / 5) * 100), 0) / 8
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

     <div className="border-2 border-black p-4 pdf-section pdf-wide-section">
  <div className="mb-3 text-center text-xl font-bold">
    Valoración por Componente
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


<div className="border-2 border-black pdf-section pdf-wide-section">
  <div className="border-b-2 border-black bg-[#dce7d4] px-4 py-1 text-center text-lg font-bold">
    Nivel de Cumplimiento por Principios
  </div>

  <table className="w-full border-collapse text-sm">
    <thead>
      <tr>
        <th className="w-[70px] border border-black bg-[#dce7d4] px-2 py-3 text-center">
          No.-
        </th>
        <th className="border border-black bg-[#dce7d4] px-2 py-3 text-center">
          Principio
        </th>
        <th className="w-[120px] border border-black bg-[#dce7d4] px-2 py-3 text-center">
          Calificación<br />obtenida
        </th>
        <th className="w-[120px] border border-black bg-[#dce7d4] px-2 py-3 text-center">
          Nivel
        </th>
        <th className="w-[120px] border border-black bg-[#dce7d4] px-2 py-3 text-center">
          % Cumplimiento<br />(Nota 1)
        </th>
      </tr>
    </thead>

    <tbody>
      {[
        {
          titulo: "Entorno de Control",
          color: "bg-[#d9eaf7]",
          items: [
            "La Entidad demuestra compromiso con la integridad y los valores éticos.",
            "La Máxima autoridad demuestra independencia de la dirección y ejerce la supervisión del desarrollo y funcionamiento del sistema de control interno.",
            "La Máxima Autoridad establece supervisión en las estructuras, líneas de reporte y una apropiada asignación de autoridad y responsabilidad para la consecución de los objetivos.",
            "La Máxima Autoridad demuestra compromiso para atraer, desarrollar y retener a profesionales competentes en concordancia con los objetivos de las entidades.",
            "La Máxima Autoridad y la Administración definen las responsabilidades de los servidores públicos a nivel de control interno para la consecución de los objetivos.",
          ],
          inicio: 1,
        },
        {
          titulo: "Evaluación de Riesgos",
          color: "bg-[#dce7d4]",
          items: [
            "Las entidades definen objetivos con la suficiente claridad para permitir la identificación y evaluación de los riesgos relacionados.",
            "La Entidad identifica riesgos para el logro de sus objetivos y los analiza como base para determinar cómo deben ser administrados.",
            "La Entidad considera la posibilidad de irregularidades en la evaluación de riesgos para el logro de objetivos.",
            "La Entidad identifica y evalúa los cambios que podrían afectar significativamente al sistema de control interno.",
          ],
          inicio: 6,
        },
        {
          titulo: "Actividades de Control",
          color: "bg-[#d9eaf7]",
          items: [
            "La Entidad selecciona y desarrolla actividades de control que contribuyen en la mitigación de riesgos al logro de objetivos, a un nivel aceptable.",
            "La Entidad selecciona y desarrolla actividades generales de control sobre la tecnología, para apoyar el logro de los objetivos.",
            "La Entidad implementa actividades de control a través de políticas que establezcan lo requerido y procedimientos que pongan estas políticas en acción.",
          ],
          inicio: 10,
        },
        {
          titulo: "Información y Comunicación",
          color: "bg-[#dce7d4]",
          items: [
            "La Entidad obtiene o genera y utiliza información relevante, y de calidad para apoyar el funcionamiento del control interno.",
            "La Entidad comunica internamente información, incluyendo objetivos y responsabilidades sobre el Control Interno necesaria para soportar el funcionamiento del control interno.",
            "La Entidad se comunica con los grupos de interés externos en relación con los aspectos que afectan el funcionamiento del control interno.",
          ],
          inicio: 13,
        },
        {
          titulo: "Supervisión - Monitoreo",
          color: "bg-[#d9eaf7]",
          items: [
            "La Entidad selecciona, desarrolla y realiza evaluaciones concurrentes o separadas para determinar si los componentes de control interno están presentes y funcionando.",
            "La Entidad evalúa y comunica las deficiencias de control interno de manera oportuna a los responsables de tomar acciones correctivas, incluida la máxima autoridad si corresponde.",
          ],
          inicio: 16,
        },
      ].map((grupo) => (
        <React.Fragment key={grupo.titulo}>
          <tr>
            <td
              colSpan={5}
              className={`border border-black ${grupo.color} px-2 py-1 text-center text-base font-bold`}
            >
              {grupo.titulo}
            </td>
          </tr>

         {grupo.items.map((principio, index) => {
  const numero = grupo.inicio + index;
  const item = getPrincipioData(numero);
  const val = Number(item?.Promedio ?? 0);

  return (
    <tr key={`${grupo.titulo}-${index}`}>
      <td className="border border-black px-2 py-2 text-center align-middle">
        {numero}
      </td>

      <td className="border border-black px-2 py-2 text-justify align-top text-xs leading-relaxed">
        {principio}
      </td>

      <td className="border border-black px-2 py-2 text-center">
        {val.toFixed(2)}
      </td>

      <td
        className={`border border-black px-2 py-2 text-center font-bold ${
          val === 5
            ? "bg-green-500 text-white"
            : val >= 3
            ? "bg-yellow-400 text-black"
            : "bg-red-500 text-white"
        }`}
      >
        {val === 5 ? "Alto" : val >= 3 ? "Medio" : "Bajo"}
      </td>

      <td className="border border-black px-2 py-2 text-center">
        {((val / 5) * 100).toFixed(2)}%
      </td>
    </tr>
  );
})}
        </React.Fragment>
      ))}
    </tbody>
  </table>
</div>


      <div className="border-0 pdf-section pdf-wide-section">
        <div className="border-b-2 border-black px-4 py-2 text-center text-xl font-bold">
       Nivel de Cumplimiento de Puntos de Enfoque Evaluados
        </div>

        <div className="grid grid-cols-1 border-2 mb-4 border-black">
          <div className="col-span-1 border-r-2  bg-[#44546a] px-1 py-1 text-center  font-bold text-white">
            Priorización:
          </div>
          <div className="col-span-10 px-3 py-2 text-sm">
            Para la implementación de las acciones de mejora de las deficiencias de los puntos de enfoque.
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#dce7d4]">
              <th className="border border-black px-3 py-2 text-center">
                Valor
              </th>
              <th className="border border-black px-2 py-2 text-center">
                Nivel
              </th>
              <th className="border border-black px-2 py-2 text-center">
                Entorno
                <br />
                De Control
                
              </th>
              <th className="border border-black px-2 py-2 text-center">
                Evaluación
                <br />
                De Riesgos
              </th>
              <th className="border border-black px-2 py-2 text-center">
                Actividades
                <br />
                De Control
              </th>
              <th className="border border-black px-2 py-2 text-center">
                Información
                <br />
                y Comunicación
              </th>
              <th className="border border-black px-2 py-2 text-center">
                Supervición
                <br />
                - Monitoreo
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

    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="border border-black px-2 py-2 text-center">
        {resumenNivelesComponentes.Alto[i]}
      </td>
    ))}

    <td className="border border-black bg-[#d9eaf7] px-2 py-2 text-center font-bold">
      {totalFilaComponentes(resumenNivelesComponentes.Alto)}
    </td>
  </tr>

  <tr>
    <td className="border border-black bg-[#ffff00] px-2 py-2 text-center font-bold">
      [3 - 4]
    </td>
    <td className="border border-black bg-[#ffe600] px-2 py-2 text-center">
      Medio
    </td>

    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="border border-black px-2 py-2 text-center">
        {resumenNivelesComponentes.Medio[i]}
      </td>
    ))}

    <td className="border border-black bg-[#d9eaf7] px-2 py-2 text-center font-bold">
      {totalFilaComponentes(resumenNivelesComponentes.Medio)}
    </td>
  </tr>

  <tr>
    <td className="border border-black bg-[#ff0000] px-2 py-2 text-center font-bold text-white">
      [0 - 2]
    </td>
    <td className="border border-black bg-[#ff1a1a] px-2 py-2 text-center text-white">
      Bajo
    </td>

    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="border border-black px-2 py-2 text-center">
        {resumenNivelesComponentes.Bajo[i]}
      </td>
    ))}

    <td className="border border-black bg-[#d9eaf7] px-2 py-2 text-center font-bold">
      {totalFilaComponentes(resumenNivelesComponentes.Bajo)}
    </td>
  </tr>

  <tr className="bg-[#d9eaf7] font-bold">
    <td colSpan={2} className="border border-black px-2 py-2 text-center">
      TOTAL
    </td>

    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="border border-black px-2 py-2 text-center">
        {totalColumnaComponentes(i)}
      </td>
    ))}

    <td className="border border-black px-2 py-2 text-center">
      {totalGeneralComponentes}
    </td>
  </tr>
</tbody>
        </table>
</div>


      <div className="border-0 pdf-section pdf-wide-section">
        <div className="px-4 py-3 text-center text-xl font-bold">
         Respuestas Afirmativas de los Puntos de Enfoque Evaluados
        </div>

        <div className="grid grid-cols-13 border-2 border-black">
          <div className="col-span-1 border-r-2  bg-[#44546a] px-1 py-2 text-center font-bold text-white">
            Explicación:
          </div>
          <div className="col-span-14 px-3 py-2 text-sm">
            ¿Los puntos de enfoque de cada uno de los componentes se encuentran operando juntos y de manera integrada? 
          </div>
        </div>

<div className="grid grid-cols-12 gap-3 p-3">
<div className="col-span-12">
     <div >

<table className="border-collapse text-sm">
  <thead>
    <tr >
      <th className="w-[120px] border-none bg-transparent"></th>

      <th className="bg-[#dce7d4] w-[120px] border-2 border-black px-2 py-3 text-center font-bold">
        Entorno de<br />Control
      </th>

      <th className="bg-[#dce7d4] w-[120px] border-2 border-black px-2 py-3 text-center font-bold">
        Evaluación de<br />Riesgos
      </th>

      <th className="bg-[#dce7d4] w-[120px] border-2 border-black px-2 py-3 text-center font-bold">
        Actividades<br />de Control
      </th>

      <th className="bg-[#dce7d4] w-[140px] border-2 border-black px-2 py-3 text-center font-bold">
        Información y<br />Comunicación
      </th>

      <th className="bg-[#dce7d4] w-[130px] border-2 border-black px-2 py-3 text-center font-bold">
        Supervisión -<br />Monitoreo
      </th>

      <th className="w-[170px] border-2 border-black bg-[#3c78b4] px-2 py-3 text-center font-bold text-white">
        Total puntos de<br />
        enfoque afirmativos<br />
        Sistemas de Control Interno
      </th>

      <th className="w-[90px] border-none bg-transparent"></th>
    </tr>
  </thead>

 <tbody>
  {/* ESTÁ PRESENTE - CANTIDAD */}
  <tr>
    <td
      rowSpan={2}
      className="border-2 border-black bg-white px-2 py-2 text-center font-bold"
    >
      Está Presente
      <br />
      (Nota 2)
    </td>

    {Array.from({ length: 5 }).map((_, i) => (
      <td
        key={`presente-cantidad-${i}`}
        className="border-2 border-black bg-[#d9e4f5] px-2 py-2 text-center"
      >
        {getAfirmativaPrincipio(i)?.TotalPresente ?? 0}
      </td>
    ))}

    <td className="border-2 border-black bg-[#d9e4f5] px-2 py-2 text-center font-bold">
      {totalPresentePrincipios}
    </td>

    <td
      rowSpan={2}
      className="border-2 border-black bg-[#f4c7ab] px-2 py-2 text-center font-bold"
    >
      (Nota 3)
    </td>
  </tr>

  {/* ESTÁ PRESENTE - PORCENTAJE */}
  <tr>
    {Array.from({ length: 5 }).map((_, i) => (
      <td
        key={`presente-porcentaje-${i}`}
        className="border-2 border-black bg-[#d9e4f5] px-2 py-2 text-center font-bold"
      >
        {Number(getAfirmativaPrincipio(i)?.PorcentajePresente ?? 0).toFixed(0)}%
      </td>
    ))}

    <td className="border-2 border-black bg-[#f4c7ab] px-2 py-2 text-center font-bold">
      {porcentajeTotalPresentePrincipios}%
    </td>
  </tr>

  {/* ESTÁ FUNCIONANDO - CANTIDAD */}
  <tr>
    <td
      rowSpan={2}
      className="border-2 border-black bg-white px-2 py-2 text-center font-bold"
    >
      Está Funcionando
      <br />
      (Nota 2)
    </td>

    {Array.from({ length: 5 }).map((_, i) => (
      <td
        key={`funcionando-cantidad-${i}`}
        className="border-2 border-black bg-[#dfead7] px-2 py-2 text-center"
      >
        {getAfirmativaPrincipio(i)?.TotalFuncionando ?? 0}
      </td>
    ))}

    <td className="border-2 border-black bg-[#dfead7] px-2 py-2 text-center font-bold">
      {totalFuncionandoPrincipios}
    </td>

    <td
      rowSpan={2}
      className="border-2 border-black bg-[#f4c7ab] px-2 py-2 text-center font-bold"
    >
      (Nota 3)
    </td>
  </tr>

  {/* ESTÁ FUNCIONANDO - PORCENTAJE */}
  <tr>
    {Array.from({ length: 5 }).map((_, i) => (
      <td
        key={`funcionando-porcentaje-${i}`}
        className="border-2 border-black bg-[#dfead7] px-2 py-2 text-center font-bold"
      >
        {Number(getAfirmativaPrincipio(i)?.PorcentajeFuncionando ?? 0).toFixed(0)}%
      </td>
    ))}

    <td className="border-2 border-black bg-[#f4c7ab] px-2 py-2 text-center font-bold">
      {porcentajeTotalFuncionandoPrincipios}%
    </td>
  </tr>
</tbody>
</table>
    </div>

    <div className="mt-3 space-y-1 text-xs">
      <div>
        <span className="font-bold">Nota 2:</span> Corresponde a la relación entre el número de puntos de enfoque evaluados afirmativamente 
        y el total de puntos de enfoque de cada componente.
      </div>
      <div>
        <span className="font-bold">Nota 3:</span> Corresponde a la relación entre el total de puntos de enfoque evaluados afirmativamente y el número total 
        de puntos de enfoque del Sistema de Control Interno.
      </div>
    </div>
  </div>
</div>
        
      </div>

       <div className="col-span-12 xl:col-span-2 pdf-section pdf-wide-section">
  <div className="border-2 border-black">
    <div className="border-b-2 border-black bg-[#d9eaf7] px-3 py-2 text-center font-bold">
      Componente
    </div>

    <table className="w-full border-collapse text-sm ">
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