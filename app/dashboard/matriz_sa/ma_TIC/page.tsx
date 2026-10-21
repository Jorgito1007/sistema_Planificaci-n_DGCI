"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HashLoader } from "react-spinners";
import Swal  from "sweetalert2";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  Download,
  ClipboardCheck,
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
  documentId?: number | null;
nombreDocumento?: string;
pdfUrl?: string;
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
    numero: `9.${correlativo}.1`,
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

export default function MatrizTICPage() {
  const SUBMODULE_KEY = "m_TIC";

const tablaRef = useRef<HTMLTableElement>(null);
const scrollTablaRef = useRef<HTMLDivElement>(null);
const scrollFijoRef = useRef<HTMLDivElement>(null);
const [anchoTabla, setAnchoTabla] = useState(2200);


const [cargos, setCargos] = useState<Cargo[]>([]);
const [roleKey, setRoleKey] = useState("");

const puedeEditarTextoPregunta =
  String(roleKey).trim().toLowerCase() === "administrador" ||
  String(roleKey).trim().toLowerCase() === "subadministrador";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preguntas, setPreguntas] = useState<PreguntaDetalleForm[]>([]);
  const [preguntaEditando, setPreguntaEditando] =
    useState<PreguntaDetalleForm | null>(null);

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

const [openDifusion, setOpenDifusion] = useState(false);

const [habilitarInterna, setHabilitarInterna] = useState(false);
const [habilitarExterna, setHabilitarExterna] = useState(false);

// Documento de evidencia vinculado a la pregunta
const [nombreDocumento, setNombreDocumento] = useState("");
const [archivoDocumento, setArchivoDocumento] = useState<File | null>(null);
const [guardandoDocumento, setGuardandoDocumento] = useState(false);
const [reemplazarDocumento, setReemplazarDocumento] = useState(false);

  const [permisosItems, setPermisosItems] = useState({
  puedeAgregar: false,
  puedeEditar: false,
  puedeEliminar: false,
});

const [cargandoPermisos, setCargandoPermisos] = useState(true);

const puedeAgregarItems = permisosItems.puedeAgregar;
const puedeEditarPregunta = permisosItems.puedeEditar;
const puedeEliminarPregunta = permisosItems.puedeEliminar;

//estados de pisición
const [menuPosicion, setMenuPosicion] = useState<{
  top: number;
  left: number;
  arriba: boolean;
} | null>(null);

