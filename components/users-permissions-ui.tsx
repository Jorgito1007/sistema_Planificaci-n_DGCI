"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2,Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  is_active: boolean;
};
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




export function UsersPermissionsUI() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
const [openSubmoduleId, setOpenSubmoduleId] = useState<string | null>(null);

async function openEdit(u: UserRow) {
  setEditTarget(u);

  setForm({
    full_name: u.full_name ?? "",
    email: u.email ?? "",
    password: "",
    role: String(u.role || "").toLowerCase(),
    is_active: !!u.is_active,
  });

  let workingModules: ModuleRow[] = modules ?? [];

  if (workingModules.length === 0) {
    workingModules = await loadModules();
  }

  const ma: Record<string, boolean> = {};
  const sa: Record<string, boolean> = {};
  const pa: Record<string, boolean> = {};
  const qa: Record<string, boolean> = {};

  for (const m of workingModules) {
    ma[String(m.id)] = false;

    for (const s of m.submodules || []) {
      const sk = subKey(String(m.id), String(s.id));
      sa[sk] = false;

      for (const p of s.principles || []) {
        const pk = principleKey(String(m.id), String(s.id), String(p.id));
        pa[pk] = false;
      }

      for (const q of s.questions || []) {
        const qk = questionKey(String(m.id), String(s.id), String(q.id));
        qa[qk] = false;
      }
    }
  }

  const res = await fetch(`/api/admin/users/${u.id}/permissions`, {
    cache: "no-store",
    credentials: "include",
  });

  const data = await res.json();

 if (res.ok) {


  // marcar módulos permitidos
for (const pp of data.principlePermissions || []) {
  const subModuleId = String(pp.SubModuleId ?? pp.subModuleId ?? "");
  const principioId = String(pp.PrincipioId ?? pp.principioId ?? "");

  const canView =
    pp.CanView === true ||
    pp.CanView === 1 ||
    pp.CanView === "1" ||
    pp.canView === true ||
    pp.canView === 1 ||
    pp.canView === "1";

  if (!subModuleId || !principioId || !canView) continue;

  for (const m of workingModules) {
    const moduleId = String(m.id);

    const exists = (m.submodules || []).some(
      (s) => String(s.id) === subModuleId
    );

    if (exists) {
      const pk = principleKey(moduleId, subModuleId, principioId);

      pa[pk] = true;
      sa[subKey(moduleId, subModuleId)] = true;
      ma[moduleId] = true;
    }
  }
}

  // marcar submódulos permitidos
  for (const p of data.permissions || []) {
    const subModuleId = String(
      p.SubModuleId ??
      p.subModuleId ??
      p.submoduleId ??
      p.submoduleid ??
      ""
    );

    const canView =
      p.CanView === true ||
      p.CanView === 1 ||
      p.CanView === "1" ||
      p.canView === true ||
      p.canView === 1 ||
      p.canView === "1";

    if (!subModuleId || !canView) continue;

    for (const m of workingModules) {
      const moduleId = String(m.id);

      const exists = (m.submodules || []).some(
        (s) => String(s.id) === subModuleId
      );

      if (exists) {
        const sk = subKey(moduleId, subModuleId);

        sa[sk] = true;
        ma[moduleId] = true;

        console.log("SUBMODULO MARCADO:", sk);
      }
    }
  }
}
  setModuleAccess(ma);
  setSubmoduleAccess(sa);
  setPrincipleAccess(pa);
  setQuestionAccess(qa);

  const firstAllowedSubmodule =
    Object.entries(sa).find(([, allowed]) => allowed)?.[0] ?? null;

  setOpenSubmoduleId(firstAllowedSubmodule);
  setOpenCreate(true);
}


  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
  cache: "no-store",
  credentials: "include",
});
      const data = await res.json();

      if (!res.ok) {
        console.error("API /users error:", data);
        setUsers([]);
        return;
      }

      setUsers((data.users ?? []) as UserRow[]);
    } finally {
      setLoading(false);
    }
  }

  const [roles, setRoles] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);

async function loadRoles() {
  const res = await fetch("/api/admin/Roles", {
    credentials: "include",
  });

  const data = await res.json();
  console.log("ROLES API:", data);
  if (res.ok) {
    setRoles(data);
  }
}

useEffect(() => {
  loadUsers();
  loadModules();
  loadRoles();
}, []);

