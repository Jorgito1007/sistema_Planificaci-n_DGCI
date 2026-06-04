"use client";

import React, { useEffect, useRef, useState } from "react";

import { Download } from "lucide-react";
import { Send } from "lucide-react";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { HashLoader } from "react-spinners";

export default function PlanAccionPage() {

  const pdfRef = useRef<HTMLDivElement>(null);

  const textAreaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFin, setPeriodoFin] = useState("");


  useEffect(() => {
  obtenerPreguntas();
}, []);

const obtenerPreguntas = async () => {
  try {

    const response = await fetch("/api/plan-accion-pc");

    const data = await response.json();
    console.log(data);

    if (data.ok) {

      const preguntasMapeadas = data.data.map((item: any) => ({
        numeroPregunta: item.Numero || "",
        descripcionPregunta: item.Texto || "",
        clasificacion: item.Calificacion || "",
        nivel: item.Nivel || "",
        deficiencia: "",
        actividades: "",
        fechaInicio: "",
        fechaFin: "",
        responsable: "",
        cargo: "",
        contacto: "",
        recursos: "",
        entregable: "",
      }));

      setFilas(preguntasMapeadas);
    }

  } catch (error) {
    console.error(error);
  }
};

  // SOLO UNA FILA
 const [filas, setFilas] = useState<any[]>([]);


const handleChange = (
  index: number,
  field: string,
  value: string
) => {

  const nuevasFilas = [...filas];

  nuevasFilas[index][field] = value;

  setFilas(nuevasFilas);
};

const autoResize = (
  e: React.FormEvent<HTMLTextAreaElement>
) => {

  const target = e.currentTarget;

  target.style.height = "auto";
  target.style.height = `${target.scrollHeight}px`;
};

useEffect(() => {

  textAreaRefs.current.forEach((textarea) => {

    if (textarea) {

      textarea.style.height = "auto";

      textarea.style.height =
        textarea.scrollHeight + "px";
    }

  });

}, [filas]);

  // BOTÓN ENVIAR
  const [loading, setLoading] = useState(false);

  const [planEnviado, setPlanEnviado] = useState(false);
  
const enviarPlan = async () => {

  try {

    // ======================================
// VALIDAR PERÍODOS
// ======================================

if (!periodoInicio || !periodoFin) {

  Swal.fire({
    icon: "warning",
    title: "Campos incompletos",
    text: "Favor completar el período.",
    confirmButtonColor: "#2563eb",
  });

  return;
}

// ======================================
// VALIDAR FILAS
// ======================================

for (let i = 0; i < filas.length; i++) {

  const fila = filas[i];

  const campos = [

    {
      key: "deficiencia",
      label: "Deficiencia",
    },

    {
      key: "actividades",
      label: "Actividades",
    },

    {
      key: "fechaInicio",
      label: "Fecha Inicio",
    },

    {
      key: "fechaFin",
      label: "Fecha Fin",
    },

    {
      key: "responsable",
      label: "Responsable",
    },

    {
      key: "cargo",
      label: "Cargo",
    },

    {
      key: "contacto",
      label: "Contacto",
    },

    {
      key: "recursos",
      label: "Recursos",
    },

    {
      key: "entregable",
      label: "Entregable",
    },

  ];

  for (const campo of campos) {

    if (
      !fila[campo.key] ||
      fila[campo.key].toString().trim() === ""
    ) {

      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        html: `
          Favor completar los datos de:

          <br /><br />

          <strong>
            ${campo.label}
          </strong>

          <br /><br />

          en la pregunta:

          <strong>
            ${fila.numeroPregunta}
          </strong>
        `,
        confirmButtonColor: "#2563eb",
      });

      return;
    }
  }
}

    setLoading(true);

    const response = await fetch(
      "/api/plan-accion-pc/guardar",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          periodoInicio,
          periodoFin,
          filas,
        }),
      }
    );

    const data = await response.json();

   if (data.ok) {

  setPlanEnviado(true);

  Swal.fire({
    icon: "success",
    title: "Éxito",
    text:
      "Plan de acción enviado correctamente",
    confirmButtonColor: "#2563eb",
  });

    } else {

      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message,
      });

    }

  } catch (error) {

    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text:
        "Ocurrió un error al enviar",
    });

  } finally {

    setLoading(false);

  }

};

  // GENERAR PDF