const seleccionarPregunta = (
  event: React.MouseEvent<HTMLTableRowElement>,
  index: number
) => {
  const fila = event.currentTarget;
  const rect = fila.getBoundingClientRect();

  // Si vuelve a seleccionar la misma fila, cerrar menú
  if (selectedIndex === index) {
    setSelectedIndex(null);
    setMenuPosicion(null);
    return;
  }

  setSelectedIndex(index);

  const menuWidth = 190;
  const margen = 12;

  // Posición horizontal visible
  let left = rect.left + 20;

  // Evitar que se salga por la derecha
  if (left + menuWidth > window.innerWidth - margen) {
    left = window.innerWidth - menuWidth - margen;
  }

  // Evitar que se meta debajo del sidebar
  const sidebarWidth = 250;

  if (left < sidebarWidth + margen) {
    left = sidebarWidth + margen;
  }

  // Arriba de la fila
  let top = rect.top - 10;

  // Si no hay espacio arriba, colocarlo debajo
  if (top < 70) {
    top = rect.bottom + 10;

    setMenuPosicion({
      top,
      left,
      arriba: false,
    });
  } else {
    setMenuPosicion({
      top,
      left,
      arriba: true,
    });
  }
};

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
// Validar y eliminar pregunta
async function validarYEliminar() {
  if (selectedIndex === null) {
    return;
  }

  const pregunta = preguntasOrdenadas[selectedIndex];

  if (!pregunta?.id) {
    await Swal.fire({
      icon: "warning",
      title: "Ítem no válido",
      text: "No se encontró el identificador del ítem seleccionado.",
      confirmButtonColor: "#1d4ed8",
    });

    return;
  }

  // ==========================================
  // CONFIRMACIÓN ANTES DE ELIMINAR
  // ==========================================
  const confirmacion = await Swal.fire({
    icon: "warning",
    title: "¿Desea eliminar esta pregunta?",
    text: `Se eliminará la pregunta ${pregunta.numero}. Esta acción no se puede deshacer.`,
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
    reverseButtons: true,
  });

  // Si presiona cancelar
  if (!confirmacion.isConfirmed) {
    return;
  }

  // ==========================================
  // VALIDAR PERMISO
  // ==========================================
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

    // ==========================================
    // ELIMINAR
    // ==========================================
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

// Limpiar documento
setNombreDocumento("");
setArchivoDocumento(null);

setOpen(true);
};

  const editarSeleccionada = () => {
  if (selectedIndex === null) {
    alert("Seleccione una fila para editar.");
    return;
  }

  const preguntaSeleccionada =
    preguntasOrdenadas[selectedIndex];

  setPreguntaEditando({
    ...preguntaSeleccionada,
  });

  // Si ya tiene documento, mostramos su nombre
  setNombreDocumento(
    preguntaSeleccionada.nombreDocumento || ""
  );

  // No cargamos ningún File porque el navegador
  // no permite precargar un input type="file"
  setArchivoDocumento(null);

  // Inicialmente NO estamos reemplazando
  setReemplazarDocumento(false);

  setEditIndex(selectedIndex);
  setOpen(true);

  setMenuPosicion(null);
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

//Documentos///
async function guardarDocumentoPregunta(
  questionId: number
) {
  if (!archivoDocumento) {
    return true;
  }

  if (!nombreDocumento.trim()) {
    await Swal.fire({
      icon: "warning",
      title: "Documento",
      text: "Debe ingresar el nombre del documento.",
      confirmButtonColor: "#1d4ed8",
    });

    return false;
  }

  if (!preguntaEditando) {
    return false;
  }

  try {
    setGuardandoDocumento(true);

    const formData = new FormData();

    formData.append(
      "Nombre",
      nombreDocumento.trim()
    );

 
    formData.append(
      "SubModuleId",
      "22"
    );

    formData.append(
      "OrigenMatriz",
      "true"
    );

    formData.append(
      "TipoMatriz",
      "SISTEMA_ADMINISTRATIVO"
    );

    formData.append(
      "QuestionId",
      String(questionId)
    );

    formData.append(
      "Elaborado",
      String(preguntaEditando.existe === 1)
    );

    formData.append(
      "Aprobado",
      String(preguntaEditando.aprobado === 1)
    );

    formData.append(
      "Implementado",
      String(preguntaEditando.implementado === 1)
    );

    formData.append(
      "Actualizado",
      String(preguntaEditando.actualizado === 1)
    );

    formData.append(
      "Difundido",
      String(preguntaEditando.difundido === 1)
    );

    if (
      preguntaEditando.aprobado === 1 &&
      preguntaEditando.fechaEmision
    ) {
      formData.append(
        "Fecha_Aprobado",
        preguntaEditando.fechaEmision
      );
    }

    if (
      preguntaEditando.actualizado === 1 &&
      preguntaEditando.fechaEmision
    ) {
      formData.append(
        "Fecha_Actualizado",
        preguntaEditando.fechaEmision
      );
    }

    formData.append(
      "file",
      archivoDocumento
    );

    const response = await fetch(
      "/api/documents",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      await Swal.fire({
        icon: "error",
        title: "Documento",
        text:
          data.error ||
          "No se pudo guardar el documento.",
        confirmButtonColor: "#dc2626",
      });

      return false;
    }

    return true;

  } catch (error) {
    console.error(
      "Error guardando documento:",
      error
    );

    await Swal.fire({
      icon: "error",
      title: "Documento",
      text: "Error al guardar el documento.",
      confirmButtonColor: "#dc2626",
    });

    return false;

  } finally {
    setGuardandoDocumento(false);
  }
}

//Guardar//
const guardarModal = async () => {
  if (!preguntaEditando) return;

  if (!preguntaEditando.texto.trim()) {
    await Swal.fire({
      icon: "warning",
      title: "Validación",
      text: "Debe ingresar el texto de la pregunta.",
      confirmButtonColor: "#1d4ed8",
    });
    return;
  }

  // Si eligió reemplazar, debe seleccionar archivo
  if (
    reemplazarDocumento &&
    preguntaEditando.documentId &&
    !archivoDocumento
  ) {
    await Swal.fire({
      icon: "warning",
      title: "Seleccione un archivo",
      text: "Ha seleccionado reemplazar el documento, pero todavía no ha elegido el nuevo archivo.",
      confirmButtonColor: "#1d4ed8",
    });

    return;
  }

  try {
    // ==============================
    // ACTIVAR LOADER
    // ==============================
    setLoading(true);

    let actualizadas: PreguntaDetalleForm[] = [];

    if (editIndex === null) {
      actualizadas = [
        ...preguntasOrdenadas,
        preguntaEditando,
      ];
    } else {
      actualizadas = preguntasOrdenadas.map((p, i) =>
        i === editIndex ? preguntaEditando : p
      );
    }

    actualizadas = actualizadas.map((p) => ({
      ...recalcularPregunta(p),
    }));

    // ==============================
    // GUARDAR MATRIZ
    // ==============================
    const resultadoGuardado =
      await guardarTodo(actualizadas);

    if (!resultadoGuardado) {
      return;
    }

    // ==============================
    // OBTENER ID REAL DE PREGUNTA
    // ==============================
    const preguntaGuardada =
      resultadoGuardado.preguntas?.find(
        (p: { id: number; numero: string }) =>
          String(p.numero) ===
          String(preguntaEditando.numero)
      );

    if (!preguntaGuardada?.id) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "La pregunta fue guardada, pero no se pudo obtener su identificador.",
        confirmButtonColor: "#dc2626",
      });

      return;
    }

    // ==============================
    // DOCUMENTO
    // ==============================
    if (archivoDocumento) {

      // Reemplazar documento existente
      if (
        preguntaEditando.documentId &&
        reemplazarDocumento
      ) {
        const reemplazado =
          await reemplazarDocumentoPregunta(
            preguntaEditando.documentId
          );

        if (!reemplazado) {
          return;
        }
      }

      // Crear documento nuevo
      else if (!preguntaEditando.documentId) {
        const documentoGuardado =
          await guardarDocumentoPregunta(
            preguntaGuardada.id
          );

        if (!documentoGuardado) {
          return;
        }
      }
    }

    // ==============================
    // RECARGAR MATRIZ
    // ==============================
    await cargarRegistros();

    // ==============================
    // CERRAR Y LIMPIAR
    // ==============================
    setOpen(false);
    setPreguntaEditando(null);
    setEditIndex(null);

    setNombreDocumento("");
    setArchivoDocumento(null);
    setReemplazarDocumento(false);