useEffect(() => {
  setMounted(true);
}, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users.filter((u) => {
      const matchText =
        !s ||
        (u.email || "").toLowerCase().includes(s) ||
        (u.full_name || "").toLowerCase().includes(s);

      const roleKey = String(u.role || "").toLowerCase();
      const matchRole = roleFilter === "all" ? true : roleKey === roleFilter;

      return matchText && matchRole;
    });
  }, [users, q, roleFilter]);

type PrincipleRow = {
  id: string;
  title: string;
  number: string;
  text: string;
};

type QuestionRow = {
  id: string;
  parentId: string;
  number: string;
  text: string;
};

type ModuleRow = {
  id: string;
  key: string;
  name: string;
  submodules: {
    id: string;
    key: string;
    name: string;

    // Por Componentes
    principles: PrincipleRow[];

    // Matriz Sistema Administrativo
    questions: QuestionRow[];
  }[];
};


// ---- dentro del componente:
const [modules, setModules] = useState<ModuleRow[]>([]);
const [modulesLoading, setModulesLoading] = useState(false);

const [openCreate, setOpenCreate] = useState(false);
const [editTarget, setEditTarget] = useState<UserRow | null>(null);

const [form, setForm] = useState({
  full_name: "",
  email: "",
  password: "",
  role: "asesor",
  is_active: true,
});

const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
const [submoduleAccess, setSubmoduleAccess] = useState<Record<string, boolean>>({});
const [principleAccess, setPrincipleAccess] = useState<Record<string, boolean>>({});
const [questionAccess, setQuestionAccess] = useState<Record<string, boolean>>({});


async function loadModules(): Promise<ModuleRow[]> {
  setModulesLoading(true);
  try {
    const res = await fetch("/api/admin/modules", {
  cache: "no-store",
  credentials: "include",
});
    const text = await res.text();

console.log("RAW RESPONSE:", text);

let data: any = {};

try {
  data = JSON.parse(text);
} catch (e) {
  console.error("NO ES JSON");
}

if (!res.ok) {
  console.error("modules error", data);
  alert(text);
  setModules([]);
  return [];
}
    const mods = (data.modules ?? []) as ModuleRow[];
    setModules(mods);

console.log("MODS COMPLETOS:", mods);
    // inicializar accesos (por defecto denegado)
    const ma: Record<string, boolean> = {};
    const sa: Record<string, boolean> = {};
    const pa: Record<string, boolean> = {};
   for (const m of mods) {
  ma[String(m.id)] = false;

  for (const s of m.submodules || []) {
    const sk = subKey(String(m.id), String(s.id));
    sa[sk] = false;

    for (const p of s.principles || []) {
      const pk = principleKey(String(m.id), String(s.id), String(p.id));
      pa[pk] = false;
    }
  }
}
    setModuleAccess(ma);
    setSubmoduleAccess(sa);
    setPrincipleAccess(pa);
      return mods;
  } finally {

    setModulesLoading(false);
    
  }
      
}


//función de carga de principios por componentes
function togglePrinciple(principleId: string, subId: string, moduleId: string) {
  const sk = subKey(moduleId, subId);
  const pk = principleKey(moduleId, subId, principleId);

  setPrincipleAccess((prev) => ({
    ...prev,
    [pk]: !prev[pk],
  }));

  setSubmoduleAccess((prev) => ({
    ...prev,
    [sk]: true,
  }));

  setModuleAccess((prev) => ({
    ...prev,
    [String(moduleId)]: true,
  }));
}

function toggleModule(moduleId: string) {
  const mod = modules.find((m) => String(m.id) === String(moduleId));
  if (!mod) return;

  setModuleAccess((prevMA) => {
    const turningOn = !prevMA[moduleId];

    if (!turningOn) {
      setSubmoduleAccess((prevSA) => {
        const nextSA = { ...prevSA };

        for (const s of mod.submodules || []) {
          nextSA[subKey(String(moduleId), String(s.id))] = false;
        }

        return nextSA;
      });

      setOpenSubmoduleId(null);
    }

    return { ...prevMA, [moduleId]: turningOn };
  });
}

function questionKey(moduleId: string, subId: string, questionId: string) {
  return `${moduleId}-${subId}-${questionId}`;
}

function toggleQuestion(questionId: string, subId: string, moduleId: string) {
  const sk = subKey(moduleId, subId);
  const qk = questionKey(moduleId, subId, questionId);

  setQuestionAccess((prev) => ({
    ...prev,
    [qk]: !prev[qk],
  }));

  setSubmoduleAccess((prev) => ({
    ...prev,
    [sk]: true,
  }));

  setModuleAccess((prev) => ({
    ...prev,
    [String(moduleId)]: true,
  }));
}

