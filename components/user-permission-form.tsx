"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Eye,
  EyeOff,
  UserRound,
  KeyRound,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  X,
  Layers3,
  ListChecks,
  CircleHelp,
} from "lucide-react";

import Swal from "sweetalert2";

// ============================================================
// TIPOS
// ============================================================

type PrincipleRow = {
  id: string;
  title: string;
  number: string;
  text: string;
};

type QuestionRow = {
  id: string;

  // En Por Componentes corresponde al PrincipleId.
  // En Sistema Administrativo puede venir vacío.
  parentId: string;

  number: string;
  text: string;
};

type SubModuleRow = {
  id: string;
  key: string;
  name: string;
  principles: PrincipleRow[];
  questions: QuestionRow[];
};

type ModuleRow = {
  id: string;
  key: string;
  name: string;
  submodules: SubModuleRow[];
};

type RoleRow = {
  RoleId: number;
  RoleKey: string;
  RoleName: string;
};

type CargoRow = {
  Id: number;
  CargoKey: string;
  NombreCargo: string;
};

type UserData = {
  id?: string;
  email?: string;
  full_name?: string | null;
  cargo?: string | null;
  role?: string | null;
  is_active?: boolean;
};

type UserPermissionFormProps = {
  mode: "create" | "edit";
  userId?: string;
};

// ============================================================
// COMPONENTE
// ============================================================

