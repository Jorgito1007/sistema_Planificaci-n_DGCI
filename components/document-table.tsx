"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Plus,
  FileDown,
  Trash2,
  AlertTriangle,
  CalendarDays,
  FileUp,
  FileCheck2,
  FolderOpen,
} from "lucide-react";

import { HashLoader } from "react-spinners";

interface Document {
  DocumentId: number;
  Nombre: string;

  Elaborado: boolean;
  Aprobado: boolean;
  Implementado: boolean;
  Actualizado: boolean;
  Difundido: boolean;

  PdfUrl: string | null;

  /**
   * URL del documento que fue cargado al actualizar.
   * El API debe devolver este campo.
   */
  DocumentoActualizadoUrl?: string | null;

  Fecha_elaborado?: string | null;
  Fecha_Aprobado?: string | null;
  Fecha_Actualizado?: string | null;
}

interface DocumentTableProps {
  documents: Document[];
  categoryValue: string;
}

const statusColumns = [
  {
    key: "Elaborado",
    label: "Elaborado",
  },
  {
    key: "Aprobado",
    label: "Aprobado",
  },
  {
    key: "Implementado",
    label: "Implementado",
  },
  {
    key: "Actualizado",
    label: "Actualizado",
  },
  {
    key: "Difundido",
    label: "Difundido",
  },
] as const;

type StatusKey = (typeof statusColumns)[number]["key"];

type ConfirmState =
  | {
      type: "toggle";
      docId: number;
      docName: string;
      field: StatusKey;
      currentValue: boolean;
    }
  | {
      type: "delete";
      docId: number;
      docName: string;
    }
  | null;

type PendingDateToggle = {
  docId: number;
  docName: string;
  field: "Aprobado" | "Actualizado";
  currentValue: boolean;
} | null;

function formatDate(date?: string | null) {
  if (!date) return "";

  const normalizedDate = date.includes("T")
    ? date.substring(0, 10)
    : date;

  const [year, month, day] = normalizedDate.split("-");

  if (!year || !month || !day) {
    return date;
  }

  return `${day}/${month}/${year}`;
}

