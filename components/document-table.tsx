"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { Plus, FileDown, Trash2, AlertTriangle } from "lucide-react";

interface Document {
  DocumentId: number;
  Nombre: string;
  Elaborado: boolean;
  Aprobado: boolean;
  Implementado: boolean;
  Actualizado: boolean;
  Difundido: boolean;
  PdfUrl: string | null;
}

interface DocumentTableProps {
  documents: Document[];
  categoryValue: string;
}

const statusColumns = [
  { key: "Elaborado", label: "Elaborado" },
  { key: "Aprobado", label: "Aprobado" },
  { key: "Implementado", label: "Implementado" },
  { key: "Actualizado", label: "Actualizado" },
  { key: "Difundido", label: "Difundido" },
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

export function DocumentTable({
  documents: initialDocs,
  categoryValue,
}: DocumentTableProps) {
  const [documents, setDocuments] = useState(initialDocs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newDocName, setNewDocName] = useState("");
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);

  const [newStatus, setNewStatus] = useState({
    Elaborado: false,
    Aprobado: false,
    Implementado: false,
    Actualizado: false,
    Difundido: false,
  });

  const [confirmData, setConfirmData] = useState<ConfirmState>(null);

  function resetForm() {
    setNewDocName("");
    setNewPdfFile(null);
    setNewStatus({
      Elaborado: false,
      Aprobado: false,
      Implementado: false,
      Actualizado: false,
      Difundido: false,
    });
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

  function canToggleStatus(currentStatus: typeof newStatus, field: StatusKey) {
    switch (field) {
      case "Elaborado":
        return true;
      case "Aprobado":
        return currentStatus.Elaborado;
      case "Implementado":
        return currentStatus.Elaborado && currentStatus.Aprobado;
      case "Actualizado":
        return (
          currentStatus.Elaborado &&
          currentStatus.Aprobado &&
          currentStatus.Implementado
        );
      case "Difundido":
        return (
          currentStatus.Elaborado &&
          currentStatus.Aprobado &&
          currentStatus.Implementado &&
          currentStatus.Actualizado
        );
      default:
        return false;
    }
  }

  function handleNewStatusChange(field: StatusKey, checked: boolean) {
    setNewStatus((prev) => {
      const updated = { ...prev };

      if (field === "Elaborado") {
        updated.Elaborado = checked;
        if (!checked) {
          updated.Aprobado = false;
          updated.Implementado = false;
          updated.Actualizado = false;
          updated.Difundido = false;
        }
      }

      if (field === "Aprobado") {
        if (!prev.Elaborado) return prev;
        updated.Aprobado = checked;
        if (!checked) {
          updated.Implementado = false;
          updated.Actualizado = false;
          updated.Difundido = false;
        }
      }

      if (field === "Implementado") {
        if (!prev.Elaborado || !prev.Aprobado) return prev;
        updated.Implementado = checked;
        if (!checked) {
          updated.Actualizado = false;
          updated.Difundido = false;
        }
      }

      if (field === "Actualizado") {
        if (!prev.Elaborado || !prev.Aprobado || !prev.Implementado) return prev;
        updated.Actualizado = checked;
        if (!checked) {
          updated.Difundido = false;
        }
      }

      if (field === "Difundido") {
        if (
          !prev.Elaborado ||
          !prev.Aprobado ||
          !prev.Implementado ||
          !prev.Actualizado
        ) {
          return prev;
        }
        updated.Difundido = checked;
      }

      return updated;
    });
  }

 async function handleToggle(
  docId: number,
  docName: string,
  field: StatusKey,
  currentValue: boolean
) {
  try {
    const res = await fetch(`/api/documents/${docId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        field,
        value: !currentValue,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("PATCH status:", res.status);
      console.error("PATCH response:", data);
      toast.error(data.error || data.sqlMessage || "Error al actualizar el estado");
      return;
    }

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.DocumentId === docId ? { ...doc, [field]: !currentValue } : doc
      )
    );

    toast.success(
      !currentValue
        ? `El estado "${field}" fue aplicado correctamente`
        : `El estado "${field}" fue removido correctamente`
    );
  } catch (error) {
    console.error("PATCH fetch error:", error);
    toast.error("Error de conexión al actualizar el estado");
  }
}

async function handleAddDocument() {
  if (!newDocName.trim()) {
    toast.error("Debe ingresar el nombre del documento");
    return;
  }

  try {
    setLoading(true);

    const formData = new FormData();
    formData.append("Nombre", newDocName.trim());
    formData.append("SubModuleId", categoryValue);
    formData.append("Elaborado", String(newStatus.Elaborado));
    formData.append("Aprobado", String(newStatus.Aprobado));
    formData.append("Implementado", String(newStatus.Implementado));
    formData.append("Actualizado", String(newStatus.Actualizado));
    formData.append("Difundido", String(newStatus.Difundido));

    if (newPdfFile) {
      formData.append("pdf", newPdfFile);
    }

    const res = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });

    const rawText = await res.text();
    console.log("POST raw response:", rawText);

    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = { rawText };
    }

    if (!res.ok) {
      console.error("POST status:", res.status);
      console.error("POST response:", data);
      toast.error(data?.error || data?.sqlMessage || "Error al agregar documento");
      return;
    }

    setDocuments((prev) => [...prev, data]);
    resetForm();
    setDialogOpen(false);

    toast.success("Documento agregado");
  } catch (error) {
    console.error("POST fetch error:", error);
    toast.error("Error de conexión al agregar documento");
  } finally {
    setLoading(false);
  }
}
  async function handleDelete(docId: number, docName: string) {
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("DELETE error:", data);
        toast.error(data.error || "Error al eliminar documento");
        return;
      }

      setDocuments((prev) => prev.filter((doc) => doc.DocumentId !== docId));
      toast.success(`Documento "${docName}" eliminado correctamente`);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar documento");
    }
  }

  async function handleConfirmAction() {
    if (!confirmData) return;

    if (confirmData.type === "toggle") {
      await handleToggle(
        confirmData.docId,
        confirmData.docName,
        confirmData.field,
        confirmData.currentValue
      );
    }

    if (confirmData.type === "delete") {
      await handleDelete(confirmData.docId, confirmData.docName);
    }

    setConfirmData(null);
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {documents.length} documento{documents.length !== 1 ? "s" : ""} registrado
            {documents.length !== 1 ? "s" : ""}
          </p>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Agregar Documento
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Documento</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-5 pt-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="doc-name">Nombre del documento</Label>
                  <Input
                    id="doc-name"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="Ej.: Organigrama"
                  />
                </div>

                <div className="flex flex-col gap-3 rounded-lg border p-4">
                  <Label className="text-sm font-semibold">Estados del documento</Label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {statusColumns.map((col) => (
                      <div
                        key={col.key}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <span className="text-sm">{col.label}</span>
                        <Checkbox
                          checked={newStatus[col.key]}
                          disabled={!canToggleStatus(newStatus, col.key)}
                          onCheckedChange={(checked) =>
                            handleNewStatusChange(col.key, checked === true)
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Debe seguir el orden: Elaborado → Aprobado → Implementado →
                    Actualizado → Difundido.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="pdf-file">Archivo PDF</Label>
                  <Input
                    id="pdf-file"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewPdfFile(file);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Seleccione el archivo PDF del documento.
                  </p>
                </div>

                <Button onClick={handleAddDocument} disabled={!newDocName.trim() || loading}>
                  {loading ? "Agregando..." : "Agregar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Documento</TableHead>

                {statusColumns.map((col) => (
                  <TableHead key={col.key} className="w-[120px] text-center">
                    {col.label}
                  </TableHead>
                ))}

                <TableHead className="w-[80px] text-center">PDF</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No hay documentos registrados. Haga clic en &quot;Agregar Documento&quot;
                    para comenzar.
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.DocumentId}>
                    <TableCell className="font-medium">{doc.Nombre}</TableCell>

                    {statusColumns.map((col) => (
                      <TableCell key={col.key} className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={doc[col.key]}
                           onCheckedChange={() =>
  setConfirmData({
    type: "toggle",
    docId: doc.DocumentId,
    docName: doc.Nombre,
    field: col.key,
    currentValue: doc[col.key],
  })
}
                          />
                        </div>
                      </TableCell>
                    ))}

                    <TableCell className="text-center">
                      {doc.PdfUrl ? (
                        <a href={doc.PdfUrl} target="_blank" rel="noopener noreferrer">
                          <FileDown className="mx-auto h-4 w-4 text-primary" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setConfirmData({
                            type: "delete",
                            docId: doc.DocumentId,
                            docName: doc.Nombre,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

    <AlertDialog open={!!confirmData} onOpenChange={() => setConfirmData(null)}>
  <AlertDialogContent className="sm:max-w-md">
    <AlertDialogHeader>
      <div className="mb-2 flex items-center gap-2">
        <div className="rounded-full bg-amber-100 p-2 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <AlertDialogTitle>
          {confirmData?.type === "delete"
            ? "Confirmar eliminación"
            : "Confirmar acción"}
        </AlertDialogTitle>
      </div>

      <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
        {confirmData?.type === "toggle" &&
          (() => {
            const accion = confirmData.currentValue
              ? `quitar el estado "${confirmData.field}"`
              : `${getActionText(confirmData.field)}`;

            return `¿Desea ${accion} el documento "${confirmData.docName}"?`;
          })()}

        {confirmData?.type === "delete" &&
          `¿Desea eliminar el documento "${confirmData.docName}"? Esta acción también quedará registrada en auditoría.`}
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => setConfirmData(null)}>
        Cancelar
      </AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirmAction}>
        Confirmar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </>
  );
}