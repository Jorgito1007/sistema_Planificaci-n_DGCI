"use client";

import { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

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

  const exportarPDF = async () => {
    const input = reportRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save("informe_sistemas_administracion.pdf");
  };

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    const hojaResumen = XLSX.utils.aoa_to_sheet([
      ["INFORME DE EVALUACIÓN DE CONTROL INTERNO DE LOS SISTEMAS DE ADMINISTRACIÓN"],
      [],
      ["INSTITUCIÓN:", ""],
      ["PERIODO:", ""],
      [],
      ["CONTROL INTERNO GLOBAL DE LOS SISTEMAS DE ADMINISTRACIÓN"],
      ["", "Calificación obtenida", "Nivel", "% Cumplimiento (Nota 1)"],
      ["", "", "", ""],
    ]);

    const hojaCumplimiento = XLSX.utils.aoa_to_sheet([
      ["Nivel de Cumplimiento del Control Interno de los Sistemas de Administración"],
      [],
      ["No", "Sistema de Administración", "Puntaje máximo", "Calificación obtenida", "Nivel", "% cumplimiento (Nota 1)"],
      [1, "ADMINISTRACIÓN DE LOS RECURSOS HUMANOS", 5, "", "", ""],
      [2, "PLANEACIÓN Y PROGRAMACIÓN", 5, "", "", ""],
      [3, "PRESUPUESTO", 5, "", "", ""],
      [4, "ADMINISTRACIÓN FINANCIERA", 5, "", "", ""],
      [5, "CONTABILIDAD INTEGRADA", 5, "", "", ""],
      [6, "CONTRATACIÓN Y ADMINISTRACIÓN DE BIENES Y SERVICIOS", 5, "", "", ""],
      [7, "INVERSIONES EN PROGRAMAS Y PROYECTOS", 5, "", "", ""],
      [8, "TECNOLOGÍA DE LA INFORMACIÓN (TI)", 5, "", "", ""],
      ["", "TOTAL", "", "", "", ""],
    ]);

    const hojaPreguntas = XLSX.utils.aoa_to_sheet([
      ["Nivel de Cumplimiento de las preguntas evaluadas de los Sistemas de Administración"],
      [],
      ["Valor", "Nivel", "RH", "Planeación", "Presupuesto", "Adm. Financiera", "Cont. Integrada", "Bienes y Servicios", "Inversiones", "TI", "TOTAL"],
      ["[5]", "Alto", 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["[3 - 4]", "Medio", 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["[0 - 2]", "Bajo", 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["", "TOTAL", 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]);

    const hojaAfirmativas = XLSX.utils.aoa_to_sheet([
      ["Respuestas Afirmativas de las Preguntas Evaluadas por cada Sistema de Administración"],
      [],
      ["", "RH", "Planeación", "Presupuesto", "Adm. Financiera", "Cont. Integrada", "Bienes y Servicios", "Inversiones", "TI", "Total preguntas afirmativas"],
      ["Está Presente (Nota 2)", 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["Resultado", 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["Está Funcionando (Nota 2)", 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["Resultado", 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [],
      ["Conclusiones:"],
      [""],
      [""],
      ["Recomendaciones:"],
      [""],
      [""],
      [],
      ["Fecha:", ""],
    ]);

    hojaCumplimiento["!cols"] = [
      { wch: 6 },
      { wch: 45 },
      { wch: 16 },
      { wch: 20 },
      { wch: 14 },
      { wch: 18 },
    ];

    hojaPreguntas["!cols"] = [
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
    ];

    hojaAfirmativas["!cols"] = [
      { wch: 24 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 10 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, hojaResumen, "Resumen");
    XLSX.utils.book_append_sheet(wb, hojaCumplimiento, "Cumplimiento");
    XLSX.utils.book_append_sheet(wb, hojaPreguntas, "Preguntas");
    XLSX.utils.book_append_sheet(wb, hojaAfirmativas, "Afirmativas");

    XLSX.writeFile(wb, "informe_sistemas_administracion.xlsx");
  };


  return (

    <div className="space-y-4 p-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={exportarPDF}
          className="rounded bg-red-600 px-4 py-2 text-white"
        >
          Exportar PDF
        </button>

        <button
          onClick={exportarExcel}
          className="rounded bg-green-600 px-4 py-2 text-white"
        >
          Exportar Excel
        </button>
      </div>

      <div ref={reportRef} className="bg-white p-4">
        <div className="space-y-6  p-6 text-black">
      <div className="border-2 border-black">
        <div className="border-b-2 border-black px-4 py-3 text-center text-xl font-bold uppercase">
          INFORME DE EVALUACIÓN DE CONTROL INTERNO DE LOS SISTEMAS DE
          ADMINISTRACIÓN
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
          <div className="col-span-9 px-3 py-2"></div>
        </div>
      </div>

      <div className="grid grid-cols-14 gap-4">
        <div className="col-span-12 lg:col-span-7 border-2 border-black">
          <div className="grid grid-cols-12">
            <div className="col-span-6 border-r-2 border-b-2 border-black bg-[#efe3ba] px-4 py-6 text-center text-lg font-bold uppercase">
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
            <div className="col-span-2 border-r-2 border-black bg-white"></div>
            <div className="col-span-2 border-r-2 border-black bg-white"></div>
            <div className="col-span-2 bg-white"></div>
          </div>
        </div>
      </div>

      <div className="border-0">
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
            {sistemas.map((sistema, index) => (
              <tr key={sistema}>
                <td className="border border-black px-2 py-1 text-center">
                  {index + 1}
                </td>
                <td className="border border-black px-2 py-1">{sistema}</td>
                <td className="border border-black px-2 py-1 text-center">5</td>
                <td className="border border-black px-2 py-1 text-center"></td>
                <td className="border border-black px-2 py-1 text-center"></td>
                <td className="border border-black px-2 py-1 text-center"></td>
              </tr>
            ))}

            <tr>
              <td
                colSpan={5}
                className="border border-black px-2 py-2 text-right font-bold"
              >
                TOTAL
              </td>
              <td className="border border-black px-2 py-2 text-center font-bold"></td>
            </tr>
          </tbody>
        </table>

        <div className="px-2 py-3 text-xs">
          <span className="font-bold">Nota 1:</span> El porcentaje de
          cumplimiento se obtiene de la relación entre la calificación obtenida
          sobre el puntaje máximo.
        </div>
      </div>

      <div className="border-2 border-black p-4">
        <div className="mb-3 text-center text-xl font-bold">
          Valoración por sistema de administración
        </div>
        <div className="flex min-h-[420px] items-center justify-center border-2 border-dashed border-gray-400 bg-gray-50 text-gray-500">
          Aquí se colocará el gráfico posteriormente
        </div>
      </div>

      <div className="border-0">
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
                  0
                </td>
              ))}
              <td className="border border-black bg-[#d9eaf7] px-2 py-2 text-center"></td>
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
                  0
                </td>
              ))}
              <td className="border border-black bg-[#d9eaf7] px-2 py-2 text-center"></td>
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
                  0
                </td>
              ))}
              <td className="border border-black bg-[#d9eaf7] px-2 py-2 text-center"></td>
            </tr>

            <tr className="bg-[#d9eaf7] font-bold">
              <td colSpan={2} className="border border-black px-2 py-2 text-center">
                TOTAL
              </td>
              {Array.from({ length: 8 }).map((_, i) => (
                <td key={i} className="border border-black px-2 py-2 text-center">
                  0
                </td>
              ))}
              <td className="border border-black px-2 py-2 text-center"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border-0">
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
      <table className="border-collapse text-sm">
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
                0
              </td>
            ))}

            <td className="border-2 border-black bg-[#d9e4f5] px-2 py-2 text-center font-bold">
              0
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
                0
              </td>
            ))}

            <td className="border-2 border-black bg-[#dfead7] px-2 py-2 text-center font-bold">
              0
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

       <div className="col-span-12 xl:col-span-2">
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

      <div className="space-y-4">
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

      <div className="grid grid-cols-1 gap-10 pt-10 md:grid-cols-3">
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

      <div className="w-[260px] border-2 border-black">
  <div className="grid grid-cols-12">
    <div className="col-span-5 border-r-2 border-black px-3 py-1 text-center font-bold uppercase">
      FECHA:
    </div>

    <div className="col-span-7 px-2 py-1">
      <input
        type="date"
        className="w-full outline-none border-none text-center"
      />
    </div>
  </div>
</div>
    </div>
 
      </div>
    </div>
    
    ); 
}