"use client";

import {
  Users,
  ShieldCheck,
  KeyRound,
  Settings2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { UsersPermissionsUI } from "@/components/users-permissions-ui";


export default function PermisosPage() {
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

            {/* ICONO */}

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
              <ShieldCheck className="h-7 w-7 text-white" />
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
                Permisos de Usuario
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
                Gestione los usuarios del sistema y controle sus
                permisos de acceso a cada módulo.
              </p>

            </div>

          </div>


          {/* =====================================================
              INDICADOR DERECHO
          ===================================================== */}

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
              <KeyRound className="h-5 w-5 text-cyan-100" />
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
                Control de acceso
              </p>

              <p className="mt-0.5 text-xs font-semibold text-white">
                Usuarios y permisos
              </p>

            </div>

          </div>

        </div>

      </div>



      {/* =========================================================
          CONTENEDOR DE USUARIOS
      ========================================================= */}

      <Card
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-[0_4px_18px_rgba(15,23,42,0.06)]
        "
      >

        {/* =======================================================
            HEADER CARD
        ======================================================= */}

        <CardHeader
          className="
            border-b
            border-slate-100
            bg-gradient-to-r
            from-slate-50
            via-white
            to-blue-50/40
            px-6
            py-5
          "
        >

          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            {/* IZQUIERDA */}

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-50
                  text-blue-700
                  ring-1
                  ring-blue-100
                "
              >
                <Users className="h-5 w-5" />
              </div>


              <div>

                <CardTitle
                  className="
                    text-base
                    font-bold
                    text-slate-900
                  "
                >
                  Usuarios Registrados
                </CardTitle>


                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500
                  "
                >
                  Configure los accesos y permisos asignados a cada usuario.
                </p>

              </div>

            </div>


            {/* INDICADOR */}

            <div
              className="
                flex
                w-fit
                items-center
                gap-2
                rounded-full
                border
                border-blue-100
                bg-blue-50
                px-3
                py-1.5
              "
            >
              <Settings2 className="h-3.5 w-3.5 text-blue-600" />

              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-blue-700
                "
              >
                Configuración de acceso
              </span>
            </div>

          </div>

        </CardHeader>



        {/* =======================================================
            USERS PERMISSIONS UI
            NO SE MODIFICA SU FUNCIONALIDAD
        ======================================================= */}

        <CardContent className="p-0">

          <div className="p-5 md:p-6">
            <UsersPermissionsUI />
          </div>

        </CardContent>

      </Card>

    </div>
  );
}