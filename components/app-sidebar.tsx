"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  LayoutDashboard,
  Layers,
  BarChart3,
  Users,
  Shield,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  ShieldCheck,
  DoorOpen,

  // Iconos para submódulos
  UserRoundCog,
  CalendarRange,
  WalletCards,
  Landmark,
  BookOpenCheck,
  ShoppingBag,
  MonitorCog,
  FolderKanban,
  ChartNoAxesCombined,
  ClipboardCheck,
  CircleDot,
  Activity,
  MessageSquareText,
  ScanSearch,
  Settings2,
  LockKeyhole,
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

/* ============================================================
   SUBMÓDULOS
============================================================ */

const sistemaAdminSubModules = [
  {
    id: 1,
    title: "Administración de Talento Humano",
    href: "/dashboard/sistema-administrativo/sa_talento_humano",
  },
  {
    id: 2,
    title: "Planeación y Programación",
    href: "/dashboard/sistema-administrativo/sa_planeacion",
  },
  {
    id: 3,
    title: "Presupuesto",
    href: "/dashboard/sistema-administrativo/sa_presupuesto",
  },
  {
    id: 4,
    title: "Administración Financiera",
    href: "/dashboard/sistema-administrativo/sa_financiera",
  },
  {
    id: 5,
    title: "Contabilidad Integrada",
    href: "/dashboard/sistema-administrativo/sa_ConIntegrada",
  },
  {
    id: 6,
    title: "Inversiones en Proyectos y Programa",
    href: "/dashboard/sistema-administrativo/sa_Invproyec",
  },
  {
    id: 7,
    title: "Tecnología de la Información",
    href: "/dashboard/sistema-administrativo/sa_TIC",
  },
];

const porComponentesSubModules = [
  {
    id: 8,
    title: "Entorno de Control",
    href: "/dashboard/por-componentes/entorno-control",
  },
  {
    id: 9,
    title: "Evaluación de Riesgos",
    href: "/dashboard/por-componentes/evaluacion-riesgos",
  },
  {
    id: 10,
    title: "Actividades de Control",
    href: "/dashboard/por-componentes/actividades-control",
  },
  {
    id: 11,
    title: "Información y Comunicación",
    href: "/dashboard/por-componentes/Informa-Comuni",
  },
  {
    id: 12,
    title: "Actividades de Supervisión",
    href: "/dashboard/por-componentes/actividad-supervision",
  },
  {
    id: 13,
    title: "Resultados",
    href: "/dashboard/por-componentes/Resultados",
  },
  {
    id: 15,
    title: "Plan de Acción",
    href: "/dashboard/por-componentes/Plan_Accion",
  },
];

const matrizSistemaAdminSubModules = [
  {
    id: 16,
    title: "Administración de Talento Humano",
    href: "/dashboard/matriz_sa/ma_talento_humano",
  },
  {
    id: 17,
    title: "Planeación y Programación",
    href: "/dashboard/matriz_sa/ma_planeacion",
  },
  {
    id: 18,
    title: "Presupuesto",
    href: "/dashboard/matriz_sa/ma_presupuesto",
  },
  {
    id: 19,
    title: "Administración Financiera",
    href: "/dashboard/matriz_sa/ma_financiera",
  },
  {
    id: 20,
    title: "Contabilidad Integrada",
    href: "/dashboard/matriz_sa/ma_ConIntegrada",
  },
  {
    id: 21,
    title: "Contratación y Administración de Bienes y Servicios",
    href: "/dashboard/matriz_sa/ma_contbys",
  },
  {
    id: 22,
    title: "Tecnología de la Información",
    href: "/dashboard/matriz_sa/ma_TIC",
  },
  {
    id: 23,
    title: "Inversiones en Programas y Proyectos",
    href: "/dashboard/matriz_sa/ma_InvPoyect",
  },
  {
    id: 24,
    title: "Resultados",
    href: "/dashboard/matriz_sa/Resultados",
  },
  {
    id: 26,
    title: "Plan de Acción",
    href: "/dashboard/matriz_sa/Plan_Accion",
  },
];

