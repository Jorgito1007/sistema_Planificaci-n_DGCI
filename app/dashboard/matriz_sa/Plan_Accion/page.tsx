"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, Send, CalendarDays, Building2, ClipboardList } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { HashLoader } from "react-spinners";

export default function PlanAccionPage() {
  const pdfRef = useRef<HTMLDivElement>(null);
  const textAreaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFin, setPeriodoFin] = useState("");
  const [filas, setFilas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [planEnviado, setPlanEnviado] = useState(false);

  useEffect(() => {
    obtenerPreguntas();
  }, []);

  const obtenerPreguntas = async () => {
    try {
      const response = await fetch("/api/plan-accion");
      const data = await response.json();

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
             responsable: item.FullName || "",
  cargo: item.Cargo || "",
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

  const handleChange = (index: number, field: string, value: string) => {
    const nuevasFilas = [...filas];
    nuevasFilas[index][field] = value;
    setFilas(nuevasFilas);
  };

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
  };

  useEffect(() => {
    textAreaRefs.current.forEach((textarea) => {
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
      }
    });
  }, [filas]);

  const enviarPlan = async () => {
    try {
      if (!periodoInicio || !periodoFin) {
        Swal.fire({
          icon: "warning",
          title: "Campos incompletos",
          text: "Favor completar el período.",
          confirmButtonColor: "#0B3D91",
        });
        return;
      }

      for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];

        const campos = [
          { key: "deficiencia", label: "Deficiencia" },
          { key: "actividades", label: "Actividades" },
          { key: "fechaInicio", label: "Fecha Inicio" },
          { key: "fechaFin", label: "Fecha Fin" },
          { key: "responsable", label: "Responsable" },
          { key: "cargo", label: "Cargo" },
          { key: "contacto", label: "Contacto" },
          { key: "recursos", label: "Recursos" },
          { key: "entregable", label: "Entregable" },
        ];

        for (const campo of campos) {
          if (!fila[campo.key] || fila[campo.key].toString().trim() === "") {
            Swal.fire({
              icon: "warning",
              title: "Campos incompletos",
              html: `
                Favor completar el campo:
                <br/><br/>
                <strong>${campo.label}</strong>
                <br/><br/>
                en la pregunta:
                <strong>${fila.numeroPregunta}</strong>
              `,
              confirmButtonColor: "#0B3D91",
            });
            return;
          }
        }
      }

      setLoading(true);

      const response = await fetch("/api/plan-accion/guardar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          periodoInicio,
          periodoFin,
          filas,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setPlanEnviado(true);

        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Plan de acción enviado correctamente",
          confirmButtonColor: "#0B3D91",
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
        text: "Ocurrió un error al enviar.",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("Plan Acción", {
      pageSetup: {
        paperSize: 9,
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

    worksheet.mergeCells("A1:M2");
    const titulo = worksheet.getCell("A1");
    titulo.value = "PLAN DE ACCIÓN INSTITUCIONAL";
    titulo.font = {
      bold: true,
      size: 18,
      color: { argb: "FFFFFFFF" },
    };
    titulo.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0B3D91" },
    };
    titulo.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    worksheet.mergeCells("A3:M3");
    const subtitulo = worksheet.getCell("A3");
    subtitulo.value = "Sistema de Control Interno - Universidad Nacional Casimiro Sotelo Montenegro";
    subtitulo.font = {
      bold: true,
      size: 11,
      color: { argb: "FFC7A97A" },
    };
    subtitulo.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF061B33" },
    };
    subtitulo.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    worksheet.getCell("A5").value = "ENTIDAD:";
    worksheet.getCell("A5").font = { bold: true };
    worksheet.mergeCells("B5:M5");
    worksheet.getCell("B5").value = "Universidad Nacional Casimiro Sotelo Montenegro";

    worksheet.getCell("A6").value = "PERÍODO:";
    worksheet.getCell("A6").font = { bold: true };
    worksheet.mergeCells("B6:M6");
    worksheet.getCell("B6").value = `Del: ${periodoInicio}    Al: ${periodoFin}`;

    for (let rowNumber = 5; rowNumber <= 6; rowNumber++) {
      for (let col = 1; col <= 13; col++) {
        const cell = worksheet.getRow(rowNumber).getCell(col);
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = {
          vertical: "middle",
          wrapText: true,
        };
      }
    }

    worksheet.addRow([]);

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
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0B3D91" },
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

      const nivelCell = row.getCell(4);

      if (fila.nivel?.toLowerCase() === "bajo") {
        nivelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF4D4F" },
        };
      }

      if (fila.nivel?.toLowerCase() === "medio") {
        nivelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFD966" },
        };
      }

      if (fila.nivel?.toLowerCase() === "alto") {
        nivelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF22C55E" },
        };
      }
    });

    worksheet.addRow([]);

    worksheet.mergeCells(`A${worksheet.lastRow!.number + 1}:M${worksheet.lastRow!.number + 1}`);

    const notaCell = worksheet.getCell(`A${worksheet.lastRow!.number}`);

    notaCell.value =
      "NOTA: Este documento forma parte del seguimiento institucional del Sistema de Control Interno.";
    notaCell.font = { size: 10 };
    notaCell.alignment = {
      horizontal: "left",
      vertical: "middle",
      wrapText: true,
    };

    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(new Blob([buffer]), "plan_accion_institucional.xlsx");
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <HashLoader color="#0B3D91" loading={loading} size={50} speedMultiplier={1} />

            <p className="mt-4 text-center font-semibold text-gray-700">
              Enviando plan de acción...
            </p>
          </div>
        </div>
      )}

      <div className="min-h-screen w-full bg-slate-100 p-6">
        <div className="mb-5 flex flex-wrap gap-4">
          <button
            onClick={enviarPlan}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B3D91] to-[#1565C0] px-6 py-2.5 font-semibold text-white shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
          >
            <Send size={18} />
            <span>Enviar Plan de Acción</span>
          </button>

          <button
            onClick={exportarExcel}
            disabled={!planEnviado}
            className={`
              inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5
              font-semibold text-white transition-all
              ${
                planEnviado
                  ? "bg-gradient-to-r from-[#C7A97A] to-[#B8860B] shadow-lg shadow-yellow-200 hover:-translate-y-0.5 hover:shadow-yellow-300 active:scale-95"
                  : "cursor-not-allowed bg-gray-400 opacity-60"
              }
            `}
          >
            <Download size={18} />
            Descargar Informe
          </button>
        </div>

        <div
          id="area-pdf"
          ref={pdfRef}
          className="min-w-[2200px] rounded-2xl bg-white p-5 text-[11px] text-black shadow-xl"
          style={{
            fontFamily: "Arial, sans-serif",
          }}
        >
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
            <div className="flex items-center justify-between bg-gradient-to-r from-[#061B33] via-[#0B3D91] to-[#1565C0] px-8 py-5">
              <div className="flex items-center gap-5">
                

                <div>
                  

                  <h1 className="text-2xl font-extrabold uppercase tracking-wide text-white">
                    Plan de Acción
                  </h1>

                  <p className="mt-1 text-sm font-medium text-blue-100">
                    Guia Especializada Para La Implementación Del Control Interno Institucional
                  </p>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-6 bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-5">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-[#0B3D91]">
                  <Building2 size={18} />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Entidad
                  </p>
                </div>

                <p className="text-sm font-bold text-slate-800">
                  Universidad Nacional Casimiro Sotelo Montenegro
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-[#0B3D91]">
                  <CalendarDays size={18} />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Período de Evaluación
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-600">Del:</span>

                  <input
                    type="date"
                    value={periodoInicio}
                    onChange={(e) => setPeriodoInicio(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                  />

                  <span className="font-semibold text-slate-600">Al:</span>

                  <input
                    type="date"
                    value={periodoFin}
                    onChange={(e) => setPeriodoFin(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <table
            className="mt-4 w-full overflow-hidden rounded-xl border border-slate-300"
            style={{ tableLayout: "fixed", borderCollapse: "collapse" }}
          >
            <thead>
              <tr className="bg-[#0B3D91] text-center text-white">
                <th rowSpan={2} className="border border-slate-300 p-2">
                  Número Pregunta
                </th>
                <th rowSpan={2} className="border border-slate-300 p-2">
                  Descripción de la Pregunta
                </th>
                <th rowSpan={2} className="border border-slate-300 p-2">
                  Clasificación
                </th>
                <th rowSpan={2} className="border border-slate-300 p-2">
                  Nivel
                </th>
                <th rowSpan={2} className="border border-slate-300 p-2">
                  Deficiencia
                </th>
                <th rowSpan={2} className="border border-slate-300 p-2">
                  Actividades
                </th>
                <th rowSpan={2} className="border border-slate-300 p-2">
                  Fecha Inicio
                </th>
                <th rowSpan={2} className="border border-slate-300 p-2">
                  Fecha Fin
                </th>
                <th colSpan={3} className="border border-slate-300 bg-[#061B33] p-2 text-[#C7A97A]">
                  RESPONSABLE
                </th>
                <th rowSpan={2} className="border border-slate-300 p-2">
                  Recursos
                </th>
                <th rowSpan={2} className="border border-slate-300 p-2">
                  Entregable
                </th>
              </tr>

              <tr className="bg-[#EAF1FB] text-[#061B33]">
                <th className="border border-slate-300 p-2">Nombre</th>
                <th className="border border-slate-300 p-2">Cargo</th>
                <th className="border border-slate-300 p-2">Contacto</th>
              </tr>
            </thead>

           <tbody>
  {filas.map((fila, index) => (
    <tr key={index} className="odd:bg-white even:bg-slate-50">
      <td className="border border-slate-300 text-center align-middle">
        <input
          type="text"
          value={fila.numeroPregunta}
          readOnly
          className="h-full w-full bg-transparent p-1 text-center font-bold outline-none"
        />
      </td>

      <td className="border border-slate-300 p-1 align-top">
        <textarea
          ref={(el) => {
            textAreaRefs.current[index] = el;
          }}
          value={fila.descripcionPregunta}
          readOnly
          rows={1}
          className="h-full w-full resize-none overflow-hidden bg-transparent p-1 text-center outline-none"
          style={{ minHeight: "40px" }}
        />
      </td>

      <td className="border border-slate-300 text-center align-middle">
        <input
          type="text"
          value={fila.clasificacion}
          readOnly
          className="h-full w-full bg-transparent p-1 text-center font-bold outline-none"
        />
      </td>

      <td className="border border-slate-300 p-1 text-center align-middle">
        <div
          className={`
            mx-auto flex min-h-[35px] w-[90%] items-center justify-center rounded-full font-bold
            ${
              fila.nivel?.toLowerCase() === "bajo"
                ? "bg-red-500 text-white"
                : fila.nivel?.toLowerCase() === "medio"
                ? "bg-yellow-300 text-black"
                : fila.nivel?.toLowerCase() === "alto"
                ? "bg-green-500 text-white"
                : "bg-slate-100 text-slate-700"
            }
          `}
        >
          {fila.nivel}
        </div>
      </td>

      {["deficiencia", "actividades"].map((field) => (
        <td key={field} className="border border-slate-300 align-top">
          <textarea
            value={fila[field]}
            onChange={(e) => handleChange(index, field, e.target.value)}
            onInput={autoResize}
            rows={1}
            className="h-full w-full resize-none overflow-hidden bg-transparent p-2 text-left outline-none focus:bg-blue-50"
          />
        </td>
      ))}

      <td className="border border-slate-300">
        <input
          type="date"
          value={fila.fechaInicio}
          onChange={(e) => handleChange(index, "fechaInicio", e.target.value)}
          className="h-full w-full bg-transparent p-2 text-center outline-none focus:bg-blue-50"
        />
      </td>

      <td className="border border-slate-300">
        <input
          type="date"
          value={fila.fechaFin}
          onChange={(e) => handleChange(index, "fechaFin", e.target.value)}
          className="h-full w-full bg-transparent p-2 text-center outline-none focus:bg-blue-50"
        />
      </td>

      <td className="border border-slate-300">
        <input
          type="text"
          value={fila.responsable}
          readOnly
          className="h-full w-full bg-blue-50 p-2 text-left font-semibold text-slate-700 outline-none"
        />
      </td>

      <td className="border border-slate-300">
        <input
          type="text"
          value={fila.cargo}
          readOnly
          className="h-full w-full bg-blue-50 p-2 text-left font-semibold text-slate-700 outline-none"
        />
      </td>

      <td className="border border-slate-300">
        <input
          type="text"
          value={fila.contacto}
          onChange={(e) => handleChange(index, "contacto", e.target.value)}
          className="h-full w-full bg-transparent p-2 text-left outline-none focus:bg-blue-50"
        />
      </td>

      {["recursos", "entregable"].map((field) => (
        <td key={field} className="border border-slate-300 align-top">
          <textarea
            value={fila[field]}
            onChange={(e) => handleChange(index, field, e.target.value)}
            onInput={autoResize}
            rows={1}
            className="h-full w-full resize-none overflow-hidden bg-transparent p-2 text-left outline-none focus:bg-blue-50"
          />
        </td>
      ))}
    </tr>
  ))}
</tbody>
          </table>

          <div className="mt-4 rounded-xl border-l-4 border-[#0B3D91] bg-blue-50 p-4 text-[13px] text-slate-700">
            <strong>NOTA:</strong> Este documento forma parte del seguimiento institucional del Sistema de Control Interno.
          </div>
        </div>
      </div>
    </>
  );
}