function principleKey(moduleId: string, subId: string, principleId: string) {
  return `${moduleId}-${subId}-${principleId}`;
}

function toggleSubmodule(subId: string, moduleId: string) {
  const sk = subKey(moduleId, subId);

  setSubmoduleAccess((prev) => ({
    ...prev,
    [sk]: !prev[sk],
  }));

  setModuleAccess((prev) => ({
    ...prev,
    [String(moduleId)]: true,
  }));
}

const [missingOpen, setMissingOpen] = useState(false);

const [missingMsg, setMissingMsg] = useState({
  title: "Faltan datos por agregar",
  desc: "Completa Nombre, Correo institucional, Contraseña y Rol.",
});

async function handleCreateUser() {
  // Validación básica
  if (
    !form.full_name.trim() ||
    !form.email.trim() ||
    !form.password.trim() ||
    !form.role.trim()
  ) {
    setMissingMsg({
      title: "Faltan datos por agregar",
      desc: "Completa Nombre, Correo institucional, Contraseña y Rol.",
    });
    setMissingOpen(true);
    return;
  }

  // Validación correo institucional
  if (!form.email.toLowerCase().endsWith("@uncsm.edu.ni")) {
    setMissingMsg({
      title: "Correo inválido",
      desc: "Debe ser un correo institucional @uncsm.edu.ni",
    });
    setMissingOpen(true);
    return;
  }

  // Confirmación (puede quedarse en Swal)
  const confirm = await Swal.fire({
    icon: "question",
    title: "¿Crear usuario?",
    text: "Se guardará el usuario y sus permisos en el sistema.",
    showCancelButton: true,
    confirmButtonText: "Sí, crear",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#16a34a",
    cancelButtonColor: "#64748b",
  });

  if (!confirm.isConfirmed) return;

  try {
  // ✅ construir permisos (solo submódulos en "Permitido")
const permissions = Object.entries(submoduleAccess)
  .filter(([, allowed]) => allowed)
  .map(([subModuleId]) => ({
    subModuleId: Number(subModuleId), // ✅ INT
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  }));


// ✅ payload que el backend espera
const payload = {
  email: form.email.trim(),
  full_name: form.full_name.trim(),
  password: form.password,
  roleKey: form.role,       // ✅ roleKey (no role)
  is_active: form.is_active,
 modules: buildModulesPayload(),
  permissions: buildPermissionsPayload(),
  principles: buildPrinciplesPayload(),//principios
};

console.log("submoduleAccess:", submoduleAccess);
console.log("permissions payload:", permissions);
console.log("payload final:", payload);

const res = await fetch("/api/admin/users/create", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

    const data = await res.json();

    if (!res.ok) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo crear",
        text: data?.error || "Ocurrió un error al crear el usuario.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Usuario creado",
      text: "El usuario fue registrado correctamente.",
      confirmButtonColor: "#16a34a",
    });

    // limpiar form
    setForm({
      full_name: "",
      email: "",
      password: "",
      role: "",
      is_active: true,
    });

    // cerrar modal
    setOpenCreate(false);

    // recargar tabla
    await loadUsers();
  } catch (e: any) {
    await Swal.fire({
      icon: "error",
      title: "Error inesperado",
      text: "No se pudo conectar con el servidor.",
      confirmButtonColor: "#dc2626",
    });
  }
}

// preguntas principios
function buildQuestionsPayload() {
  return Object.entries(questionAccess)
    .filter(([, allowed]) => allowed)
    .map(([key]) => {
      const [, subModuleId, questionId] = key.split("-");

      return {
        subModuleId: Number(subModuleId),
        questionId: Number(questionId),
        canView: true,
        canCreate: false,
        canEdit: true,
        canDelete: false,
      };
    });
}

//Eliminar usuarios

async function handleDeleteUser() {
  if (!deleteTarget) return;

  const confirm = await Swal.fire({
    icon: "warning",
    title: "¿Eliminar usuario?",
    text: `Se eliminará ${deleteTarget.full_name || deleteTarget.email}`,
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: data?.error || "Error al eliminar usuario",
      });

      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Usuario eliminado",
      text: "El usuario fue eliminado correctamente.",
    });

    setDeleteTarget(null);

    await loadUsers();
  } catch (err) {
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo conectar con el servidor.",
    });
  }
}


