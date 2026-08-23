"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import {
  PlusCircle,
  Pencil,
  Trash2,
} from "lucide-react";

import { useNotifications } from "@/context/NotificationContext";

type PreguntaDetalleForm = {
  id?: number;
    Id?: number;
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

function crearPreguntaDetalleVacia(correlativo: number): PreguntaDetalleForm {
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
    numero: `3.${correlativo}.1`,
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

interface Cargo {
  Id: number;
  CargoKey: string;
  NombreCargo: string;
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

export default function MatrizplaneacionPage() {
  const SUBMODULE_KEY = "m_planeacion";
 const [cargos, setCargos] = useState<Cargo[]>([]);
 const [roleKey, setRoleKey] = useState("");

 const puedeEditarTextoPregunta =
  roleKey === "Administrador" ||
  roleKey === "SubAdministrador";


  const [open, setOpen] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [preguntas, setPreguntas] = useState<PreguntaDetalleForm[]>([]);
  const [preguntaEditando, setPreguntaEditando] =
    useState<PreguntaDetalleForm | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

const [openDifusion, setOpenDifusion] = useState(false);

const [habilitarInterna, setHabilitarInterna] = useState(false);
const [habilitarExterna, setHabilitarExterna] = useState(false);


const [permisosItems, setPermisosItems] = useState({
  puedeAgregar: false,
  puedeEditar: false,
  puedeEliminar: false,
});

const [cargandoPermisos, setCargandoPermisos] = useState(true);

const puedeAgregarItems = permisosItems.puedeAgregar;
const puedeEditarPregunta = permisosItems.puedeEditar;
const puedeEliminarPregunta = permisosItems.puedeEliminar;
const { cargarNotificaciones } = useNotifications();

  const cargarRegistros = async () => {
    try {
      const res = await fetch(
        `/api/matriz-sistema-administrativo/listar?subModuleKey=${SUBMODULE_KEY}`
      );
      const json = await res.json();

      if (!json.ok) {
        alert(json.message || "No se pudo cargar la información.");
        return;
      }

   setPreguntas(
  (json.data?.preguntas || []).map((p: any) => ({
    ...p,
    id: Number(p.id ?? p.Id),
  }))
);

    } catch (error) {
      console.error(error);
      alert("Error al cargar los registros.");
    }
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

async function cargarUsuarioActual() {
  try {
    const res = await fetch("/api/me", {
      credentials: "include",
    });

    const data = await res.json();

    console.log("RESPUESTA API ME:", data);

    if (data.ok) {
      console.log("ROLE KEY ACTUAL:", data.user.roleKey);

      setRoleKey(data.user.roleKey);
    }
  } catch (error) {
    console.error(error);
  }
}

//Validar y eliminar preguntas de la matrix del sistema administrativo
async function validarYEliminar() {
  if (selectedIndex === null) {
    return;
  }

  const pregunta = preguntas[selectedIndex];

  if (!pregunta?.id) {
    Swal.fire({
      icon: "warning",
      title: "Ítem no válido",
      text: "No se encontró el identificador del ítem seleccionado.",
      confirmButtonColor: "#1d4ed8",
    });

    return;
  }

  try {
    const res = await fetch(
      "/api/matriz-sistema-administrativo/validar-eliminacion",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: pregunta.id,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok || !data.puedeEliminar) {
      await Swal.fire({
        icon: "warning",
        title: "Acceso denegado",
        text:
          data.message ||
          "No tiene permisos para eliminar este ítem.",
        confirmButtonColor: "#1d4ed8",
      });

      return;
    }

    await eliminarSeleccionada();
  } catch (error) {
    console.error("Error validando eliminación:", error);

    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "No fue posible validar el permiso de eliminación.",
      confirmButtonColor: "#dc2626",
    });
  }
}


//Validar y editar preguntas de la matrix del sistema administrativo
async function validarYEditar() {
  if (selectedIndex === null) {
    return;
  }

  const pregunta = preguntas[selectedIndex];

  if (!pregunta?.id) {
    await Swal.fire({
      icon: "warning",
      title: "Ítem no válido",
      text: "No se encontró el identificador del ítem seleccionado.",
      confirmButtonColor: "#1d4ed8",
    });

    return;
  }

  try {
    const res = await fetch(
      "/api/matriz-sistema-administrativo/validar-edicion",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: pregunta.id,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok || !data.puedeEditar) {
      await Swal.fire({
        icon: "warning",
        title: "Acceso denegado",
        text:
          data.message ||
          "No tiene permisos para editar este ítem.",
        confirmButtonColor: "#1d4ed8",
      });

      return;
    }

    editarSeleccionada();
  } catch (error) {
    console.error("Error validando edición:", error);

    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "No fue posible validar el permiso de edición.",
      confirmButtonColor: "#dc2626",
    });
  }
}

useEffect(() => {
  async function cargarPermisosItems() {
    try {
      setCargandoPermisos(true);

      const res = await fetch(
        "/api/matriz-sistema-administrativo/permisos",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(
          data.message || "No se pudieron cargar los permisos."
        );
      }

      setPermisosItems({
        puedeAgregar: Boolean(data.permisos?.puedeAgregar),
        puedeEditar: Boolean(data.permisos?.puedeEditar),
        puedeEliminar: Boolean(data.permisos?.puedeEliminar),
      });
    } catch (error) {
      console.error(error);

      setPermisosItems({
        puedeAgregar: false,
        puedeEditar: false,
        puedeEliminar: false,
      });
    } finally {
      setCargandoPermisos(false);
    }
  }

  cargarPermisosItems();
}, []);



  useEffect(() => {
    cargarRegistros();
    cargarCargos();
    cargarUsuarioActual();
  }, []);




const abrirNuevaPregunta = () => {
  const ultimoCorrelativo = preguntas.reduce((mayor, pregunta) => {
    const partes = String(pregunta.numero)
      .split(".")
      .map(Number);

    const correlativo = partes[1] || 0;

    return Math.max(mayor, correlativo);
  }, 0);

  const siguiente = ultimoCorrelativo + 1;

  setPreguntaEditando(
    crearPreguntaDetalleVacia(siguiente)
  );

  setEditIndex(null);
  setOpen(true);
};

  const editarSeleccionada = () => {
    if (selectedIndex === null) {
      alert("Seleccione una fila para editar.");
      return;
    }

    setPreguntaEditando({ ...preguntasOrdenadas[selectedIndex] });
    setEditIndex(selectedIndex);
    setOpen(true);
  };

  async function eliminarSeleccionada() {
  if (selectedIndex === null) return;

  const pregunta = preguntasOrdenadas[selectedIndex];

  console.log("Pregunta seleccionada para eliminar:", pregunta);

  if (!pregunta?.id) {
    alert("No se encontró el ID de la pregunta seleccionada.");
    return;
  }

  const res = await fetch(
    "/api/matriz-sistema-administrativo/eliminar-pregunta",
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionId: pregunta.id,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "No se pudo eliminar la pregunta.");
    return;
  }

  setPreguntas((prev) =>
    prev.filter((p) => Number(p.id) !== Number(pregunta.id))
  );

  setSelectedIndex(null);
}

  const actualizarCampo = (
    campo: keyof PreguntaDetalleForm,
    valor: string | number
  ) => {
    if (!preguntaEditando) return;

    const actualizada = {
      ...preguntaEditando,
      [campo]: valor,
    } as PreguntaDetalleForm;

    setPreguntaEditando(recalcularPregunta(actualizada));
  };

  const guardarModal = async () => {
    if (!preguntaEditando) return;

    if (!preguntaEditando.texto.trim()) {
      alert("Debe ingresar el texto de la pregunta.");
      return;
    }

    let actualizadas: PreguntaDetalleForm[] = [];

   if (editIndex === null) {
  actualizadas = [...preguntasOrdenadas, preguntaEditando];
} else {
  actualizadas = preguntasOrdenadas.map((p, i) =>
    i === editIndex ? preguntaEditando : p
  );
}

actualizadas = actualizadas.map((p) => ({
  ...recalcularPregunta(p),
}));

    await guardarTodo(actualizadas);
    setOpen(false);
    setPreguntaEditando(null);
    setEditIndex(null);
  };

  const guardarTodo = async (preguntasActualizadas: PreguntaDetalleForm[]) => {
    try {
      const res = await fetch("/api/matriz-sistema-administrativo/guardar", {
        method: "POST",
        credentials:"include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subModuleKey: SUBMODULE_KEY,
          preguntas: preguntasActualizadas,
        }),
      });

      const json = await res.json();
      
