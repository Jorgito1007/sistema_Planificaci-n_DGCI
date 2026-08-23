"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Megaphone,
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  Info,
  TriangleAlert,
  CircleAlert,
  CircleCheck,
  Eye,
  CalendarDays,
  Send,
} from "lucide-react";

import Swal from "sweetalert2";

type Aviso = {
  Id: number;
  Titulo: string;
  Mensaje: string;
  Tipo: "informativo" | "advertencia" | "urgente" | "exito";
  FechaInicio: string;
  FechaFin: string;
  Activo: boolean;
  UsuarioCreacion?: string;
  FechaCreacion: string;
};

export default function AvisosPage() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [registros, setRegistros] = useState(10);

  const [openNuevoAviso, setOpenNuevoAviso] = useState(false);

const [titulo, setTitulo] = useState("");
const [mensaje, setMensaje] = useState("");
const [tipo, setTipo] = useState<
  "informativo" | "advertencia" | "urgente" | "exito"
>("informativo");

const [fechaInicio, setFechaInicio] = useState("");
const [fechaFin, setFechaFin] = useState("");
const [activo, setActivo] = useState(true);

const [guardando, setGuardando] = useState(false);

const [avisoEditando, setAvisoEditando] = useState<Aviso | null>(null);


const abrirEditar = (aviso: Aviso) => {
  setAvisoEditando(aviso);

  setTitulo(aviso.Titulo);
  setMensaje(aviso.Mensaje);
  setTipo(aviso.Tipo);

  setFechaInicio(
    aviso.FechaInicio
      .replace(" ", "T")
      .slice(0, 16)
  );

  setFechaFin(
    aviso.FechaFin
      .replace(" ", "T")
      .slice(0, 16)
  );

  setActivo(Boolean(aviso.Activo));

  setOpenNuevoAviso(true);
};

  // ==========================================
  // FORMATO FECHA
  // ==========================================