function buildModulesPayload() {
  return Object.entries(moduleAccess)
    .filter(([_, allowed]) => allowed)
    .map(([moduleId]) => ({
      moduleId: Number(moduleId),
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    }));
}

function buildPermissionsPayload() {
  return Object.entries(submoduleAccess)
    .filter(([, allowed]) => allowed)
    .map(([key]) => {
      const [, subModuleId] = key.split("-");

      return {
        subModuleId: Number(subModuleId),
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      };
    });
}

function buildPrinciplesPayload() {
  return Object.entries(principleAccess)
    .filter(([, allowed]) => allowed)
    .map(([key]) => {
      const [, subModuleId, principleId] = key.split("-");

      return {
        subModuleId: Number(subModuleId),
        principleId: Number(principleId),
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      };
    });
}

function subKey(moduleId: string, subId: string) {
  return `${moduleId}-${subId}`;
}

async function handleUpdateUser() {
  if (!editTarget) return;

  // si no quiere cambiar contraseña, dejarla vacía
 const payload = {
  id: editTarget.id,              // ✅ ESTE ES EL QUE TE FALTA
  email: form.email,
  full_name: form.full_name,
  password: form.password, // null si no cambia
  roleKey: form.role,
  is_active: form.is_active,
  modules: buildModulesPayload(),
  permissions: buildPermissionsPayload(), // subModuleId int + flags
   principles: buildPrinciplesPayload(), // principios
   questions: buildQuestionsPayload(),//preguntas principios
};
  

console.log("SUBMODULE ACCESS:", submoduleAccess);
console.log("PERMISSIONS PAYLOAD:", buildPermissionsPayload());

const res = await fetch(`/api/admin/users/${editTarget.id}`, {
  method: "PUT",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

  const data = await res.json();

  if (!res.ok) {
    await Swal.fire({
      icon: "error",
      title: "No se pudo actualizar",
      text: data?.detail || data?.error || "Error al actualizar",
    });
    return;
  }

  await Swal.fire({
    icon: "success",
    title: "Actualizado",
    text: "El usuario fue actualizado correctamente.",
  });

  setOpenCreate(false);
  setEditTarget(null);
  setForm({ full_name: "", email: "", password: "", role: "", is_active: true });

  await loadUsers();
}

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const adminUsers = users.filter((u) => String(u.role || "").toLowerCase() === "administrador").length;
  const rolesCount = new Set(users.map((u) => String(u.role || "").toLowerCase()).filter(Boolean)).size;

if (!mounted) {
  return null;
}

  return (
    <div className="flex flex-col gap-5">
      {/* Header + button */}
      <div className="flex items-start justify-between gap-3">
   
<Dialog open={openCreate} onOpenChange={setOpenCreate}>
  <DialogTrigger asChild>
<Button
  className="bg-blue-600 hover:bg-blue-700"
  type="button"
  onClick={() => {
    // ✅ modo crear
    setEditTarget(null);

    // ✅ limpiar form
    setForm({
      full_name: "",
      email: "",
      password: "",
      role: "asesor",
      is_active: true,
    });

    // ✅ reset permisos
    const ma: Record<string, boolean> = {};
    const sa: Record<string, boolean> = {};
    const pa: Record<string, boolean> = {};
    const qa: Record<string, boolean> = {};


setModuleAccess(ma);
setSubmoduleAccess(sa);
setPrincipleAccess(pa);
setOpenSubmoduleId(null);
setQuestionAccess(qa);

    // ✅ abrir
    setOpenCreate(true);
  }}
>
  + Nuevo Usuario
</Button>
  </DialogTrigger>

 <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
   <DialogTitle>{editTarget ? "Actualizar Usuario" : "Nuevo Usuario"}</DialogTitle>
    </DialogHeader>

  <div className="grid gap-4">
      {/* fila 1 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Nombre Completo</label>
          <Input
            placeholder="Nombre del usuario"
            value={form.full_name}
            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
          />
        </div>
    <div className="grid gap-2">
          <label className="text-sm font-medium">Correo institucional</label>
          <Input
            type="email"
            placeholder="nombre.apellido@uncsm.edu.ni"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
 
      </div>

      {/* fila 2 */}
      <div className="grid grid-cols-2 gap-4">
    
     <div>
  <label className="mb-2 block text-sm font-medium">
    Contraseña
  </label>

  <div className="relative">
    <Input
      type={showPassword ? "text" : "password"}
      placeholder="Contraseña"
      value={form.password}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          password: e.target.value,
        }))
      }
      className="pr-10"
    />

    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
    >
      {showPassword ? (
        <EyeOff className="h-5 w-5" />
      ) : (
        <Eye className="h-5 w-5" />
      )}
    </button>
  </div>