const seguridadSubModules = [
  {
    id: 27,
    title: "Roles y Permisos",
    href: "/dashboard/seguridad/roles_permisos",
  },
  {
    id: 28,
    title: "Auditoría del Sistema",
    href: "/dashboard/seguridad/auditoria_datos",
  },
];

/* ============================================================
   TIPOS
============================================================ */

interface AppSidebarProps {
  user: {
    email: string;
    full_name: string;
    role: string;
  };
}

type MePerms = {
  allowAll: boolean;

  modules: Array<{
    ModuleId: number;
    CanView?: any;
  }>;

  submodules: Array<{
    SubModuleId: number;
    CanView?: any;
  }>;
};

type AccesoModulo = {
  cargando: boolean;
  puedeAcceder: boolean;
  estado: string;
  message: string;
};

/* ============================================================
   ICONOS MATRIZ SISTEMA ADMINISTRATIVO
============================================================ */

function getMatrizIcon(id: number) {
  switch (id) {
    case 16:
      return UserRoundCog;

    case 17:
      return CalendarRange;

    case 18:
      return WalletCards;

    case 19:
      return Landmark;

    case 20:
      return BookOpenCheck;

    case 21:
      return ShoppingBag;

    case 22:
      return MonitorCog;

    case 23:
      return FolderKanban;

    case 24:
      return ChartNoAxesCombined;

    case 26:
      return ClipboardCheck;

    default:
      return CircleDot;
  }
}

/* ============================================================
   ICONOS POR COMPONENTES
============================================================ */

function getComponentIcon(id: number) {
  switch (id) {
    case 8:
      return ShieldCheck;

    case 9:
      return ScanSearch;

    case 10:
      return Settings2;

    case 11:
      return MessageSquareText;

    case 12:
      return Activity;

    case 13:
      return ChartNoAxesCombined;

    case 15:
      return ClipboardCheck;

    default:
      return CircleDot;
  }
}

/* ============================================================
   COMPONENTE
============================================================ */

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const { state, toggleSidebar } = useSidebar();

  const collapsed = state === "collapsed";

  /* ============================================================
     ROL ACTUAL
  ============================================================ */

  const roleNormalizado = String(user?.role || "")
    .trim()
    .toLowerCase();

  const esAdministrador =
    roleNormalizado === "administrador" ||
    roleNormalizado === "subadministrador";