const exportarExcel = async () => {

  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet("Plan Acción", {
    pageSetup: {
      paperSize: 9, // A3
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
  left: 0.2,
  right: 0.2,
  top: 0.3,
  bottom: 0.3,
  header: 0.1,
  footer: 0.1,
},
    },
  });

  // ANCHOS COLUMNAS
  worksheet.columns = [
    { width: 15 },
    { width: 40 },
    { width: 12 },
    { width: 15 },
    { width: 30 },
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ];

  // ======================================
// ENCABEZADO SUPERIOR
// ======================================

worksheet.mergeCells("A1:M1");

const top = worksheet.getCell("A1");

top.value = "CONTRALORÍA GENERAL DE LA REPÚBLICA";

top.font = {
  bold: true,
  size: 12,
};

top.alignment = {
  horizontal: "center",
  vertical: "middle",
};

// ======================================
// TITULO PRINCIPAL
// ======================================

worksheet.mergeCells("A3:M3");

const titulo1 = worksheet.getCell("A3");

titulo1.value =
  "PLAN DE ACCIÓN PARA LA IMPLEMENTACIÓN DE LAS ACTIVIDADES DE MEJORA DEL SISTEMA POR COMPONENTES";

titulo1.font = {
  bold: true,
  size: 11,
};

titulo1.alignment = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};

titulo1.border = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

// ======================================
// SUBTITULO
// ======================================

worksheet.mergeCells("A4:M5");

const titulo2 = worksheet.getCell("A4");

titulo2.value =
  "GUÍA ESPECIALIZADA PARA LA IMPLEMENTACIÓN DEL CONTROL INTERNO EN LAS INSTITUCIONES GUBERNAMENTALES";

titulo2.font = {
  bold: true,
  size: 10,
};

titulo2.alignment = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};

titulo2.border = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

// ======================================
// ENTIDAD
// ======================================

worksheet.getCell("A7").value = "ENTIDAD:";

worksheet.getCell("A7").font = {
  bold: true,
};

worksheet.mergeCells("B7:M7");

worksheet.getCell("B7").value =
  "Universidad Nacional Casimiro Sotelo Montenegro";

// Bordes ENTIDAD
for (let col = 1; col <= 13; col++) {

  const cell = worksheet.getRow(7).getCell(col);

  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

}

// ======================================
// PERIODO
// ======================================

worksheet.getCell("A8").value = "PERÍODO:";

worksheet.getCell("A8").font = {
  bold: true,
};

worksheet.mergeCells("B8:M8");

worksheet.getCell("B8").value =
  `Del: ${periodoInicio}    Al: ${periodoFin}`;

// Bordes PERIODO
for (let col = 1; col <= 13; col++) {

  const cell = worksheet.getRow(8).getCell(col);

  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

}

// Espacio
worksheet.addRow([]);

  // CABECERA
  const header = worksheet.addRow([
    "Número Pregunta",
    "Descripción",
    "Clasificación",
    "Nivel",
    "Deficiencia",
    "Actividades",
    "Fecha Inicio",
    "Fecha Fin",
    "Nombre",
    "Cargo",
    "Contacto",
    "Recursos",
    "Entregable",
  ]);

  header.eachCell((cell) => {

    cell.font = {
      bold: true,
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "D9D9D9",
      },
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

  });

  // FILAS
  filas.forEach((fila) => {

    const row = worksheet.addRow([
      fila.numeroPregunta,
      fila.descripcionPregunta,
      fila.clasificacion,
      fila.nivel,
      fila.deficiencia,
      fila.actividades,
      fila.fechaInicio,
      fila.fechaFin,
      fila.responsable,
      fila.cargo,
      fila.contacto,
      fila.recursos,
      fila.entregable,
    ]);

    row.eachCell((cell) => {

      cell.alignment = {
        wrapText: true,
        vertical: "top",
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

    });

    // COLOR NIVEL
    const nivelCell = row.getCell(4);

    if (
      fila.nivel?.toLowerCase() === "medio"
    ) {

      nivelCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "FFD966",
        },
      };
    }

  });

