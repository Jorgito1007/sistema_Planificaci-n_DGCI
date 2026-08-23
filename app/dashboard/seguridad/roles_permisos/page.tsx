

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FolderTree,
  Users,
  Layers3,
  LockKeyhole,
} from "lucide-react";

type Permiso = {
  UserId: string;
  FullName: string;
  RoleName: string | null;
  ModuleName: string | null;
  SubModuleName: string | null;
};

type UsuarioAgrupado = {
  UserId: string;
  FullName: string;
    RoleName: string | null;
  modulos: {
    ModuleName: string;
    submodulos: string[];
  }[];
};

export default function InformePermisosUsuarios() {
  const [data, setData] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuariosAbiertos, setUsuariosAbiertos] = useState<string[]>([]);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      const res = await fetch("/api/informes/permisos-usuarios");

      const json = await res.json();

      setData(json);
    } catch (error) {
      console.error("Error cargando permisos:", error);
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // AGRUPAR USUARIOS
  // =====================================================

  const usuarios: UsuarioAgrupado[] = Object.values(
    data.reduce<Record<string, UsuarioAgrupado>>((acc, item) => {
    if (!acc[item.UserId]) {
  acc[item.UserId] = {
    UserId: item.UserId,
    FullName: item.FullName,
    RoleName: item.RoleName,
    modulos: [],
  };
}

      const nombreModulo = item.ModuleName || "Sin módulo";

      let modulo = acc[item.UserId].modulos.find(
        (m) => m.ModuleName === nombreModulo
      );

      if (!modulo) {
        modulo = {
          ModuleName: nombreModulo,
          submodulos: [],
        };

        acc[item.UserId].modulos.push(modulo);
      }

      if (
        item.SubModuleName &&
        !modulo.submodulos.includes(item.SubModuleName)
      ) {
        modulo.submodulos.push(item.SubModuleName);
      }

      return acc;
    }, {})
  );

  // =====================================================
  // ABRIR / CERRAR USUARIO
  // =====================================================

  function toggleUsuario(userId: string) {
    setUsuariosAbiertos((actuales) =>
      actuales.includes(userId)
        ? actuales.filter((id) => id !== userId)
        : [...actuales, userId]
    );
  }




// =====================================================
// TOTALES ÚNICOS
// =====================================================
  const totalUsuarios = usuarios.length;

const totalModulos = new Set(
  data
    .map((item) => item.ModuleName)
    .filter(Boolean)
).size;

const totalSubmodulos = new Set(
  data
    .map((item) => item.SubModuleName)
    .filter(Boolean)
).size;
  return (
    <div className="space-y-6">

      {/* =================================================
          ENCABEZADO
      ================================================= */}

      <Card className="overflow-hidden border-0 shadow-lg">

        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 px-6 py-7 text-white">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-sm">
              <LockKeyhole className="h-7 w-7 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Informe de Permisos
              </h1>

              <p className="mt-1 text-sm text-blue-100">
                Usuarios, módulos,roles y submódulos asignados
              </p>
            </div>

          </div>

        </div>

        {/* =================================================
            RESUMEN
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 bg-slate-50 p-5 sm:grid-cols-3">

          {/* USUARIOS */}

          <div className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Usuarios
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {totalUsuarios}
              </p>
            </div>

          </div>

          {/* MODULOS */}

          <div className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
              <Layers3 className="h-5 w-5 text-indigo-600" />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Módulos
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {totalModulos}
              </p>
            </div>

          </div>

          {/* SUBMODULOS */}

          <div className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
              <FolderTree className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Submódulos
              </p>

              <p className="text-2xl font-bold text-slate-800">
                {totalSubmodulos}
              </p>
            </div>

          </div>

        </div>

      </Card>

      {/* =================================================
          LISTADO
      ================================================= */}

      <Card className="border-0 shadow-lg">

        <CardHeader className="border-b bg-white">

          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            Usuarios con permisos asignados
          </CardTitle>

        </CardHeader>

        <CardContent className="p-0">

          {loading ? (

            <div className="flex items-center justify-center py-12">

              <div className="flex items-center gap-3 text-slate-500">

                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />

                <span>
                  Cargando permisos...
                </span>

              </div>

            </div>

          ) : usuarios.length === 0 ? (

            <div className="py-12 text-center text-slate-500">
              No se encontraron permisos asignados.
            </div>

          ) : (

            <div className="divide-y">

              {usuarios.map((usuario) => {

                const abierto =
                  usuariosAbiertos.includes(usuario.UserId);

                const cantidadSubmodulos =
                  usuario.modulos.reduce(
                    (total, modulo) =>
                      total + modulo.submodulos.length,
                    0
                  );

                return (

                  <div
                    key={usuario.UserId}
                    className="transition-colors hover:bg-slate-50/70"
                  >

                    {/* ====================================
                        USUARIO
                    ==================================== */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleUsuario(usuario.UserId)
                      }
                      className="group flex w-full items-center gap-4 px-6 py-4 text-left"
                    >

                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                          abierto
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                            : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                        }`}
                      >

                        {abierto ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}

                      </div>

                     <div className="flex-1">

  <div className="flex flex-wrap items-center gap-2">

    <p className="font-semibold text-slate-800">
      {usuario.FullName}
    </p>

    {usuario.RoleName && (
      <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-red-700 shadow-sm">
        {usuario.RoleName}
      </span>
    )}

  </div>

  <p className="mt-1 text-xs text-slate-500">
    {usuario.modulos.length}{" "}
    {usuario.modulos.length === 1
      ? "módulo"
      : "módulos"}{" "}
    · {cantidadSubmodulos}{" "}
    {cantidadSubmodulos === 1
      ? "submódulo"
      : "submódulos"}
  </p>

</div>

                      <div className="hidden rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 sm:block">

                        {usuario.modulos.length}{" "}
                        {usuario.modulos.length === 1
                          ? "Módulo"
                          : "Módulos"}

                      </div>

                    </button>

                    {/* ====================================
                        MODULOS
                    ==================================== */}

                    {abierto && (

                      <div className="border-t bg-gradient-to-br from-slate-50 to-indigo-50/30 px-6 py-5">

                        <div className="space-y-3 pl-4 sm:pl-14">

                          {usuario.modulos.map(
                            (modulo, moduloIndex) => (

                              <div
                                key={modulo.ModuleName}
                                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
                              >

                                {/* MODULO */}

                                <div className="flex items-center gap-3 border-b px-4 py-3">

                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">

                                    <Layers3 className="h-5 w-5 text-indigo-600" />

                                  </div>

                                  <div className="flex-1">

                                    <p className="font-semibold text-slate-800">
                                      {modulo.ModuleName}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                      Módulo {moduloIndex + 1}
                                    </p>

                                  </div>

                                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">

                                    {modulo.submodulos.length}{" "}
                                    {modulo.submodulos.length === 1
                                      ? "submódulo"
                                      : "submódulos"}

                                  </span>

                                </div>

                                {/* SUBMODULOS */}

                                {modulo.submodulos.length > 0 && (

                                  <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">

                                    {modulo.submodulos.map(
                                      (submodulo) => (

                                        <div
                                          key={submodulo}
                                          className="group flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5 transition-all hover:border-emerald-200 hover:bg-emerald-50"
                                        >

                                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 group-hover:bg-emerald-200">

                                            <ShieldCheck className="h-4 w-4 text-emerald-600" />

                                          </div>

                                          <span className="text-sm text-slate-700">
                                            {submodulo}
                                          </span>

                                        </div>

                                      )
                                    )}

                                  </div>

                                )}

                              </div>

                            )
                          )}

                        </div>

                      </div>

                    )}

                  </div>

                );
              })}

            </div>

          )}

        </CardContent>

      </Card>

    </div>
  );
}