if (!json.ok) {
  Swal.fire({
    icon: "warning",
    title: "Validación",
    text: json.message || "No se pudo guardar.",
    confirmButtonColor: "#1d4ed8",
  });
  return;
}

await cargarRegistros();

    } catch (error) {
      console.error(error);
      alert("Error al guardar.");
    }
    
    await cargarNotificaciones();
  };

const preguntasOrdenadas = useMemo(() => {
  return [...preguntas].sort((a, b) => {
    const partesA = String(a.numero)
      .split(".")
      .map(Number);

    const partesB = String(b.numero)
      .split(".")
      .map(Number);

    const principalA = partesA[0] || 0;
    const principalB = partesB[0] || 0;

    if (principalA !== principalB) {
      return principalA - principalB;
    }

    const secundarioA = partesA[1] || 0;
    const secundarioB = partesB[1] || 0;

    if (secundarioA !== secundarioB) {
      return secundarioA - secundarioB;
    }

    const detalleA = partesA[2] || 0;
    const detalleB = partesB[2] || 0;

    return detalleA - detalleB;
  });
}, [preguntas]);

  function badgeSiNo(valor: string) {
    const esSi = String(valor).toUpperCase() === "SI";

    return (
      <span
        className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${
          esSi ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {esSi ? "SI" : "NO"}
      </span>
    );
  }

  function badgeNivel(nivel: string) {
    const n = String(nivel).toLowerCase();

    const clases =
      n === "alto"
        ? "bg-green-100 text-green-700"
        : n === "medio"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

    return (
      <span
        className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${clases}`}
      >
        {nivel || "-"}
      </span>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="overflow-hidden rounded-2xl border bg-[#e7c0a1] shadow-sm">
        <div className="border-b border-black px-4 py-4">
          <h1 className="text-lg font-bold uppercase">
            3. PLANEACIÓN Y PROGRAMACIÓN
          </h1>
        </div>
        <div className="px-4 py-5">
          <p className="text-sm font-medium leading-7 text-justify">
            La Planeación constituye la base para llevar a cabo las
            acciones administrativas y financieras.
          </p>
        </div>
      </div>

     <div className="mt-4 flex flex-wrap justify-end gap-3">
  {puedeAgregarItems && (
    <Button
      type="button"
      onClick={abrirNuevaPregunta}
      disabled={cargandoPermisos}
      className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-blue-700 hover:to-cyan-600"
    >
      <PlusCircle className="mr-2 h-5 w-5" />
      Agregar ítem
    </Button>
  )}

  {puedeEditarPregunta && (
    <Button
      type="button"
      variant="outline"
      onClick={validarYEditar}
      disabled={
        cargandoPermisos ||
        selectedIndex === null
      }
      className="rounded-xl border-amber-500 text-amber-700 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-amber-50"
    >
      <Pencil className="mr-2 h-5 w-5" />
      Editar ítem
    </Button>
  )}

  {puedeEliminarPregunta && (
    <Button
      type="button"
      onClick={validarYEliminar}
      disabled={
        cargandoPermisos ||
        selectedIndex === null
      }
      className="rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-red-700 hover:to-rose-600"
    >
      <Trash2 className="mr-2 h-5 w-5" />
      Eliminar ítem
    </Button>
  )}
</div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-slate-100 px-4 py-3">
          <h3 className="text-base font-semibold text-slate-800">
            Matriz de Evaluación - Planeación y Programación
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[2200px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#d9e7f5] text-center font-semibold">
                <th rowSpan={4} className="border px-2 py-2 w-[80px]">
                  N°
                </th>
                <th rowSpan={4} className="border px-2 py-2 min-w-[500px]">
            
                </th>

                <th className="border px-2 py-2 min-w-[180px]">RESPONSABLE</th>

                <th colSpan={7} className="border px-2 py-2">
                  CRITERIOS DE VALORACIÓN
                </th>

                <th
                  colSpan={2}
                  rowSpan={2}
                  className="border px-2 py-2 bg-[#bcd4ec]"
                >
                  Nivel de cumplimiento
                </th>

                <th colSpan={3} rowSpan={2} className="border px-2 py-2">
                  EVIDENCIAS DE CUMPLIMIENTO DE LOS PARÁMETROS ESTABLECIDOS
                </th>

                <th colSpan={2} className="border px-2 py-2">
                  DIFUSIÓN / COMUNICACIÓN
                </th>
              </tr>

              <tr className="bg-[#eef4fb] text-center">
                <th rowSpan={3} className="border px-2 py-2 min-w-[180px]">
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
                <th rowSpan={2} className="border px-2 py-2 min-w-[65px]">
                  Existe
                </th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[65px]">
                  Aprobado
                </th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[65px]">
                  Difundido
                </th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[80px]">
                  Implementado
                </th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[80px]">
                  Actualizado
                </th>
                <th
                  rowSpan={2}
                  className="border px-2 py-2 min-w-[90px] bg-[#d6e5f4]"
                >
                  Calificación
                </th>
                <th
                  rowSpan={2}
                  className="border px-2 py-2 min-w-[100px] bg-[#d6e5f4]"
                >
                  Nivel
                </th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[160px]">
                  Tipo de documento
                </th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[260px]">
                  Descripción
                </th>
                <th rowSpan={2} className="border px-2 py-2 min-w-[170px]">
                  Fecha de emisión / aprobación
                </th>
              </tr>

              <tr className="bg-[#eef4fb] text-center">
                <th className="border px-2 py-2"></th>
              </tr>
            </thead>

            <tbody>
              {preguntasOrdenadas.length === 0 ? (
                <tr>
                  <td
                    colSpan={17}
                    className="border px-4 py-8 text-center text-slate-500"
                  >
                    Aún no hay preguntas registradas.
                  </td>
                </tr>
              ) : (
                preguntasOrdenadas.map((pregunta, index) => (
                  <tr
                    key={pregunta.numero}
                   onClick={() =>
  setSelectedIndex((prev) => (prev === index ? null : index))
} 
                    className={`cursor-pointer ${
                      selectedIndex === index
                        ? "bg-blue-100 ring-1 ring-blue-300"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="border px-2 py-2 text-center">
                      {pregunta.numero}
                    </td>
                    <td className="border px-2 py-2">{pregunta.texto}</td>
                                 <td className="border px-2 py-2 align-top">
  {pregunta.cargo || "-"}
</td>

                    <td className="border px-2 py-2 text-center">
                      {pregunta.existe}
                    </td>
                    <td className="border px-2 py-2 text-center">
                      {pregunta.aprobado}
                    </td>
                    <td className="border px-2 py-2 text-center">
                      {pregunta.difundido}
                    </td>

                    <td className="border px-2 py-2 text-center">
                      {badgeSiNo(pregunta.estaPresente)}
                    </td>

                    <td className="border px-2 py-2 text-center">
                      {pregunta.implementado}
                    </td>
                    <td className="border px-2 py-2 text-center">
                      {pregunta.actualizado}
                    </td>

                    <td className="border px-2 py-2 text-center">
                      {badgeSiNo(pregunta.estaFuncionando)}
                    </td>

                    <td className="border px-2 py-2 text-center">
                      {pregunta.calificacion}
                    </td>

                    <td className="border px-2 py-2 text-center">
                      {badgeNivel(pregunta.nivel)}
                    </td>

                    <td className="border px-2 py-2">
                      {pregunta.tipoDocumento}
                    </td>
                    <td className="border px-2 py-2">
                      {pregunta.descripcion}
                    </td>
                    <td className="border px-2 py-2 text-center">
                      {pregunta.fechaEmision}
                    </td>
                    <td className="border px-2 py-2 text-center">
                      {pregunta.interna}
                    </td>
                    <td className="border px-2 py-2 text-center">
                      {pregunta.externa}
                    </td>
                  </tr>
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
              {editIndex === null ? "Agregar pregunta" : "Editar pregunta"}
            </DialogTitle>
          </DialogHeader>

          
          {preguntaEditando && (
  <div className="space-y-6">

    {/* ================= DATOS DE LA PREGUNTA ================= */}
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
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
              value={preguntaEditando.numero}
              readOnly
            />
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Texto de la pregunta
            </label>

                  <textarea
  rows={3}
  value={preguntaEditando.texto}
  disabled={!puedeEditarTextoPregunta}
  onChange={(e) =>
    actualizarCampo("texto", e.target.value)
  }
  className="w-full rounded-lg border border-slate-300 px-3 py-2
    focus:border-blue-500
    focus:ring-2
    focus:ring-blue-200
    disabled:bg-slate-100
    disabled:text-slate-600
    disabled:cursor-not-allowed"
/>
          </div>

        </div>

      </div>
    </div>

    {/* ================= EVALUACIÓN ================= */}

    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      <div className="border-b bg-slate-100 px-5 py-3">
     
      </div>

      <div className="p-5 space-y-6">

        <div>

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Cargo Responsable
          </label>

          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={preguntaEditando.cargo || ""}
            onChange={(e) =>
              actualizarCampo("cargo", e.target.value)
            }
          >
            <option value="">
              Seleccione un cargo
            </option>

            {cargos.map((cargo) => (
              <option
                key={cargo.Id}
                value={cargo.NombreCargo}
              >
                {cargo.NombreCargo}
              </option>
            ))}
          </select>

        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">

          <CampoBinario
            label="Existe"
            value={preguntaEditando.existe}
            onChange={(v) => actualizarCampo("existe", v)}
          />

          <CampoBinario
            label="Aprobado"
            value={preguntaEditando.aprobado}
            onChange={(v) => actualizarCampo("aprobado", v)}
          />

   <CampoBinario
  label="Difundido"
  value={preguntaEditando.difundido}
  onChange={(v) => {

    const valorAnterior = preguntaEditando.difundido;

    // Actualizar Difundido
    actualizarCampo("difundido", v);

    // SOLO cuando cambia de 0 → 1
    if (valorAnterior === 0 && v === 1) {
      setOpenDifusion(true);
    }

  }}
/>
          <CampoLectura
            label="Está presente"
            value={preguntaEditando.estaPresente}
            tipo={
              preguntaEditando.estaPresente === "SI"
                ? "success"
                : "danger"
            }
          />

          <CampoBinario
            label="Implementado"
            value={preguntaEditando.implementado}
            onChange={(v) =>
              actualizarCampo("implementado", v)
            }
          />

          <CampoBinario
            label="Actualizado"
            value={preguntaEditando.actualizado}
            onChange={(v) =>
              actualizarCampo("actualizado", v)
            }
          />

        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <CampoLectura
            label="Está funcionando"
            value={preguntaEditando.estaFuncionando}
            tipo={
              preguntaEditando.estaFuncionando === "SI"
                ? "success"
                : "danger"
            }
          />

          <CampoLectura
            label="Calificación"
            value={String(
              preguntaEditando.calificacion
            )}
          />

          <CampoLectura
            label="Nivel"
            value={preguntaEditando.nivel}
            tipo={
              preguntaEditando.nivel === "Bajo"
                ? "danger"
                : preguntaEditando.nivel === "Medio"
                ? "warning"
                : "success"
            }
          />

        </div>

      </div>
    </div>

    {/* ================= DOCUMENTACIÓN ================= */}

    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      <div className="border-b bg-slate-100 px-5 py-3">
      
      </div>

      <div className="p-5 space-y-5">

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-6">

          <div className="lg:col-span-2">

            <TipoDocumento
              label="Tipo de documento"
              value={preguntaEditando.tipoDocumento}
              onChange={(v) =>
                actualizarCampo("tipoDocumento", v)
              }
            />

          </div>

          <div className="lg:col-span-4">

            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Descripción
            </label>

            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={preguntaEditando.descripcion}
              onChange={(e) =>
                actualizarCampo(
                  "descripcion",
                  e.target.value
                )
              }
            />

          </div>

        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          <div>

            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Fecha de emisión / aprobación
            </label>

            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={preguntaEditando.fechaEmision}
              onChange={(e) =>
                actualizarCampo(
                  "fechaEmision",
                  e.target.value
                )
              }
            />

          </div>

          <div className="lg:col-span-2">

            <label className="mb-3 block text-sm font-semibold text-slate-700">
              Divulgación
            </label>

            <div className="grid grid-cols-2 gap-4">

              <CampoSiNo
                label="Interna"
                disabled={!habilitarInterna}
                value={preguntaEditando.interna}
                onChange={(v) =>
                  actualizarCampo("interna", v)
                }
              />

              <CampoSiNo
                label="Externa"
                disabled={!habilitarExterna}
                value={preguntaEditando.externa}
                onChange={(v) =>
                  actualizarCampo("externa", v)
                }
              />

            </div>

          </div>

        </div>

      </div>

    </div>

  </div>
)}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={guardarModal}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    
<Dialog
    open={openDifusion}
    onOpenChange={setOpenDifusion}
>
    <DialogContent className="max-w-sm">

        <DialogHeader>
            <DialogTitle>
                Medio de divulgación
            </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

            <label className="flex items-center gap-3">

                <input
                    type="checkbox"
                    checked={habilitarInterna}
                    onChange={(e)=>
                        setHabilitarInterna(e.target.checked)
                    }
                />

                Difusión interna

            </label>

            <label className="flex items-center gap-3">

                <input
                    type="checkbox"
                    checked={habilitarExterna}
                    onChange={(e)=>
                        setHabilitarExterna(e.target.checked)
                    }
                />

                Difusión externa

            </label>

        </div>

        <DialogFooter>

            <Button
                variant="outline"
                onClick={()=>{
                    setOpenDifusion(false);
                }}
            >
                Cancelar
            </Button>

            <Button
                onClick={()=>{

                    if(!habilitarInterna){
                        actualizarCampo("interna","");
                    }

                    if(!habilitarExterna){
                        actualizarCampo("externa","");
                    }

                    setOpenDifusion(false);

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
        <option value="Autorizaciones de baja">
          Autorizaciones de baja
        </option>
        <option value="Calendario de vacaciones">
          Calendario de vacaciones
        </option>
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
        <option value="Otros medios de difusión ">
          Otros medios de difusión
        </option>
        <option value="Páginas de transparencia">
          Páginas de transparencia
        </option>
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
      <div
        className={`w-full rounded-md border px-3 py-2 font-medium ${clases}`}
      >
        {value || "-"}
      </div>
    </div>
  );
}