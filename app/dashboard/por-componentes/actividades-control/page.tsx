"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
};

type RegistroPrincipio = {
  principioId: number;
  principioTitulo: string;
  color: string;
  rowColor: string;
  preguntaGeneral: PreguntaGeneralForm;
  preguntas: PreguntaDetalleForm[];
};

const PRINCIPIOS: Principio[] = [
  { id: 10, titulo: "Principio 10", color: "bg-blue-600", rowColor: "bg-[#cfe2f3]" },
  { id: 11, titulo: "Principio 11", color: "bg-green-600", rowColor: "bg-[#d9ead3]" },
  { id: 12, titulo: "Principio 12", color: "bg-yellow-500", rowColor: "bg-[#fff2cc]" },
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

export default function ActividadesControlPage() {
  const SUBMODULE_KEY = "sa_AControl";

  const [open, setOpen] = useState(false);
  const [principioActual, setPrincipioActual] = useState<Principio | null>(null);

  const [preguntaGeneral, setPreguntaGeneral] = useState<PreguntaGeneralForm>({
    numero: "",
    texto: "",
  });

  const [preguntasDetalle, setPreguntasDetalle] = useState<PreguntaDetalleForm[]>([]);
  const [registros, setRegistros] = useState<RegistroPrincipio[]>([]);

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
  }, []);

  useEffect(() => {
    localStorage.setItem("actividades_control", JSON.stringify(registros));
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
  };

  const registrosOrdenados = useMemo(() => {
    return [...registros].sort((a, b) => a.principioId - b.principioId);
  }, [registros]);

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Componente 3</h1>
        <h2 className="mt-2 text-lg font-semibold text-slate-700">
          ACTIVIDADES DE CONTROL
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-600 text-justify">
        Establecer y ejecutar Actividades de Control, para contribuir a la administración de 
        los riesgos en la consecución de los objetivos de la Entidad.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRINCIPIOS.map((principio) => (
          <button
            key={principio.id}
            type="button"
            onClick={() => abrirModal(principio)}
            className={`${principio.color} rounded-2xl p-5 text-left text-white shadow-md transition hover:scale-[1.02]`}
          >
            <h3 className="text-lg font-bold">{principio.titulo}</h3>
            <p className="mt-2 text-sm opacity-90">Registrar o editar contenido</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-slate-100 px-4 py-3">
          <h3 className="text-base font-semibold text-slate-800">
            Matriz de Evaluación - Sistema de Control Interno
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[2200px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#d9e7f5] text-center font-semibold">
                <th rowSpan={4} className="border px-2 py-2 w-[60px]"></th>
                <th rowSpan={4} className="border px-2 py-2 min-w-[500px]"></th>

                <th className="border px-2 py-2 min-w-[180px]">RESPONSABLE</th>

                <th colSpan={7} className="border px-2 py-2">
                  CRITERIOS DE VALORACIÓN
                </th>

                <th colSpan={2} rowSpan={2} className="border px-2 py-2 bg-[#bcd4ec]">
                  Nivel de cumplimiento del principio
                </th>

                <th colSpan={3} rowSpan={2} className="border px-2 py-2">
                  EVIDENCIAS DE CUMPLIMIENTO DE LOS PARÁMETROS ESTABLECIDOS
                   <br />
                  Nombre del documento (Manual, guía, política, lineamiento, norma, procedimiento, etc)
                </th>

                <th colSpan={2} className="border px-2 py-2">
                  DIFUSIÓN / COMUNICACIÓN
                </th>
              </tr>

              <tr className="bg-[#eef4fb] text-center">
                <th
                  rowSpan={3}
                  className="border px-2 py-2 min-w-[180px] text-center align-middle"
                >
                  CARGO
                </th>

                <th colSpan={3} className="border px-2 py-2">
                  Presente
                </th>

                <th rowSpan={3} className="border px-2 py-2 min-w-[90px]">
                  Está presente
                </th>

                <th colSpan={2} className="border px-2 py-2">
                  Funcionando
                </th>

                <th rowSpan={3} className="border px-2 py-2 min-w-[95px]">
                  Está funcionando
                </th>

                <th rowSpan={3} className="border px-2 py-2 min-w-[100px]">
                  INTERNA
                </th>

                <th rowSpan={3} className="border px-2 py-2 min-w-[100px]">
                  EXTERNA
                </th>
              </tr>

              <tr className="bg-[#eef4fb] text-center">
                <th rowSpan={2} className="border px-2 py-2 min-w-[65px]">Existe</th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[65px]">Aprobado</th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[65px]">Difundido</th>

                <th rowSpan={2} className="border px-2 py-2 min-w-[80px]">
                  Implementado
                </th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[80px]">
                  Actualizado
                </th>

                <th rowSpan={2} className="border px-2 py-2 min-w-[90px] bg-[#d6e5f4]">
                  Calificación
                </th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[100px] bg-[#d6e5f4]">
                  Nivel
                </th>

                <th rowSpan={2} className="border px-2 py-2 min-w-[160px]">
                  TIPO DE DOCUMENTO
                </th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[260px]">
                  DESCRIPCIÓN
                </th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[170px]">
                  FECHA DE EMISIÓN / APROBACIÓN
                </th>
              </tr>

              <tr className="bg-[#eef4fb] text-center">
                <th className="border px-2 py-2"></th>
              </tr>
            </thead>

            <tbody>
              {registrosOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={17} className="border px-4 py-8 text-center text-slate-500">
                    Aún no hay registros.
                  </td>
                </tr>
              ) : (
                registrosOrdenados.map((registro) => (
                  <Fragment key={registro.principioId}>
                    <tr className={`${registro.rowColor} font-semibold`}>
                      <td colSpan={17} className="border px-3 py-3">
                        {registro.preguntaGeneral.numero} {registro.preguntaGeneral.texto}
                      </td>
                    </tr>

                    {registro.preguntas.map((pregunta, index) => (
                      <tr key={`${registro.principioId}-${index}`} className="hover:bg-slate-50">
                        <td className="border px-2 py-2 text-center align-top">{pregunta.numero}</td>
                        <td className="border px-2 py-2 align-top">{pregunta.texto}</td>

                        <td className="border px-2 py-2 align-middle text-center font-medium">
                          {pregunta.cargo}
                        </td>

                        <td className="border px-2 py-2 text-center align-top">{pregunta.existe}</td>
                        <td className="border px-2 py-2 text-center align-top">{pregunta.aprobado}</td>
                        <td className="border px-2 py-2 text-center align-top">{pregunta.difundido}</td>

                        <td className="border px-2 py-2 text-center align-top">
                          <span
                            className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${
                              pregunta.estaPresente === "SI"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {pregunta.estaPresente}
                          </span>
                        </td>

                        <td className="border px-2 py-2 text-center align-top">{pregunta.implementado}</td>
                        <td className="border px-2 py-2 text-center align-top">{pregunta.actualizado}</td>

                        <td className="border px-2 py-2 text-center align-top">
                          <span
                            className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${
                              pregunta.estaFuncionando === "SI"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {pregunta.estaFuncionando}
                          </span>
                        </td>

                        <td className="border px-2 py-2 text-center align-top">{pregunta.calificacion}</td>

                        <td className="border px-2 py-2 text-center align-top">
                          <span
                            className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${
                              pregunta.nivel === "Bajo"
                                ? "bg-red-100 text-red-700"
                                : pregunta.nivel === "Medio"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {pregunta.nivel}
                          </span>
                        </td>

                        <td className="border px-2 py-2 align-top">{pregunta.tipoDocumento}</td>
                        <td className="border px-2 py-2 align-top">{pregunta.descripcion}</td>
                        <td className="border px-2 py-2 text-center align-top">{pregunta.fechaEmision}</td>
                        <td className="border px-2 py-2 text-center align-top">{pregunta.interna}</td>
                        <td className="border px-2 py-2 text-center align-top">{pregunta.externa}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {principioActual?.titulo} - Registro del principio
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="rounded-xl border p-4">
              <h4 className="mb-4 text-base font-semibold">Pregunta general</h4>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Número</label>
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    value={preguntaGeneral.numero}
                    onChange={(e) =>
                      setPreguntaGeneral((prev) => ({
                        ...prev,
                        numero: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium">Texto</label>
                  <textarea
                    className="w-full rounded-md border px-3 py-2"
                    rows={3}
                    value={preguntaGeneral.texto}
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

            <div className="rounded-xl border p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-base font-semibold">Preguntas adicionales</h4>
                <Button type="button" onClick={agregarPregunta}>
                  Agregar pregunta
                </Button>
              </div>

              <div className="space-y-5">
                {preguntasDetalle.map((pregunta, index) => (
                  <div key={index} className="rounded-xl border bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        Pregunta {index + 1}
                      </span>

                      {preguntasDetalle.length > 1 && (
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600"
                          onClick={() => eliminarPregunta(index)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium">Número</label>
                        <input
                          className="w-full rounded-md border px-3 py-2"
                          value={pregunta.numero}
                          onChange={(e) =>
                            actualizarPreguntaDetalle(index, "numero", e.target.value)
                          }
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="mb-1 block text-sm font-medium">Texto</label>
                        <textarea
                          className="w-full rounded-md border px-3 py-2"
                          rows={2}
                          value={pregunta.texto}
                          onChange={(e) =>
                            actualizarPreguntaDetalle(index, "texto", e.target.value)
                          }
                        />
                      </div>
                    </div>

                   
{/* FILA 1 */}
<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-8">
  <div className="md:col-span-2">
    <label className="mb-1 block text-sm font-medium">Cargo</label>
    <input
      className="w-full rounded-md border px-3 py-2"
      value={pregunta.cargo}
      onChange={(e) =>
        actualizarPreguntaDetalle(index, "cargo", e.target.value)
      }
    />
  </div>

  <CampoBinario label="Existe" value={pregunta.existe} onChange={(v) => actualizarPreguntaDetalle(index, "existe", v)} />
  <CampoBinario label="Aprobado" value={pregunta.aprobado} onChange={(v) => actualizarPreguntaDetalle(index, "aprobado", v)} />
  <CampoBinario label="Difundido" value={pregunta.difundido} onChange={(v) => actualizarPreguntaDetalle(index, "difundido", v)} />

  <CampoLectura
    label="Está presente"
    value={pregunta.estaPresente}
    tipo={pregunta.estaPresente === "SI" ? "success" : "danger"}
  />

  <CampoBinario label="Implementado" value={pregunta.implementado} onChange={(v) => actualizarPreguntaDetalle(index, "implementado", v)} />
  <CampoBinario label="Actualizado" value={pregunta.actualizado} onChange={(v) => actualizarPreguntaDetalle(index, "actualizado", v)} />

  <CampoLectura
    label="Está funcionando"
    value={pregunta.estaFuncionando}
    tipo={pregunta.estaFuncionando === "SI" ? "success" : "danger"}
  />

  <CampoLectura label="Calificación" value={String(pregunta.calificacion)} />

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

{/* FILA 2 👉 AQUÍ LOS PONES JUNTOS */}
<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6">
  <div className="md:col-span-2">
    <TipoDocumento
      label="Tipo de documento"
      value={pregunta.tipoDocumento}
      onChange={(v) =>
        actualizarPreguntaDetalle(index, "tipoDocumento", v)
      }
    />
  </div>

  <div className="md:col-span-4">
    <label className="mb-1 block text-sm font-medium">Descripción</label>
    <input
      className="w-full rounded-md border px-3 py-2"
      value={pregunta.descripcion}
      onChange={(e) =>
        actualizarPreguntaDetalle(index, "descripcion", e.target.value)
      }
    />
  </div>
</div>
        

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Fecha de emisión / aprobación
                        </label>
                        <input
                          type="date"
                          className="w-full rounded-md border px-3 py-2"
                          value={pregunta.fechaEmision}
                          onChange={(e) =>
                            actualizarPreguntaDetalle(index, "fechaEmision", e.target.value)
                          }
                        />
                      </div>

                      <CampoSiNo
                        label="Interna"
                        value={pregunta.interna}
                        onChange={(v) => actualizarPreguntaDetalle(index, "interna", v)}
                      />

                      <CampoSiNo
                        label="Externa"
                        value={pregunta.externa}
                        onChange={(v) => actualizarPreguntaDetalle(index, "externa", v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
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


function CampoSiNo({
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