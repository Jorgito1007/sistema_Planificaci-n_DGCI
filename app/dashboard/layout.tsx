import React from "react";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";

import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

import { NotificationProvider } from "@/context/NotificationContext";

import { getCurrentUser } from "@/lib/current-user";

import AvisoSistemaModal from "@/components/AvisoSistemaModal";

// ============================================================
// TIPO USUARIO PARA SIDEBAR / TOPBAR
// ============================================================

type SidebarUser = {
  email: string;
  full_name: string;
  role: string;
};

// ============================================================
// DASHBOARD LAYOUT
// ============================================================

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ==========================================================
  // 1. OBTENER USUARIO ACTUAL
  // ==========================================================

  /*
   * getCurrentUser() ya se encarga de:
   *
   * - auth_token
   * - Auth.js / Google
   * - verificar JWT
   * - consultar Usuarios_Dgci
   * - comprobar IsActive = 1
   * - obtener rol actualizado
   * - obtener cargo actualizado
   * - obtener MustChangePassword
   */

  const currentUser =
    await getCurrentUser();

  // ==========================================================
  // 2. USUARIO NO AUTORIZADO / BLOQUEADO
  // ==========================================================

  /*
   * Si el administrador bloqueó al usuario:
   *
   * Usuarios_Dgci.IsActive = 0
   *
   * getCurrentUser() devolverá null.
   */

  if (!currentUser) {
    redirect(
      "/auth/login?error=Usuario no autorizado o bloqueado"
    );
  }

  // ==========================================================
  // 3. CAMBIO OBLIGATORIO DE CONTRASEÑA
  // ==========================================================

  /*
   * Un usuario con contraseña temporal NO puede
   * acceder al dashboard aunque escriba directamente:
   *
   * /dashboard
   *
   * Primero deberá cambiar su contraseña.
   */

  if (
    currentUser.mustChangePassword
  ) {
    redirect(
      "/auth/cambiar-contrasena"
    );
  }

  // ==========================================================
  // 4. DATOS PARA SIDEBAR Y TOPBAR
  // ==========================================================

  const user: SidebarUser = {
    email:
      currentUser.email,

    full_name:
      currentUser.full_name,

    /*
     * Conservamos RoleName porque tu interfaz actual
     * ya utiliza user.role.
     */
    role:
      currentUser.role,
  };

  // ==========================================================
  // 5. RENDERIZAR DASHBOARD
  // ==========================================================

  return (
    <NotificationProvider>

      <SidebarProvider
        defaultOpen={true}
        className="
          [--sidebar-width:20rem]
          [--sidebar-width-icon:4rem]
        "
      >

        {/* SIDEBAR */}

        <AppSidebar
          user={user}
        />


        {/* CONTENIDO */}

        <SidebarInset
          className="
            min-w-0
            bg-slate-50
          "
        >

          {/* TOPBAR */}

          <Topbar
            user={user}
          />


          {/* AVISOS */}

          <AvisoSistemaModal />


          {/* CONTENIDO DE LAS PÁGINAS */}

          <main
            className="
              h-[calc(100vh-3.5rem)]
              overflow-auto
              p-4
            "
          >

            <div
              className="
                w-full
                min-w-0
              "
            >
              {children}
            </div>

          </main>

        </SidebarInset>

      </SidebarProvider>

    </NotificationProvider>
  );
}