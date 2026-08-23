"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Layers,
  BarChart3,
  Users,
  Shield,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
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

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";



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
  { id: 8, title: "Entorno de Control", href: "/dashboard/por-componentes/entorno-control" },
  { id: 9, title: "Evaluación de Riesgos", href: "/dashboard/por-componentes/evaluacion-riesgos" },
  { id: 10, title: "Actividades de Control", href: "/dashboard/por-componentes/actividades-control" },
  { id: 11, title: "Información y Comunicación", href: "/dashboard/por-componentes/Informa-Comuni" },
  { id: 12, title: "Actividades de Supervisión", href: "/dashboard/por-componentes/actividad-supervision" },
  { id: 13, title: "Resultados", href: "/dashboard/por-componentes/Resultados" },
  { id: 14, title: "Preguntas sin Responder", href: "/dashboard/por-componentes/Preguntas_Sresponder" },
  { id: 15, title: "Plan de Acción", href: "/dashboard/por-componentes/Plan_Accion" },
];

const matrizSistemaAdminSubModules = [
  { id: 16, title: "Administración de Talento Humano", href: "/dashboard/matriz_sa/ma_talento_humano" },
  { id: 17, title: "Planeación y Programación", href: "/dashboard/matriz_sa/ma_planeacion" },
  { id: 18, title: "Presupuesto", href: "/dashboard/matriz_sa/ma_presupuesto" },
  { id: 19, title: "Administración Financiera", href: "/dashboard/matriz_sa/ma_financiera" },
  { id: 20, title: "Contabilidad Integrada", href: "/dashboard/matriz_sa/ma_ConIntegrada" },
  { id: 21, title: "Contratación y Administración de Bienes y Servicios", href: "/dashboard/matriz_sa/ma_contbys" },
  { id: 22, title: "Tecnología de la Información", href: "/dashboard/matriz_sa/ma_TIC" },
  { id: 23, title: "Inversiones en Programas y Proyectos", href: "/dashboard/matriz_sa/ma_InvPoyect" },
  { id: 24, title: "Resultados", href: "/dashboard/matriz_sa/Resultados" },
  { id: 25, title: "Preguntas sin Responder", href: "/dashboard/matriz_sa/Preguntas_Sresponder" },
  { id: 26, title: "Plan de Acción", href: "/dashboard/matriz_sa/Plan_Accion" },
];

const seguridadSubModules = [
  { id: 27, title: "Roles y Permisos", href: "/dashboard/seguridad/roles_permisos" },
  { id: 28, title: "Auditoria del Sistema", href: "/dashboard/seguridad/auditoria_datos" },
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
    async function loadPermissions() {
      try {
        const res = await fetch("/api/me/permissions", { cache: "no-store" });
        const data = await res.json();

        setPerms({
          allowAll: Boolean(data?.allowAll),
          modules: Array.isArray(data?.modules) ? data.modules : [],
          submodules: Array.isArray(data?.submodules) ? data.submodules : [],
        });
      } catch {
        setPerms({ allowAll: false, modules: [], submodules: [] });
      }
    }

    loadPermissions();
  }, []);

  const allowedSubSet = useMemo(() => {
    if (!perms || perms.allowAll) return new Set<number>();
    return new Set((perms.submodules ?? []).map((p) => Number(p.SubModuleId)));
  }, [perms]);

  const allowedModuleSet = useMemo(() => {
    if (!perms || perms.allowAll) return new Set<number>();
    return new Set((perms.modules ?? []).map((m) => Number(m.ModuleId)));
  }, [perms]);

  const visibleSistemaAdminSubs = useMemo(() => {
    if (!perms) return [];
    if (perms.allowAll) return sistemaAdminSubModules;
    return sistemaAdminSubModules.filter((s) => allowedSubSet.has(Number(s.id)));
  }, [perms, allowedSubSet]);

  const visiblePorComponentesSubs = useMemo(() => {
    if (!perms) return [];
    if (perms.allowAll) return porComponentesSubModules;
    return porComponentesSubModules.filter((s) => allowedSubSet.has(Number(s.id)));
  }, [perms, allowedSubSet]);

  const visibleMatrizSistemaAdminSubs = useMemo(() => {
    if (!perms) return [];
    if (perms.allowAll) return matrizSistemaAdminSubModules;
    return matrizSistemaAdminSubModules.filter((s) => allowedSubSet.has(Number(s.id)));
  }, [perms, allowedSubSet]);

  const visibleSeguridadSubs = useMemo(() => {
  if (!perms) return [];

  if (perms.allowAll) return seguridadSubModules;

  return seguridadSubModules.filter((s) =>
    allowedSubSet.has(Number(s.id))
  );
}, [perms, allowedSubSet, seguridadSubModules]);

  const canSeeSistemaAdmin = visibleSistemaAdminSubs.length > 0;

  const canSeePorComponentes =
    (perms?.allowAll || allowedModuleSet.has(2)) &&
    visiblePorComponentesSubs.length > 0;

  const canSeeInformes =
    perms?.allowAll || allowedModuleSet.has(3) || false;

  const canSeePermisos =
    perms?.allowAll || allowedModuleSet.has(4) || false;

    
  const canSeeAvisos =
    perms?.allowAll || allowedModuleSet.has(5) || false;

  const canSeeMatrizSistemaAdmin =
    (perms?.allowAll || allowedModuleSet.has(6)) &&
    visibleMatrizSistemaAdminSubs.length > 0;

  const canSeeSeguridad =
    perms?.allowAll || allowedModuleSet.has(7) || false;

