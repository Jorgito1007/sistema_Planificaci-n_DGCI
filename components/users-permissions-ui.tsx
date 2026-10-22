"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Eye, EyeOff, KeyRound, Lock, Unlock, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { escapeHtml } from "@/lib/sanitize-html";

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
const [resettingUserId, setResettingUserId] = useState<string | null>(null);
const [changingStatusUserId, setChangingStatusUserId] = useState<string | null>(null);
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

const router = useRouter();
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

// ============================================================
// REINICIAR CONTRASEÑA
// ============================================================

async function handleResetPassword(u: UserRow) {
  const nombre = u.full_name || u.email;

  const confirm = await Swal.fire({
    icon: "warning",
    title: "¿Reiniciar contraseña?",
    html: `
      <div style="text-align:left;line-height:1.6">
        <p>Se generará una <strong>nueva contraseña temporal</strong> para:</p>
        <p style="margin-top:8px"><strong>${escapeHtml(nombre)}</strong></p>
        <p>${escapeHtml(u.email)}</p>
        <p style="margin-top:12px">
          La contraseña será enviada al correo institucional y el usuario
          deberá cambiarla en su próximo inicio de sesión.
        </p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Sí, reiniciar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#c7a97a",
    cancelButtonColor: "#64748b",
  });

  if (!confirm.isConfirmed) return;

  try {
    setResettingUserId(u.id);

    const res = await fetch(`/api/admin/users/${u.id}/reset-password`, {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data?.detail ||
          data?.error ||
          "No se pudo reiniciar la contraseña."
      );
    }

    if (data.emailSent === false) {
      await Swal.fire({
        icon: "warning",
        title: "Contraseña reiniciada",
        text:
          data?.warning ||
          "La contraseña temporal fue generada, pero no se pudo enviar el correo al usuario.",
        confirmButtonColor: "#c7a97a",
      });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Contraseña reiniciada",
      html: `
        <p>Se generó una nueva contraseña temporal.</p>
        <p style="margin-top:8px">
          Las nuevas credenciales fueron enviadas a
          <strong>${escapeHtml(u.email)}</strong>.
        </p>
      `,
      confirmButtonColor: "#16a34a",
    });
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: "No se pudo reiniciar",
      text:
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado.",
      confirmButtonColor: "#dc2626",
    });
  } finally {
    setResettingUserId(null);
  }
}

// ============================================================
// BLOQUEAR / DESBLOQUEAR USUARIO
// ============================================================

async function handleToggleUserStatus(u: UserRow) {
  const bloquear = u.is_active;
  const nombre = u.full_name || u.email;

  const confirm = await Swal.fire({
    icon: bloquear ? "warning" : "question",
    title: bloquear ? "¿Bloquear usuario?" : "¿Desbloquear usuario?",
    html: bloquear
      ? `
          <div style="line-height:1.6">
            <p><strong>${nombre}</strong> no podrá ingresar al SCI mientras permanezca bloqueado.</p>
          </div>
        `
      : `
          <div style="line-height:1.6">
            <p><strong>${nombre}</strong> volverá a tener acceso al SCI según los permisos asignados.</p>
          </div>
        `,
    showCancelButton: true,
    confirmButtonText: bloquear ? "Sí, bloquear" : "Sí, desbloquear",
    cancelButtonText: "Cancelar",
    confirmButtonColor: bloquear ? "#d97706" : "#16a34a",
    cancelButtonColor: "#64748b",
  });

  if (!confirm.isConfirmed) return;

  try {
    setChangingStatusUserId(u.id);

    const res = await fetch(`/api/admin/users/${u.id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        is_active: !u.is_active,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data?.detail ||
          data?.error ||
          (bloquear
            ? "No se pudo bloquear el usuario."
            : "No se pudo desbloquear el usuario.")
      );
    }

    await Swal.fire({
      icon: "success",
      title: bloquear ? "Usuario bloqueado" : "Usuario desbloqueado",
      text: bloquear
        ? "El usuario ya no podrá ingresar al sistema."
        : "El usuario puede volver a ingresar al sistema.",
      confirmButtonColor: bloquear ? "#d97706" : "#16a34a",
    });

    await loadUsers();
  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: bloquear ? "No se pudo bloquear" : "No se pudo desbloquear",
      text:
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado.",
      confirmButtonColor: "#dc2626",
    });
  } finally {
    setChangingStatusUserId(null);
  }
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
   <Button
  type="button"
  onClick={() =>
    router.push(
      "/dashboard/permisos/usuario/nuevo"
    )
  }
  className="
    h-10
    rounded-xl
    bg-blue-600
    px-5
    font-semibold
    text-white
    shadow-sm
    transition-all
    hover:-translate-y-0.5
    hover:bg-blue-700
  "
>
  + Nuevo Usuario
</Button>

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
            <div className="flex items-center gap-2">
              {/* EDITAR */}
              <button
                onClick={() =>
                  router.push(
                    `/dashboard/permisos/usuario/${u.id}/editar`
                  )
                }
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100 hover:text-blue-800"
                title="Editar usuario"
              >
                <Pencil className="h-4 w-4" />
              </button>

              {/* REINICIAR CONTRASEÑA */}
              <button
                type="button"
                disabled={resettingUserId === u.id}
                onClick={() => handleResetPassword(u)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 transition hover:bg-amber-100 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
                title="Reiniciar contraseña"
              >
                {resettingUserId === u.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
              </button>

              {/* BLOQUEAR / DESBLOQUEAR */}
              <button
                type="button"
                disabled={changingStatusUserId === u.id}
                onClick={() => handleToggleUserStatus(u)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  u.is_active
                    ? "bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-800"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800"
                }`}
                title={u.is_active ? "Bloquear usuario" : "Desbloquear usuario"}
              >
                {changingStatusUserId === u.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : u.is_active ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </button>

              {/* ELIMINAR */}
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-800"
                title="Eliminar usuario"
                onClick={() => setDeleteTarget(u)}
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