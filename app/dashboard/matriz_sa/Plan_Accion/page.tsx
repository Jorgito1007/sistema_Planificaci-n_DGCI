"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Download,
  Send,
  Save,
  CalendarDays,
  Building2,
  CheckCircle2,
  FileText,
  LockKeyhole,
  PencilLine,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { HashLoader } from "react-spinners";
import { useNotifications } from "@/context/NotificationContext";

export default function PlanAccionPage() {
  const pdfRef = useRef<HTMLDivElement>(null);
  const textAreaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFin, setPeriodoFin] = useState("");
  const [filas, setFilas] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [planEnviado, setPlanEnviado] = useState(false);

  const { cargarNotificaciones } = useNotifications();

  // ============================================================
  // CARGAR PREGUNTAS
  // ============================================================

  useEffect(() => {
    obtenerPreguntas();
  }, []);

const obtenerPreguntas = async () => {
  try {

    const response =
      await fetch(
        "/api/plan-accion",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );


    const data =
      await response.json();


    if (!response.ok || !data.ok) {

      console.error(
        "Error cargando Plan de Acción:",
        data.message
      );

      return;
    }


    // ==========================================================
    // FORMATEAR FECHA PARA INPUT type="date"
    // ==========================================================

    const formatearFechaInput = (
      fecha: string | null
    ) => {

      if (!fecha) {
        return "";
      }

      return String(fecha)
        .substring(0, 10);
    };


    // ==========================================================
    // MAPEAR PREGUNTAS + BORRADOR
    // ==========================================================

    const preguntasMapeadas =
      data.data.map(
        (item: any) => ({

          // Datos originales de la matriz

          numeroPregunta:
            item.Numero || "",

          descripcionPregunta:
            item.Texto || "",

          clasificacion:
            item.Calificacion ?? "",

          nivel:
            item.Nivel || "",


          // Datos del Plan de Acción

          planAccionId:
            item.PlanAccionId ?? null,

          deficiencia:
            item.Deficiencia || "",

          actividades:
            item.Actividades || "",

          fechaInicio:
            formatearFechaInput(
              item.FechaInicio
            ),

          fechaFin:
            formatearFechaInput(
              item.FechaFin
            ),


          // Responsable original

          responsable:
            item.FullName || "",

          cargo:
            item.Cargo || "",


          // Datos editables

          contacto:
            item.Contacto || "",

          recursos:
            item.Recursos || "",

          entregable:
            item.Entregable || "",


          // Estado individual

          estado:
            item.Estado ?? 0,

        })
      );


    setFilas(
      preguntasMapeadas
    );


    // ==========================================================
    // RECUPERAR PERÍODO
    // ==========================================================

    setPeriodoInicio(
      formatearFechaInput(
        data.periodoInicio
      )
    );


    setPeriodoFin(
      formatearFechaInput(
        data.periodoFin
      )
    );


    // ==========================================================
    // ESTADO DEL PLAN
    // ==========================================================

    setPlanEnviado(
      Boolean(
        data.planEnviado
      )
    );


    console.log(
      "PLAN DE ACCIÓN CARGADO:",
      {
        filas:
          preguntasMapeadas,

        tieneBorrador:
          data.tieneBorrador,

        planEnviado:
          data.planEnviado,

        periodoInicio:
          data.periodoInicio,

        periodoFin:
          data.periodoFin,
      }
    );

  } catch (error) {

    console.error(
      "ERROR CARGANDO PLAN DE ACCIÓN:",
      error
    );
  }
};

  // ============================================================
  // CAMBIAR CAMPOS
  // ============================================================

  const handleChange = (
    index: number,
    field: string,
    value: string
  ) => {
    if (planEnviado) {
      return;
    }

    setFilas((prev) =>
      prev.map((fila, i) =>
        i === index
          ? {
              ...fila,
              [field]: value,
            }
          : fila
      )
    );
  };

  // ============================================================
  // AUTO RESIZE
  // ============================================================

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
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    });
  }, [filas]);

  // ============================================================
  // GUARDAR BORRADOR
  // ============================================================
  // EN EL PASO 2 CONECTAREMOS ESTA FUNCIÓN CON SQL
  // ============================================================

 const guardarBorrador = async () => {
  if (planEnviado) {
    return;
  }

  if (filas.length === 0) {
    await Swal.fire({
      icon: "warning",
      title: "Sin información",
      text: "No existen registros disponibles para guardar.",
      confirmButtonColor: "#0B4DA2",
    });

    return;
  }

  try {
    setGuardando(true);

    const response = await fetch(
      "/api/plan-accion/borrador",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          periodoInicio:
            periodoInicio || null,

          periodoFin:
            periodoFin || null,

          filas,
        }),
      }
    );


    const data =
      await response.json();


    if (!response.ok || !data.ok) {

      if (response.status === 409) {
        setPlanEnviado(true);
      }

      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text:
          data.message ||
          "No fue posible guardar los avances.",
        confirmButtonColor: "#0B4DA2",
      });

      return;
    }


    await Swal.fire({
      icon: "success",
      title: "Avances guardados",
      text:
        "El borrador del Plan de Acción fue guardado correctamente.",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#0B4DA2",
      timer: 1800,
      timerProgressBar: true,
    });

  } catch (error) {

    console.error(
      "ERROR GUARDANDO BORRADOR:",
      error
    );


    await Swal.fire({
      icon: "error",
      title: "Error",
      text:
        "Ocurrió un error al guardar el borrador.",
      confirmButtonColor: "#0B4DA2",
    });

  } finally {

    setGuardando(false);
  }
};
  // ============================================================
  // ENVIAR PLAN DE ACCIÓN
  // ============================================================

  const enviarPlan = async () => {
    try {
      if (planEnviado) {
        return;
      }

      if (!periodoInicio || !periodoFin) {
        await Swal.fire({
          icon: "warning",
          title: "Período incompleto",
          text: "Debe seleccionar la fecha de inicio y la fecha de fin.",
          confirmButtonColor: "#0B4DA2",
        });

        return;
      }

      if (new Date(periodoInicio) > new Date(periodoFin)) {
        await Swal.fire({
          icon: "warning",
          title: "Período no válido",
          text: "La fecha de inicio no puede ser posterior a la fecha de fin.",
          confirmButtonColor: "#0B4DA2",
        });

        return;
      }

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
            await Swal.fire({
              icon: "warning",
              title: "Información incompleta",
              html: `
                Debe completar el campo:
                <br/><br/>
                <strong>${campo.label}</strong>
                <br/><br/>
                correspondiente a la pregunta:
                <br/>
                <strong>${fila.numeroPregunta}</strong>
              `,
              confirmButtonColor: "#0B4DA2",
            });

            return;
          }
        }

        if (
          new Date(fila.fechaInicio) >
          new Date(fila.fechaFin)
        ) {
          await Swal.fire({
            icon: "warning",
            title: "Fechas no válidas",
            html: `
              La fecha de inicio no puede ser posterior
              a la fecha de fin en la pregunta:
              <br/><br/>
              <strong>${fila.numeroPregunta}</strong>
            `,
            confirmButtonColor: "#0B4DA2",
          });

          return;
        }
      }

      const confirmacion = await Swal.fire({
        icon: "question",
        title: "¿Enviar Plan de Acción?",
        html: `
          Está a punto de realizar el envío definitivo.
          <br/><br/>
          <strong>
            Una vez enviado, el Plan de Acción quedará cerrado
            y no podrá continuar editando la información.
          </strong>
        `,
        showCancelButton: true,
        confirmButtonText: "Sí, enviar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#0B4DA2",
        cancelButtonColor: "#64748B",
        reverseButtons: true,
      });

      if (!confirmacion.isConfirmed) {
        return;
      }

      setLoading(true);

      const response = await fetch(
        "/api/plan-accion/guardar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
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

        await cargarNotificaciones();

        await Swal.fire({
          icon: "success",
          title: "Plan de Acción enviado",
          html: `
            El Plan de Acción fue enviado correctamente.
            <br/><br/>
            <strong>
              El proceso de edición ha finalizado.
            </strong>
          `,
          confirmButtonColor: "#0B4DA2",
        });
      } else {
        await Swal.fire({
          icon: "error",
          title: "No se pudo enviar",
          text:
            data.message ||
            "Ocurrió un error al enviar el Plan de Acción.",
          confirmButtonColor: "#0B4DA2",
        });
      }
    } catch (error) {
      console.error(
        "Error enviando Plan de Acción:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al enviar el Plan de Acción.",
        confirmButtonColor: "#0B4DA2",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // EXPORTAR EXCEL
  // ============================================================

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
      color: {
        argb: "FFFFFFFF",
      },
    };

    titulo.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF0B3D91",
      },
    };

    titulo.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    worksheet.mergeCells("A3:M3");

    const subtitulo = worksheet.getCell("A3");

    subtitulo.value =
      "Sistema de Control Interno - Universidad Nacional Casimiro Sotelo Montenegro";

    subtitulo.font = {
      bold: true,
      size: 11,
      color: {
        argb: "FFC7A97A",
      },
    };

    subtitulo.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF061B33",
      },
    };

    subtitulo.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    worksheet.getCell("A5").value = "ENTIDAD:";
    worksheet.getCell("A5").font = {
      bold: true,
    };

    worksheet.mergeCells("B5:M5");

    worksheet.getCell("B5").value =
      "Universidad Nacional Casimiro Sotelo Montenegro";

    worksheet.getCell("A6").value = "PERÍODO:";
    worksheet.getCell("A6").font = {
      bold: true,
    };

    worksheet.mergeCells("B6:M6");

    worksheet.getCell("B6").value =
      `Del: ${periodoInicio}    Al: ${periodoFin}`;

    for (
      let rowNumber = 5;
      rowNumber <= 6;
      rowNumber++
    ) {
      for (let col = 1; col <= 13; col++) {
        const cell =
          worksheet
            .getRow(rowNumber)
            .getCell(col);

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
        color: {
          argb: "FFFFFFFF",
        },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "FF0B3D91",
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

      if (
        fila.nivel?.toLowerCase() === "bajo"
      ) {
        nivelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FFFF4D4F",
          },
        };
      }

      if (
        fila.nivel?.toLowerCase() === "medio"
      ) {
        nivelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FFFFD966",
          },
        };
      }

      if (
        fila.nivel?.toLowerCase() === "alto"
      ) {
        nivelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FF22C55E",
          },
        };
      }
    });

    worksheet.addRow([]);

    const filaNota =
      worksheet.lastRow!.number + 1;

    worksheet.mergeCells(
      `A${filaNota}:M${filaNota}`
    );

    const notaCell =
      worksheet.getCell(`A${filaNota}`);

    notaCell.value =
      "NOTA: Este documento forma parte del seguimiento institucional del Sistema de Control Interno.";

    notaCell.font = {
      size: 10,
    };

    notaCell.alignment = {
      horizontal: "left",
      vertical: "middle",
      wrapText: true,
    };

    const buffer =
      await workbook.xlsx.writeBuffer();

    saveAs(
      new Blob([buffer]),
      "plan_accion_institucional.xlsx"
    );
  };

  // ============================================================
  // ESTILOS CAMPOS
  // ============================================================

  const claseCampoEditable = `
    h-full
    w-full
    bg-white
    p-2.5
    text-left
    text-slate-700
    outline-none
    transition-colors
    placeholder:text-slate-400
    focus:bg-blue-50
    disabled:cursor-not-allowed
    disabled:bg-slate-100
    disabled:text-slate-500
  `;

  const claseFecha = `
    h-full
    w-full
    bg-white
    p-2.5
    text-center
    text-slate-700
    outline-none
    transition-colors
    focus:bg-blue-50
    disabled:cursor-not-allowed
    disabled:bg-slate-100
    disabled:text-slate-500
  `;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* ========================================================
          LOADER
      ======================================================== */}

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
          <div className="min-w-[300px] rounded-2xl bg-white p-8 shadow-2xl">
            <div className="flex justify-center">
              <HashLoader
                color="#0B3D91"
                loading={loading}
                size={50}
                speedMultiplier={1}
              />
            </div>

            <p className="mt-5 text-center text-base font-bold text-slate-800">
              Enviando Plan de Acción
            </p>

            <p className="mt-1 text-center text-sm text-slate-500">
              Espere un momento...
            </p>
          </div>
        </div>
      )}

      <div className="min-h-screen w-full bg-slate-100 p-4 md:p-6">

        {/* ======================================================
            CABECERA PRINCIPAL
        ====================================================== */}

        <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B4DA2] via-[#126CB1] to-[#25A7BC] shadow-lg">

          {/* DECORACIÓN */}

          <div className="pointer-events-none absolute -right-12 -top-24 h-56 w-56 rounded-full bg-white/[0.06]" />

          <div className="pointer-events-none absolute right-16 -bottom-24 h-48 w-48 rounded-full bg-white/[0.05]" />

          <div className="pointer-events-none absolute right-28 top-0 h-full w-24 skew-x-[-12deg] bg-white/[0.04]" />

          <div className="relative flex flex-wrap items-center justify-between gap-5 px-6 py-6">

            {/* TITULO */}

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                Plan de Acción
              </h1>

              <p className="mt-1 text-sm font-medium text-blue-50">
                Gestión y seguimiento de acciones para el fortalecimiento del Control Interno.
              </p>
            </div>

            {/* BOTONES */}

            <div className="flex flex-wrap items-center gap-2.5">

              {/* GUARDAR */}

              <button
                type="button"
                onClick={guardarBorrador}
                disabled={
                  loading ||
                  guardando ||
                  planEnviado
                }
                className={`
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  px-4
                  text-sm
                  font-bold
                  transition-all
                  duration-200

                  ${
                    planEnviado
                      ? `
                        cursor-not-allowed
                        border-white/10
                        bg-white/10
                        text-white/50
                      `
                      : `
                        border-white/25
                        bg-white/10
                        text-white
                        shadow-sm
                        backdrop-blur-sm
                        hover:-translate-y-0.5
                        hover:bg-white/20
                        hover:shadow-md
                      `
                  }
                `}
              >
                {guardando ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={17} />

                    Guardar
                  </>
                )}
              </button>

              {/* ENVIAR */}

              {!planEnviado && (
  <button
    type="button"
    onClick={enviarPlan}
    disabled={loading || guardando}
    className="
      inline-flex
      h-10
      items-center
      justify-center
      gap-2
      rounded-xl
      bg-emerald-500
      px-4
      text-sm
      font-bold
      text-white
      shadow-md
      shadow-emerald-900/10
      transition-all
      duration-200
      hover:-translate-y-0.5
      hover:bg-emerald-400
      hover:shadow-lg
      active:scale-[0.98]
      disabled:cursor-not-allowed
      disabled:opacity-60
    "
  >
    <Send size={17} />
    Enviar Plan
  </button>
)}
              {/* DESCARGAR */}

              <button
                type="button"
                onClick={exportarExcel}
                disabled={!planEnviado}
                className={`
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  px-4
                  text-sm
                  font-bold
                  transition-all
                  duration-200

                  ${
                    planEnviado
                      ? `
                        border-white/25
                        bg-white/10
                        text-white
                        shadow-sm
                        backdrop-blur-sm
                        hover:-translate-y-0.5
                        hover:bg-white/20
                      `
                      : `
                        cursor-not-allowed
                        border-white/10
                        bg-white/10
                        text-white/40
                      `
                  }
                `}
              >
                <Download size={17} />

                Exportar Excel
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================
            ESTADO
        ====================================================== */}

        <div
          className={`
            mb-5
            flex
            items-center
            gap-2
            rounded-xl
            border
            px-4
            py-3
            text-sm
            font-semibold

            ${
              planEnviado
                ? `
                  border-emerald-200
                  bg-emerald-50
                  text-emerald-700
                `
                : `
                  border-blue-200
                  bg-blue-50
                  text-[#0B4DA2]
                `
            }
          `}
        >
          {planEnviado ? (
            <>
              <LockKeyhole size={17} />

              Plan enviado. El proceso se encuentra cerrado para edición.
            </>
          ) : (
            <>
     


            </>
          )}
        </div>

        {/* ======================================================
            CONTENEDOR HORIZONTAL
        ====================================================== */}

        <div className="overflow-x-auto rounded-2xl">

          <div
            id="area-pdf"
            ref={pdfRef}
            className="
              min-w-[2200px]
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              text-[11px]
              text-black
              shadow-lg
            "
            style={{
              fontFamily:
                "Arial, sans-serif",
            }}
          >

            {/* ==================================================
                TITULO DEL INFORME
            ================================================== */}

            <div className="bg-[#123F60] px-8 py-5 text-center">

              <h2 className="text-xl font-extrabold  tracking-wide text-white">
                Plan de Acción para el Fortalecimiento del Control Interno Institucional
              </h2>

              <p className="mt-1 text-xs font-medium text-blue-100">
                Guía especializada para la implementación del Control Interno Institucional
              </p>
            </div>

            {/* ==================================================
                DATOS GENERALES
            ================================================== */}

            <div className="grid grid-cols-2 gap-5 border-b border-slate-200 bg-slate-50 p-6">

              {/* ENTIDAD */}

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

                <div className="mb-2 flex items-center gap-2 text-[#0B4DA2]">

                  <Building2 size={18} />

                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Entidad
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-800">
                  Universidad Nacional Casimiro Sotelo Montenegro
                </p>
              </div>

              {/* PERIODO */}

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

                <div className="mb-3 flex items-center gap-2 text-[#0B4DA2]">

                  <CalendarDays size={18} />

                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Período de Evaluación
                  </span>
                </div>

                <div className="flex items-center gap-3">

                  <span className="font-bold text-slate-600">
                    Del:
                  </span>

                  <input
                    type="date"
                    value={periodoInicio}
                    disabled={planEnviado}
                    onChange={(e) =>
                      setPeriodoInicio(
                        e.target.value
                      )
                    }
                    className="
                      rounded-lg
                      border
                      border-slate-300
                      bg-white
                      px-3
                      py-2
                      text-sm
                      outline-none
                      transition
                      focus:border-[#0B4DA2]
                      focus:ring-2
                      focus:ring-blue-100
                      disabled:cursor-not-allowed
                      disabled:bg-slate-100
                      disabled:text-slate-500
                    "
                  />

                  <span className="font-bold text-slate-600">
                    Al:
                  </span>

                  <input
                    type="date"
                    value={periodoFin}
                    disabled={planEnviado}
                    onChange={(e) =>
                      setPeriodoFin(
                        e.target.value
                      )
                    }
                    className="
                      rounded-lg
                      border
                      border-slate-300
                      bg-white
                      px-3
                      py-2
                      text-sm
                      outline-none
                      transition
                      focus:border-[#0B4DA2]
                      focus:ring-2
                      focus:ring-blue-100
                      disabled:cursor-not-allowed
                      disabled:bg-slate-100
                      disabled:text-slate-500
                    "
                  />
                </div>
              </div>
            </div>

            {/* ==================================================
                TABLA
            ================================================== */}

            <div className="p-5">

              <div className="overflow-hidden rounded-xl border border-slate-300">

                <table
                  className="w-full"
                  style={{
                    tableLayout: "fixed",
                    borderCollapse:
                      "collapse",
                  }}
                >
                  <thead>

                    {/* PRIMER ENCABEZADO */}

                    <tr className="bg-[#0B4DA2] text-center text-white">

                      <th
                        rowSpan={2}
                        className="w-[120px] border border-blue-800 p-3"
                      >
                        Número
                      </th>

                      <th
                        rowSpan={2}
                        className="w-[340px] border border-blue-800 p-3"
                      >
                        Descripción de la Pregunta
                      </th>

                      <th
                        rowSpan={2}
                        className="w-[120px] border border-blue-800 p-3"
                      >
                        Clasificación
                      </th>

                      <th
                        rowSpan={2}
                        className="w-[120px] border border-blue-800 p-3"
                      >
                        Nivel
                      </th>

                      <th
                        rowSpan={2}
                        className="w-[240px] border border-blue-800 p-3"
                      >
                        Deficiencia
                      </th>

                      <th
                        rowSpan={2}
                        className="w-[260px] border border-blue-800 p-3"
                      >
                        Actividades
                      </th>

                      <th
                        rowSpan={2}
                        className="w-[145px] border border-blue-800 p-3"
                      >
                        Fecha Inicio
                      </th>

                      <th
                        rowSpan={2}
                        className="w-[145px] border border-blue-800 p-3"
                      >
                        Fecha Fin
                      </th>

                      <th
                        colSpan={3}
                        className="border border-blue-950 bg-[#123F60] p-3 text-white"
                      >
                        RESPONSABLE
                      </th>

                      <th
                        rowSpan={2}
                        className="w-[220px] border border-blue-800 p-3"
                      >
                        Recursos
                      </th>

                      <th
                        rowSpan={2}
                        className="w-[220px] border border-blue-800 p-3"
                      >
                        Entregable
                      </th>
                    </tr>

                    {/* SEGUNDO ENCABEZADO */}

                    <tr className="bg-[#EAF1FB] font-bold text-[#123F60]">

                      <th className="w-[200px] border border-slate-300 p-2.5">
                        Nombre
                      </th>

                      <th className="w-[180px] border border-slate-300 p-2.5">
                        Cargo
                      </th>

                      <th className="w-[180px] border border-slate-300 p-2.5">
                        Contacto
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filas.map(
                      (fila, index) => (
                        <tr
                          key={index}
                          className="
                            odd:bg-white
                            even:bg-slate-50/70
                            transition-colors
                            hover:bg-blue-50/40
                          "
                        >

                          {/* NUMERO */}

                          <td className="border border-slate-300 text-center align-middle">

                            <input
                              type="text"
                              value={
                                fila.numeroPregunta
                              }
                              readOnly
                              className="
                                h-full
                                w-full
                                bg-transparent
                                p-2
                                text-center
                                font-extrabold
                                text-[#0B4DA2]
                                outline-none
                              "
                            />
                          </td>

                          {/* DESCRIPCION */}

                          <td className="border border-slate-300 p-1 align-top">

                            <textarea
                              ref={(el) => {
                                textAreaRefs.current[
                                  index
                                ] = el;
                              }}
                              value={
                                fila.descripcionPregunta
                              }
                              readOnly
                              rows={1}
                              className="
                                h-full
                                w-full
                                resize-none
                                overflow-hidden
                                bg-transparent
                                p-2
                                text-left
                                leading-relaxed
                                text-slate-700
                                outline-none
                              "
                              style={{
                                minHeight:
                                  "55px",
                              }}
                            />
                          </td>

                          {/* CLASIFICACION */}

                          <td className="border border-slate-300 text-center align-middle">

                            <input
                              type="text"
                              value={
                                fila.clasificacion
                              }
                              readOnly
                              className="
                                h-full
                                w-full
                                bg-transparent
                                p-2
                                text-center
                                font-bold
                                text-slate-700
                                outline-none
                              "
                            />
                          </td>

                          {/* NIVEL */}

                          <td className="border border-slate-300 p-2 text-center align-middle">

                            <div
                              className={`
                                mx-auto
                                flex
                                min-h-[34px]
                                w-[88%]
                                items-center
                                justify-center
                                rounded-full
                                px-3
                                text-xs
                                font-extrabold
                                uppercase
                                tracking-wide

                                ${
                                  fila.nivel
                                    ?.toLowerCase() ===
                                  "bajo"
                                    ? `
                                      bg-red-100
                                      text-red-700
                                      ring-1
                                      ring-red-200
                                    `
                                    : fila.nivel?.toLowerCase() ===
                                      "medio"
                                    ? `
                                      bg-amber-100
                                      text-amber-700
                                      ring-1
                                      ring-amber-200
                                    `
                                    : fila.nivel?.toLowerCase() ===
                                      "alto"
                                    ? `
                                      bg-emerald-100
                                      text-emerald-700
                                      ring-1
                                      ring-emerald-200
                                    `
                                    : `
                                      bg-slate-100
                                      text-slate-600
                                      ring-1
                                      ring-slate-200
                                    `
                                }
                              `}
                            >
                              {fila.nivel}
                            </div>
                          </td>

                          {/* DEFICIENCIA Y ACTIVIDADES */}

                          {[
                            "deficiencia",
                            "actividades",
                          ].map((field) => (
                            <td
                              key={field}
                              className="border border-slate-300 bg-white align-top"
                            >
                              <textarea
                                value={
                                  fila[field]
                                }
                                disabled={
                                  planEnviado
                                }
                                onChange={(e) =>
                                  handleChange(
                                    index,
                                    field,
                                    e.target.value
                                  )
                                }
                                onInput={
                                  autoResize
                                }
                                rows={1}
                                placeholder={
                                  field ===
                                  "deficiencia"
                                    ? "Describa la deficiencia identificada..."
                                    : "Describa las actividades a realizar..."
                                }
                                className={`
                                  ${claseCampoEditable}
                                  resize-none
                                  overflow-hidden
                                `}
                                style={{
                                  minHeight:
                                    "65px",
                                }}
                              />
                            </td>
                          ))}

                          {/* FECHA INICIO */}

                          <td className="border border-slate-300 bg-white">

                            <input
                              type="date"
                              value={
                                fila.fechaInicio
                              }
                              disabled={
                                planEnviado
                              }
                              onChange={(e) =>
                                handleChange(
                                  index,
                                  "fechaInicio",
                                  e.target.value
                                )
                              }
                              className={
                                claseFecha
                              }
                            />
                          </td>

                          {/* FECHA FIN */}

                          <td className="border border-slate-300 bg-white">

                            <input
                              type="date"
                              value={
                                fila.fechaFin
                              }
                              disabled={
                                planEnviado
                              }
                              onChange={(e) =>
                                handleChange(
                                  index,
                                  "fechaFin",
                                  e.target.value
                                )
                              }
                              className={
                                claseFecha
                              }
                            />
                          </td>

                          {/* RESPONSABLE */}

                          <td className="border border-slate-300">

                            <input
                              type="text"
                              value={
                                fila.responsable
                              }
                              readOnly
                              className="
                                h-full
                                w-full
                                bg-blue-50/60
                                p-2.5
                                text-left
                                font-semibold
                                text-slate-700
                                outline-none
                              "
                            />
                          </td>

                          {/* CARGO */}

                          <td className="border border-slate-300">

                            <input
                              type="text"
                              value={
                                fila.cargo
                              }
                              readOnly
                              className="
                                h-full
                                w-full
                                bg-blue-50/60
                                p-2.5
                                text-left
                                font-semibold
                                text-slate-700
                                outline-none
                              "
                            />
                          </td>

                          {/* CONTACTO */}

                          <td className="border border-slate-300 bg-white">

                            <input
                              type="text"
                              value={
                                fila.contacto
                              }
                              disabled={
                                planEnviado
                              }
                              placeholder="Contacto..."
                              onChange={(e) =>
                                handleChange(
                                  index,
                                  "contacto",
                                  e.target.value
                                )
                              }
                              className={
                                claseCampoEditable
                              }
                            />
                          </td>

                          {/* RECURSOS Y ENTREGABLE */}

                          {[
                            "recursos",
                            "entregable",
                          ].map((field) => (
                            <td
                              key={field}
                              className="border border-slate-300 bg-white align-top"
                            >
                              <textarea
                                value={
                                  fila[field]
                                }
                                disabled={
                                  planEnviado
                                }
                                onChange={(e) =>
                                  handleChange(
                                    index,
                                    field,
                                    e.target.value
                                  )
                                }
                                onInput={
                                  autoResize
                                }
                                rows={1}
                                placeholder={
                                  field ===
                                  "recursos"
                                    ? "Recursos requeridos..."
                                    : "Producto o evidencia esperada..."
                                }
                                className={`
                                  ${claseCampoEditable}
                                  resize-none
                                  overflow-hidden
                                `}
                                style={{
                                  minHeight:
                                    "65px",
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* ==================================================
                  NOTA
              ================================================== */}

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 border-l-4 border-l-[#0B4DA2] bg-blue-50/70 p-4 text-[13px] text-slate-700">

                <FileText
                  size={18}
                  className="mt-0.5 shrink-0 text-[#0B4DA2]"
                />

                <div>
                  <strong className="text-[#0B4DA2]">
                    NOTA:
                  </strong>{" "}

                  Este documento forma parte del seguimiento institucional del Sistema de Control Interno. Utilice la opción{" "}
                  <strong>Guardar</strong>{" "}
                  para conservar sus avances y{" "}
                  <strong>Enviar Plan</strong>{" "}
                  únicamente cuando haya completado toda la información.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}