</div>
           <div className="grid gap-2">
          <label className="text-sm font-medium">Rol</label>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          >
           {roles.map((r) => (
  <option key={r.RoleId} value={r.RoleKey}>
    {r.RoleName}
  </option>
))}
          </select>
        </div>

      </div>

      {/* fila 3 */}
      <div className="grid grid-cols-2 gap-4">
     
        <div className="grid gap-2">
          <label className="text-sm font-medium">Estado</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                form.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              }`}
            >
              {form.is_active ? "Activo" : "Inactivo"}
            </button>
          </div>
        </div>
      </div>

      {/* Permisos */}
     <div className="grid gap-2">
        <div className="text-sm font-semibold">Permisos de Módulos</div>

        <div className="rounded-lg border overflow-hidden">
          {modulesLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Cargando módulos...</div>
      ) : modules.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No hay módulos. Revisa <code>/api/admin/modules</code>.
            </div>
          ) : (
           <div className="divide-y">
              {modules.map((m) => {
                const allowed = !!moduleAccess[m.id];
                return (
                  <div key={m.id}>
                    {/* fila módulo */}
                    <div className={`flex items-center justify-between p-3 ${allowed ? "bg-emerald-50" : "bg-white"}`}>
                      <div className="font-medium">{m.name}</div>
                      <button
                        type="button"
                        onClick={() => toggleModule(m.id)}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          allowed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {allowed ? "Permitido" : "Denegado"}
                      </button>
                    </div>

                    {/* submódulos (solo si módulo permitido) */}
                    
              {allowed && (m.submodules?.length ?? 0) > 0 && (
  <div className="bg-white">
    {m.submodules.map((s) => {


 const sk = subKey(m.id, s.id);
  const sAllowed = !!submoduleAccess[sk];


      return (
        <div key={`submodule-${m.id}-${s.id}`} className="border-t">
          <div className="flex items-center justify-between px-5 py-2">
            <div className="text-sm text-slate-700">{s.name}</div>

          <button
  type="button"
 onClick={() => {
  const wasAllowed = !!submoduleAccess[sk];

  toggleSubmodule(s.id, m.id);

  if (!wasAllowed) {
    setOpenSubmoduleId(sk);
  } else {
    setOpenSubmoduleId(null);
  }
}}
  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
    sAllowed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
  }`}
>
  {sAllowed ? "Permitido" : "Denegado"}
</button>
          </div>

          {sAllowed && openSubmoduleId === sk && (s.principles?.length ?? 0) > 0 && (
            <div className="bg-slate-50 px-8 py-3 space-y-2">
              {s.principles.map((p) => {
                const pk = principleKey(m.id, s.id, p.id);
const pAllowed = !!principleAccess[pk];

                return (
                  <div
                    key={`principle-${s.id}-${p.id}`}
                    className="flex items-start justify-between gap-3 rounded-md border bg-white px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {p.title}
                      </div>

                      <div className="text-xs text-slate-500">
                        {p.number}. {p.text}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePrinciple(p.id, s.id, m.id)}
                      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        pAllowed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {pAllowed ? "Permitido" : "Denegado"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Preguntas */}

{sAllowed && openSubmoduleId === sk && (s.questions?.length ?? 0) > 0 && (
  <div className="bg-slate-50 px-8 py-3 space-y-2">
    {s.questions.map((q) => {
      const qk = questionKey(m.id, s.id, q.id);
      const qAllowed = !!questionAccess[qk];

      return (
        <div
          key={`question-${s.id}-${q.id}`}
          className="flex items-start justify-between gap-3 rounded-md border bg-white px-3 py-2"
        >
          <div>
            <div className="text-sm font-medium text-slate-800">
              Pregunta {q.number}
            </div>

            <div className="text-xs text-slate-500">
              {q.text}
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleQuestion(q.id, s.id, m.id)}
            className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
              qAllowed
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {qAllowed ? "Permitido" : "Denegado"}
          </button>
        </div>
      );
    })}
  </div>
)}
        </div>
      );
    })}
  </div>

  
)}


                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
    </div>

    <div className="flex justify-end gap-3 pt-4">
      <Button variant="outline" onClick={() => setOpenCreate(false)}>
        Cancelar
      </Button>
    <Button
  className="bg-blue-600 hover:bg-blue-700"
  onClick={editTarget ? handleUpdateUser : handleCreateUser}