export function UserPermissionForm({
  mode,
  userId,
}: UserPermissionFormProps) {
  const router = useRouter();

  const isEdit = mode === "edit";

  // ============================================================
  // ESTADOS GENERALES
  // ============================================================

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    cargo: "",
    password: "",
    role: "asesor",
    is_active: true,
  });

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [cargos, setCargos] = useState<CargoRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);

  const [modulesLoading, setModulesLoading] =
    useState(true);

  const [loadingUser, setLoadingUser] =
    useState(isEdit);

  const [saving, setSaving] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  // ============================================================
  // PERMISOS
  // ============================================================

  const [moduleAccess, setModuleAccess] =
    useState<Record<string, boolean>>({});

  const [submoduleAccess, setSubmoduleAccess] =
    useState<Record<string, boolean>>({});

  // Principios de Por Componentes
  const [principleAccess, setPrincipleAccess] =
    useState<Record<string, boolean>>({});

  // Preguntas de Sistema Administrativo
  const [questionAccess, setQuestionAccess] =
    useState<Record<string, boolean>>({});

  // Preguntas pertenecientes a principios de Por Componentes
  const [
    principleQuestionAccess,
    setPrincipleQuestionAccess,
  ] = useState<Record<string, boolean>>({});

  // ============================================================
  // ESTADOS DE EXPANSIÓN
  // ============================================================

  const [openSubmodules, setOpenSubmodules] =
    useState<Record<string, boolean>>({});

  const [openModules, setOpenModules] =
    useState<Record<string, boolean>>({});

  const [openPrinciples, setOpenPrinciples] =
    useState<Record<string, boolean>>({});

  // ============================================================
  // KEYS
  // ============================================================

  function subKey(
    moduleId: string,
    subId: string
  ) {
    return `${moduleId}-${subId}`;
  }

  function principleKey(
    moduleId: string,
    subId: string,
    principleId: string
  ) {
    return `${moduleId}-${subId}-${principleId}`;
  }

  function questionKey(
    moduleId: string,
    subId: string,
    questionId: string
  ) {
    return `${moduleId}-${subId}-${questionId}`;
  }

  function principleQuestionKey(
    moduleId: string,
    subId: string,
    questionId: string
  ) {
    return `${moduleId}-${subId}-${questionId}`;
  }

  // ============================================================
  // IDENTIFICAR TIPO DE SUBMÓDULO
  // ============================================================

  /**
   * Si un submódulo tiene principios, sus preguntas se consideran
   * preguntas de Por Componentes y se relacionan mediante parentId.
   *
   * Si no tiene principios pero sí preguntas, corresponde al esquema
   * utilizado actualmente por Sistema Administrativo.
   */
  function isPrincipleSubmodule(
    submodule: SubModuleRow
  ) {
    return (
      (submodule.principles?.length ?? 0) > 0
    );
  }

  // ============================================================
  // EXPANDIR
  // ============================================================

  function toggleOpenModule(
    moduleId: string
  ) {
    setOpenModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  }

  function toggleOpenSubmodule(
    key: string
  ) {
    setOpenSubmodules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function toggleOpenPrinciple(
    key: string
  ) {
    setOpenPrinciples((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {
    inicializarFormulario();
  }, [mode, userId]);

  async function inicializarFormulario() {
    try {
      setModulesLoading(true);

      const [
        rolesCargados,
        cargosCargados,
        modulesCargados,
      ] = await Promise.all([
        loadRoles(),
        loadCargos(),
        loadModules(),
      ]);

      void cargosCargados;

      if (isEdit && userId) {
        await loadUser(
          userId,
          modulesCargados
        );
      } else {
        inicializarPermisos(
          modulesCargados
        );

        setForm({
          full_name: "",
          email: "",
          cargo: "",
          password: "",
          role:
            rolesCargados?.[0]
              ?.RoleKey ||
            "asesor",
          is_active: true,
        });

        setLoadingUser(false);
      }
    } catch (error) {
      console.error(
        "Error inicializando formulario:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "No se pudo cargar",
        text:
          "Ocurrió un error al cargar la información del formulario.",
        confirmButtonColor:
          "#0B4DA2",
      });
    } finally {
      setModulesLoading(false);
    }
  }

  // ============================================================
  // CARGAR ROLES
  // ============================================================

  async function loadRoles(): Promise<RoleRow[]> {
    const res = await fetch(
      "/api/admin/Roles",
      {
        credentials: "include",
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error(
        "Error cargando roles:",
        data
      );

      return [];
    }

    const lista =
      Array.isArray(data)
        ? data
        : [];

    setRoles(lista);

    return lista;
  }

  // ============================================================
  // CARGAR CARGOS
  // ============================================================

  async function loadCargos(): Promise<CargoRow[]> {
    try {
      const res = await fetch(
        "/api/cargos",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Error cargando cargos:",
          data
        );

        setCargos([]);
        return [];
      }

      const lista: CargoRow[] =
        Array.isArray(data)
          ? data
          : [];

      setCargos(lista);

      return lista;
    } catch (error) {
      console.error(
        "Error cargando cargos:",
        error
      );

      setCargos([]);
      return [];
    }
  }

  // ============================================================
  // CARGAR MÓDULOS
  // ============================================================

  async function loadModules(): Promise<ModuleRow[]> {
    const res = await fetch(
      "/api/admin/modules",
      {
        cache: "no-store",
        credentials: "include",
      }
    );

    const text = await res.text();

    let data: any = {};

    try {
      data = text
        ? JSON.parse(text)
        : {};
    } catch {
      console.error(
        "La API /api/admin/modules no devolvió JSON:",
        text
      );

      return [];
    }

    if (!res.ok) {
      console.error(
        "Error cargando módulos:",
        data
      );

      return [];
    }

    const mods =
      (data.modules ??
        []) as ModuleRow[];

    setModules(mods);

    return mods;
  }

  // ============================================================
  // INICIALIZAR PERMISOS
  // ============================================================

  function inicializarPermisos(
    workingModules: ModuleRow[]
  ) {
    const ma: Record<
      string,
      boolean
    > = {};

    const sa: Record<
      string,
      boolean
    > = {};

    const pa: Record<
      string,
      boolean
    > = {};

    const qa: Record<
      string,
      boolean
    > = {};

    const pqa: Record<
      string,
      boolean
    > = {};

    for (
      const m of workingModules
    ) {
      const moduleId =
        String(m.id);

      ma[moduleId] = false;

      for (
        const s of
          m.submodules || []
      ) {
        const subId =
          String(s.id);

        sa[
          subKey(
            moduleId,
            subId
          )
        ] = false;

        for (
          const p of
            s.principles || []
        ) {
          pa[
            principleKey(
              moduleId,
              subId,
              String(p.id)
            )
          ] = false;
        }

        for (
          const q of
            s.questions || []
        ) {
          if (
            isPrincipleSubmodule(s)
          ) {
            pqa[
              principleQuestionKey(
                moduleId,
                subId,
                String(q.id)
              )
            ] = false;
          } else {
            qa[
              questionKey(
                moduleId,
                subId,
                String(q.id)
              )
            ] = false;
          }
        }
      }
    }

    setModuleAccess(ma);
    setSubmoduleAccess(sa);
    setPrincipleAccess(pa);

    setQuestionAccess(qa);

    setPrincipleQuestionAccess(
      pqa
    );

    setOpenSubmodules({});
    setOpenPrinciples({});
  }

  // ============================================================
  // CARGAR USUARIO PARA EDICIÓN
  // ============================================================

  async function loadUser(
    id: string,
    workingModules: ModuleRow[]
  ) {
    try {
      setLoadingUser(true);

      // --------------------------------------------------------
      // DATOS DEL USUARIO
      // --------------------------------------------------------

      const usersRes =
        await fetch(
          "/api/admin/users",
          {
            cache: "no-store",
            credentials:
              "include",
          }
        );

      const usersData =
        await usersRes.json();

      if (!usersRes.ok) {
        throw new Error(
          "No se pudieron cargar los datos del usuario."
        );
      }

      const usuarios =
        Array.isArray(
          usersData?.users
        )
          ? usersData.users
          : [];

      const usuario:
        | UserData
        | undefined =
        usuarios.find(
          (u: any) =>
            String(u.id) ===
            String(id)
        );

      if (!usuario) {
        throw new Error(
          "No se encontró el usuario solicitado."
        );
      }

      setForm({
        full_name:
          usuario.full_name ??
          "",

        email:
          usuario.email ?? "",

        cargo:
          usuario.cargo ?? "",

        password: "",

        role: String(
          usuario.role || ""
        ).toLowerCase(),

        is_active:
          !!usuario.is_active,
      });

      // --------------------------------------------------------
      // INICIALIZAR TODO EN FALSE
      // --------------------------------------------------------

      const ma: Record<
        string,
        boolean
      > = {};

      const sa: Record<
        string,
        boolean
      > = {};

      const pa: Record<
        string,
        boolean
      > = {};

      const qa: Record<
        string,
        boolean
      > = {};

      const pqa: Record<
        string,
        boolean
      > = {};

      for (
        const m of workingModules
      ) {
        const moduleId =
          String(m.id);

        ma[moduleId] = false;

        for (
          const s of
            m.submodules || []
        ) {
          const subId =
            String(s.id);

          sa[
            subKey(
              moduleId,
              subId
            )
          ] = false;

          for (
            const p of
              s.principles || []
          ) {
            pa[
              principleKey(
                moduleId,
                subId,
                String(p.id)
              )
            ] = false;
          }

          for (
            const q of
              s.questions || []
          ) {
            if (
              isPrincipleSubmodule(
                s
              )
            ) {
              pqa[
                principleQuestionKey(
                  moduleId,
                  subId,
                  String(q.id)
                )
              ] = false;
            } else {
              qa[
                questionKey(
                  moduleId,
                  subId,
                  String(q.id)
                )
              ] = false;
            }
          }
        }
      }

      // --------------------------------------------------------
      // CARGAR PERMISOS
      // --------------------------------------------------------

      const res =
        await fetch(
          `/api/admin/users/${id}/permissions`,
          {
            cache: "no-store",
            credentials:
              "include",
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "No se pudieron cargar los permisos del usuario."
        );
      }

      // --------------------------------------------------------
      // MÓDULOS
      // --------------------------------------------------------

      for (
        const mp of
          data.modulePermissions ||
          []
      ) {
        const moduleId =
          String(
            mp.ModuleId ??
              mp.moduleId ??
              ""
          );

        if (
          moduleId &&
          isAllowed(mp)
        ) {
          ma[moduleId] =
            true;
        }
      }

      // --------------------------------------------------------
      // SUBMÓDULOS
      // --------------------------------------------------------

      for (
        const p of
          data.permissions || []
      ) {
        const subModuleId =
          String(
            p.SubModuleId ??
              p.subModuleId ??
              p.submoduleId ??
              p.submoduleid ??
              ""
          );

        if (
          !subModuleId ||
          !isAllowed(p)
        ) {
          continue;
        }

        for (
          const m of
            workingModules
        ) {
          const moduleId =
            String(m.id);

          const exists =
            (
              m.submodules ||
              []
            ).some(
              (s) =>
                String(
                  s.id
                ) ===
                subModuleId
            );

          if (exists) {
            sa[
              subKey(
                moduleId,
                subModuleId
              )
            ] = true;

            ma[moduleId] =
              true;
          }
        }
      }

      // --------------------------------------------------------
      // PRINCIPIOS
      // --------------------------------------------------------

      for (
        const pp of
          data.principlePermissions ||
          []
      ) {
        const subModuleId =
          String(
            pp.SubModuleId ??
              pp.subModuleId ??
              ""
          );

        const principioId =
          String(
            pp.PrincipioId ??
              pp.principioId ??
              ""
          );

        if (
          !subModuleId ||
          !principioId ||
          !isAllowed(pp)
        ) {
          continue;
        }

        for (
          const m of
            workingModules
        ) {
          const moduleId =
            String(m.id);

          const exists =
            (
              m.submodules ||
              []
            ).some(
              (s) =>
                String(
                  s.id
                ) ===
                subModuleId
            );

          if (exists) {
            pa[
              principleKey(
                moduleId,
                subModuleId,
                principioId
              )
            ] = true;

            sa[
              subKey(
                moduleId,
                subModuleId
              )
            ] = true;

            ma[moduleId] =
              true;
          }
        }
      }

      // --------------------------------------------------------
      // PREGUNTAS SISTEMA ADMINISTRATIVO
      // --------------------------------------------------------

      const questionPermissions =
        data.questionPermissions ||
        data.questions ||
        [];

      for (
        const qp of
          questionPermissions
      ) {
        const subModuleId =
          String(
            qp.SubModuleId ??
              qp.subModuleId ??
              ""
          );

        const questionId =
          String(
            qp.QuestionId ??
              qp.questionId ??
              qp.PreguntaId ??
              qp.preguntaId ??
              ""
          );

        if (
          !subModuleId ||
          !questionId ||
          !isAllowed(qp)
        ) {
          continue;
        }

        for (
          const m of
            workingModules
        ) {
          const moduleId =
            String(m.id);

          const sub =
            (
              m.submodules ||
              []
            ).find(
              (s) =>
                String(
                  s.id
                ) ===
                subModuleId
            );

          if (
            sub &&
            !isPrincipleSubmodule(
              sub
            )
          ) {
            qa[
              questionKey(
                moduleId,
                subModuleId,
                questionId
              )
            ] = true;

            sa[
              subKey(
                moduleId,
                subModuleId
              )
            ] = true;

            ma[moduleId] =
              true;
          }
        }
      }

      // --------------------------------------------------------
      // PREGUNTAS POR COMPONENTES
      //
      // La API de permisos todavía la modificaremos en el
      // siguiente paso para devolver este arreglo.
      // --------------------------------------------------------

      const principleQuestionPermissions =
        data.principleQuestionPermissions ||
        [];

      for (
        const qp of
          principleQuestionPermissions
      ) {
        const subModuleId =
          String(
            qp.SubModuleId ??
              qp.subModuleId ??
              ""
          );

        const questionId =
          String(
            qp.QuestionId ??
              qp.questionId ??
              ""
          );

        if (
          !subModuleId ||
          !questionId ||
          !isAllowed(qp)
        ) {
          continue;
        }

        for (
          const m of
            workingModules
        ) {
          const moduleId =
            String(m.id);

          const sub =
            (
              m.submodules ||
              []
            ).find(
              (s) =>
                String(
                  s.id
                ) ===
                subModuleId
            );

          if (
            sub &&
            isPrincipleSubmodule(
              sub
            )
          ) {
            pqa[
              principleQuestionKey(
                moduleId,
                subModuleId,
                questionId
              )
            ] = true;

            sa[
              subKey(
                moduleId,
                subModuleId
              )
            ] = true;

            ma[moduleId] =
              true;
          }
        }
      }

      setModuleAccess(ma);
      setSubmoduleAccess(sa);
      setPrincipleAccess(pa);

      setQuestionAccess(qa);

      setPrincipleQuestionAccess(
        pqa
      );

      // --------------------------------------------------------
      // ABRIR AUTOMÁTICAMENTE SUBMÓDULOS PERMITIDOS
      // --------------------------------------------------------

      const abiertos: Record<
        string,
        boolean
      > = {};

      for (
        const [
          key,
          allowed,
        ] of Object.entries(sa)
      ) {
        if (allowed) {
          abiertos[key] =
            true;
        }
      }

      setOpenSubmodules(
        abiertos
      );

      // Abrir principios permitidos.
      const principiosAbiertos: Record<
        string,
        boolean
      > = {};

      for (
        const [
          key,
          allowed,
        ] of Object.entries(pa)
      ) {
        if (allowed) {
          principiosAbiertos[
            key
          ] = true;
        }
      }

      setOpenPrinciples(
        principiosAbiertos
      );
    } catch (error) {
      console.error(
        "Error cargando usuario:",
        error
      );

      await Swal.fire({
        icon: "error",
        title:
          "No se pudo cargar el usuario",

        text:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",

        confirmButtonColor:
          "#0B4DA2",
      });
    } finally {
      setLoadingUser(false);
    }
  }

  // ============================================================
  // INTERPRETAR CAN VIEW
  // ============================================================

  function isAllowed(
    permission: any
  ) {
    return (
      permission?.CanView ===
        true ||
      permission?.CanView ===
        1 ||
      permission?.CanView ===
        "1" ||
      permission?.canView ===
        true ||
      permission?.canView ===
        1 ||
      permission?.canView ===
        "1"
    );
  }

  // ============================================================
  // TOGGLE MÓDULO
  // ============================================================

  function toggleModule(
    moduleId: string
  ) {
    const mod =
      modules.find(
        (m) =>
          String(m.id) ===
          String(moduleId)
      );

    if (!mod) return;

    const id =
      String(moduleId);

    const turningOn =
      !moduleAccess[id];

    setModuleAccess(
      (prev) => ({
        ...prev,
        [id]: turningOn,
      })
    );

    if (!turningOn) {
      setSubmoduleAccess(
        (prev) => {
          const next = {
            ...prev,
          };

          for (
            const s of
              mod.submodules ||
              []
          ) {
            next[
              subKey(
                id,
                String(s.id)
              )
            ] = false;
          }

          return next;
        }
      );

      setPrincipleAccess(
        (prev) => {
          const next = {
            ...prev,
          };

          for (
            const s of
              mod.submodules ||
              []
          ) {
            for (
              const p of
                s.principles ||
                []
            ) {
              next[
                principleKey(
                  id,
                  String(s.id),
                  String(p.id)
                )
              ] = false;
            }
          }

          return next;
        }
      );

      // Sistema Administrativo
      setQuestionAccess(
        (prev) => {
          const next = {
            ...prev,
          };

          for (
            const s of
              mod.submodules ||
              []
          ) {
            if (
              isPrincipleSubmodule(
                s
              )
            ) {
              continue;
            }

            for (
              const q of
                s.questions ||
                []
            ) {
              next[
                questionKey(
                  id,
                  String(s.id),
                  String(q.id)
                )
              ] = false;
            }
          }

          return next;
        }
      );

      // Por Componentes
      setPrincipleQuestionAccess(
        (prev) => {
          const next = {
            ...prev,
          };

          for (
            const s of
              mod.submodules ||
              []
          ) {
            if (
              !isPrincipleSubmodule(
                s
              )
            ) {
              continue;
            }

            for (
              const q of
                s.questions ||
                []
            ) {
              next[
                principleQuestionKey(
                  id,
                  String(s.id),
                  String(q.id)
                )
              ] = false;
            }
          }

          return next;
        }
      );
    }
  }

  // ============================================================
  // TOGGLE SUBMÓDULO
  // ============================================================

  function toggleSubmodule(
    subId: string,
    moduleId: string
  ) {
    const moduleKey =
      String(moduleId);

    const subModuleKey =
      String(subId);

    const sk =
      subKey(
        moduleKey,
        subModuleKey
      );

    const turningOn =
      !submoduleAccess[sk];

    setSubmoduleAccess(
      (prev) => ({
        ...prev,
        [sk]: turningOn,
      })
    );

    setModuleAccess(
      (prev) => ({
        ...prev,
        [moduleKey]: true,
      })
    );

    setOpenSubmodules(
      (prev) => ({
        ...prev,
        [sk]: turningOn,
      })
    );

    if (!turningOn) {
      const mod =
        modules.find(
          (m) =>
            String(m.id) ===
            moduleKey
        );

      const sub =
        mod?.submodules?.find(
          (s) =>
            String(s.id) ===
            subModuleKey
        );

      if (sub) {
        setPrincipleAccess(
          (prev) => {
            const next = {
              ...prev,
            };

            for (
              const p of
                sub.principles ||
                []
            ) {
              next[
                principleKey(
                  moduleKey,
                  subModuleKey,
                  String(p.id)
                )
              ] = false;
            }

            return next;
          }
        );

        if (
          isPrincipleSubmodule(
            sub
          )
        ) {
          setPrincipleQuestionAccess(
            (prev) => {
              const next = {
                ...prev,
              };

              for (
                const q of
                  sub.questions ||
                  []
              ) {
                next[
                  principleQuestionKey(
                    moduleKey,
                    subModuleKey,
                    String(q.id)
                  )
                ] = false;
              }

              return next;
            }
          );
        } else {
          setQuestionAccess(
            (prev) => {
              const next = {
                ...prev,
              };

              for (
                const q of
                  sub.questions ||
                  []
              ) {
                next[
                  questionKey(
                    moduleKey,
                    subModuleKey,
                    String(q.id)
                  )
                ] = false;
              }

              return next;
            }
          );
        }
      }
    }
  }

  // ============================================================
  // TOGGLE PRINCIPIO
  // ============================================================

  function togglePrinciple(
    principleId: string,
    subId: string,
    moduleId: string
  ) {
    const moduleKey =
      String(moduleId);

    const subModuleKey =
      String(subId);

    const sk =
      subKey(
        moduleKey,
        subModuleKey
      );

    const pk =
      principleKey(
        moduleKey,
        subModuleKey,
        String(principleId)
      );

    const turningOn =
      !principleAccess[pk];

    setPrincipleAccess(
      (prev) => ({
        ...prev,
        [pk]: turningOn,
      })
    );

    setSubmoduleAccess(
      (prev) => ({
        ...prev,
        [sk]: true,
      })
    );

    setModuleAccess(
      (prev) => ({
        ...prev,
        [moduleKey]: true,
      })
    );

    setOpenPrinciples(
      (prev) => ({
        ...prev,
        [pk]: turningOn,
      })
    );

    // Si quitamos el principio, quitamos también
    // todas las preguntas que pertenecen a él.
    if (!turningOn) {
      const mod =
        modules.find(
          (m) =>
            String(m.id) ===
            moduleKey
        );

      const sub =
        mod?.submodules?.find(
          (s) =>
            String(s.id) ===
            subModuleKey
        );

      if (sub) {
        const preguntasPrincipio =
          (
            sub.questions || []
          ).filter(
            (q) =>
              String(
                q.parentId
              ) ===
              String(
                principleId
              )
          );

        setPrincipleQuestionAccess(
          (prev) => {
            const next = {
              ...prev,
            };

            for (
              const q of
                preguntasPrincipio
            ) {
              next[
                principleQuestionKey(
                  moduleKey,
                  subModuleKey,
                  String(q.id)
                )
              ] = false;
            }

            return next;
          }
        );
      }
    }
  }

  // ============================================================
  // TOGGLE PREGUNTA SISTEMA ADMINISTRATIVO
  // ============================================================

  function toggleQuestion(
    questionId: string,
    subId: string,
    moduleId: string
  ) {
    const moduleKey =
      String(moduleId);

    const subModuleKey =
      String(subId);

    const sk =
      subKey(
        moduleKey,
        subModuleKey
      );

    const qk =
      questionKey(
        moduleKey,
        subModuleKey,
        String(questionId)
      );

    setQuestionAccess(
      (prev) => ({
        ...prev,
        [qk]: !prev[qk],
      })
    );

    setSubmoduleAccess(
      (prev) => ({
        ...prev,
        [sk]: true,
      })
    );

    setModuleAccess(
      (prev) => ({
        ...prev,
        [moduleKey]: true,
      })
    );
  }

  // ============================================================
  // TOGGLE PREGUNTA POR COMPONENTES
  // ============================================================

  function togglePrincipleQuestion(
    questionId: string,
    principleId: string,
    subId: string,
    moduleId: string
  ) {
    const moduleKey =
      String(moduleId);

    const subModuleKey =
      String(subId);

    const principleIdKey =
      String(principleId);

    const sk =
      subKey(
        moduleKey,
        subModuleKey
      );

    const pk =
      principleKey(
        moduleKey,
        subModuleKey,
        principleIdKey
      );

    const qk =
      principleQuestionKey(
        moduleKey,
        subModuleKey,
        String(questionId)
      );

    const turningOn =
      !principleQuestionAccess[
        qk
      ];

    setPrincipleQuestionAccess(
      (prev) => ({
        ...prev,
        [qk]: turningOn,
      })
    );

    // Si asignamos una pregunta, automáticamente
    // permitimos principio, submódulo y módulo.
    if (turningOn) {
      setPrincipleAccess(
        (prev) => ({
          ...prev,
          [pk]: true,
        })
      );

      setSubmoduleAccess(
        (prev) => ({
          ...prev,
          [sk]: true,
        })
      );

      setModuleAccess(
        (prev) => ({
          ...prev,
          [moduleKey]: true,
        })
      );

      setOpenPrinciples(
        (prev) => ({
          ...prev,
          [pk]: true,
        })
      );
    }
  }

  // ============================================================
  // PAYLOAD MÓDULOS
  // ============================================================

  function buildModulesPayload() {
    return Object.entries(
      moduleAccess
    )
      .filter(
        ([, allowed]) =>
          allowed
      )
      .map(([moduleId]) => ({
        moduleId:
          Number(moduleId),

        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      }));
  }

  // ============================================================
  // PAYLOAD SUBMÓDULOS
  // ============================================================

  function buildPermissionsPayload() {
    return Object.entries(
      submoduleAccess
    )
      .filter(
        ([, allowed]) =>
          allowed
      )
      .map(([key]) => {
        const [
          ,
          subModuleId,
        ] = key.split("-");

        return {
          subModuleId:
            Number(
              subModuleId
            ),

          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        };
      });
  }

  // ============================================================
  // PAYLOAD PRINCIPIOS
  // ============================================================

  function buildPrinciplesPayload() {
    return Object.entries(
      principleAccess
    )
      .filter(
        ([, allowed]) =>
          allowed
      )
      .map(([key]) => {
        const [
          ,
          subModuleId,
          principleId,
        ] = key.split("-");

        return {
          subModuleId:
            Number(
              subModuleId
            ),

          principleId:
            Number(
              principleId
            ),

          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        };
      });
  }

  // ============================================================
  // PAYLOAD PREGUNTAS SISTEMA ADMINISTRATIVO
  // ============================================================

  function buildQuestionsPayload() {
    return Object.entries(
      questionAccess
    )
      .filter(
        ([, allowed]) =>
          allowed
      )
      .map(([key]) => {
        const [
          ,
          subModuleId,
          questionId,
        ] = key.split("-");

        return {
          subModuleId:
            Number(
              subModuleId
            ),

          questionId:
            Number(
              questionId
            ),

          canView: true,
          canCreate: false,
          canEdit: true,
          canDelete: false,
        };
      });
  }

  // ============================================================
  // PAYLOAD PREGUNTAS POR COMPONENTES
  // ============================================================

  function buildPrincipleQuestionsPayload() {
    return Object.entries(
      principleQuestionAccess
    )
      .filter(
        ([, allowed]) =>
          allowed
      )
      .map(([key]) => {
        const [
          ,
          subModuleId,
          questionId,
        ] = key.split("-");

        return {
          subModuleId:
            Number(
              subModuleId
            ),

          questionId:
            Number(
              questionId
            ),

          canView: true,
          canCreate: false,
          canEdit: true,
          canDelete: false,
        };
      });
  }

  // ============================================================
  // VALIDAR
  // ============================================================

  async function validarFormulario() {
    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.cargo.trim() ||
      !form.role.trim()
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Faltan datos",
        text:
          "Complete Nombre, Correo institucional, Cargo y Rol.",
        confirmButtonColor:
          "#0B4DA2",
      });

      return false;
    }

 

    if (
      !form.email
        .toLowerCase()
        .endsWith(
          "@uncsm.edu.ni"
        )
    ) {
      await Swal.fire({
        icon: "warning",
        title:
          "Correo inválido",
        text:
          "Debe ingresar un correo institucional @uncsm.edu.ni.",
        confirmButtonColor:
          "#0B4DA2",
      });

      return false;
    }

    return true;
  }

  // ============================================================
  // CREAR USUARIO
  // ============================================================

  async function handleCreateUser() {
    const valido =
      await validarFormulario();

    if (!valido) return;

    const confirm =
      await Swal.fire({
        icon: "question",
        title:
          "¿Crear usuario?",
        text:
          "Se guardará el usuario y sus permisos en el sistema.",
        showCancelButton: true,
        confirmButtonText:
          "Sí, crear",
        cancelButtonText:
          "Cancelar",
        confirmButtonColor:
          "#16a34a",
        cancelButtonColor:
          "#64748b",
      });

    if (
      !confirm.isConfirmed
    ) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
  email:
    form.email.trim(),

  full_name:
    form.full_name.trim(),

  cargo:
    form.cargo.trim(),

  roleKey:
    form.role,

  is_active:
    form.is_active,

  modules:
    buildModulesPayload(),

  permissions:
    buildPermissionsPayload(),

  principles:
    buildPrinciplesPayload(),

  // Sistema Administrativo
  questions:
    buildQuestionsPayload(),

  // Por Componentes
  principleQuestions:
    buildPrincipleQuestionsPayload(),
};

    

      const res =
        await fetch(
          "/api/admin/users/create",
          {
            method: "POST",
            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            data?.error ||
            "No se pudo crear el usuario."
        );
      }

     if (data.emailSent) {
  await Swal.fire({
    icon: "success",
    title: "Usuario creado",
    html: `
      <div style="text-align:center">
        <p>
          El usuario fue registrado correctamente.
        </p>

        <p style="margin-top:10px">
          Se envió un correo a:
        </p>

        <strong>
          ${form.email.trim()}
        </strong>

        <p style="margin-top:10px">
          con su contraseña temporal y las
          instrucciones para ingresar al SCI.
        </p>
      </div>
    `,
    confirmButtonText: "Aceptar",
    confirmButtonColor:
      "#16a34a",
  });
} else {
  await Swal.fire({
    icon: "warning",
    title:
      "Usuario creado",
    text:
      data.warning ||
      "El usuario fue creado, pero no fue posible enviar el correo de bienvenida.",
    confirmButtonColor:
      "#f59e0b",
  });
}

      router.push(
        "/dashboard/permisos"
      );

      router.refresh();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title:
          "No se pudo crear",

        text:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",

        confirmButtonColor:
          "#dc2626",
      });
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // ACTUALIZAR USUARIO
  // ============================================================

  async function handleUpdateUser() {
    if (!userId) {
      return;
    }

    const valido =
      await validarFormulario();

    if (!valido) return;

    const confirm =
      await Swal.fire({
        icon: "question",
        title:
          "¿Actualizar usuario?",
        text:
          "Se actualizarán los datos y permisos asignados al usuario.",
        showCancelButton: true,
        confirmButtonText:
          "Sí, actualizar",
        cancelButtonText:
          "Cancelar",
        confirmButtonColor:
          "#0B4DA2",
        cancelButtonColor:
          "#64748b",
      });

    if (
      !confirm.isConfirmed
    ) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        id: userId,

        email:
          form.email.trim(),

        full_name:
          form.full_name.trim(),

        cargo:
          form.cargo.trim(),

        password:
          form.password,

        roleKey:
          form.role,

        is_active:
          form.is_active,

        modules:
          buildModulesPayload(),

        permissions:
          buildPermissionsPayload(),

        principles:
          buildPrinciplesPayload(),

        // Sistema Administrativo
        questions:
          buildQuestionsPayload(),

        // Por Componentes
        principleQuestions:
          buildPrincipleQuestionsPayload(),
      };

      console.log(
        "PAYLOAD ACTUALIZAR:",
        payload
      );

      const res =
        await fetch(
          `/api/admin/users/${userId}`,
          {
            method: "PUT",
            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            data?.error ||
            "No se pudo actualizar el usuario."
        );
      }

      await Swal.fire({
        icon: "success",
        title:
          "Usuario actualizado",
        text:
          "Los datos y permisos fueron actualizados correctamente.",
        confirmButtonColor:
          "#16a34a",
      });

      router.push(
        "/dashboard/permisos"
      );

      router.refresh();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title:
          "No se pudo actualizar",

        text:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",

        confirmButtonColor:
          "#dc2626",
      });
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // LOADER
  // ============================================================

  if (
    isEdit &&
    loadingUser
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>

          <p className="mt-4 font-semibold text-slate-700">
            Cargando usuario
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Recuperando datos y permisos...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ====================================================== */}
      {/* DATOS DEL USUARIO */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Información del Usuario
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Ingrese la información general y las credenciales de acceso.
              </p>
            </div>

          </div>

        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">

          {/* NOMBRE */}

          <div className="space-y-2">

            <label className="text-sm font-semibold text-slate-700">
              Nombre Completo

              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <Input
              placeholder="Nombre del usuario"
              value={
                form.full_name
              }
              disabled={saving}
              onChange={(e) =>
                setForm(
                  (prev) => ({
                    ...prev,
                    full_name:
                      e.target.value,
                  })
                )
              }
              className="h-11 rounded-xl"
            />

          </div>

          {/* CORREO */}

          <div className="space-y-2">

            <label className="text-sm font-semibold text-slate-700">
              Correo institucional

              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <Input
              type="email"
              placeholder="nombre.apellido@uncsm.edu.ni"
              value={
                form.email
              }
              disabled={saving}
              onChange={(e) =>
                setForm(
                  (prev) => ({
                    ...prev,
                    email:
                      e.target.value,
                  })
                )
              }
              className="h-11 rounded-xl"
            />

          </div>

          {/* CARGO */}

          <div className="space-y-2">

            <label className="text-sm font-semibold text-slate-700">
              Cargo

              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={
                form.cargo
              }
              disabled={saving}
              onChange={(e) =>
                setForm(
                  (prev) => ({
                    ...prev,
                    cargo:
                      e.target.value,
                  })
                )
              }
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                Seleccione un cargo
              </option>

              {cargos.map(
                (cargo) => (
                  <option
                    key={
                      cargo.Id
                    }
                    value={
                      cargo.NombreCargo
                    }
                  >
                    {
                      cargo.NombreCargo
                    }
                  </option>
                )
              )}

            </select>

          </div>

          {/* ROL */}

          <div className="space-y-2">

            <label className="text-sm font-semibold text-slate-700">
              Rol

              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={
                form.role
              }
              disabled={saving}
              onChange={(e) =>
                setForm(
                  (prev) => ({
                    ...prev,
                    role:
                      e.target.value,
                  })
                )
              }
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {roles.map(
                (r) => (
                  <option
                    key={
                      r.RoleId
                    }
                    value={
                      r.RoleKey
                    }
                  >
                    {
                      r.RoleName
                    }
                  </option>
                )
              )}

            </select>

          </div>

        {/* CONTRASEÑA / CREDENCIALES */}

<div className="space-y-2 md:col-span-2">

  {isEdit ? (
    <>
      <label className="text-sm font-semibold text-slate-700">
        Nueva contraseña provisional
      </label>

      <div className="relative">

        <Input
          type={
            showPassword
              ? "text"
              : "password"
          }
          placeholder="Dejar vacío para conservar la contraseña actual"
          value={
            form.password
          }
          disabled={saving}
          onChange={(e) =>
            setForm(
              (prev) => ({
                ...prev,
                password:
                  e.target.value,
              })
            )
          }
          className="h-11 rounded-xl pr-11"
        />

        <button
          type="button"
          disabled={saving}
          onClick={() =>
            setShowPassword(
              (prev) =>
                !prev
            )
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={
            showPassword
              ? "Ocultar contraseña"
              : "Mostrar contraseña"
          }
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>

      </div>

      <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">

        <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />

        <p>
          Si establece una nueva contraseña,
          será provisional y el usuario deberá
          cambiarla al iniciar sesión. Déjela
          vacía para conservar la contraseña actual.
        </p>

      </div>
    </>
  ) : (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">

      <div className="flex items-start gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <KeyRound className="h-5 w-5" />
        </div>

        <div>

          <p className="text-sm font-bold text-blue-900">
            Contraseña temporal automática
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            Al crear el usuario, el sistema
            generará automáticamente una contraseña
            temporal segura y la enviará al correo
            institucional indicado.
          </p>

          <p className="mt-2 text-xs font-medium text-blue-800">
            El usuario deberá cambiar esta contraseña
            durante su primer ingreso al SCI.
          </p>

        </div>

      </div>

    </div>
  )}

</div>

          {/* ESTADO */}

          <div className="space-y-2 md:col-span-2">

            <label className="text-sm font-semibold text-slate-700">
              Estado del usuario
            </label>

            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setForm(
                    (prev) => ({
                      ...prev,
                      is_active:
                        !prev.is_active,
                    })
                  )
                }
                className={`
                  relative inline-flex
                  h-7 w-12
                  items-center
                  rounded-full
                  transition-colors
                  duration-200

                  ${
                    form.is_active
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }
                `}
              >

                <span
                  className={`
                    inline-block
                    h-5 w-5
                    rounded-full
                    bg-white
                    shadow-sm
                    transition-transform
                    duration-200

                    ${
                      form.is_active
                        ? "translate-x-6"
                        : "translate-x-1"
                    }
                  `}
                />

              </button>

              <div>

                <p
                  className={`
                    text-sm font-bold

                    ${
                      form.is_active
                        ? "text-emerald-700"
                        : "text-slate-600"
                    }
                  `}
                >
                  {form.is_active
                    ? "Usuario activo"
                    : "Usuario inactivo"}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {form.is_active
                    ? "El usuario podrá acceder al sistema según los permisos asignados."
                    : "El usuario no podrá acceder al sistema."}
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ====================================================== */}
      {/* PERMISOS */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Permisos de Acceso
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Seleccione módulos, submódulos, principios y preguntas que podrá consultar el usuario.
              </p>

            </div>

          </div>

        </div>

        <div className="p-6">

          {modulesLoading ? (

            <div className="flex min-h-[180px] items-center justify-center">

              <div className="text-center">

                <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  Cargando módulos...
                </p>

              </div>

            </div>

          ) : modules.length === 0 ? (

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

              <Layers3 className="mx-auto h-8 w-8 text-slate-400" />

              <p className="mt-3 font-semibold text-slate-700">
                No hay módulos disponibles
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Revise la API /api/admin/modules.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {modules.map(
                (m) => {
                  const moduleId =
                    String(m.id);

                  const allowed =
                    !!moduleAccess[
                      moduleId
                    ];

                  const moduleOpen =
                    !!openModules[
                      moduleId
                    ];

                  const hasSubmodules =
                    (
                      m.submodules
                        ?.length ??
                      0
                    ) > 0;

                  return (
                    <div
                      key={m.id}
                      className={`
                        overflow-hidden
                        rounded-xl
                        border
                        transition-all

                        ${
                          allowed
                            ? "border-emerald-200 bg-emerald-50/20"
                            : "border-slate-200 bg-white"
                        }
                      `}
                    >

                      {/* MÓDULO */}

                      <div className="flex items-center justify-between gap-4 p-4">

                        <div className="flex items-center gap-3">

                          {hasSubmodules ? (
                            <button
                              type="button"
                              onClick={() =>
                                toggleOpenModule(
                                  moduleId
                                )
                              }
                              className="
                                flex h-8 w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                bg-slate-100
                                text-slate-600
                                transition-all
                                hover:bg-blue-100
                                hover:text-blue-700
                              "
                            >
                              {moduleOpen ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <div className="h-8 w-8 shrink-0" />
                          )}

                          <div
                            className={`
                              flex h-9 w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg

                              ${
                                allowed
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }
                            `}
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </div>

                          <div>

                            <p className="font-semibold text-slate-800">
                              {m.name}
                            </p>

                            {hasSubmodules && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {m.submodules.length} opciones disponibles
                              </p>
                            )}

                          </div>

                        </div>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            toggleModule(
                              moduleId
                            )
                          }
                          className={`
                            inline-flex
                            min-w-[92px]
                            items-center
                            justify-center
                            rounded-full
                            px-3 py-1.5
                            text-xs
                            font-bold
                            transition-all

                            ${
                              allowed
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }
                          `}
                        >
                          {allowed
                            ? "Permitido"
                            : "Denegado"}
                        </button>

                      </div>

                      {/* SUBMÓDULOS */}

                      {moduleOpen &&
                        hasSubmodules && (
                          <div className="border-t border-slate-100 bg-white">

                            {m.submodules.map(
                              (s) => {
                                const subId =
                                  String(
                                    s.id
                                  );

                                const sk =
                                  subKey(
                                    moduleId,
                                    subId
                                  );

                                const sAllowed =
                                  !!submoduleAccess[
                                    sk
                                  ];

                                const abierto =
                                  !!openSubmodules[
                                    sk
                                  ];

                                const tienePrincipios =
                                  (
                                    s.principles
                                      ?.length ??
                                    0
                                  ) > 0;

                                const tienePreguntas =
                                  (
                                    s.questions
                                      ?.length ??
                                    0
                                  ) > 0;

                                const tieneDetalle =
                                  tienePrincipios ||
                                  tienePreguntas;

                                return (
                                  <div
                                    key={
                                      sk
                                    }
                                    className="border-t border-slate-100 first:border-t-0"
                                  >

                                    {/* SUBMÓDULO */}

                                    <div className="flex items-center gap-3 px-5 py-3">

                                      {tieneDetalle ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleOpenSubmodule(
                                              sk
                                            )
                                          }
                                          disabled={
                                            !sAllowed
                                          }
                                          className={`
                                            flex h-8 w-8
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-lg
                                            transition

                                            ${
                                              sAllowed
                                                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                : "cursor-not-allowed bg-slate-50 text-slate-300"
                                            }
                                          `}
                                        >
                                          {abierto ? (
                                            <ChevronUp className="h-4 w-4" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4" />
                                          )}
                                        </button>
                                      ) : (
                                        <div className="h-8 w-8" />
                                      )}

                                      <div className="min-w-0 flex-1">

                                        <p className="text-sm font-medium text-slate-700">
                                          {s.name}
                                        </p>

                                        {tienePrincipios ? (
                                          <p className="mt-0.5 text-[11px] text-slate-400">
                                            {s.principles.length} principios
                                          </p>
                                        ) : tienePreguntas ? (
                                          <p className="mt-0.5 text-[11px] text-slate-400">
                                            {s.questions.length} preguntas
                                          </p>
                                        ) : null}

                                      </div>

                                      <button
                                        type="button"
                                        disabled={
                                          saving
                                        }
                                        onClick={() =>
                                          toggleSubmodule(
                                            subId,
                                            moduleId
                                          )
                                        }
                                        className={`
                                          inline-flex
                                          min-w-[92px]
                                          items-center
                                          justify-center
                                          rounded-full
                                          px-3 py-1.5
                                          text-xs
                                          font-bold
                                          transition

                                          ${
                                            sAllowed
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-red-100 text-red-700"
                                          }
                                        `}
                                      >
                                        {sAllowed
                                          ? "Permitido"
                                          : "Denegado"}
                                      </button>

                                    </div>

                                    {/* DETALLE */}

                                    {sAllowed &&
                                      abierto &&
                                      tieneDetalle && (
                                        <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 md:px-10">

                                          {/* ================================= */}
                                          {/* POR COMPONENTES                  */}
                                          {/* PRINCIPIOS + SUS PREGUNTAS       */}
                                          {/* ================================= */}

                                          {tienePrincipios && (
                                            <div className="space-y-3">

                                              <div className="mb-3 flex items-center gap-2">

                                                <ListChecks className="h-4 w-4 text-blue-600" />

                                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                  Principios y preguntas
                                                </p>

                                              </div>

                                              {s.principles.map(
                                                (p) => {
                                                  const pk =
                                                    principleKey(
                                                      moduleId,
                                                      subId,
                                                      String(
                                                        p.id
                                                      )
                                                    );

                                                  const pAllowed =
                                                    !!principleAccess[
                                                      pk
                                                    ];

                                                  const principioAbierto =
                                                    !!openPrinciples[
                                                      pk
                                                    ];

                                                  // IMPORTANTE:
                                                  // parentId identifica el principio
                                                  // al que pertenece la pregunta.
                                                  const preguntasPrincipio =
                                                    (
                                                      s.questions ||
                                                      []
                                                    ).filter(
                                                      (
                                                        q
                                                      ) =>
                                                        String(
                                                          q.parentId
                                                        ) ===
                                                        String(
                                                          p.id
                                                        )
                                                    );

                                                  return (
                                                    <div
                                                      key={
                                                        pk
                                                      }
                                                      className={`
                                                        overflow-hidden
                                                        rounded-xl
                                                        border
                                                        bg-white
                                                        transition

                                                        ${
                                                          pAllowed
                                                            ? "border-blue-200"
                                                            : "border-slate-200"
                                                        }
                                                      `}
                                                    >

                                                      {/* PRINCIPIO */}

                                                      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">

                                                        <div className="flex min-w-0 flex-1 gap-3">

                                                          {/* DESPLEGAR PREGUNTAS */}

                                                          {preguntasPrincipio.length >
                                                          0 ? (
                                                            <button
                                                              type="button"
                                                              disabled={
                                                                !pAllowed
                                                              }
                                                              onClick={() =>
                                                                toggleOpenPrinciple(
                                                                  pk
                                                                )
                                                              }
                                                              className={`
                                                                mt-0.5
                                                                flex
                                                                h-8
                                                                w-8
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-lg
                                                                transition

                                                                ${
                                                                  pAllowed
                                                                    ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                                    : "cursor-not-allowed bg-slate-50 text-slate-300"
                                                                }
                                                              `}
                                                            >
                                                              {principioAbierto ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                              ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                              )}
                                                            </button>
                                                          ) : (
                                                            <div className="h-8 w-8 shrink-0" />
                                                          )}

                                                          <div className="min-w-0">

                                                            <p className="text-sm font-semibold text-slate-800">
                                                              {p.title}
                                                            </p>

                                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                              {p.number}.{" "}
                                                              {p.text}
                                                            </p>

                                                            <p className="mt-2 text-[11px] font-medium text-blue-600">
                                                              {
                                                                preguntasPrincipio.length
                                                              }{" "}
                                                              {preguntasPrincipio.length ===
                                                              1
                                                                ? "pregunta asociada"
                                                                : "preguntas asociadas"}
                                                            </p>

                                                          </div>

                                                        </div>

                                                        <button
                                                          type="button"
                                                          disabled={
                                                            saving
                                                          }
                                                          onClick={() =>
                                                            togglePrinciple(
                                                              String(
                                                                p.id
                                                              ),
                                                              subId,
                                                              moduleId
                                                            )
                                                          }
                                                          className={`
                                                            inline-flex
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            px-3
                                                            py-1.5
                                                            text-xs
                                                            font-bold

                                                            ${
                                                              pAllowed
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : "bg-red-100 text-red-700"
                                                            }
                                                          `}
                                                        >
                                                          {pAllowed
                                                            ? "Permitido"
                                                            : "Denegado"}
                                                        </button>

                                                      </div>

                                                      {/* PREGUNTAS DEL PRINCIPIO */}

                                                      {pAllowed &&
                                                        principioAbierto &&
                                                        preguntasPrincipio.length >
                                                          0 && (
                                                          <div className="border-t border-blue-100 bg-blue-50/30 px-4 py-4 sm:px-6">

                                                            <div className="mb-3 flex items-center gap-2">

                                                              <CircleHelp className="h-4 w-4 text-blue-500" />

                                                              <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
                                                                Preguntas asignables
                                                              </p>

                                                            </div>

                                                            <div className="space-y-2">

                                                              {preguntasPrincipio.map(
                                                                (
                                                                  q
                                                                ) => {
                                                                  const qk =
                                                                    principleQuestionKey(
                                                                      moduleId,
                                                                      subId,
                                                                      String(
                                                                        q.id
                                                                      )
                                                                    );

                                                                  const qAllowed =
                                                                    !!principleQuestionAccess[
                                                                      qk
                                                                    ];

                                                                  return (
                                                                    <div
                                                                      key={
                                                                        qk
                                                                      }
                                                                      className={`
                                                                        flex
                                                                        flex-col
                                                                        gap-3
                                                                        rounded-lg
                                                                        border
                                                                        p-3
                                                                        sm:flex-row
                                                                        sm:items-start
                                                                        sm:justify-between

                                                                        ${
                                                                          qAllowed
                                                                            ? "border-emerald-200 bg-emerald-50/40"
                                                                            : "border-slate-200 bg-white"
                                                                        }
                                                                      `}
                                                                    >

                                                                      <div className="min-w-0 flex-1">

                                                                        <p className="text-xs font-bold text-slate-700">
                                                                          Pregunta{" "}
                                                                          {
                                                                            q.number
                                                                          }
                                                                        </p>

                                                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                                                          {
                                                                            q.text
                                                                          }
                                                                        </p>

                                                                      </div>

                                                                      <button
                                                                        type="button"
                                                                        disabled={
                                                                          saving
                                                                        }
                                                                        onClick={() =>
                                                                          togglePrincipleQuestion(
                                                                            String(
                                                                              q.id
                                                                            ),
                                                                            String(
                                                                              p.id
                                                                            ),
                                                                            subId,
                                                                            moduleId
                                                                          )
                                                                        }
                                                                        className={`
                                                                          inline-flex
                                                                          shrink-0
                                                                          items-center
                                                                          justify-center
                                                                          rounded-full
                                                                          px-3
                                                                          py-1.5
                                                                          text-[11px]
                                                                          font-bold
                                                                          transition

                                                                          ${
                                                                            qAllowed
                                                                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                                              : "bg-red-100 text-red-700 hover:bg-red-200"
                                                                          }
                                                                        `}
                                                                      >
                                                                        {qAllowed
                                                                          ? "Permitida"
                                                                          : "Denegada"}
                                                                      </button>

                                                                    </div>
                                                                  );
                                                                }
                                                              )}

                                                            </div>

                                                          </div>
                                                        )}

                                                    </div>
                                                  );
                                                }
                                              )}

                                            </div>
                                          )}

                                          {/* ================================= */}
                                          {/* SISTEMA ADMINISTRATIVO            */}
                                          {/* PREGUNTAS SIN PRINCIPIOS          */}
                                          {/* ================================= */}

                                          {!tienePrincipios &&
                                            tienePreguntas && (
                                              <div className="space-y-2">

                                                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                  Preguntas
                                                </p>

                                                {s.questions.map(
                                                  (
                                                    q
                                                  ) => {
                                                    const qk =
                                                      questionKey(
                                                        moduleId,
                                                        subId,
                                                        String(
                                                          q.id
                                                        )
                                                      );

                                                    const qAllowed =
                                                      !!questionAccess[
                                                        qk
                                                      ];

                                                    return (
                                                      <div
                                                        key={
                                                          qk
                                                        }
                                                        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
                                                      >

                                                        <div className="min-w-0">

                                                          <p className="text-sm font-semibold text-slate-800">
                                                            Pregunta{" "}
                                                            {
                                                              q.number
                                                            }
                                                          </p>

                                                          <p className="mt-1 text-xs leading-5 text-slate-500">
                                                            {
                                                              q.text
                                                            }
                                                          </p>

                                                        </div>

                                                        <button
                                                          type="button"
                                                          disabled={
                                                            saving
                                                          }
                                                          onClick={() =>
                                                            toggleQuestion(
                                                              String(
                                                                q.id
                                                              ),
                                                              subId,
                                                              moduleId
                                                            )
                                                          }
                                                          className={`
                                                            inline-flex
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            px-3
                                                            py-1.5
                                                            text-xs
                                                            font-bold

                                                            ${
                                                              qAllowed
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : "bg-red-100 text-red-700"
                                                            }
                                                          `}
                                                        >
                                                          {qAllowed
                                                            ? "Permitido"
                                                            : "Denegado"}
                                                        </button>

                                                      </div>
                                                    );
                                                  }
                                                )}

                                              </div>
                                            )}

                                        </div>
                                      )}

                                  </div>
                                );
                              }
                            )}

                          </div>
                        )}

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

      </section>

      {/* ====================================================== */}
      {/* ACCIONES */}
      {/* ====================================================== */}

      <section className="sticky bottom-4 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">

            <KeyRound className="h-4 w-4 text-blue-500" />

            Los cambios se aplicarán al guardar el usuario.

          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">

            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() =>
                router.push(
                  "/dashboard/permisos"
                )
              }
              className="h-11 rounded-xl px-5"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>

            <Button
              type="button"
              disabled={
                saving ||
                modulesLoading
              }
              onClick={
                isEdit
                  ? handleUpdateUser
                  : handleCreateUser
              }
              className="h-11 rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
            >

              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                  {isEdit
                    ? "Actualizando..."
                    : "Creando usuario..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />

                  {isEdit
                    ? "Actualizar Usuario"
                    : "Crear Usuario"}
                </>
              )}

            </Button>

          </div>

        </div>

      </section>

    </div>
  );
}