// Quitar loader antes del mensaje
setLoading(false);


await Swal.fire({
  icon: "success",
  title: "Guardado correctamente",
  text: "La información se guardó correctamente.",
  confirmButtonColor: "#0B3D91",
  confirmButtonText: "Aceptar",
});

  } catch (error) {
    console.error("Error guardando:", error);

    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "Ocurrió un error mientras se guardaba la información.",
      confirmButtonColor: "#dc2626",
    });

  } finally {
    // SIEMPRE se apaga el loader
    setLoading(false);
  }
};


  const reemplazarDocumentoPregunta = async (
  documentId: number
): Promise<boolean> => {
  try {
    if (!archivoDocumento) {
      await Swal.fire({
        icon: "warning",
        title: "Archivo requerido",
        text: "Debe seleccionar el nuevo archivo.",
        confirmButtonColor: "#1d4ed8",
      });

      return false;
    }

    if (!nombreDocumento.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Nombre requerido",
        text: "Debe ingresar el nombre del documento.",
        confirmButtonColor: "#1d4ed8",
      });

      return false;
    }

    const formData = new FormData();

    formData.append(
      "DocumentId",
      String(documentId)
    );

    formData.append(
      "Nombre",
      nombreDocumento.trim()
    );

    formData.append(
      "file",
      archivoDocumento
    );

    const res = await fetch(
      "/api/documents/reemplazar",
      {
        method: "PUT",
        body: formData,
        credentials: "include",
      }
    );

    const data = await res.json();

    if (!res.ok || !data.ok) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo reemplazar",
        text:
          data.error ||
          "No fue posible reemplazar el documento.",
        confirmButtonColor: "#dc2626",
      });

      return false;
    }

    return true;

  } catch (error) {
    console.error(
      "Error reemplazando documento:",
      error
    );

    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "Ocurrió un error al reemplazar el documento.",
      confirmButtonColor: "#dc2626",
    });

    return false;
  }
};

  
const guardarTodo = async (
  preguntasActualizadas: PreguntaDetalleForm[]
) => {
  try {
    const res = await fetch(
      "/api/matriz-sistema-administrativo/guardar",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subModuleKey: SUBMODULE_KEY,
          preguntas: preguntasActualizadas,
        }),
      }
    );

    const json = await res.json();

    if (!json.ok) {
      await Swal.fire({
        icon: "warning",
        title: "Validación",
        text: json.message || "No se pudo guardar.",
        confirmButtonColor: "#1d4ed8",
      });

      return null;
    }

    await cargarRegistros();
    await cargarNotificaciones();

    return json;

  } catch (error) {
    console.error(error);

    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "Error al guardar.",
      confirmButtonColor: "#dc2626",
    });

    return null;
  }
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


// ============================================================
// SCROLL - SINCRONIZACIÓN TABLA ↔ SCROLL FIJO
// ============================================================