const formatearFechaAviso = (fecha: string) => {
  if (!fecha) return "";

  // Si viene como "2026-08-12 07:57:00"
  const valor = fecha.replace("T", " ");

  const [fechaParte, horaParte] = valor.split(" ");

  if (!fechaParte || !horaParte) return fecha;

  const [anio, mes, dia] = fechaParte.split("-");
  const [hora, minuto] = horaParte.split(":");

  let horaNumero = Number(hora);

  const periodo = horaNumero >= 12 ? "p. m." : "a. m.";

  horaNumero = horaNumero % 12 || 12;

  return `${Number(dia)}/${Number(mes)}/${anio}, ${horaNumero}:${minuto} ${periodo}`;
};

  // ==========================================
  // CARGAR AVISOS
  // ==========================================

  const cargarAvisos = async () => {
    try {
      setCargando(true);

      const res = await fetch("/api/avisos", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.ok) {
        setAvisos(data.avisos || []);
      }
    } catch (error) {
      console.error("Error cargando avisos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAvisos();
  }, []);


  
  // ==========================================
  // ACTUALIZAR AVISOS
  // ==========================================

  const actualizarAviso = async () => {
  if (!avisoEditando) return;

  try {
    setGuardando(true);

    const res = await fetch("/api/avisos", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: avisoEditando.Id,
        titulo,
        mensaje,
        tipo,
        fechaInicio,
        fechaFin,
        activo,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "No se pudo actualizar el aviso.",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Aviso actualizado",
      text: "Los cambios se guardaron correctamente.",
      timer: 1800,
      showConfirmButton: false,
    });

   setOpenNuevoAviso(false);


setAvisoEditando(null);

window.dispatchEvent(new Event("aviso-creado"));
// Volver a cargar los avisos
await cargarAvisos();

  } catch (error) {
    console.error("Error actualizando aviso:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo actualizar el aviso.",
    });
  } finally {
    setGuardando(false);
  }
};

  // ==========================================
  // FILTRAR
  // ==========================================

  const avisosFiltrados = avisos.filter((aviso) => {
    const texto = `
      ${aviso.Titulo}
      ${aviso.Mensaje}
      ${aviso.Tipo}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const avisosMostrar = avisosFiltrados.slice(0, registros);


 

  // ==========================================
  // TIPO
  // ==========================================

  const obtenerTipo = (tipo: string) => {
    switch (tipo) {
      case "advertencia":
        return {
          texto: "Advertencia",
          clase: "bg-yellow-100 text-yellow-700",
          icono: "⚠",
        };

      case "urgente":
        return {
          texto: "Urgente / Error",
          clase: "bg-red-100 text-red-700",
          icono: "●",
        };

      case "exito":
        return {
          texto: "Éxito",
          clase: "bg-green-100 text-green-700",
          icono: "✓",
        };

      default:
        return {
          texto: "Informativo",
          clase: "bg-blue-100 text-blue-700",
          icono: "ⓘ",
        };
    }
  };

  // ==========================================
  // ESTADO
  // ==========================================

  const obtenerEstado = (aviso: Aviso) => {
  if (!aviso.Activo) {
    return {
      texto: "Inactivo",
      clase: "bg-slate-100 text-slate-600",
    };
  }

  const ahora = new Date();

  const ahoraNumero =
    ahora.getFullYear() * 100000000 +
    (ahora.getMonth() + 1) * 1000000 +
    ahora.getDate() * 10000 +
    ahora.getHours() * 100 +
    ahora.getMinutes();

  const convertirFechaNumero = (fecha: string) => {
    const valor = fecha.replace("T", " ");

    const [fechaParte, horaParte] = valor.split(" ");

    const [anio, mes, dia] = fechaParte.split("-").map(Number);
    const [hora, minuto] = horaParte.split(":").map(Number);

    return (
      anio * 100000000 +
      mes * 1000000 +
      dia * 10000 +
      hora * 100 +
      minuto
    );
  };

  const inicio = convertirFechaNumero(aviso.FechaInicio);
  const fin = convertirFechaNumero(aviso.FechaFin);

  if (ahoraNumero < inicio) {
    return {
      texto: "Programado",
      clase: "bg-blue-100 text-blue-700",
    };
  }

  if (ahoraNumero > fin) {
    return {
      texto: "Vencido",
      clase: "bg-red-100 text-red-700",
    };
  }

  return {
    texto: "Activo",
    clase: "bg-green-100 text-green-700",
  };
};

  // ==========================================
  // LIMPIAR FORMULARIOS
  // ==========================================
const limpiarFormulario = () => {
  setTitulo("");
  setMensaje("");
  setTipo("informativo");
  setFechaInicio("");
  setFechaFin("");
  setActivo(true);
};

  // ==========================================
  // CREAR AVISOS
  // ==========================================

const crearAviso = async () => {
  try {
    if (!titulo.trim()) {
      alert("Debe ingresar el título del aviso.");
      return;
    }

    if (!mensaje.trim()) {
      alert("Debe ingresar el mensaje del aviso.");
      return;
    }

    if (!fechaInicio || !fechaFin) {
      alert("Debe indicar la fecha de inicio y fecha de fin.");
      return;
    }

    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      alert("La fecha de fin debe ser posterior a la fecha de inicio.");
      return;
    }

    setGuardando(true);

    const res = await fetch("/api/avisos", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        titulo,
        mensaje,
        tipo,
        fechaInicio,
        fechaFin,
        activo,
      }),
    });

    const data = await res.json();

    console.log("AVISOS RECIBIDOS:", data.avisos);

    if (!data.ok) {
      alert(data.message || "No se pudo crear el aviso.");
      return;
    }

    await cargarAvisos();

window.dispatchEvent(new Event("aviso-creado"));

limpiarFormulario();
setOpenNuevoAviso(false);

  } catch (error) {
    console.error("Error creando aviso:", error);
    alert("Ocurrió un error al crear el aviso.");
  } finally {
    setGuardando(false);
  }
};

  return (
    <div className="min-h-full bg-slate-50">

      {/* ==========================================
          ENCABEZADO
      ========================================== */}

      <div className="mb-5 rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-5">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
              <Megaphone className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-blue-900">
                Avisos del Sistema
              </h1>

              <p className="text-sm text-slate-600">
                Gestión de notificaciones globales visibles para todos los
                usuarios
              </p>
            </div>

          </div>

         <button
  type="button"
  onClick={() => {
    limpiarFormulario();
    setOpenNuevoAviso(true);
  }}
  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
>
  <Plus className="h-4 w-4" />
  Nuevo Aviso
</button>

        </div>

      </div>

      {/* ==========================================
          TABLA
      ========================================== */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

        {/* CONTROLES */}

        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-2 text-sm text-slate-600">

            <span>Mostrar</span>

            <select
              value={registros}
              onChange={(e) =>
                setRegistros(Number(e.target.value))
              }
              className="rounded-md border px-2 py-1.5"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <span>registros</span>

          </div>

          <div className="relative">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 md:w-72"
            />

          </div>

        </div>

        {/* TABLA */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px] border-collapse text-sm">

            <thead>

              <tr className="bg-slate-50 text-left text-slate-700">

                <th className="border-b px-4 py-3 font-semibold">
                  Título
                </th>

                <th className="border-b px-4 py-3 font-semibold">
                  Mensaje
                </th>

                <th className="border-b px-4 py-3 text-center font-semibold">
                  Tipo
                </th>

                <th className="border-b px-4 py-3 text-center font-semibold">
                  Inicio
                </th>

                <th className="border-b px-4 py-3 text-center font-semibold">
                  Fin
                </th>

                <th className="border-b px-4 py-3 text-center font-semibold">
                  Estado
                </th>

                <th className="border-b px-4 py-3 text-center font-semibold">
                  Acciones
                </th>

              </tr>

            </thead>

            <tbody>

              {cargando ? (

                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Cargando avisos...
                  </td>
                </tr>

              ) : avisosMostrar.length === 0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center"
                  >

                    <div className="flex flex-col items-center gap-2 text-slate-400">

                      <Bell className="h-10 w-10" />

                      <p className="text-sm">
                        No hay avisos registrados.
                      </p>

                    </div>

                  </td>
                </tr>

              ) : (

                avisosMostrar.map((aviso) => {

                  const tipo = obtenerTipo(aviso.Tipo);
                  const estado = obtenerEstado(aviso);

                  return (
                    <tr
                      key={aviso.Id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* TÍTULO */}

                      <td className="border-b px-4 py-4 align-top">

                        <div className="font-semibold text-slate-800">
                          {aviso.Titulo}
                        </div>

                      </td>

                      {/* MENSAJE */}

                      <td className="max-w-md border-b px-4 py-4 align-top">

                        <p className="line-clamp-3 text-slate-600">
                          {aviso.Mensaje}
                        </p>

                      </td>

                      {/* TIPO */}

                      <td className="border-b px-4 py-4 text-center align-top">

                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${tipo.clase}`}
                        >
                          <span>{tipo.icono}</span>
                          {tipo.texto}
                        </span>

                      </td>

                      {/* INICIO */}

                      <td className="border-b px-4 py-4 text-center align-top text-slate-600">
                       {formatearFechaAviso(aviso.FechaInicio)}
                      </td>

                      {/* FIN */}

                      <td className="border-b px-4 py-4 text-center align-top text-slate-600">
                       {formatearFechaAviso(aviso.FechaFin)}
                      </td>

                      {/* ESTADO */}

                      <td className="border-b px-4 py-4 text-center align-top">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}
                        >
                          {estado.texto}
                        </span>

                      </td>

                      {/* ACCIONES */}

                      <td className="border-b px-4 py-4 text-center align-top">

                        <div className="flex justify-center gap-2">

                       <button
  type="button"
  onClick={() => abrirEditar(aviso)}
  className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
  title="Editar"
