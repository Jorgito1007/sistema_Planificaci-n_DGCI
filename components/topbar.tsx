"use client";

import { Bell, LogOut, UserCircle, CheckCheck, ExternalLink } from "lucide-react";
import { logout } from "@/app/auth/actions";
import Swal from "sweetalert2";
import { useRef, useState, useEffect } from "react";
import { useNotifications } from "@/context/NotificationContext";
import Link from "next/link";


type TopbarProps = {
  user: {
    email: string;
    full_name: string;
    role: string;
  };
};


export function Topbar({ user }: TopbarProps) {

  /* ============================================================
      ESTADOS
  ============================================================ */

  const [openNotif, setOpenNotif] = useState(false);

  const {
    notificaciones,
    cargarNotificaciones,
  } = useNotifications();


  /* ============================================================
      CARGAR NOTIFICACIONES
  ============================================================ */

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);


  /* ============================================================
      LOGOUT
  ============================================================ */

  const logoutFormRef = useRef<HTMLFormElement>(null);


  const handleLogout = async () => {

    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Desea salir del sistema?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, salir",
      cancelButtonText: "No, cancelar",
      confirmButtonColor: "#0b4da2",
      cancelButtonColor: "#dc2626",
      reverseButtons: true,
    });


    if (result.isConfirmed) {
      logoutFormRef.current?.requestSubmit();
    }

  };


  /* ============================================================
      INICIAL DEL USUARIO
  ============================================================ */

  const inicialUsuario =
    user.full_name?.trim()?.charAt(0)?.toUpperCase() ||
    user.email?.charAt(0)?.toUpperCase() ||
    "U";


  /* ============================================================
      RETURN
  ============================================================ */

  return (

    <header
      className="
        sticky
        top-0
        z-50
        flex
        h-16
        w-full
        shrink-0
        items-center
        justify-between
        border-b
        border-blue-900/40
        bg-gradient-to-r
        from-[#082a4d]
        via-[#07345c]
        to-[#075174]
        px-5
        text-white
        shadow-[0_4px_14px_rgba(2,20,40,0.15)]
      "
    >

      {/* ========================================================
          DECORACIÓN IZQUIERDA
      ======================================================== */}

      <div className="flex items-center">

   
      </div>



      {/* ========================================================
          LADO DERECHO
      ======================================================== */}

      <div className="flex h-full items-center gap-2">


        {/* ======================================================
            NOTIFICACIONES
        ====================================================== */}

        <div className="relative">

          <button
            type="button"
            onClick={() => setOpenNotif(!openNotif)}
            title="Notificaciones"
            className={`
              relative
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              transition-all
              duration-200

              ${
                openNotif
                  ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-100"
                  : "border-white/10 bg-white/5 text-blue-100 hover:border-white/20 hover:bg-white/10 hover:text-white"
              }
            `}
          >

            <Bell className="h-[18px] w-[18px]" />


            {/* CONTADOR */}

            {notificaciones.length > 0 && (

              <span
                className="
                  absolute
                  -right-1
                  -top-1
                  flex
                  h-[18px]
                  min-w-[18px]
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  border-[#07345c]
                  bg-red-500
                  px-1
                  text-[9px]
                  font-black
                  leading-none
                  text-white
                  shadow-sm
                "
              >
                {notificaciones.length > 99
                  ? "99+"
                  : notificaciones.length}
              </span>

            )}

          </button>



          {/* ====================================================
              PANEL DE NOTIFICACIONES
          ==================================================== */}

          {openNotif && (

            <div
              className="
                absolute
                right-0
                top-[50px]
                z-[100]
                w-[360px]
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                text-slate-900
                shadow-[0_20px_50px_rgba(15,23,42,0.22)]
              "
            >

              {/* =================================================
                  HEADER DEL PANEL
              ================================================= */}

              <div
                className="
                  relative
                  overflow-hidden
                  bg-gradient-to-r
                  from-[#0b4da2]
                  via-[#1267a1]
                  to-[#1189a0]
                  px-4
                  py-4
                "
              >

                {/* Decoraciones */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    -right-7
                    -top-8
                    h-24
                    w-24
                    rounded-full
                    bg-white/10
                  "
                />

                <div
                  className="
                    pointer-events-none
                    absolute
                    right-16
                    top-8
                    h-12
                    w-12
                    rounded-full
                    bg-white/5
                  "
                />


                <div className="relative flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-white/10
                        bg-white/15
                      "
                    >
                      <Bell className="h-4 w-4 text-white" />
                    </div>


                    <div>

                      <h3 className="text-sm font-bold text-white">
                        Notificaciones
                      </h3>

                      <p className="mt-0.5 text-[10px] text-blue-100">
                        Avisos y actividades pendientes
                      </p>

                    </div>

                  </div>


                  {/* TOTAL */}

                  {notificaciones.length > 0 && (

                    <span
                      className="
                        rounded-full
                        border
                        border-white/10
                        bg-white/15
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold
                        text-white
                      "
                    >
                      {notificaciones.length}
                    </span>

                  )}

                </div>

              </div>



              {/* =================================================
                  CONTENIDO
              ================================================= */}

              <div className="max-h-[370px] overflow-y-auto">

                {notificaciones.length === 0 ? (

                  /* ===============================================
                      SIN NOTIFICACIONES
                  =============================================== */

                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      justify-center
                      px-6
                      py-10
                      text-center
                    "
                  >

                    <div
                      className="
                        flex
                        h-14
                        w-14
                        items-center
                        justify-center
                        rounded-2xl
                        bg-emerald-50
                        text-emerald-600
                      "
                    >
                      <CheckCheck className="h-6 w-6" />
                    </div>


                    <p className="mt-4 text-sm font-bold text-slate-800">
                      Todo está al día
                    </p>


                    <p className="mt-1 max-w-[240px] text-xs leading-5 text-slate-500">
                      No tiene notificaciones pendientes en este momento.
                    </p>

                  </div>

                ) : (

                  notificaciones.map((n, index) => (

                    <Link
                      key={index}
                      href={n.href}
                      onClick={() => setOpenNotif(false)}
                      className="
                        group
                        relative
                        block
                        border-b
                        border-slate-100
                        px-4
                        py-4
                        transition-colors
                        duration-200
                        last:border-b-0
                        hover:bg-blue-50/70
                      "
                    >

                      <div className="flex gap-3">


                        {/* ICONO */}

                        <div
                          className="
                            mt-0.5
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-blue-50
                            text-blue-600
                            ring-1
                            ring-blue-100
                            transition
                            group-hover:bg-blue-600
                            group-hover:text-white
                          "
                        >
                          <Bell className="h-4 w-4" />
                        </div>



                        {/* INFORMACIÓN */}

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <p
                              className="
                                text-xs
                                font-bold
                                leading-5
                                text-slate-800
                              "
                            >
                              {n.titulo}
                            </p>


                            <span
                              className="
                                mt-1
                                h-2
                                w-2
                                shrink-0
                                rounded-full
                                bg-blue-500
                              "
                            />

                          </div>


                          <p
                            className="
                              mt-1
                              text-[11px]
                              leading-5
                              text-slate-500
                            "
                          >
                            {n.mensaje}
                          </p>


                          <div
                            className="
                              mt-2
                              flex
                              items-center
                              gap-1
                              text-[10px]
                              font-bold
                              text-blue-700
                            "
                          >

                            <span>
                              Ir al plan de acción
                            </span>

                            <ExternalLink
                              className="
                                h-3
                                w-3
                                transition-transform
                                group-hover:translate-x-0.5
                              "
                            />

                          </div>

                        </div>

                      </div>

                    </Link>

                  ))

                )}

              </div>

            </div>

          )}

        </div>



        {/* ======================================================
            SEPARADOR
        ====================================================== */}

        <div className="mx-1 h-7 w-px bg-white/15" />



        {/* ======================================================
            USUARIO
        ====================================================== */}

        <div
          className="
            flex
            items-center
            gap-3
            rounded-xl
            px-2
            py-1.5
          "
        >

          {/* AVATAR */}

          <div
            className="
              relative
              hidden
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-cyan-300/20
              bg-gradient-to-br
              from-blue-500/30
              to-cyan-400/20
              text-sm
              font-black
              text-white
              shadow-sm
              sm:flex
            "
          >

            {inicialUsuario}


            {/* INDICADOR ONLINE */}

            <span
              className="
                absolute
                -bottom-0.5
                -right-0.5
                h-2.5
                w-2.5
                rounded-full
                border-2
                border-[#07345c]
                bg-emerald-400
              "
            />

          </div>



          {/* DATOS */}

          <div className="hidden min-w-0 md:block">

            <p
              className="
                max-w-[190px]
                truncate
                text-xs
                font-bold
                leading-none
                text-white
              "
            >
              {user.full_name || user.email}
            </p>


            <div className="mt-1.5 flex items-center gap-1.5">

              <UserCircle className="h-3 w-3 text-cyan-300" />

              <p
                className="
                  max-w-[170px]
                  truncate
                  text-[10px]
                  font-medium
                  text-blue-200
                "
              >
                {user.role}
              </p>

            </div>

          </div>

        </div>



        {/* ======================================================
            SALIR
        ====================================================== */}

        <form
          ref={logoutFormRef}
          action={logout}
        >

          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            className="
              group
              flex
              h-10
              items-center
              gap-2
              rounded-xl
              border
              border-white/10
              bg-white/5
              px-3
              text-xs
              font-semibold
              text-blue-100
              transition-all
              duration-200

              hover:border-red-300/30
              hover:bg-red-500/15
              hover:text-red-100
            "
          >

            <LogOut
              className="
                h-4
                w-4
                transition-transform
                duration-200
                group-hover:translate-x-0.5
              "
            />


            <span className="hidden md:inline">
              Salir
            </span>

          </button>

        </form>

      </div>

    </header>

  );

}