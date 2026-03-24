"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Layers,
  BarChart3,
  Users,
  ScrollText,
  Shield,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { logout } from "@/app/auth/actions";
import Image from "next/image";

// Submódulos reales de sistema administrativo
const sistemaAdminSubModules = [
  { id: 1, title: "Administración de Talento Humano", href: "/dashboard/sistema-administrativo/sa_talento_humano" },
  { id: 2, title: "Planeación y Programación", href: "/dashboard/sistema-administrativo/sa_planeacion" },
  { id: 3, title: "Presupuesto", href: "/dashboard/sistema-administrativo/sa_presupuesto" },
  { id: 4, title: "Administración Financiera", href: "/dashboard/sistema-administrativo/sa_financiera" },
  { id: 5, title: "Contabilidad Integrada", href: "/dashboard/sistema-administrativo/sa_ConIntegrada" },
  { id: 6, title: "Inversiones en Proyectos y Programa", href: "/dashboard/sistema-administrativo/sa_Invproyec" },
  { id: 7, title: "Tecnología de la Información", href: "/dashboard/sistema-administrativo/sa_TIC" },
];

const porComponentesSubModules = [
  { id: 8, key: "sa_Entornocontrol", title: "Entorno de Control", href: "/dashboard/por-componentes/entorno-control" },
  { id: 9, key: "sa_ERiesgos", title: "Evaluación de Riesgos", href: "/dashboard/por-componentes/evaluacion-riesgos" },
  { id: 10, key: "sa_AControl", title: "Actividades de Control", href: "/dashboard/por-componentes/actividades-control" },
  { id: 11, key: "sa_IyC", title: "Información y Comunicación", href: "/dashboard/por-componentes/Informa-Comuni" },
  { id: 12, key: "sa_ASupervision", title: "Actividades de Supervisión", href: "/dashboard/por-componentes/actividad-supervision" },
];

interface AppSidebarProps {
  user: {
    email: string;
    full_name: string;
    role: string;
  };
}

type MePerms = {
  allowAll: boolean;
  modules: Array<{ ModuleId: number; CanView?: any }>;
  submodules: Array<{ SubModuleId: number; CanView?: any }>;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  const [perms, setPerms] = useState<MePerms | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me/permissions", { cache: "no-store" });
        const data = await res.json();
        setPerms(data);
      } catch {
        setPerms({ allowAll: false, modules: [], submodules: [] });
      }
    })();
  }, []);

  const allowedSubSet = useMemo(() => {
    if (!perms || perms.allowAll) return null;
    return new Set(perms.submodules.map((p) => Number(p.SubModuleId)));
  }, [perms]);

  const allowedModuleSet = useMemo(() => {
    if (!perms || perms.allowAll) return null;
    return new Set(perms.modules.map((m) => Number(m.ModuleId)));
  }, [perms]);

  const visibleSistemaAdminSubs = useMemo(() => {
    if (!perms) return [];
    if (perms.allowAll) return sistemaAdminSubModules;

    return sistemaAdminSubModules.filter((s) => allowedSubSet?.has(Number(s.id)));
  }, [perms, allowedSubSet]);

const visiblePorComponentesSubs = useMemo(() => {
  if (!perms) return [];
  if (perms.allowAll) return porComponentesSubModules;

  return porComponentesSubModules.filter((s) =>
    allowedSubSet?.has(Number(s.id))
  );
}, [perms, allowedSubSet]);

  const canSeeSistemaAdmin = visibleSistemaAdminSubs.length > 0;
const canSeePorComponentes =
  (perms?.allowAll || allowedModuleSet?.has(2) || false) &&
  visiblePorComponentesSubs.length > 0;
  const canSeeInformes = perms?.allowAll || allowedModuleSet?.has(3) || false;
  const canSeePermisos = perms?.allowAll || allowedModuleSet?.has(4) || false;
  const canSeeAuditoria = perms?.allowAll || allowedModuleSet?.has(5) || false;

  return (
    <Sidebar
      collapsible="icon" variant="sidebar" side="left"
    >
  <SidebarHeader className="relative border-b border-sidebar-border p-4">
  <div className="flex items-center justify-center gap-3 w-full">
    <div className="shrink-0">
     {!collapsed && (  <Image
        src="/logoUNCSM.png"
        alt="Logo UNCSM"
        width={150}
        height={150}
        className="rounded-lg object-contain"
      />
)}
          {!collapsed && (
      <div className="flex min-w-0 flex-col">
        <span className="text-sm text-center font-semibold text-sidebar-foreground">DGCI</span>
        <span className="text-xs text-center text-sidebar-foreground/80">
          Sistema de Planificación
        </span>
      </div>
    )}
  </div>
    </div>

</SidebarHeader>

      <SidebarContent className="overflow-y-auto custom-scroll">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Navegación</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span>Panel Principal</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Módulos</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {canSeeSistemaAdmin && (
                <Collapsible defaultOpen={pathname.includes("/sistema-administrativo")}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={pathname.includes("/sistema-administrativo")}>
                        <FileText className="h-4 w-4" />
                        {!collapsed && <span>Sistema Administrativo</span>}
                        {!collapsed && (
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {!collapsed && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {visibleSistemaAdminSubs.map((sub) => (
                            <SidebarMenuSubItem key={sub.href} className="border-b border-white/10 last:border-none">
                              <SidebarMenuSubButton asChild isActive={pathname === sub.href}>
                             <Link
                           href={sub.href}
                           className="block text-[12px] leading-3 whitespace-normal break-words py-2 px-1"
                             title={sub.title}
                             >
                            {sub.title}
                              </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              )}

             {canSeePorComponentes && (
  <Collapsible defaultOpen={pathname.includes("/por-componentes")}>
    <SidebarMenuItem>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton isActive={pathname.includes("/por-componentes")}>
          <Layers className="h-4 w-4" />
          {!collapsed && <span>Por Componentes</span>}
          {!collapsed && (
            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          )}
        </SidebarMenuButton>
      </CollapsibleTrigger>

      {!collapsed && (
        <CollapsibleContent>
          <SidebarMenuSub>
            {visiblePorComponentesSubs.map((sub) => (
              <SidebarMenuSubItem
                key={sub.href}
                className="border-b border-white/10 last:border-none"
              >
                <SidebarMenuSubButton asChild isActive={pathname === sub.href}>
                  <Link
                    href={sub.href}
                    className="block text-[12px] leading-3 whitespace-normal break-words py-2 px-1"
                    title={sub.title}
                  >
                    {sub.title}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      )}
    </SidebarMenuItem>
  </Collapsible>
)}

              {canSeeInformes && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes("/informes")}>
                    <Link href="/dashboard/informes">
                      <BarChart3 className="h-4 w-4" />
                      {!collapsed && <span>Informes</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {canSeePermisos && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes("/permisos")}>
                    <Link href="/dashboard/permisos">
                      <Users className="h-4 w-4" />
                      {!collapsed && <span>Permisos de Usuario</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {canSeeAuditoria && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.includes("/auditoria")}>
                    <Link href="/dashboard/auditoria">
                      <ScrollText className="h-4 w-4" />
                      {!collapsed && <span>Auditoría</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex flex-col gap-3">
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                {user.full_name || user.email}
              </span>
              <span className="text-xs text-sidebar-foreground/60">{user.role}</span>
            </div>
          )}

          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Cerrar Sesión</span>}
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}