export function DocumentTable({
  documents: initialDocs,
  categoryValue,
}: DocumentTableProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocs);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newDocName, setNewDocName] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);

  const [newFechaAprobado, setNewFechaAprobado] = useState("");
  const [newFechaActualizado, setNewFechaActualizado] = useState("");

  /**
   * Archivo actualizado cuando se registra un documento nuevo
   * con el estado Actualizado marcado.
   */
  const [newUpdatedFile, setNewUpdatedFile] = useState<File | null>(
    null
  );

  const [newStatus, setNewStatus] = useState({
    Elaborado: false,
    Aprobado: false,
    Implementado: false,
    Actualizado: false,
    Difundido: false,
  });

  const [confirmData, setConfirmData] =
    useState<ConfirmState>(null);

  const [pendingDateToggle, setPendingDateToggle] =
    useState<PendingDateToggle>(null);

  const [toggleDateValue, setToggleDateValue] = useState("");

  /**
   * Archivo nuevo que se selecciona al marcar
   * un documento existente como Actualizado.
   */
  const [toggleUpdatedFile, setToggleUpdatedFile] =
    useState<File | null>(null);

  useEffect(() => {
    setDocuments(initialDocs);
  }, [initialDocs]);

  function resetForm() {
    setNewDocName("");
    setNewFile(null);
    setNewUpdatedFile(null);
    setNewFechaAprobado("");
    setNewFechaActualizado("");

    setNewStatus({
      Elaborado: false,
      Aprobado: false,
      Implementado: false,
      Actualizado: false,
      Difundido: false,
    });
  }

  function resetUpdateDialog() {
    setPendingDateToggle(null);
    setToggleDateValue("");
    setToggleUpdatedFile(null);
  }

  function getActionText(field: StatusKey) {
    const actions: Record<StatusKey, string> = {
      Elaborado: "elaborar",
      Aprobado: "aprobar",
      Implementado: "implementar",
      Actualizado: "actualizar",
      Difundido: "difundir",
    };

    return actions[field];
  }

  function canToggleStatus(
    currentStatus: typeof newStatus,
    field: StatusKey
  ) {
    if (field === "Elaborado") {
      return true;
    }

    return currentStatus.Elaborado;
  }

  function canToggleExistingStatus(
    doc: Document,
    field: StatusKey
  ) {
    if (field === "Elaborado") {
      return true;
    }

    return doc.Elaborado;
  }

  function handleNewStatusChange(
    field: StatusKey,
    checked: boolean
  ) {
    setNewStatus((previousStatus) => {
      const updatedStatus = {
        ...previousStatus,
      };

      if (field === "Elaborado") {
        updatedStatus.Elaborado = checked;

        if (!checked) {
          updatedStatus.Aprobado = false;
          updatedStatus.Implementado = false;
          updatedStatus.Actualizado = false;
          updatedStatus.Difundido = false;

          setNewFechaAprobado("");
          setNewFechaActualizado("");
          setNewUpdatedFile(null);
        }

        return updatedStatus;
      }

      if (!previousStatus.Elaborado) {
        return previousStatus;
      }

      if (field === "Aprobado") {
        updatedStatus.Aprobado = checked;

        if (!checked) {
          setNewFechaAprobado("");
        }

        return updatedStatus;
      }

      if (field === "Implementado") {
        updatedStatus.Implementado = checked;
        return updatedStatus;
      }

      if (field === "Actualizado") {
        updatedStatus.Actualizado = checked;

        if (!checked) {
          setNewFechaActualizado("");
          setNewUpdatedFile(null);
        }

        return updatedStatus;
      }

      if (field === "Difundido") {
        updatedStatus.Difundido = checked;
        return updatedStatus;
      }

      return updatedStatus;
    });
  }

  /**
   * Actualiza estados normales:
   * Elaborado, Aprobado, Implementado y Difundido.
   *
   * También puede quitar el estado Actualizado,
   * porque para quitarlo no se necesita archivo.
   */
  async function handleToggle(
    docId: number,
    docName: string,
    field: StatusKey,
    currentValue: boolean,
    fecha?: string
  ) {
    try {
      setLoading(true);

      const response = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          field,
          value: !currentValue,
          fecha: fecha || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("PATCH status:", response.status);
        console.error("PATCH response:", data);

        toast.error(
          data.error ||
            data.sqlMessage ||
            "Error al actualizar el estado"
        );

        return;
      }

      setDocuments((previousDocuments) =>
        previousDocuments.map((doc) => {
          if (doc.DocumentId !== docId) {
            return doc;
          }

          const updatedDocument: Document = {
            ...doc,
            [field]: !currentValue,
          };

          if (field === "Aprobado") {
            updatedDocument.Fecha_Aprobado = !currentValue
              ? fecha || null
              : null;

            if (currentValue) {
              updatedDocument.Implementado = false;
              updatedDocument.Actualizado = false;
              updatedDocument.Difundido = false;
              updatedDocument.Fecha_Actualizado = null;
              updatedDocument.DocumentoActualizadoUrl = null;
            }
          }

          if (field === "Actualizado" && currentValue) {
            updatedDocument.Fecha_Actualizado = null;
            updatedDocument.DocumentoActualizadoUrl = null;
            updatedDocument.Difundido = false;
          }

          if (field === "Elaborado" && currentValue) {
            updatedDocument.Aprobado = false;
            updatedDocument.Implementado = false;
            updatedDocument.Actualizado = false;
            updatedDocument.Difundido = false;

            updatedDocument.Fecha_Aprobado = null;
            updatedDocument.Fecha_Actualizado = null;
            updatedDocument.DocumentoActualizadoUrl = null;
          }

          if (field === "Implementado" && currentValue) {
            updatedDocument.Actualizado = false;
            updatedDocument.Difundido = false;
            updatedDocument.Fecha_Actualizado = null;
            updatedDocument.DocumentoActualizadoUrl = null;
          }

          return updatedDocument;
        })
      );

      toast.success(
        !currentValue
          ? `El estado "${field}" fue aplicado correctamente`
          : `El estado "${field}" fue removido correctamente`
      );
    } catch (error) {
      console.error("PATCH fetch error:", error);
      toast.error("Error de conexión al actualizar el estado");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Marca el documento como Actualizado.
   * Envía fecha y archivo mediante FormData.
   */
  async function handleMarkAsUpdated(
    docId: number,
    fecha: string,
    file: File
  ) {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("field", "Actualizado");
      formData.append("value", "true");
      formData.append("fecha", fecha);
      formData.append("file", file);

      const response = await fetch(
        `/api/documents/${docId}/actualizar`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      const rawText = await response.text();

      let data: any = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = {
          rawText,
        };
      }

      if (!response.ok) {
        console.error("UPDATE DOCUMENT status:", response.status);
        console.error("UPDATE DOCUMENT response:", data);

        toast.error(
          data?.error ||
            data?.sqlMessage ||
            "No fue posible actualizar el documento"
        );

        return false;
      }

      setDocuments((previousDocuments) =>
        previousDocuments.map((doc) => {
          if (doc.DocumentId !== docId) {
            return doc;
          }

          return {
            ...doc,
            Actualizado: true,
            Fecha_Actualizado:
              data?.Fecha_Actualizado || fecha,
            DocumentoActualizadoUrl:
              data?.DocumentoActualizadoUrl ||
              data?.PdfActualizadoUrl ||
              data?.PdfUrl ||
              null,
          };
        })
      );

      toast.success(
        "El documento fue actualizado correctamente"
      );

      return true;
    } catch (error) {
      console.error("UPDATE DOCUMENT fetch error:", error);

      toast.error(
        "Error de conexión al actualizar el documento"
      );

      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDocument() {
    if (!newDocName.trim()) {
      toast.error("Debe ingresar el nombre del documento");
      return;
    }

    if (!newFile) {
      toast.error("Debe seleccionar el documento original");
      return;
    }

    if (newStatus.Aprobado && !newFechaAprobado) {
      toast.error("Debe seleccionar la fecha de aprobado");
      return;
    }

    if (
      newStatus.Actualizado &&
      !newFechaActualizado
    ) {
      toast.error(
        "Debe seleccionar la fecha de actualización"
      );
      return;
    }
if (newStatus.Actualizado) {
  if (!newUpdatedFile) {
    toast.error("Debe seleccionar el documento.");
    return;
  }
} else {
  if (!newFile) {
    toast.error("Debe seleccionar el documento.");
    return;
  }
}

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("Nombre", newDocName.trim());
      formData.append("SubModuleId", categoryValue);

      formData.append(
        "Elaborado",
        String(newStatus.Elaborado)
      );

      formData.append(
        "Aprobado",
        String(newStatus.Aprobado)
      );

      formData.append(
        "Implementado",
        String(newStatus.Implementado)
      );

      formData.append(
        "Actualizado",
        String(newStatus.Actualizado)
      );

      formData.append(
        "Difundido",
        String(newStatus.Difundido)
      );

      if (newFechaAprobado) {
        formData.append(
          "Fecha_Aprobado",
          newFechaAprobado
        );
      }

      if (newFechaActualizado) {
        formData.append(
          "Fecha_Actualizado",
          newFechaActualizado
        );
      }

  

     if (newStatus.Actualizado) {
  formData.append("file", newUpdatedFile!);
} else {
  formData.append("file", newFile!);
}

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();

      let data: any = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = {
          rawText,
        };
      }

      if (!response.ok) {
        console.error("POST status:", response.status);
        console.error("POST response:", data);

        toast.error(
          data?.error ||
            data?.sqlMessage ||
            "Error al agregar el documento"
        );

        return;
      }

      setDocuments((previousDocuments) => [
        ...previousDocuments,
        data,
      ]);

      resetForm();
      setDialogOpen(false);

      toast.success("Documento agregado correctamente");
    } catch (error) {
      console.error("POST fetch error:", error);

      toast.error(
        "Error de conexión al agregar el documento"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(
    docId: number,
    docName: string
  ) {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/documents/${docId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("DELETE error:", data);

        toast.error(
          data.error || "Error al eliminar el documento"
        );

        return;
      }

      setDocuments((previousDocuments) =>
        previousDocuments.filter(
          (doc) => doc.DocumentId !== docId
        )
      );

      toast.success(
        `Documento "${docName}" eliminado correctamente`
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "Error de conexión al eliminar el documento"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirmData) {
      return;
    }

    if (confirmData.type === "toggle") {
      await handleToggle(
        confirmData.docId,
        confirmData.docName,
        confirmData.field,
        confirmData.currentValue
      );
    }

    if (confirmData.type === "delete") {
      await handleDelete(
        confirmData.docId,
        confirmData.docName
      );
    }

    setConfirmData(null);
  }

  function handleExistingStatusClick(
    doc: Document,
    field: StatusKey
  ) {
    /**
     * Para marcar Aprobado se solicita fecha.
     */
    if (field === "Aprobado" && !doc.Aprobado) {
      setToggleDateValue("");

      setPendingDateToggle({
        docId: doc.DocumentId,
        docName: doc.Nombre,
        field: "Aprobado",
        currentValue: false,
      });

      return;
    }

    /**
     * Para marcar Actualizado se solicitará
     * fecha y nuevo documento.
     */
    if (field === "Actualizado" && !doc.Actualizado) {
      setToggleDateValue("");
      setToggleUpdatedFile(null);

      setPendingDateToggle({
        docId: doc.DocumentId,
        docName: doc.Nombre,
        field: "Actualizado",
        currentValue: false,
      });

      return;
    }

    setConfirmData({
      type: "toggle",
      docId: doc.DocumentId,
      docName: doc.Nombre,
      field,
      currentValue: doc[field],
    });
  }

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="flex min-w-[290px] flex-col items-center rounded-2xl border border-white/20 bg-white p-8 text-center shadow-2xl">
            <HashLoader
              color="#084a89"
              loading
              size={55}
              speedMultiplier={1}
            />

            <p className="mt-5 text-sm font-semibold text-slate-700">
              Procesando información...
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Guardando cambios del documento
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Encabezado */}
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-blue-50 shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-600/20">
                <FolderOpen className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Gestión de documentos
                </h2>

                <p className="text-sm text-slate-500">
                  {documents.length} documento
                  {documents.length !== 1 ? "s" : ""} registrado
                  {documents.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);

                if (!open) {
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-blue-600 shadow-md shadow-blue-600/20 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar documento
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                      <FileUp className="h-5 w-5" />
                    </div>

                    Agregar nuevo documento
                  </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-5 pt-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="doc-name">
                      Nombre del documento
                    </Label>

                    <Input
                      id="doc-name"
                      value={newDocName}
                      onChange={(event) =>
                        setNewDocName(event.target.value)
                      }
                      placeholder="Ej.: Manual de procedimientos"
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="rounded-xl border bg-slate-50/70 p-4">
                    <Label className="text-sm font-bold text-slate-700">
                      Estados del documento
                    </Label>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {statusColumns.map((column) => (
                        <div
                          key={column.key}
                          className={`flex items-center justify-between rounded-xl border bg-white px-4 py-3 transition ${
                            newStatus[column.key]
                              ? "border-blue-300 shadow-sm"
                              : "border-slate-200"
                          }`}
                        >
                          <span className="text-sm font-medium text-slate-700">
                            {column.label}
                          </span>

                          <Checkbox
                            checked={newStatus[column.key]}
                            disabled={
                              !canToggleStatus(
                                newStatus,
                                column.key
                              )
                            }
                            onCheckedChange={(checked) =>
                              handleNewStatusChange(
                                column.key,
                                checked === true
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Primero debe marcarse como elaborado. Luego
                      podrá seleccionar los demás estados.
                    </p>
                  </div>

                  {newStatus.Aprobado && (
                    <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                      <Label htmlFor="fecha-aprobado">
                        Fecha de aprobación
                      </Label>

                      <Input
                        id="fecha-aprobado"
                        type="date"
                        value={newFechaAprobado}
                        onChange={(event) =>
                          setNewFechaAprobado(
                            event.target.value
                          )
                        }
                        className="bg-white"
                      />
                    </div>
                  )}

                  {newStatus.Actualizado && (
                    <div className="flex flex-col gap-4 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="h-5 w-5 text-violet-700" />

                        <Label className="font-bold text-violet-900">
                          Información de actualización
                        </Label>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="fecha-actualizado">
                          Fecha de actualización
                        </Label>

                        <Input
                          id="fecha-actualizado"
                          type="date"
                          value={newFechaActualizado}
                          onChange={(event) =>
                            setNewFechaActualizado(
                              event.target.value
                            )
                          }
                          className="bg-white"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="updated-file">
                          Nuevo documento actualizado
                        </Label>

                        <Input
                          id="updated-file"
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="bg-white"
                          onChange={(event) => {
                            const file =
                              event.target.files?.[0] || null;

                            setNewUpdatedFile(file);
                          }}
                        />

                        <p className="text-xs text-violet-700">
                          Este archivo quedará registrado como la
                          nueva versión del documento.
                        </p>
                      </div>
                    </div>
                  )}

{!newStatus.Actualizado && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="doc-file">
                      Documento original
                    </Label>

                    <Input
                      id="doc-file"
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="h-11 rounded-xl"
                      onChange={(event) => {
                        const file =
                          event.target.files?.[0] || null;

                        setNewFile(file);
                      }}
                    />

                    <p className="text-xs text-slate-500">
                      Formatos permitidos: PDF, DOC y DOCX.
                    </p>
                  </div>

)}

                  <Button
                    onClick={handleAddDocument}
                    disabled={
                      !newDocName.trim() ||
                      !newFile ||
                      loading
                    }
                    className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />

                    {loading
                      ? "Guardando..."
                      : "Agregar documento"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100 hover:bg-slate-100">
                  <TableHead className="min-w-[280px] font-bold text-slate-700">
                    Documento
                  </TableHead>

                  <TableHead className="w-[110px] text-center font-bold text-slate-700">
                    Elaborado
                  </TableHead>

                  <TableHead className="w-[140px] text-center font-bold text-slate-700">
                    Aprobado
                  </TableHead>

                  <TableHead className="w-[120px] text-center font-bold text-slate-700">
                    Implementado
                  </TableHead>

                  <TableHead className="min-w-[210px] text-center font-bold text-slate-700">
                    Actualizado
                  </TableHead>

                  <TableHead className="w-[110px] text-center font-bold text-slate-700">
                    Difundido
                  </TableHead>

                  <TableHead className="w-[100px] text-center font-bold text-slate-700">
                    Archivo
                  </TableHead>

                  <TableHead className="w-[100px] text-center font-bold text-slate-700">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-14 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-slate-100 p-4">
                          <FolderOpen className="h-8 w-8 text-slate-400" />
                        </div>

                        <p className="mt-3 font-semibold text-slate-600">
                          No hay documentos registrados
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Utilice el botón Agregar documento para
                          comenzar.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow
                      key={doc.DocumentId}
                      className="group transition-colors hover:bg-blue-50/40"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                            <FileCheck2 className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {doc.Nombre}
                            </p>

                           
                          </div>
                        </div>
                      </TableCell>

                      {/* Elaborado */}
                      <TableCell className="text-center">
                        <Checkbox
                          checked={doc.Elaborado}
                          disabled={
                            !canToggleExistingStatus(
                              doc,
                              "Elaborado"
                            )
                          }
                          onCheckedChange={() =>
                            handleExistingStatusClick(
                              doc,
                              "Elaborado"
                            )
                          }
                        />
                      </TableCell>

                      {/* Aprobado */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <Checkbox
                            checked={doc.Aprobado}
                            disabled={
                              !canToggleExistingStatus(
                                doc,
                                "Aprobado"
                              )
                            }
                            onCheckedChange={() =>
                              handleExistingStatusClick(
                                doc,
                                "Aprobado"
                              )
                            }
                          />

                          {doc.Aprobado &&
                            doc.Fecha_Aprobado && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(
                                  doc.Fecha_Aprobado
                                )}
                              </span>
                            )}
                        </div>
                      </TableCell>

                      {/* Implementado */}
                      <TableCell className="text-center">
                        <Checkbox
                          checked={doc.Implementado}
                          disabled={
                            !canToggleExistingStatus(
                              doc,
                              "Implementado"
                            )
                          }
                          onCheckedChange={() =>
                            handleExistingStatusClick(
                              doc,
                              "Implementado"
                            )
                          }
                        />
                      </TableCell>

                     {/* Actualizado */}
<TableCell>
  <div className="flex min-h-[58px] items-center justify-center gap-3">
    <Checkbox
      checked={doc.Actualizado}
      disabled={
        !canToggleExistingStatus(
          doc,
          "Actualizado"
        )
      }
      onCheckedChange={() =>
        handleExistingStatusClick(
          doc,
          "Actualizado"
        )
      }
    />

    {doc.Actualizado ? (
      doc.Fecha_Actualizado ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
          <CalendarDays className="h-3 w-3" />
          {formatDate(doc.Fecha_Actualizado)}
        </span>
      ) : null
    ) : (
      <span className="text-xs text-slate-400">
        Sin actualización
      </span>
    )}
  </div>
</TableCell>

                      {/* Difundido */}
                      <TableCell className="text-center">
                        <Checkbox
                          checked={doc.Difundido}
                          disabled={
                            !canToggleExistingStatus(
                              doc,
                              "Difundido"
                            )
                          }
                          onCheckedChange={() =>
                            handleExistingStatusClick(
                              doc,
                              "Difundido"
                            )
                          }
                        />
                      </TableCell>

                      {/* Documento original */}
                      <TableCell className="text-center">
                        {doc.PdfUrl ? (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            asChild
                          >
                            <a
                              href={doc.PdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir documento original"
                            >
                              <FileDown className="h-4 w-4" />
                              <span className="sr-only">
                                Abrir documento
                              </span>
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Sin archivo
                          </span>
                        )}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Eliminar documento"
                          onClick={() =>
                            setConfirmData({
                              type: "delete",
                              docId: doc.DocumentId,
                              docName: doc.Nombre,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">
                            Eliminar documento
                          </span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Confirmación general */}
      <AlertDialog
        open={!!confirmData}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmData(null);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <div
                className={`rounded-full p-2 ${
                  confirmData?.type === "delete"
                    ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                {confirmData?.type === "delete" ? (
                  <Trash2 className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>

              <AlertDialogTitle>
                {confirmData?.type === "delete"
                  ? "Confirmar eliminación"
                  : "Confirmar acción"}
              </AlertDialogTitle>
            </div>

            <AlertDialogDescription className="text-sm leading-6">
              {confirmData?.type === "toggle" &&
                (() => {
                  const action = confirmData.currentValue
                    ? `quitar el estado "${confirmData.field}"`
                    : getActionText(confirmData.field);

                  return `¿Desea ${action} el documento "${confirmData.docName}"?`;
                })()}

              {confirmData?.type === "delete" &&
                `¿Desea eliminar el documento "${confirmData.docName}"? Esta acción quedará registrada en auditoría.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmData(null)}
            >
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                confirmData?.type === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {confirmData?.type === "delete"
                ? "Sí, eliminar"
                : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fecha aprobado / fecha y archivo actualizado */}
      <Dialog
        open={!!pendingDateToggle}
        onOpenChange={(open) => {
          if (!open) {
            resetUpdateDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className={`rounded-lg p-2 ${
                  pendingDateToggle?.field === "Actualizado"
                    ? "bg-violet-100 text-violet-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {pendingDateToggle?.field === "Actualizado" ? (
                  <FileUp className="h-5 w-5" />
                ) : (
                  <CalendarDays className="h-5 w-5" />
                )}
              </div>

              {pendingDateToggle?.field === "Aprobado"
                ? "Registrar aprobación"
                : "Actualizar documento"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5 pt-3">
            <div className="rounded-xl border bg-slate-50 p-3">
              <p className="text-xs text-slate-500">
                Documento
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {pendingDateToggle?.docName}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="toggle-date">
                {pendingDateToggle?.field === "Aprobado"
                  ? "Fecha de aprobación"
                  : "Fecha de actualización"}
              </Label>

              <Input
                id="toggle-date"
                type="date"
                value={toggleDateValue}
                onChange={(event) =>
                  setToggleDateValue(event.target.value)
                }
                className="h-11 rounded-xl"
              />
            </div>

            {pendingDateToggle?.field === "Actualizado" && (
              <div className="flex flex-col gap-2 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                <Label htmlFor="toggle-updated-file">
               Documento
                </Label>

                <Input
                  id="toggle-updated-file"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="bg-white"
                  onChange={(event) => {
                    const file =
                      event.target.files?.[0] || null;

                    setToggleUpdatedFile(file);
                  }}
                />

                <p className="text-xs leading-5 text-violet-700">
                  Seleccione la nueva versión que sustituirá o
                  complementará al documento original.
                </p>
              </div>
            )}

            <Button
              className={`h-11 rounded-xl ${
                pendingDateToggle?.field === "Actualizado"
                  ? "bg-violet-600 hover:bg-violet-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              onClick={async () => {
                if (!pendingDateToggle) {
                  return;
                }

                if (!toggleDateValue) {
                  toast.error(
                    "Debe seleccionar una fecha"
                  );
                  return;
                }

                if (
                  pendingDateToggle.field === "Actualizado"
                ) {
                  if (!toggleUpdatedFile) {
                    toast.error(
                      "Debe seleccionar el documento actualizado"
                    );
                    return;
                  }

                  const success =
                    await handleMarkAsUpdated(
                      pendingDateToggle.docId,
                      toggleDateValue,
                      toggleUpdatedFile
                    );

                  if (success) {
                    resetUpdateDialog();
                  }

                  return;
                }

                await handleToggle(
                  pendingDateToggle.docId,
                  pendingDateToggle.docName,
                  pendingDateToggle.field,
                  pendingDateToggle.currentValue,
                  toggleDateValue
                );

                resetUpdateDialog();
              }}
            >
              {pendingDateToggle?.field === "Actualizado" ? (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Guardar actualización
                </>
              ) : (
                <>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Confirmar aprobación
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}