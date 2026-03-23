"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
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

const ROLE_LABEL: Record<string, string> = {
  administrador: "Administrador",
  director: "Director",
  asesor: "Asesor",
};

export function UsersPermissionsUI() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);


async function openEdit(u: UserRow) {
  setEditTarget(u);

  // llenar campos
  setForm({
    full_name: u.full_name ?? "",
    email: u.email ?? "",
    password: "",
    role: String(u.role || "").toLowerCase(),
    is_active: !!u.is_active,
  });

  // ✅ esperar a que modules estén cargados
  if (!modules || modules.length === 0) {
    await loadModules();
  }

  // reset permisos a false
  const ma: Record<string, boolean> = {};
  const sa: Record<string, boolean> = {};

  for (const m of modules) {
    ma[String(m.id)] = false;
    for (const s of m.submodules || []) sa[String(s.id)] = false;
  }
console.log("EDIT USER:", { id: u.id, email: u.email });
  // traer permisos reales
  const res = await fetch(`/api/admin/users/${u.id}/permissions`, { cache: "no-store" });
  const data = await res.json();

  console.log("PERMISSIONS API:", data); // ✅ mira esto en consola

 if (res.ok) {
    console.log("Permisos desde API:", data.permissions);
  for (const p of data.permissions || []) {
    const canView =
      p.CanView === true ||
      p.CanView === 1 ||
      p.CanView === "1";

    if (canView) {
      sa[String(p.SubModuleId)] = true;
    }
  }

  // activar módulo si tiene al menos 1 submódulo activo
  for (const m of modules) {
    const hasAny = (m.submodules || []).some((s) => sa[String(s.id)]);
    ma[String(m.id)] = hasAny;
  }
}

  setSubmoduleAccess(sa);
  setModuleAccess(ma);

  setOpenCreate(true);
}
  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
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

  

useEffect(() => {
  loadUsers();
  loadModules();
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

type ModuleRow = {
  id: string;
  key: string;
  name: string;
  submodules: { id: string; key: string; name: string }[];
};

const ROLE_OPTIONS = [
  { value: "administrador", label: "Administrador" },
  { value: "director", label: "Director" },
  { value: "asesor", label: "Asesor" },
] as const;

function normRoleLabel(role: string | null) {
  const k = String(role || "").toLowerCase();
  return ROLE_LABEL[k] ?? (role || "-");
}

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

async function loadModules() {
  setModulesLoading(true);
  try {
    const res = await fetch("/api/admin/modules", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      console.error("modules error", data);
      setModules([]);
      return;
    }
    const mods = (data.modules ?? []) as ModuleRow[];
    setModules(mods);

    // inicializar accesos (por defecto denegado)
    const ma: Record<string, boolean> = {};
    const sa: Record<string, boolean> = {};
    for (const m of mods) {
      ma[m.id] = false;
      for (const s of m.submodules || []) sa[s.id] = false;
    }
    setModuleAccess(ma);
    setSubmoduleAccess(sa);
  } finally {
    setModulesLoading(false);
  }
}

function toggleModule(moduleId: string) {
  const mod = modules.find((m) => String(m.id) === String(moduleId));
  if (!mod) return;

  setModuleAccess((prevMA) => {
    const turningOn = !prevMA[moduleId];

    // sincroniza submódulos en el mismo click
    setSubmoduleAccess((prevSA) => {
      const nextSA = { ...prevSA };

      if (turningOn) {
        // ✅ encender módulo => encender TODOS sus submódulos
        for (const s of mod.submodules || []) nextSA[String(s.id)] = true;
      } else {
        // ✅ apagar módulo => apagar TODOS sus submódulos
        for (const s of mod.submodules || []) nextSA[String(s.id)] = false;
      }

      return nextSA;
    });

    return { ...prevMA, [moduleId]: turningOn };
  });
}


function toggleSubmodule(subId: string, moduleId: string) {
  setSubmoduleAccess((prev) => {
    const next = { ...prev, [String(subId)]: !prev[String(subId)] };
    return next;
  });

  // ✅ si prende un submódulo, prende el módulo
  setModuleAccess((prev) => ({ ...prev, [String(moduleId)]: true }));
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
};

console.log("submoduleAccess:", submoduleAccess);
console.log("permissions payload:", permissions);
console.log("payload final:", payload);

const res = await fetch("/api/admin/users/create", {
  method: "POST",
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
    .map(([subModuleId]) => ({
      subModuleId: Number(subModuleId), // INT
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    }));
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
};
  
console.log("SUBMODULE ACCESS:", submoduleAccess);
console.log("PERMISSIONS PAYLOAD:", buildPermissionsPayload());

const res = await fetch(`/api/admin/users/${editTarget.id}`, {
  method: "PUT",
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
    for (const m of modules) {
      ma[String(m.id)] = false;
      for (const s of m.submodules || []) sa[String(s.id)] = false;
    }
    setModuleAccess(ma);
    setSubmoduleAccess(sa);

    // ✅ abrir
    setOpenCreate(true);
  }}
>
  + Nuevo Usuario
</Button>
  </DialogTrigger>

 <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
    
        <div className="grid gap-2">
          <label className="text-sm font-medium">Contraseña</label>
          <Input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
        </div>
           <div className="grid gap-2">
          <label className="text-sm font-medium">Rol</label>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
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
                          const sAllowed = !!submoduleAccess[s.id];
                          return (
                            <div key={s.id} className="flex items-center justify-between px-5 py-2 border-t">
                              <div className="text-sm text-slate-700">{s.name}</div>
                              <button
                                type="button"
                                onClick={() => toggleSubmodule(s.id, m.id)}
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                  sAllowed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                }`}
                              >
                                {sAllowed ? "Permitido" : "Denegado"}
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
          <option value="administrador">Administrador</option>
          <option value="director">Director</option>
          <option value="asesor">Asesor</option>
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
              {ROLE_LABEL[roleKey] ?? (u.role || "-")}
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
        </div>
      </div>
    </div>
  );
}