useEffect(() => {
  const tabla = scrollTablaRef.current;
  const fijo = scrollFijoRef.current;

  if (!tabla || !fijo) return;

  let sincronizando = false;

  const moverDesdeTabla = () => {
    if (sincronizando) return;

    sincronizando = true;

    const maxTabla =
      tabla.scrollWidth - tabla.clientWidth;

    const maxFijo =
      fijo.scrollWidth - fijo.clientWidth;

    if (maxTabla > 0 && maxFijo > 0) {
      const porcentaje =
        tabla.scrollLeft / maxTabla;

      fijo.scrollLeft =
        porcentaje * maxFijo;
    }

    requestAnimationFrame(() => {
      sincronizando = false;
    });
  };


  const moverDesdeFijo = () => {
    if (sincronizando) return;

    sincronizando = true;

    const maxTabla =
      tabla.scrollWidth - tabla.clientWidth;

    const maxFijo =
      fijo.scrollWidth - fijo.clientWidth;

    if (maxTabla > 0 && maxFijo > 0) {
      const porcentaje =
        fijo.scrollLeft / maxFijo;

      tabla.scrollLeft =
        porcentaje * maxTabla;
    }

    requestAnimationFrame(() => {
      sincronizando = false;
    });
  };


  tabla.addEventListener(
    "scroll",
    moverDesdeTabla
  );

  fijo.addEventListener(
    "scroll",
    moverDesdeFijo
  );


  return () => {
    tabla.removeEventListener(
      "scroll",
      moverDesdeTabla
    );

    fijo.removeEventListener(
      "scroll",
      moverDesdeFijo
    );
  };

}, []);

// ============================================================
// CALCULAR ANCHO REAL DE LA TABLA
// ============================================================

useEffect(() => {

  const actualizarAncho = () => {

    if (tablaRef.current) {

      const anchoReal =
        tablaRef.current.scrollWidth;

      setAnchoTabla(anchoReal);

    }

  };


  // Calculamos inicialmente
  actualizarAncho();


  // Recalculamos después de que React termine de pintar
  const frame = requestAnimationFrame(() => {
    actualizarAncho();
  });


  // Si cambia el tamaño de la ventana
  window.addEventListener(
    "resize",
    actualizarAncho
  );


  return () => {

    cancelAnimationFrame(frame);

    window.removeEventListener(
      "resize",
      actualizarAncho
    );

  };

}, [preguntasOrdenadas]);

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