// FILA VACÍA
worksheet.addRow([]);

// NOTA FINAL
worksheet.mergeCells(`A${worksheet.lastRow!.number + 1}:M${worksheet.lastRow!.number + 1}`);

const notaCell = worksheet.getCell(
  `A${worksheet.lastRow!.number}`
);

notaCell.value =
  "NOTA: Este anexo se imprimirá directamente desde la Matriz de Evaluación de Control Interno a los Sistemas por Componentes.";

notaCell.font = {
  size: 10,
};

notaCell.alignment = {
  horizontal: "left",
  vertical: "middle",
  wrapText: true,
};

  // DESCARGAR
  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    "plan_accion.xlsx"
  );
};


  return (
<>

    {loading && (
      <div
        className="
          fixed inset-0 z-50
          flex items-center justify-center
          bg-black/40 backdrop-blur-sm
        "
      >
        <div className="bg-white p-8 rounded-2xl shadow-2xl">

          <HashLoader
            color="#084a89"
            loading={loading}
            size={50}
            speedMultiplier={1}
          />

          <p className="mt-4 text-center font-semibold text-gray-700">
            Enviando plan de acción...
          </p>

        </div>
      </div>
    )}

    <div className="w-full min-h-screen p-6 ">

      {/* BOTONES */}
      <div className="flex gap-4 mb-4">

        <button
  onClick={enviarPlan}
  disabled={loading}
  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-full shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
>
  <Send size={18} />
  <span>Enviar Plan de Acción</span>
   </button>

   <button
  onClick={exportarExcel}
  disabled={!planEnviado}
  className={`
    inline-flex items-center justify-center gap-2 px-6 py-2.5
    text-white font-semibold rounded-full transition-all

    ${
      planEnviado
        ? "bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-200 hover:shadow-red-300 hover:-translate-y-0.5 active:scale-95"
        : "bg-gray-400 cursor-not-allowed opacity-60"
    }
  `}
     >
  <Download size={18} />
  Descargar Informe
   </button>

      </div>

      {/* CONTENIDO PDF */}
    <div
    id="area-pdf"
  ref={pdfRef}
  className="
    min-w-[2200px]
    bg-white
    p-4
    text-[11px]
    text-black
  "
  style={{
    fontFamily: "Arial, sans-serif",
  }}
>

        {/* ENCABEZADO */}
        <div className="text-center font-bold text-[12px] mb-3">
          CONTRALORÍA GENERAL DE LA REPÚBLICA
        </div>

        <div className="flex justify-end text-[12px] mb-1" style={{ fontWeight: 'bold' }}>
          ANEXO No. 11-1
        </div>

        <div className="border border-black">
          <div className="border-b border-black text-center font-bold py-1">
            PLAN DE ACCIÓN PARA LA IMPLEMENTACIÓN DE LAS ACTIVIDADES DE
            MEJORA DEL SISTEMA POR COMPONENTES
          </div>

          <div className="flex items-center">
            <div className="flex-1 text-center font-bold text-[11px] px-2 py-3">
              GUÍA ESPECIALIZADA PARA LA IMPLEMENTACIÓN DEL CONTROL INTERNO
              <br />
              EN LAS INSTITUCIONES GUBERNAMENTALES
            </div>
          </div>
        </div>

        {/* DATOS */}
        <div className="mt-3 border border-black">

          {/* ENTIDAD */}
          <div className="border-b border-black flex">
            <div className="w-[120px] border-r border-black px-2 py-2 font-bold">
              ENTIDAD:
            </div>

            <div className="flex-1 px-2 py-2">
              Universidad Nacional Casimiro Sotelo Montenegro
            </div>
          </div>

          {/* PERÍODO */}
          <div className="flex">
            <div className="w-[120px] border-r border-black px-2 py-2 font-bold">
              PERÍODO:
            </div>

            <div className="flex items-center gap-3 px-3 py-2">

              <div className="flex items-center gap-2">
                <span>Del:</span>

                <input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                         className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    resize-none
    overflow-hidden
    p-0
    m-0
    text-center
    align-top
    whitespace-pre-wrap
    break-words
    leading-normal
  "
                />
              </div>

              <div className="flex items-center gap-2">
                <span>Al:</span>

                <input
                  type="date"
                  value={periodoFin}
                  onChange={(e) => setPeriodoFin(e.target.value)}
                         className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    resize-none
    overflow-hidden
    p-0
    m-0
    text-center
    align-top
    whitespace-pre-wrap
    break-words
    leading-normal
  "
                />
              </div>

            </div>
          </div>
        </div>

        {/* TABLA */}
        <table className="w-full border-collapse border border-black mt-4" style={{
    tableLayout: "fixed",
  }}>

          <thead>

            <tr className="bg-gray-200 text-center"style={{
  pageBreakInside: "avoid",
}}>

              <th rowSpan={2} className="border border-black p-2">
                Número Pregunta
              </th>

              <th rowSpan={2} className="border border-black p-2">
                Descripción de la Pregunta
              </th>

              <th rowSpan={2} className="border border-black p-2">
                Clasificación
              </th>

              <th rowSpan={2} className="border border-black p-2">
                Nivel
              </th>

              <th rowSpan={2} className="border border-black p-2">
                Deficiencia
              </th>

              <th rowSpan={2} className="border border-black p-2">
                Actividades
              </th>

              <th rowSpan={2} className="border border-black p-2">
                Fecha Inicio
              </th>

              <th rowSpan={2} className="border border-black p-2">
                Fecha Fin
              </th>

              <th
                colSpan={3}
                className="border border-black p-2 bg-gray-300"
              >
                RESPONSABLE
              </th>

              <th rowSpan={2} className="border border-black p-2">
                Recursos
              </th>

              <th rowSpan={2} className="border border-black p-2">
                Entregable
              </th>
            </tr>

            <tr className="w-full h-full p-1 outline-none bg-white">

              <th className="border border-black p-2">
                Nombre
              </th>

              <th className="border border-black p-2">
                Cargo
              </th>

              <th className="border border-black p-2">
                Contacto
              </th>

            </tr>

          </thead>
<tbody>

  {filas.map((fila, index) => (

  <tr key={index} >

      <td className="border border-black text-center align-middle">
        <input
          type="text"
          value={fila.numeroPregunta}
          readOnly
                 className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    resize-none
    overflow-hidden
    p-0
    m-0
    text-center
    align-top
    whitespace-pre-wrap
    break-words
    leading-normal
  "
          style={{ fontWeight: 'bold' }}
        />
      </td>

      <td className="border border-black align-top p-1">
       <textarea
  ref={(el) => {
    textAreaRefs.current[index] = el;
  }}
  value={fila.descripcionPregunta}
  readOnly
  rows={1}
className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    resize-none
    overflow-hidden
    p-0
    m-0
    text-center
    align-top
    whitespace-pre-wrap
    break-words
    leading-normal
  "
  style={{
  minHeight: "40px",
}}
/>
      </td>

      <td className="border border-black text-center align-middle">
        <input
          type="text"
          value={fila.clasificacion}
          readOnly
          className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    resize-none
    overflow-hidden
    p-0
    m-0
    text-center
    align-top
    whitespace-pre-wrap
    break-words
    leading-normal
  "
          style={{ fontWeight: 'bold' }}
        />
      </td>

    <td className="border border-black align-middle text-center p-1">

  <div
    className={`
      mx-auto
      flex
      items-center
      justify-center
      w-[90%]
      min-h-[35px]
      font-bold
      rounded

      ${
        fila.nivel?.toLowerCase() === "bajo"
          ? "bg-red-500 text-white"
          : fila.nivel?.toLowerCase() === "medio"
          ? "bg-yellow-300 text-black"
          : fila.nivel?.toLowerCase() === "alto"
          ? "bg-green-500 text-white"
          : ""
      }
    `}
  >
    {fila.nivel}
  </div>

</td>

      

      {/* DEFICIENCIA */}
      <td className="border border-black text-center align-middle">
      <textarea
  value={fila.deficiencia}
  onChange={(e) =>
    handleChange(index, "deficiencia", e.target.value)
  }
  onInput={autoResize}
  rows={1}
  className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    resize-none
    overflow-hidden
    p-0
    m-0
    text-left
    align-top
    whitespace-pre-wrap
    break-words
    leading-normal
  "
/>
      </td>

      {/* ACTIVIDADES */}
      <td className="border border-black text-center align-middle">
       <textarea
  value={fila.actividades}
  onChange={(e) =>
    handleChange(index, "actividades", e.target.value)
  }
  onInput={autoResize}
  rows={1}
  className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    resize-none
    overflow-hidden
    p-0
    m-0
    text-left
    align-top
    whitespace-pre-wrap
    break-words
    leading-normal
  "
/>
      </td>

      {/* FECHA INICIO */}
      <td className="border border-black">
        <input
          type="date"
          value={fila.fechaInicio}
          onChange={(e) =>
            handleChange(index, "fechaInicio", e.target.value)
          }
                 className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    resize-none
    overflow-hidden
    p-0
    m-0
    text-center
    align-top
    whitespace-pre-wrap
    break-words
    leading-normal
  "
        />
      </td>

      {/* FECHA FIN */}
      <td className="border border-black">
        <input
          type="date"
          value={fila.fechaFin}
          onChange={(e) =>
            handleChange(index, "fechaFin", e.target.value)
          }
                 className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    resize-none
    overflow-hidden
    p-0
    m-0
    text-center
    align-top
    whitespace-pre-wrap
    break-words
    leading-normal
  "
        />
      </td>

      {/* RESPONSABLE */}
      <td className="border border-black">
       <input
  type="text"
  value={fila.responsable}
  onChange={(e) =>
    handleChange(index, "responsable", e.target.value)
  }
  className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    p-0
    m-0
    text-left
  "
/>
      </td>

      <td className="border border-black">
       <input
  type="text"
  value={fila.cargo}
  onChange={(e) =>
    handleChange(index, "cargo", e.target.value)
  }
  className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    p-0
    m-0
    text-left
  "
/>
      </td>

      <td className="border border-black">
        <input
  type="text"
  value={fila.contacto}
  onChange={(e) =>
    handleChange(index, "contacto", e.target.value)
  }
  className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    p-0
    m-0
    text-left
  "
/>
      </td>

      {/* RECURSOS */}
      <td className="border border-black">
              <textarea
  value={fila.recursos}
  onChange={(e) =>
    handleChange(index, "recursos", e.target.value)
  }
  onInput={autoResize}
  rows={1}
  className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    resize-none
    overflow-hidden
    p-0
    m-0
    text-left
    align-top
    whitespace-pre-wrap
    break-words
    leading-normal
  "
/>
      </td>

      {/* ENTREGABLE */}
      <td className="border border-black">
              <textarea
  value={fila.entregable}
  onChange={(e) =>
    handleChange(index, "entregable", e.target.value)
  }
  onInput={autoResize}
  rows={1}
  className="
    w-full
    h-full
    bg-transparent
    border-none
    outline-none
    resize-none
    overflow-hidden
    p-0
    m-0
    text-left
    align-top
    whitespace-pre-wrap
    break-words
    leading-normal
  "
/>
      </td>

    </tr>

  ))}

</tbody>

        </table>

        {/* NOTA */}
        <div className="mt-3 text-[15px]">
          NOTA: Este anexo se imprimirá directamente desde la Matriz de
          Evaluación de Control Interno a los Sistemas por Componentes.
        </div>

      </div>
    </div>
     </>
  );
}