"use client";

import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  UserCog,
  ShieldCheck,
} from "lucide-react";

import { UserPermissionForm } from "@/components/user-permission-form";

export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams();

  const userId = String(params.id || "");

  return (
    <div className="flex w-full flex-col gap-6">

      {/* =========================================================
          ENCABEZADO PRINCIPAL
      ========================================================= */}

      <div
        className="
          relative
          overflow-hidden
          rounded-2xl
          border
          border-blue-200/60
          bg-gradient-to-r
          from-[#0b4da2]
          via-[#1267a1]
          to-[#1189a0]
          px-6
          py-5
          text-white
          shadow-[0_8px_24px_rgba(15,76,129,0.16)]
        "
      >

        {/* DECORACIONES */}

        <div
          className="
            pointer-events-none
            absolute
            -right-10
            -top-16
            h-44
            w-44
            rounded-full
            bg-white/10
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            right-24
            top-12
            h-24
            w-24
            rounded-full
            bg-cyan-300/10
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            bottom-0
            right-52
            h-16
            w-16
            translate-y-1/2
            rounded-full
            bg-blue-300/10
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-5
            md:flex-row
            md:items-center
            md:justify-between
          "
        >

          {/* =====================================================
              INFORMACIÓN
          ===================================================== */}

          <div className="flex items-center gap-4">

            <div
              className="
                flex
                h-14
                w-14
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-white/15
                bg-white/15
                shadow-sm
                backdrop-blur-sm
              "
            >
              <UserCog className="h-7 w-7 text-white" />
            </div>

            <div>

              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.22em]
                  text-cyan-100
                "
              >
                Administración del sistema
              </p>

              <h1
                className="
                  mt-1
                  text-2xl
                  font-bold
                  tracking-tight
                  text-white
                "
              >
                Editar Usuario
              </h1>

              <p
                className="
                  mt-1
                  max-w-2xl
                  text-sm
                  leading-5
                  text-blue-50/90
                "
              >
                Actualice la información del usuario y configure
                sus permisos de acceso al sistema.
              </p>

            </div>

          </div>

          {/* =====================================================
              ACCIONES DERECHA
          ===================================================== */}

          <div className="flex items-center gap-3">

            {/* INDICADOR */}

            <div
              className="
                hidden
                items-center
                gap-3
                rounded-2xl
                border
                border-white/15
                bg-white/10
                px-4
                py-3
                backdrop-blur-sm
                lg:flex
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-white/15
                "
              >
                <ShieldCheck className="h-5 w-5 text-cyan-100" />
              </div>

              <div>

                <p
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.15em]
                    text-blue-100
                  "
                >
                  Configuración
                </p>

                <p className="mt-0.5 text-xs font-semibold text-white">
                  Usuario y permisos
                </p>

              </div>

            </div>

            {/* VOLVER */}

            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/permisos")
              }
              className="
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-white/20
                bg-white/10
                px-4
                text-sm
                font-semibold
                text-white
                backdrop-blur-sm
                transition-all
                duration-200
                hover:bg-white/20
              "
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a usuarios
            </button>

          </div>

        </div>

      </div>

      {/* =========================================================
          FORMULARIO DE EDICIÓN
      ========================================================= */}

      {userId ? (
        <UserPermissionForm
          mode="edit"
          userId={userId}
        />
      ) : (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
          No se pudo identificar el usuario que desea editar.
        </div>
      )}

    </div>
  );
}