{loading && (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
        <div className="flex min-w-[280px] flex-col items-center rounded-2xl bg-white px-10 py-8 shadow-2xl">

          <HashLoader
            color="#0B3D91"
            loading={loading}
            size={50}
            speedMultiplier={1}
          />

          <p className="mt-5 text-base font-semibold text-slate-800">
            Guardando información
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Espere un momento...
          </p>

        </div>
      </div>
    )}

   <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.06)]">

  {/* =========================================================
      ENCABEZADO
  ========================================================= */}
  <div className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-r from-[#EFF6FF] via-[#F0F9FF] to-[#ECFEFF] px-6 py-5">

    {/* Decoración */}
    <div className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-[#0B3D91]/5" />

    <div className="relative flex items-center gap-4">

      {/* Número de sección */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B3D91] text-sm font-bold text-white shadow-md shadow-blue-900/20">
        9
      </div>

      {/* Título */}
      <div>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#168AAD]">
          Sistema Administrativo
        </p>

        <h1 className="text-lg font-bold tracking-tight text-[#123B5D]">
          Tecnología de la Información (TI)
        </h1>
      </div>

    </div>
  </div>


  {/* =========================================================
      CONTENIDO
  ========================================================= */}
  <div className="px-6 py-6">

    <div className="flex gap-4">

      {/* Línea decorativa */}
      <div className="w-1 shrink-0 rounded-full bg-gradient-to-b from-[#0B3D91] to-[#168AAD]" />

      {/* Descripción */}
      <p className="text-justify text-sm font-normal leading-7 text-slate-600">
        Es responsabilidad de la máxima autoridad y la administración asegurar
        que la tecnología de información esté organizada en su forma y
        contenido, conforme a las necesidades de información de la entidad de
        acuerdo a los objetivos de la misma. La planeación y organización de la
        tecnología de información debe estar ajustada a los objetivos de la
        entidad y proveer las bases para las adquisiciones, implementaciones,
        desarrollo y soporte a brindar, así como, la implementación del
        monitoreo y evaluación correspondiente a los servicios tecnológicos,
        asegurando con ello se afecten mínimamente las operaciones de la
        Entidad.
      </p>

    </div>

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
</div>

<div className="w-full min-w-0">

  {/* =========================================================
      TARJETA SUPERIOR
      Independiente de la tabla
  ========================================================= */}
  <div className="mb-4 overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-r from-[#0B3D91] via-[#145DA0] to-[#168AAD] shadow-lg shadow-blue-900/10">

    <div className="relative px-6 py-5">

      {/* Decoraciones */}
      <div className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 rounded-full bg-white/10" />

      <div className="pointer-events-none absolute right-16 top-7 h-16 w-16 rounded-full bg-white/5" />

      {/* Contenido */}
      <div className="relative flex items-center gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
          <ClipboardCheck className="h-6 w-6 text-white" />
        </div>

        <div>
          <h3 className="text-lg font-bold tracking-tight text-white">
            Matriz de Evaluación
          </h3>

         
        </div>

      </div>
    </div>
  </div>


  {/* =========================================================
      CONTENEDOR INDEPENDIENTE DE LA TABLA
  ========================================================= */}
  <div className="relative w-full min-w-0">

    <div
      ref={scrollTablaRef}
      className="
        w-full
        overflow-x-auto
        border-y
        border-slate-200
        bg-white
        shadow-sm
        [scrollbar-width:none]
        [&::-webkit-scrollbar]:hidden
      "
    >

      {/* =======================================================
          TABLA
      ======================================================= */}
      <table
        ref={tablaRef}
        className="w-max min-w-[2400px] border-collapse text-sm text-slate-700"
      >

        {/* =====================================================
            ENCABEZADO
        ===================================================== */}
        <thead>

          {/* ===================================================
              PRIMER NIVEL
          =================================================== */}
          <tr className="bg-[#123B5D] text-center text-xs font-bold uppercase tracking-wide text-white">

            {/* NÚMERO */}
            <th
              rowSpan={4}
              className="w-[80px] border border-[#315A78] px-3 py-4"
            >
              N°
            </th>

            {/* PARÁMETRO */}
            <th
              rowSpan={4}
              className="min-w-[550px] border border-[#315A78] px-4 py-4"
            >
              Parámetro de evaluación
            </th>

            {/* RESPONSABLE */}
            <th className="min-w-[200px] border border-[#315A78] px-3 py-4">
              Responsable
            </th>

            {/* CRITERIOS */}
            <th
              colSpan={7}
              className="border border-[#315A78] px-3 py-4"
            >
              Criterios de valoración
            </th>

            {/* NIVEL DE CUMPLIMIENTO */}
            <th
              colSpan={2}
              rowSpan={2}
              className="border border-[#397783] bg-[#0F6B78] px-4 py-4 text-white"
            >
              Nivel de cumplimiento
            </th>

            {/* EVIDENCIAS */}
            <th
              colSpan={4}
              rowSpan={2}
              className="border border-[#315A78] bg-[#174A6B] px-4 py-4"
            >
              Evidencias de cumplimiento de los parámetros establecidos
            </th>

            {/* DIFUSIÓN */}
            <th
              colSpan={2}
              className="border border-[#315A78] bg-[#1D5678] px-4 py-4"
            >
              Difusión / Comunicación
            </th>

          </tr>


          {/* ===================================================
              SEGUNDO NIVEL
          =================================================== */}
          <tr className="bg-[#DCEAF4] text-center text-xs font-semibold text-[#123B5D]">

            {/* CARGO */}
            <th
              rowSpan={3}
              className="min-w-[200px] border border-slate-300 px-3 py-3"
            >
              Cargo
            </th>

            {/* PRESENTE */}
            <th
              colSpan={3}
              className="border border-slate-300 bg-[#D9EAF5] px-3 py-3"
            >
              Presente
            </th>

            {/* ESTÁ PRESENTE */}
            <th
              rowSpan={3}
              className="min-w-[110px] border border-slate-300 bg-[#E8F2F8] px-3 py-3"
            >
              Está presente
            </th>

            {/* FUNCIONANDO */}
            <th
              colSpan={2}
              className="border border-slate-300 bg-[#D9EAF5] px-3 py-3"
            >
              Funcionando
            </th>

            {/* ESTÁ FUNCIONANDO */}
            <th
              rowSpan={3}
              className="min-w-[120px] border border-slate-300 bg-[#E8F2F8] px-3 py-3"
            >
              Está funcionando
            </th>

            {/* INTERNA */}
            <th
              rowSpan={3}
              className="min-w-[120px] border border-slate-300 bg-[#DDEBF4] px-3 py-3"
            >
              Interna
            </th>

            {/* EXTERNA */}
            <th
              rowSpan={3}
              className="min-w-[120px] border border-slate-300 bg-[#DDEBF4] px-3 py-3"
            >
              Externa
            </th>

          </tr>


          {/* ===================================================
              TERCER NIVEL
          =================================================== */}
          <tr className="bg-[#EFF6FA] text-center text-xs font-semibold text-slate-700">

            <th
              rowSpan={2}
              className="min-w-[80px] border border-slate-300 px-3 py-3"
            >
              Existe
            </th>

            <th
              rowSpan={2}
              className="min-w-[85px] border border-slate-300 px-3 py-3"
            >
              Aprobado
            </th>

            <th
              rowSpan={2}
              className="min-w-[85px] border border-slate-300 px-3 py-3"
            >
              Difundido
            </th>

            <th
              rowSpan={2}
              className="min-w-[110px] border border-slate-300 px-3 py-3"
            >
              Implementado
            </th>

            <th
              rowSpan={2}
              className="min-w-[100px] border border-slate-300 px-3 py-3"
            >
              Actualizado
            </th>

            {/* CALIFICACIÓN */}
            <th
              rowSpan={2}
              className="min-w-[110px] border border-[#A6D3D7] bg-[#D5EEF0] px-3 py-3 font-bold text-[#0F5C66]"
            >
              Calificación
            </th>

            {/* NIVEL */}
            <th
              rowSpan={2}
              className="min-w-[120px] border border-[#A6D3D7] bg-[#D5EEF0] px-3 py-3 font-bold text-[#0F5C66]"
            >
              Nivel
            </th>

            {/* TIPO DOCUMENTO */}
            <th
              rowSpan={2}
              className="min-w-[180px] border border-slate-300 px-3 py-3"
            >
              Tipo de documento
            </th>

            {/* DOCUMENTO */}
            <th
              rowSpan={2}
              className="min-w-[220px] border border-slate-300 px-3 py-3"
            >
              Documento
            </th>

            {/* DESCRIPCIÓN */}
            <th
              rowSpan={2}
              className="min-w-[300px] border border-slate-300 px-3 py-3"
            >
              Descripción
            </th>

            {/* FECHA */}
            <th
              rowSpan={2}
              className="min-w-[190px] border border-slate-300 px-3 py-3"
            >
              Fecha de emisión / aprobación
            </th>

          </tr>


          {/* ===================================================
              CUARTO NIVEL
          =================================================== */}
          <tr className="bg-[#EFF6FA] text-center">
            <th className="border border-slate-300 px-3 py-3"></th>
          </tr>

        </thead>


        {/* =====================================================
            CUERPO
        ===================================================== */}
        <tbody>

          {preguntasOrdenadas.length === 0 ? (

            /* =================================================
                NO HAY REGISTROS
            ================================================= */
            <tr>

              <td
                colSpan={18}
                className="border border-slate-200 bg-slate-50 px-4 py-16 text-center"
              >

                <div className="flex flex-col items-center justify-center gap-2">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                    <ClipboardCheck className="h-6 w-6 text-slate-500" />
                  </div>

                  <p className="mt-2 font-semibold text-slate-700">
                    No hay parámetros registrados
                  </p>

                  <p className="text-xs text-slate-500">
                    Los parámetros agregados aparecerán en esta matriz.
                  </p>

                </div>

              </td>

            </tr>

          ) : (

            preguntasOrdenadas.map((pregunta, index) => (

              /* =================================================
                  FILA
              ================================================= */
              <tr
                key={pregunta.numero}
                onClick={(event) =>
                  seleccionarPregunta(event, index)
                }
                className={`
                  group cursor-pointer transition-all duration-150
                  ${
                    selectedIndex === index
                      ? "bg-blue-50 shadow-[inset_4px_0_0_#2563eb]"
                      : index % 2 === 0
                        ? "bg-white hover:bg-sky-50/70"
                        : "bg-slate-50/50 hover:bg-sky-50/70"
                  }
                `}
              >

                {/* ===============================================
                    NÚMERO
                =============================================== */}
                <td className="border border-slate-200 px-3 py-4 text-center">

                  <span
                    className={`
                      inline-flex min-w-[40px]
                      items-center justify-center
                      rounded-lg px-2.5 py-1.5
                      text-xs font-bold
                      ${
                        selectedIndex === index
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }
                    `}
                  >
                    {pregunta.numero}
                  </span>

                </td>


                {/* ===============================================
                    PARÁMETRO / PREGUNTA
                =============================================== */}
                <td className="border border-slate-200 px-5 py-4 align-top">

                  <p className="max-w-[550px] whitespace-normal leading-6 text-slate-700">
                    {pregunta.texto}
                  </p>

                </td>


                {/* ===============================================
                    RESPONSABLE
                =============================================== */}
                <td className="border border-slate-200 px-4 py-4 align-top">

                  {pregunta.cargo ? (

                    <span className="inline-flex rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                      {pregunta.cargo}
                    </span>

                  ) : (

                    <span className="text-xs text-slate-400">
                      Sin asignar
                    </span>

                  )}

                </td>


                {/* EXISTE */}
                <td className="border border-slate-200 px-3 py-4 text-center font-semibold text-slate-700">
                  {pregunta.existe}
                </td>


                {/* APROBADO */}
                <td className="border border-slate-200 px-3 py-4 text-center font-semibold text-slate-700">
                  {pregunta.aprobado}
                </td>


                {/* DIFUNDIDO */}
                <td className="border border-slate-200 px-3 py-4 text-center font-semibold text-slate-700">
                  {pregunta.difundido}
                </td>


                {/* ESTÁ PRESENTE */}
                <td className="border border-slate-200 px-3 py-4 text-center">
                  {badgeSiNo(pregunta.estaPresente)}
                </td>


                {/* IMPLEMENTADO */}
                <td className="border border-slate-200 px-3 py-4 text-center font-semibold text-slate-700">
                  {pregunta.implementado}
                </td>


                {/* ACTUALIZADO */}
                <td className="border border-slate-200 px-3 py-4 text-center font-semibold text-slate-700">
                  {pregunta.actualizado}
                </td>


                {/* ESTÁ FUNCIONANDO */}
                <td className="border border-slate-200 px-3 py-4 text-center">
                  {badgeSiNo(pregunta.estaFuncionando)}
                </td>


                {/* ===============================================
                    CALIFICACIÓN
                =============================================== */}
                <td className="border border-slate-200 bg-cyan-50/40 px-3 py-4 text-center">

                  <span className="inline-flex min-w-[48px] items-center justify-center rounded-lg bg-[#E0F2F4] px-3 py-1.5 font-bold text-[#0F6674]">
                    {pregunta.calificacion}
                  </span>

                </td>


                {/* ===============================================
                    NIVEL
                =============================================== */}
                <td className="border border-slate-200 bg-cyan-50/30 px-3 py-4 text-center">
                  {badgeNivel(pregunta.nivel)}
                </td>


                {/* ===============================================
                    TIPO DE DOCUMENTO
                =============================================== */}
                <td className="border border-slate-200 px-4 py-4">

                  {pregunta.tipoDocumento ? (

                    <span className="font-medium text-slate-700">
                      {pregunta.tipoDocumento}
                    </span>

                  ) : (

                    <span className="text-xs text-slate-400">
                      Sin especificar
                    </span>

                  )}

                </td>


                {/* ===============================================
                    DOCUMENTO
                =============================================== */}
                <td className="border border-slate-200 px-4 py-4 text-center align-middle">

                  {pregunta.documentId && pregunta.pdfUrl ? (

                    <div className="flex flex-col items-center justify-center gap-3">

                      {/* Nombre */}
                      <span
                        className="max-w-[200px] truncate text-xs font-semibold text-slate-700"
                        title={pregunta.nombreDocumento}
                      >
                        {pregunta.nombreDocumento || "Documento"}
                      </span>


                      {/* Acciones */}
                      <div className="flex items-center justify-center gap-2">

                        {/* VER */}
                        <a
                          href={pregunta.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                          title="Ver documento"
                          className="
                            inline-flex h-9 w-9
                            items-center justify-center
                            rounded-xl
                            border border-blue-200
                            bg-blue-50
                            text-blue-600
                            shadow-sm
                            transition-all duration-200
                            hover:-translate-y-0.5
                            hover:border-blue-300
                            hover:bg-blue-100
                            hover:shadow-md
                          "
                        >
                          <Eye className="h-4 w-4" />
                        </a>


                        {/* DESCARGAR */}
                        <a
                          href={pregunta.pdfUrl}
                          download
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                          title="Descargar documento"
                          className="
                            inline-flex h-9 w-9
                            items-center justify-center
                            rounded-xl
                            border border-emerald-200
                            bg-emerald-50
                            text-emerald-600
                            shadow-sm
                            transition-all duration-200
                            hover:-translate-y-0.5
                            hover:border-emerald-300
                            hover:bg-emerald-100
                            hover:shadow-md
                          "
                        >
                          <Download className="h-4 w-4" />
                        </a>

                      </div>

                    </div>

                  ) : (

                    /* SIN DOCUMENTO */
                    <div className="flex flex-col items-center justify-center gap-1.5">

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        <Download className="h-4 w-4 text-slate-400" />
                      </div>

                      <span className="text-xs text-slate-400">
                        Sin documento
                      </span>

                    </div>

                  )}

                </td>


                {/* ===============================================
                    DESCRIPCIÓN
                =============================================== */}
                <td className="border border-slate-200 px-5 py-4 align-top">

                  {pregunta.descripcion ? (

                    <p className="max-w-[300px] whitespace-normal leading-6 text-slate-600">
                      {pregunta.descripcion}
                    </p>

                  ) : (

                    <span className="text-xs text-slate-400">
                      Sin descripción
                    </span>

                  )}

                </td>


                {/* ===============================================
                    FECHA
                =============================================== */}
                <td className="border border-slate-200 px-4 py-4 text-center">

                  {pregunta.fechaEmision ? (

                    <span className="inline-flex whitespace-nowrap rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                      {pregunta.fechaEmision}
                    </span>

                  ) : (

                    <span className="text-xs text-slate-400">
                      Sin fecha
                    </span>

                  )}

                </td>


                {/* ===============================================
                    INTERNA
                =============================================== */}
                <td className="border border-slate-200 px-4 py-4 text-center">

                  {pregunta.interna ? (

                    <span className="whitespace-normal font-medium text-slate-700">
                      {pregunta.interna}
                    </span>

                  ) : (

                    <span className="text-xs text-slate-400">
                      -
                    </span>

                  )}

                </td>


                {/* ===============================================
                    EXTERNA
                =============================================== */}
                <td className="border border-slate-200 px-4 py-4 text-center">

                  {pregunta.externa ? (

                    <span className="whitespace-normal font-medium text-slate-700">
                      {pregunta.externa}
                    </span>

                  ) : (

                    <span className="text-xs text-slate-400">
                      -
                    </span>

                  )}

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  </div>


  {/* =========================================================
      MENÚ FLOTANTE EDITAR / ELIMINAR
      MISMA LÓGICA QUE YA TENÍAS
  ========================================================= */}
  {typeof document !== "undefined" &&
    selectedIndex !== null &&
    menuPosicion &&
    (puedeEditarPregunta || puedeEliminarPregunta) &&
    createPortal(

      <div
        className={`fixed z-[9999] ${
          menuPosicion.arriba
            ? "-translate-y-full"
            : ""
        }`}
        style={{
          top: `${menuPosicion.top}px`,
          left: `${menuPosicion.left}px`,
        }}
        onClick={(event) => event.stopPropagation()}
      >

        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl ring-1 ring-slate-200">

          {/* EDITAR */}
          {puedeEditarPregunta && (

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                validarYEditar();
                setMenuPosicion(null);
              }}
              disabled={cargandoPermisos}
              className="h-9 rounded-lg px-3 text-amber-700 hover:bg-amber-50"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>

          )}


          {/* ELIMINAR */}
          {puedeEliminarPregunta && (

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                validarYEliminar();
                setMenuPosicion(null);
              }}
              disabled={cargandoPermisos}
              className="h-9 rounded-lg px-3 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>

          )}

        </div>

      </div>,

      document.body

    )}


  {/* =========================================================
      SCROLL HORIZONTAL FIJO
      MISMA LÓGICA QUE YA TENÍAS
  ========================================================= */}
 <div
  ref={scrollFijoRef}
  className="
    fixed
    bottom-0
    left-[var(--sidebar-width)]
    right-0
    z-50
    h-5
    overflow-x-auto
    border-t
    border-slate-300
    bg-white
    shadow-md
  "
>
  <div
    style={{
      width: `${anchoTabla}px`,
      minWidth: `${anchoTabla}px`,
    }}
    className="h-1"
  />
</div>


{/* =========================================================
    FIN DEL CONTENEDOR PRINCIPAL
========================================================= */}
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

        {/* ================= ARCHIVO DEL DOCUMENTO ================= */}

<div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">

  <div className="mb-4">
    <h4 className="text-sm font-semibold text-slate-800">
      Documento de evidencia
    </h4>

    <p className="mt-1 text-xs text-slate-500">
      El documento quedará vinculado directamente a esta pregunta.
    </p>
  </div>

  {/* DOCUMENTO EXISTENTE */}
  {preguntaEditando?.documentId &&
    preguntaEditando?.pdfUrl &&
    !reemplazarDocumento && (
      <div className="mb-4 rounded-xl border border-emerald-200 bg-white p-4">

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Documento actualmente vinculado
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">

          <div>
            <p className="font-semibold text-slate-800">
              {preguntaEditando.nombreDocumento ||
                "Documento"}
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              Documento vinculado correctamente
            </p>
          </div>

          <div className="flex items-center gap-2">

            <a
              href={preguntaEditando.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              Ver documento
            </a>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReemplazarDocumento(true);
                setArchivoDocumento(null);
              }}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Reemplazar
            </Button>

          </div>
        </div>
      </div>
    )}

  {/* NUEVO DOCUMENTO / REEMPLAZO */}
  {(!preguntaEditando?.documentId ||
    reemplazarDocumento) && (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Nombre del documento
        </label>

        <input
          type="text"
          value={nombreDocumento}
          onChange={(e) =>
            setNombreDocumento(e.target.value)
          }
          placeholder="Ej.: Manual de procedimientos"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Archivo
        </label>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) =>
            setArchivoDocumento(
              e.target.files?.[0] ?? null
            )
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
        />

        {archivoDocumento && (
          <p className="mt-2 text-xs text-slate-600">
            Archivo seleccionado:{" "}
            <span className="font-semibold">
              {archivoDocumento.name}
            </span>
          </p>
        )}
      </div>

      {preguntaEditando?.documentId &&
        reemplazarDocumento && (
          <div className="lg:col-span-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setReemplazarDocumento(false);
                setArchivoDocumento(null);

                setNombreDocumento(
                  preguntaEditando.nombreDocumento || ""
                );
              }}
              className="text-slate-600"
            >
              Cancelar reemplazo
            </Button>
          </div>
        )}

    </div>
  )}

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
  disabled={loading}
>
  Cancelar
</Button>

 <Button
  type="button"
  onClick={guardarModal}
  disabled={loading}
>
  {loading ? "Guardando..." : "Guardar"}
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