const menuButtonClass =
  "h-11 w-full justify-start data-[state=collapsed]:justify-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:shadow-md";

  const subButtonClass =
    "h-auto rounded-lg px-3 py-2 text-xs leading-tight text-white/70 hover:bg-white/10 hover:text-white data-[active=true]:bg-white/15 data-[active=true]:text-white";

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      side="left"
      className="border-r-0 bg-[#061b33] text-white ju"
    >
      <SidebarHeader className="relative border-b border-white/10 bg-[#061b33] p-4">
<button
  onClick={toggleSidebar}
>
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        <div className="flex items-center gap-3">
      <div className="flex h-12 w-full items-center justify-center">
  <Image 
    src="/LogoUNCSM.png" 
    alt="Logo UNCSM" 
    width={180} 
    height={155} 
    className="object-contain" 
  />
</div>

        
        </div>
      </SidebarHeader>

      <SidebarContent className="custom-scroll bg-[#061b33] px-3 py-4">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-widest text-blue-200/80">
              Inicio
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  className={menuButtonClass}
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                    {!collapsed && <span>Panel Principal</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-widest text-blue-200/80">
              Módulos
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {canSeeSistemaAdmin && (
                <Collapsible defaultOpen={pathname.includes("/sistema-administrativo")}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname.includes("/sistema-administrativo")}
                        className={menuButtonClass}
                      >
                        <FileText className="h-5 w-5" />
                        {!collapsed && <span> Documentos Sistema Administrativo</span>}
                        {!collapsed && (
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {!collapsed && (
                      <CollapsibleContent className="mt-1">
                        <SidebarMenuSub className="ml-5 border-l border-white/10 pl-3">
                          {visibleSistemaAdminSubs.map((sub) => (
                            <SidebarMenuSubItem key={sub.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === sub.href}
                                className={subButtonClass}
                              >
                                <Link href={sub.href} title={sub.title}>
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

              {canSeeMatrizSistemaAdmin && (
                <Collapsible defaultOpen={pathname.includes("/matriz_sa")}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname.includes("/matriz_sa")}
                        className={menuButtonClass}
                      >
                        <Shield className="h-5 w-5" />
                        {!collapsed && <span>Matriz Sistema Administrativo</span>}
                        {!collapsed && (
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {!collapsed && (
                      <CollapsibleContent className="mt-1">
                        <SidebarMenuSub className="ml-5 border-l border-white/10 pl-3">
                          {visibleMatrizSistemaAdminSubs.map((sub) => (
                            <SidebarMenuSubItem key={sub.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === sub.href}
                                className={subButtonClass}
                              >
                                <Link href={sub.href} title={sub.title}>
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
                      <SidebarMenuButton
                        isActive={pathname.includes("/por-componentes")}
                        className={menuButtonClass}
                      >
                        <Layers className="h-5 w-5" />
                        {!collapsed && <span>Por Componentes</span>}
                        {!collapsed && (
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {!collapsed && (
                      <CollapsibleContent className="mt-1">
                        <SidebarMenuSub className="ml-5 border-l border-white/10 pl-3">
                          {visiblePorComponentesSubs.map((sub) => (
                            <SidebarMenuSubItem key={sub.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === sub.href}
                                className={subButtonClass}
                              >
                                <Link href={sub.href} title={sub.title}>
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
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.includes("/informes")}
                    className={menuButtonClass}
                  >
                    <Link href="/dashboard/informes">
                      <BarChart3 className="h-5 w-5" />
                      {!collapsed && <span>Informes</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {canSeePermisos && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.includes("/permisos")}
                    className={menuButtonClass}
                  >
                    <Link href="/dashboard/permisos">
                      <Users className="h-5 w-5" />
                      {!collapsed && <span>Permisos de Usuario</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

            {canSeeAvisos && (
  <SidebarMenuItem>
    <SidebarMenuButton
      asChild
      isActive={pathname.includes("/avisos")}
      className={menuButtonClass}
    >
      <Link href="/dashboard/avisos">
        <Megaphone className="h-5 w-5" />
        {!collapsed && <span>Avisos</span>}
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
)}

{canSeeSeguridad && (
  <Collapsible defaultOpen={pathname.includes("/avisos")}>
    <SidebarMenuItem>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton
          isActive={pathname.includes("/avisos")}
          className={menuButtonClass}
        >
          <ShieldCheck className="h-5 w-5" />

          {!collapsed && <span>Seguridad</span>}

          {!collapsed && (
            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          )}
        </SidebarMenuButton>
      </CollapsibleTrigger>

      {!collapsed && (
        <CollapsibleContent className="mt-1">
          <SidebarMenuSub className="ml-5 border-l border-white/10 pl-3">
            {visibleSeguridadSubs.map((sub) => (
              <SidebarMenuSubItem key={sub.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === sub.href}
                  className={subButtonClass}
                >
                  <Link href={sub.href} title={sub.title}>
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

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      
    </Sidebar>
  );
}