>
  <Pencil className="h-4 w-4" />
</button>

                          <button
                            type="button"
                            title="Eliminar aviso"
                            className="rounded-md bg-red-600 p-2 text-white transition hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })

              )}

            </tbody>

          </table>

        </div>

        {/* PIE */}

        {!cargando && avisos.length > 0 && (
          <div className="border-t px-4 py-3 text-sm text-slate-500">
            Mostrando {avisosMostrar.length} de{" "}
            {avisosFiltrados.length} aviso(s)
          </div>
        )}

      </div>

      {openNuevoAviso && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

    <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

      {/* ============================
          CABECERA
      ============================ */}

      <div className="flex items-center justify-between border-b bg-[#061b33] px-6 py-4">

        <div className="flex items-center gap-3 text-white">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Megaphone className="h-5 w-5" />
          </div>

          <div>
           <h2>
  {avisoEditando ? "Editar Aviso" : "Nuevo Aviso"}
</h2>

            <p className="text-xs text-white/70">
              Crear un nuevo aviso para los usuarios del sistema
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={() => setOpenNuevoAviso(false)}
          className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

      </div>


      {/* ============================
          CONTENIDO
      ============================ */}

      <div className="overflow-y-auto p-6">

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* ============================
              FORMULARIO
          ============================ */}

          <div>

            <div className="mb-5">
              <h3 className="text-base font-bold text-slate-800">
                Información del aviso
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Complete los datos que serán mostrados a los usuarios.
              </p>
            </div>


            {/* TÍTULO */}

            <div className="mb-5">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Título del aviso
              </label>

              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Mantenimiento programado"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* MENSAJE */}

            <div className="mb-5">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mensaje
              </label>

              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={5}
                placeholder="Escriba el mensaje que desea comunicar..."
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* TIPO */}

            <div className="mb-5">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tipo / Severidad
              </label>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                {[
                  {
                    value: "informativo",
                    label: "Informativo",
                    icon: Info,
                    clase: "bg-blue-100 text-blue-600",
                  },
                  {
                    value: "advertencia",
                    label: "Advertencia",
                    icon: TriangleAlert,
                    clase: "bg-yellow-100 text-yellow-600",
                  },
                  {
                    value: "urgente",
                    label: "Urgente / Error",
                    icon: CircleAlert,
                    clase: "bg-red-100 text-red-600",
                  },
                  {
                    value: "exito",
                    label: "Éxito",
                    icon: CircleCheck,
                    clase: "bg-green-100 text-green-600",
                  },
                ].map((item) => {

                  const Icon = item.icon;

                  const seleccionado = tipo === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setTipo(item.value as typeof tipo)
                      }
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        seleccionado
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >

                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${item.clase}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <span className="text-sm font-semibold text-slate-700">
                        {item.label}
                      </span>

                    </button>
                  );
                })}

              </div>

            </div>


            {/* FECHAS */}

            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <CalendarDays className="h-4 w-4" />
                  Inicio
                </label>

                <input
                  type="datetime-local"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <CalendarDays className="h-4 w-4" />
                  Fin
                </label>

                <input
                  type="datetime-local"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />

              </div>

            </div>


            {/* ACTIVO */}

            <div className="rounded-xl border bg-slate-50 p-4">

              <label className="flex cursor-pointer items-center gap-3">

                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />

                <div>

                  <p className="text-sm font-semibold text-slate-700">
                    Aviso activo
                  </p>

                  <p className="text-xs text-slate-500">
                    El aviso podrá ser mostrado a los usuarios dentro
                    del período establecido.
                  </p>

                </div>

              </label>

            </div>

          </div>


          {/* ============================
              VISTA PREVIA
          ============================ */}

          <div>

            <div className="mb-5 flex items-center gap-2">

              <Eye className="h-5 w-5 text-slate-600" />

              <div>

                <h3 className="text-base font-bold text-slate-800">
                  Vista previa
                </h3>

                <p className="text-sm text-slate-500">
                  Así verá el aviso el usuario.
                </p>

              </div>

            </div>


            <div className="rounded-2xl border border-dashed bg-slate-50 p-5">

              <VistaPreviaAviso
                titulo={titulo}
                mensaje={mensaje}
                tipo={tipo}
              />

            </div>

          </div>

        </div>

      </div>


      {/* ============================
          FOOTER
      ============================ */}

      <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-6 py-4">

        <button
          type="button"
          onClick={() => setOpenNuevoAviso(false)}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>

      <button
  type="button"
  onClick={avisoEditando ? actualizarAviso : crearAviso}
  disabled={guardando}
  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