/* SOLO Administrador */
const esSoloAdministrador =
  roleNormalizado === "administrador";

  /* ============================================================
     PERMISOS
  ============================================================ */

  const [perms, setPerms] = useState<MePerms | null>(null);

  /* ============================================================
     CONTROL DE APERTURA
  ============================================================ */

  const [accesoComponentes, setAccesoComponentes] =
    useState<AccesoModulo>({
      cargando: true,
      puedeAcceder: false,
      estado: "",
      message: "",
    });

  const [accesoMatrizSistema, setAccesoMatrizSistema] =
    useState<AccesoModulo>({
      cargando: true,
      puedeAcceder: false,
      estado: "",
      message: "",
    });

  /* ============================================================
     CARGAR PERMISOS
  ============================================================ */

  useEffect(() => {
    async function loadPermissions() {
      try {
        const res = await fetch("/api/me/permissions", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json();

        setPerms({
          allowAll: Boolean(data?.allowAll),

          modules: Array.isArray(data?.modules)
            ? data.modules
            : [],

          submodules: Array.isArray(data?.submodules)
            ? data.submodules
            : [],
        });
      } catch (error) {
        console.error(
          "Error cargando permisos:",
          error
        );

        setPerms({
          allowAll: false,
          modules: [],
          submodules: [],
        });
      }
    }

    loadPermissions();
  }, []);

  /* ============================================================
     CONTROL DE APERTURA Y CIERRE

     ModuleId = 2
     Matriz por Componentes

     ModuleId = 6
     Matriz Sistema Administrativo
  ============================================================ */

useEffect(() => {
  async function verificarApertura() {
    if (esAdministrador) {
      setAccesoComponentes({
        cargando: false,
        puedeAcceder: true,
        estado: "ACCESO_ADMINISTRATIVO",
        message: "Acceso administrativo.",
      });

      setAccesoMatrizSistema({
        cargando: false,
        puedeAcceder: true,
        estado: "ACCESO_ADMINISTRATIVO",
        message: "Acceso administrativo.",
      });

      return;
    }

    try {
      const [
        responseComponentes,
        responseMatrizSistema,
      ] = await Promise.all([
        fetch("/api/apertura/acceso?moduleId=2", {
          cache: "no-store",
          credentials: "include",
        }),

        fetch("/api/apertura/acceso?moduleId=6", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      const [
        dataComponentes,
        dataMatrizSistema,
      ] = await Promise.all([
        responseComponentes.json(),
        responseMatrizSistema.json(),
      ]);

      setAccesoComponentes({
        cargando: false,
        puedeAcceder:
          responseComponentes.ok &&
          Boolean(dataComponentes?.puedeAcceder),
        estado: dataComponentes?.estado || "",
        message:
          dataComponentes?.message ||
          "El módulo no se encuentra disponible.",
      });

      setAccesoMatrizSistema({
        cargando: false,
        puedeAcceder:
          responseMatrizSistema.ok &&
          Boolean(dataMatrizSistema?.puedeAcceder),
        estado: dataMatrizSistema?.estado || "",
        message:
          dataMatrizSistema?.message ||
          "El módulo no se encuentra disponible.",
      });
    } catch (error) {
      console.error(
        "Error verificando apertura del sistema:",
        error
      );

      setAccesoComponentes({
        cargando: false,
        puedeAcceder: false,
        estado: "ERROR",
        message:
          "No fue posible verificar la apertura del sistema.",
      });

      setAccesoMatrizSistema({
        cargando: false,
        puedeAcceder: false,
        estado: "ERROR",
        message:
          "No fue posible verificar la apertura del sistema.",
      });
    }
  }

  verificarApertura();
}, [esAdministrador]);

  /* ============================================================
     PERMISOS SUBMÓDULOS
  ============================================================ */

  const allowedSubSet = useMemo(() => {
    if (
      esAdministrador ||
      !perms ||
      perms.allowAll
    ) {
      return new Set<number>();
    }

    return new Set(
      (perms.submodules ?? []).map((p) =>
        Number(p.SubModuleId)
      )
    );
  }, [
    esAdministrador,
    perms,
  ]);

  /* ============================================================
     PERMISOS MÓDULOS
  ============================================================ */

  const allowedModuleSet = useMemo(() => {
    if (
      esAdministrador ||
      !perms ||
      perms.allowAll
    ) {
      return new Set<number>();
    }

    return new Set(
      (perms.modules ?? []).map((m) =>
        Number(m.ModuleId)
      )
    );
  }, [
    esAdministrador,
    perms,
  ]);

  /* ============================================================
     SISTEMA ADMINISTRATIVO ORIGINAL
  ============================================================ */

  const visibleSistemaAdminSubs = useMemo(() => {
    /*
     * Administrador y subadministrador ven todos.
     */
    if (esAdministrador) {
      return sistemaAdminSubModules;
    }

    if (!perms) {
      return [];
    }

    if (perms.allowAll) {
      return sistemaAdminSubModules;
    }

    return sistemaAdminSubModules.filter((s) =>
      allowedSubSet.has(Number(s.id))
    );
  }, [
    esAdministrador,
    perms,
    allowedSubSet,
  ]);

  /* ============================================================
     POR COMPONENTES
     MODULE ID = 2
  ============================================================ */

  const visiblePorComponentesSubs = useMemo(() => {
    /*
     * Administrador y subadministrador ven todos
     * los submódulos.
     */
    if (esAdministrador) {
      return porComponentesSubModules;
    }

    if (!perms) {
      return [];
    }

    if (perms.allowAll) {
      return porComponentesSubModules;
    }

    return porComponentesSubModules.filter((s) =>
      allowedSubSet.has(Number(s.id))
    );
  }, [
    esAdministrador,
    perms,
    allowedSubSet,
  ]);

  /* ============================================================
     MATRIZ SISTEMA ADMINISTRATIVO
     MODULE ID = 6
  ============================================================ */

  const visibleMatrizSistemaAdminSubs = useMemo(() => {
    /*
     * Administrador y subadministrador ven todos
     * los submódulos.
     */
    if (esAdministrador) {
      return matrizSistemaAdminSubModules;
    }

    if (!perms) {
      return [];
    }

    if (perms.allowAll) {
      return matrizSistemaAdminSubModules;
    }

    return matrizSistemaAdminSubModules.filter((s) =>
      allowedSubSet.has(Number(s.id))
    );
  }, [
    esAdministrador,
    perms,
    allowedSubSet,
  ]);

  /* ============================================================
     SEGURIDAD
  ============================================================ */

  const visibleSeguridadSubs = useMemo(() => {
    if (esAdministrador) {
      return seguridadSubModules;
    }

    if (!perms) {
      return [];
    }

    if (perms.allowAll) {
      return seguridadSubModules;
    }

    return seguridadSubModules.filter((s) =>
      allowedSubSet.has(Number(s.id))
    );
  }, [
    esAdministrador,
    perms,
    allowedSubSet,
  ]);

  /* ============================================================
     VISIBILIDAD GENERAL
  ============================================================ */

  /*
   * Sistema administrativo original.
   *
   * No estamos aplicando el control de Apertura_sistema
   * aquí porque acordamos controlar solamente ModuleId 2 y 6.
   */
  const canSeeSistemaAdmin =
    esAdministrador ||
    visibleSistemaAdminSubs.length > 0;

  /*
   * MODULE ID 2
   */
 const canSeePorComponentes =
  esAdministrador ||
  visiblePorComponentesSubs.length > 0;

  /*
   * Informes
   */
  const canSeeInformes =
    esAdministrador ||
    Boolean(perms?.allowAll) ||
    allowedModuleSet.has(3);

  /*
   * Permisos de usuario
   */
  const canSeePermisos =
    esSoloAdministrador ||
    Boolean(perms?.allowAll) ||
    allowedModuleSet.has(4);

  /*
   * Avisos
   */
  const canSeeAvisos =
    esSoloAdministrador ||
    Boolean(perms?.allowAll) ||
    allowedModuleSet.has(5);

  /*
   * Control de Apertura
   *
   * Administrador y subadministrador siempre lo ven.
   *
   * Por ahora conservamos tu lógica existente para
   * los demás usuarios.
   */
  const canSeeControl =
    esAdministrador ||
    Boolean(perms?.allowAll) ||
    allowedModuleSet.has(5);

  /*
   * MODULE ID 6
   */
const canSeeMatrizSistemaAdmin =
  esAdministrador ||
  visibleMatrizSistemaAdminSubs.length > 0;

  /*
   * Seguridad
   */
  const canSeeSeguridad =
    esSoloAdministrador ||
    Boolean(perms?.allowAll) ||
    allowedModuleSet.has(7);

  /* ============================================================
     ESTILOS
  ============================================================ */

  const menuButtonClass = `
    group/menu
    min-h-11
    w-full
    justify-start
    rounded-xl
    px-2.5
    font-medium
    text-slate-200
    transition-all
    duration-200

    hover:bg-blue-400/10
    hover:text-white

    data-[active=true]:bg-gradient-to-r
    data-[active=true]:from-blue-600
    data-[active=true]:to-cyan-600
    data-[active=true]:text-white
    data-[active=true]:shadow-md
    data-[active=true]:shadow-blue-950/20

    data-[state=collapsed]:justify-center
  `;

  const subButtonClass = `
    group/sub
    h-auto
    min-h-9
    rounded-lg
    border
    border-transparent
    px-2
    py-2
    text-[11px]
    font-medium
    leading-[1.25]
    text-slate-300
    transition-all
    duration-200

    hover:border-blue-300/10
    hover:bg-blue-400/10
    hover:text-white

    data-[active=true]:border-cyan-300/20
    data-[active=true]:bg-cyan-400/10
    data-[active=true]:font-semibold
    data-[active=true]:text-cyan-100
  `;

  const blockedSubButtonClass = `
    h-auto
    min-h-9
    cursor-not-allowed
    rounded-lg
    border
    border-transparent
    px-2
    py-2
    text-[11px]
    font-medium
    leading-[1.25]
    text-slate-500
    opacity-70
  `;

  /* ============================================================
     RETURN
  ============================================================ */

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      side="left"
      className="
        border-r
        border-blue-900/40
        bg-gradient-to-b
        from-[#082a4d]
        via-[#07345c]
        to-[#062743]
        text-white
      "
    >
      {/* ========================================================
          HEADER / LOGO
      ======================================================== */}

      <SidebarHeader
        className="
          relative
          border-b
          border-white/10
          bg-[#082a4d]
          px-3
          py-4
        "
      >
        {/* BOTÓN COLAPSAR */}

        <button
          type="button"
          onClick={toggleSidebar}
          className="
            absolute
            right-2
            top-2
            z-20
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-lg
            text-blue-200
            transition
            hover:bg-white/10
            hover:text-white
          "
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* LOGO */}

        <div
          className={`
            flex items-center justify-center
            transition-all duration-300
            ${
              collapsed
                ? "h-12"
                : "h-[62px]"
            }
          `}
        >
          <Image
            src="/LogoUNCSM.png"
            alt="Logo UNCSM"
            width={180}
            height={155}
            className={`
              object-contain
              transition-all
              duration-300

              ${
                collapsed
                  ? "w-9"
                  : "w-[175px]"
              }
            `}
          />
        </div>
      </SidebarHeader>

      {/* ========================================================
          CONTENIDO
      ======================================================== */}

      <SidebarContent
        className="
          custom-scroll
          bg-transparent
          px-3
          py-4
        "
      >
        {/* ======================================================
            INICIO
        ====================================================== */}

        <SidebarGroup className="p-0">
          {!collapsed && (
            <SidebarGroupLabel
              className="
                mb-1
                px-2
                text-[10px]
                font-black
                uppercase
                tracking-[0.18em]
                text-cyan-300/80
              "
            >
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
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5"
                  >
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-blue-400/10
                        text-blue-200
                      "
                    >
                      <LayoutDashboard className="h-4 w-4" />
                    </div>

                    {!collapsed && (
                      <span className="text-[13px] font-semibold">
                        Panel Principal
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ======================================================
            MÓDULOS
        ====================================================== */}

        <SidebarGroup className="mt-5 p-0">
          {!collapsed && (
            <SidebarGroupLabel
              className="
                mb-2
                px-2
                text-[10px]
                font-black
                uppercase
                tracking-[0.18em]
                text-cyan-300/80
              "
            >
              Módulos
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">

              {/* ==================================================
                  MATRIZ SISTEMA ADMINISTRATIVO
                  MODULE ID = 6
              ================================================== */}

              {canSeeMatrizSistemaAdmin && (
                <Collapsible
                  defaultOpen={pathname.includes("/matriz_sa")}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname.includes("/matriz_sa")}
                        className={menuButtonClass}
                      >
                        <div
                          className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-blue-400/10
                            text-blue-200
                            transition-all
                            group-hover/menu:bg-blue-400/20
                            group-hover/menu:text-white
                          "
                        >
                          <Shield className="h-4 w-4" />
                        </div>

                        {!collapsed && (
                          <span
                            className="
                              flex-1
                              text-left
                              text-[12px]
                              font-semibold
                              leading-[1.25]
                            "
                          >
                            Matriz Sistema Administrativo
                          </span>
                        )}

                        {!collapsed && (
                          <div className="ml-auto flex items-center gap-2">
                            {!accesoMatrizSistema.cargando &&
                              !accesoMatrizSistema.puedeAcceder && (
                                <LockKeyhole
                                  className="
                                    h-3.5
                                    w-3.5
                                    shrink-0
                                    text-amber-300
                                  "
                                />
                              )}

                            <ChevronDown
                              className="
                                h-4
                                w-4
                                shrink-0
                                text-blue-200
                                transition-transform
                                duration-200
                                group-data-[state=open]:rotate-180
                              "
                            />
                          </div>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {!collapsed && (
                      <CollapsibleContent className="mt-1">
                        <SidebarMenuSub
                          className="
                            ml-4
                            space-y-0.5
                            border-l
                            border-blue-300/15
                            pl-2
                          "
                        >
                          {visibleMatrizSistemaAdminSubs.map(
                            (sub) => {
                              const SubIcon =
                                getMatrizIcon(sub.id);

                              const activo =
                                pathname === sub.href;

                              const bloqueado =
                                !accesoMatrizSistema.cargando &&
                                !accesoMatrizSistema.puedeAcceder;

                              return (
                                <SidebarMenuSubItem
                                  key={sub.href}
                                >
                                  {bloqueado ? (
                                    <SidebarMenuSubButton
                                      isActive={false}
                                      className={
                                        blockedSubButtonClass
                                      }
                                      title={
                                        accesoMatrizSistema.message ||
                                        "Período cerrado"
                                      }
                                    >
                                      <div
                                        className="
                                          flex
                                          w-full
                                          items-center
                                          gap-2
                                        "
                                      >
                                        <div
                                          className="
                                            flex
                                            h-6
                                            w-6
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-md
                                            bg-slate-400/10
                                            text-slate-400
                                          "
                                        >
                                          <SubIcon className="h-3.5 w-3.5" />
                                        </div>

                                        <span
                                          className="
                                            min-w-0
                                            flex-1
                                            leading-[1.25]
                                          "
                                        >
                                          {sub.title}
                                        </span>

                                        <LockKeyhole
                                          className="
                                            h-3.5
                                            w-3.5
                                            shrink-0
                                            text-amber-300
                                          "
                                        />
                                      </div>
                                    </SidebarMenuSubButton>
                                  ) : (
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={activo}
                                      className={
                                        subButtonClass
                                      }
                                    >
                                      <Link
                                        href={sub.href}
                                        title={sub.title}
                                        className="
                                          flex
                                          items-center
                                          gap-2
                                        "
                                      >
                                        <div
                                          className={`
                                            flex
                                            h-6
                                            w-6
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-md
                                            transition-all
                                            duration-200

                                            ${
                                              activo
                                                ? "bg-cyan-400/20 text-cyan-100"
                                                : "bg-blue-400/10 text-blue-200 group-hover/sub:bg-blue-400/20 group-hover/sub:text-white"
                                            }
                                          `}
                                        >
                                          <SubIcon className="h-3.5 w-3.5" />
                                        </div>

                                        <span
                                          className="
                                            min-w-0
                                            flex-1
                                            leading-[1.25]
                                          "
                                        >
                                          {sub.title}
                                        </span>

                                        {activo && (
                                          <span
                                            className="
                                              h-1.5
                                              w-1.5
                                              shrink-0
                                              rounded-full
                                              bg-cyan-300
                                              shadow-[0_0_7px_rgba(103,232,249,0.8)]
                                            "
                                          />
                                        )}
                                      </Link>
                                    </SidebarMenuSubButton>
                                  )}
                                </SidebarMenuSubItem>
                              );
                            }
                          )}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* ==================================================
                  MATRIZ POR COMPONENTES
                  MODULE ID = 2
              ================================================== */}

              {canSeePorComponentes && (
                <Collapsible
                  defaultOpen={pathname.includes(
                    "/por-componentes"
                  )}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname.includes(
                          "/por-componentes"
                        )}
                        className={menuButtonClass}
                      >
                        <div
                          className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-cyan-400/10
                            text-cyan-200
                            transition
                            group-hover/menu:bg-cyan-400/20
                            group-hover/menu:text-white
                          "
                        >
                          <Layers className="h-4 w-4" />
                        </div>

                        {!collapsed && (
                          <span
                            className="
                              flex-1
                              text-left
                              text-[12px]
                              font-semibold
                            "
                          >
                            Matriz por Componentes
                          </span>
                        )}

                        {!collapsed && (
                          <div className="ml-auto flex items-center gap-2">
                            {!accesoComponentes.cargando &&
                              !accesoComponentes.puedeAcceder && (
                                <LockKeyhole
                                  className="
                                    h-3.5
                                    w-3.5
                                    shrink-0
                                    text-amber-300
                                  "
                                />
                              )}

                            <ChevronDown
                              className="
                                h-4
                                w-4
                                text-blue-200
                                transition-transform
                                group-data-[state=open]:rotate-180
                              "
                            />
                          </div>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {!collapsed && (
                      <CollapsibleContent className="mt-1">
                        <SidebarMenuSub
                          className="
                            ml-4
                            space-y-0.5
                            border-l
                            border-cyan-300/15
                            pl-2
                          "
                        >
                          {visiblePorComponentesSubs.map(
                            (sub) => {
                              const SubIcon =
                                getComponentIcon(sub.id);

                              const activo =
                                pathname === sub.href;

                              const bloqueado =
                                !accesoComponentes.cargando &&
                                !accesoComponentes.puedeAcceder;

                              return (
                                <SidebarMenuSubItem
                                  key={sub.href}
                                >
                                  {bloqueado ? (
                                    <SidebarMenuSubButton
                                      isActive={false}
                                      className={
                                        blockedSubButtonClass
                                      }
                                      title={
                                        accesoComponentes.message ||
                                        "Período cerrado"
                                      }
                                    >
                                      <div
                                        className="
                                          flex
                                          w-full
                                          items-center
                                          gap-2
                                        "
                                      >
                                        <div
                                          className="
                                            flex
                                            h-6
                                            w-6
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-md
                                            bg-slate-400/10
                                            text-slate-400
                                          "
                                        >
                                          <SubIcon className="h-3.5 w-3.5" />
                                        </div>

                                        <span className="min-w-0 flex-1">
                                          {sub.title}
                                        </span>

                                        <LockKeyhole
                                          className="
                                            h-3.5
                                            w-3.5
                                            shrink-0
                                            text-amber-300
                                          "
                                        />
                                      </div>
                                    </SidebarMenuSubButton>
                                  ) : (
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={activo}
                                      className={
                                        subButtonClass
                                      }
                                    >
                                      <Link
                                        href={sub.href}
                                        title={sub.title}
                                        className="flex items-center gap-2"
                                      >
                                        <div
                                          className={`
                                            flex
                                            h-6
                                            w-6
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-md
                                            transition

                                            ${
                                              activo
                                                ? "bg-cyan-400/20 text-cyan-100"
                                                : "bg-blue-400/10 text-blue-200 group-hover/sub:text-white"
                                            }
                                          `}
                                        >
                                          <SubIcon className="h-3.5 w-3.5" />
                                        </div>

                                        <span className="min-w-0 flex-1">
                                          {sub.title}
                                        </span>

                                        {activo && (
                                          <span
                                            className="
                                              h-1.5
                                              w-1.5
                                              rounded-full
                                              bg-cyan-300
                                            "
                                          />
                                        )}
                                      </Link>
                                    </SidebarMenuSubButton>
                                  )}
                                </SidebarMenuSubItem>
                              );
                            }
                          )}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* ==================================================
                  INFORMES
              ================================================== */}

              {canSeeInformes && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.includes("/informes")}
                    className={menuButtonClass}
                  >
                    <Link
                      href="/dashboard/informes"
                      className="flex items-center gap-2.5"
                    >
                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-blue-400/10
                          text-blue-200
                        "
                      >
                        <BarChart3 className="h-4 w-4" />
                      </div>

                      {!collapsed && (
                        <span className="text-[13px] font-semibold">
                          Informes
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* ==================================================
                  PERMISOS
              ================================================== */}

              {canSeePermisos && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.includes("/permisos")}
                    className={menuButtonClass}
                  >
                    <Link
                      href="/dashboard/permisos"
                      className="flex items-center gap-2.5"
                    >
                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-blue-400/10
                          text-blue-200
                        "
                      >
                        <Users className="h-4 w-4" />
                      </div>

                      {!collapsed && (
                        <span className="text-[13px] font-semibold">
                          Permisos de Usuario
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* ==================================================
                  AVISOS
              ================================================== */}

              {canSeeAvisos && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.includes("/avisos")}
                    className={menuButtonClass}
                  >
                    <Link
                      href="/dashboard/avisos"
                      className="flex items-center gap-2.5"
                    >
                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-blue-400/10
                          text-blue-200
                        "
                      >
                        <Megaphone className="h-4 w-4" />
                      </div>

                      {!collapsed && (
                        <span className="text-[13px] font-semibold">
                          Avisos
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* ==================================================
                  CONTROL DE APERTURA
              ================================================== */}

              {canSeeControl && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.includes("/apertura")}
                    className={menuButtonClass}
                  >
                    <Link
                      href="/dashboard/apertura"
                      className="flex items-center gap-2.5"
                    >
                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-blue-400/10
                          text-blue-200
                        "
                      >
                        <DoorOpen className="h-4 w-4" />
                      </div>

                      {!collapsed && (
                        <span className="text-[13px] font-semibold">
                          Control de Apertura
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* ==================================================
                  SEGURIDAD
              ================================================== */}

              {canSeeSeguridad && (
                <Collapsible
                  defaultOpen={pathname.includes(
                    "/seguridad"
                  )}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname.includes(
                          "/seguridad"
                        )}
                        className={menuButtonClass}
                      >
                        <div
                          className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-blue-400/10
                            text-blue-200
                          "
                        >
                          <LockKeyhole className="h-4 w-4" />
                        </div>

                        {!collapsed && (
                          <span
                            className="
                              flex-1
                              text-left
                              text-[13px]
                              font-semibold
                            "
                          >
                            Seguridad
                          </span>
                        )}

                        {!collapsed && (
                          <ChevronDown
                            className="
                              ml-auto
                              h-4
                              w-4
                              text-blue-200
                              transition-transform
                              group-data-[state=open]:rotate-180
                            "
                          />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {!collapsed && (
                      <CollapsibleContent className="mt-1">
                        <SidebarMenuSub
                          className="
                            ml-4
                            space-y-0.5
                            border-l
                            border-blue-300/15
                            pl-2
                          "
                        >
                          {visibleSeguridadSubs.map(
                            (sub) => {
                              const activo =
                                pathname === sub.href;

                              const SubIcon =
                                sub.id === 27
                                  ? ShieldCheck
                                  : Activity;

                              return (
                                <SidebarMenuSubItem
                                  key={sub.href}
                                >
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={activo}
                                    className={subButtonClass}
                                  >
                                    <Link
                                      href={sub.href}
                                      title={sub.title}
                                      className="flex items-center gap-2"
                                    >
                                      <div
                                        className={`
                                          flex
                                          h-6
                                          w-6
                                          shrink-0
                                          items-center
                                          justify-center
                                          rounded-md

                                          ${
                                            activo
                                              ? "bg-cyan-400/20 text-cyan-100"
                                              : "bg-blue-400/10 text-blue-200"
                                          }
                                        `}
                                      >
                                        <SubIcon className="h-3.5 w-3.5" />
                                      </div>

                                      <span className="min-w-0 flex-1">
                                        {sub.title}
                                      </span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            }
                          )}
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