>
  {editTarget ? "Actualizar Usuario" : "Crear Usuario"}
</Button>
    </div>
  </DialogContent>
</Dialog>
</div>

      

      {/* Stats cards */}
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Card className="border-l-4 border-l-blue-600">
    <CardContent className="p-5">
      <div className="text-sm text-muted-foreground">Total Usuarios</div>
      <div className="text-2xl font-bold text-blue-700">{totalUsers}</div>
    </CardContent>
  </Card>

  <Card className="border-l-4 border-l-emerald-600">
    <CardContent className="p-5">
      <div className="text-sm text-muted-foreground">Activos</div>
      <div className="text-2xl font-bold text-emerald-700">{activeUsers}</div>
    </CardContent>
  </Card>

  <Card className="border-l-4 border-l-violet-600">
    <CardContent className="p-5">
      <div className="text-sm text-muted-foreground">Roles</div>
      <div className="text-2xl font-bold text-violet-700">{rolesCount}</div>
    </CardContent>
  </Card>
</div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre o usuario..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

 <select
  className="h-10 w-full md:w-56 rounded-md border bg-background px-3 text-sm"
  value={roleFilter}
  onChange={(e) => setRoleFilter(e.target.value)}
>
  <option value="all">Todos los roles</option>

  {roles.map((r) => (
    <option key={r.RoleId} value={r.RoleKey}>
      {r.RoleName}
    </option>
  ))}
</select>
      </div>

      {/* List title */}
      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold">Listado de Usuarios ({filtered.length})</div>
     
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
  <thead className="bg-slate-50 text-slate-600">
    <tr>
      <th className="px-4 py-3 text-left font-semibold">Correo</th>
      <th className="px-4 py-3 text-left font-semibold">Nombre Completo</th>
      <th className="px-4 py-3 text-left font-semibold">Rol</th>
      <th className="px-4 py-3 text-left font-semibold">Estado</th>
      <th className="px-4 py-3 text-left font-semibold">Acciones</th>
    </tr>
  </thead>


  <tbody className="divide-y">
  {loading ? (
    <tr>
      <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
        Cargando usuarios...
      </td>
    </tr>
  ) : filtered.length === 0 ? (
    <tr>
      <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
        No hay usuarios para mostrar.
      </td>
    </tr>
  ) : (
    filtered.map((u) => {
      const roleKey = String(u.role || "").toLowerCase();

      return (
        <tr key={u.id} className="hover:bg-slate-50 transition">
          <td className="px-4 py-3">{u.email}</td>

          <td className="px-4 py-3 font-medium">{u.full_name || "-"}</td>

          <td className="px-4 py-3">
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium">
  {u.role || "-"}
</span>
          </td>

          <td className="px-4 py-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                u.is_active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {u.is_active ? "Activo" : "Inactivo"}
            </span>
          </td>

          {/* ✅ ACCIONES (va DENTRO del <tr>) */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
<button
  onClick={() => openEdit(u)}
  type="button"
  className="text-blue-600 hover:text-blue-800"
  title="Editar"
>
  <Pencil className="h-4 w-4" />
</button>
              <button
                className="text-red-600 hover:text-red-800"
                title="Eliminar"
                onClick={() => setDeleteTarget(u)}
                type="button"
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

<AlertDialog open={missingOpen} onOpenChange={setMissingOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{missingMsg.title}</AlertDialogTitle>
      <AlertDialogDescription>{missingMsg.desc}</AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogAction
        className="bg-blue-600 hover:bg-blue-700"
        onClick={() => setMissingOpen(false)}
      >
        Entendido
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

<AlertDialog
  open={!!deleteTarget}
  onOpenChange={(open) => {
    if (!open) setDeleteTarget(null);
  }}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        ¿Eliminar usuario?
      </AlertDialogTitle>

      <AlertDialogDescription>
        Esta acción eliminará permanentemente el usuario{" "}
        <strong>
          {deleteTarget?.full_name || deleteTarget?.email}
        </strong>.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel>
        Cancelar
      </AlertDialogCancel>

      <AlertDialogAction
        className="bg-red-600 hover:bg-red-700"
        onClick={handleDeleteUser}
      >
        Eliminar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

        </div>
      </div>
    </div>
  );
}