>
  <Send className="h-4 w-4" />

  {guardando
    ? "Guardando..."
    : avisoEditando
    ? "Guardar cambios"
    : "Crear aviso"}
</button>

      </div>

    </div>

  </div>
)}

    </div>

    
  );

  function VistaPreviaAviso({
  titulo,
  mensaje,
  tipo,
}: {
  titulo: string;
  mensaje: string;
  tipo: "informativo" | "advertencia" | "urgente" | "exito";
}) {

  const configuracion = {
    informativo: {
      icon: Info,
      border: "border-blue-500",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      text: "text-blue-700",
    },

    advertencia: {
      icon: TriangleAlert,
      border: "border-yellow-500",
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-100",
      text: "text-yellow-700",
    },

    urgente: {
      icon: CircleAlert,
      border: "border-red-500",
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      text: "text-red-700",
    },

    exito: {
      icon: CircleCheck,
      border: "border-green-500",
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      text: "text-green-700",
    },
  };

  const config = configuracion[tipo];

  const Icono = config.icon;

  return (
    <div
      className={`rounded-xl border-l-4 ${config.border} ${config.bg} p-5 shadow-sm`}
    >

      <div className="flex gap-4">

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${config.iconBg} ${config.text}`}
        >
          <Icono className="h-6 w-6" />
        </div>

        <div className="min-w-0">

          <p className={`text-xs font-bold uppercase tracking-wider ${config.text}`}>
            Aviso del sistema
          </p>

          <h3 className="mt-1 text-lg font-bold text-slate-800">
            {titulo || "Título del aviso"}
          </h3>

          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
            {mensaje || "El mensaje del aviso aparecerá aquí."}
          </p>

          <div className="mt-4 border-t pt-3 text-xs text-slate-400">
            Este es un ejemplo de cómo será mostrado al usuario.
          </div>

        </div>

      </div>

    </div>



  );
}
}