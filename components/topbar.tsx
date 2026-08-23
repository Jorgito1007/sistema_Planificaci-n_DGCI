"use client";

import Image from "next/image";
import { Bell, LogOut, UserCircle } from "lucide-react";
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

const [openNotif, setOpenNotif] = useState(false);

const {
  notificaciones,
  cargarNotificaciones,
} = useNotifications();

useEffect(() => {
  cargarNotificaciones();
}, [cargarNotificaciones]);

  
      const logoutFormRef = useRef<HTMLFormElement>(null);
    const handleLogout = async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Desea salir del sistema?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, salir",
      cancelButtonText: "No, cancelar",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#dc2626",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      logoutFormRef.current?.requestSubmit();
    }
  };

  
  return (
<header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between bg-[#061b33] px-5 text-white shadow-md">
  
      <div className="flex items-center gap-3 ">

      </div>

      <div className="flex items-center gap-4">
     
     <div className="relative">
  <button
    type="button"
    onClick={() => setOpenNotif(!openNotif)}
    className="relative rounded-full p-2 text-white hover:bg-white/10"
  >
    <Bell className="h-5 w-5" />

    {notificaciones.length > 0 && (
      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
        {notificaciones.length}
      </span>
    )}
  </button>

  {openNotif && (
    <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border bg-white shadow-2xl">
      <div className="bg-[#061B33] px-4 py-3">
        <h3 className="text-sm font-bold text-white">
          Notificaciones
        </h3>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notificaciones.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">
            No tiene notificaciones pendientes.
          </div>
        ) : (
          notificaciones.map((n, index) => (
            <Link
              key={index}
              href={n.href}
              onClick={() => setOpenNotif(false)}
              className="block border-b p-4 hover:bg-blue-50"
            >
              <p className="text-sm font-bold text-slate-800">
                {n.titulo}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {n.mensaje}
              </p>
              <p className="mt-2 text-xs font-semibold text-blue-700">
                Ir al plan de acción
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  )}
</div>

        <div className="flex items-center gap-3 border-l pl-4">
          

          <div className="hidden md:block">
  <p className="text-xs font-semibold leading-none tracking-wide text-[#c7a97a]">
    {user.full_name || user.email}
  </p>

  <p className="mt-1 text-xs text-white/80">
    {user.role}
  </p>
</div>

 <form ref={logoutFormRef} action={logout}>
  <button
    type="button"
    onClick={handleLogout}
    title="Cerrar sesión"
    className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-white hover:bg-red-50 hover:text-red-600"
  >
    <LogOut className="h-4 w-4" />
    <span className="hidden md:inline">Salir</span>
  </button>
</form>
        </div>
      </div>
    </header>
  );
}