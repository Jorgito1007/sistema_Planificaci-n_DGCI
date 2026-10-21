"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  error?: string;
  loginAction: (formData: FormData) => void;
};

export default function LoginForm({
  error,
  loginAction,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071b33]">
      {/* =====================================================
          FONDO INSTITUCIONAL
      ===================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-cover
          bg-center
          bg-no-repeat
        "
        style={{
          backgroundImage: "url('/Fondo3.png')",
        }}
      />

      {/* Overlay muy suave */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-[#071b33]/10
          via-transparent
          to-[#071b33]/5
        "
      />

      {/* Efectos de iluminación */}
      <div
        className="
          absolute
          -left-48
          top-1/3
          h-[500px]
          w-[500px]
          rounded-full
          bg-blue-500/10
          blur-[120px]
        "
      />

      <div
        className="
          absolute
          -right-48
          bottom-0
          h-[500px]
          w-[500px]
          rounded-full
          bg-cyan-400/10
          blur-[120px]
        "
      />

      {/* =====================================================
          CONTENEDOR
      ===================================================== */}

      <div
        className="
          relative
          z-10
          flex
          min-h-screen
          items-center
          justify-center
          px-4
          py-5
          sm:px-6
        "
      >
        {/* Más ancho y menos alargado */}
        <div className="w-full max-w-[450px] mr-20 mb-10">
          {/* =================================================
              CARD LOGIN
          ================================================= */}

          <div
            className="
              overflow-hidden
              rounded-[28px]
              border
              border-white/70
              bg-white/95
              shadow-[0_30px_80px_rgba(3,24,54,0.22)]
              backdrop-blur-xl
            "
          >
            {/* Línea superior institucional */}
            <div
              className="
                h-[5px]
                w-full
                bg-gradient-to-r
                from-[#0d57a1]
                via-[#1e88d8]
                to-[#d7a55a]
              "
            />

            <div className="px-8 pb-5 pt-5 sm:px-10">
              {/* =============================================
                  LOGO
              ============================================= */}

              <div className="flex justify-center">
                <Image
                  src="/Logo oficial.png"
                  alt="Universidad Nacional Casimiro Sotelo Montenegro"
                  width={200}
                  height={80}
                  priority
                  className="
                    h-auto
                    w-[165px]
                    object-contain
                    sm:w-[185px]
                  "
                />
              </div>

              {/* =============================================
                  ENCABEZADO
              ============================================= */}

              <div className="mt-2 text-center">
                {/* Badge */}

             

                {/* Título */}

                <h1
                  className="
                    text-[24px]
                    font-extrabold
                    leading-tight
                    tracking-[-0.03em]
                    text-[#0b2c5d]
                    sm:whitespace-nowrap
                    sm:text-[27px]
                  "
                >
                  Sistema de Control Interno
                </h1>

                {/* Subtítulo */}

                <p
                  className="
                    mt-1
                    text-[11px]
                    leading-5
                    text-slate-500
                    sm:text-[12px]
                  "
                >
                  Dirección de Gestión de la Calidad Institucional
                </p>
              </div>

              {/* =============================================
                  SEPARADOR
              ============================================= */}

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />

                <div className="h-1.5 w-1.5 rounded-full bg-[#d7a55a]" />

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* =============================================
                  MENSAJE DE ERROR
              ============================================= */}

              {error && (
                <div
                  className="
                    mb-4
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-2.5
                    text-center
                    text-[12px]
                    font-medium
                    text-red-700
                  "
                >
                  {error}
                </div>
              )}

              {/* =============================================
                  FORMULARIO
              ============================================= */}

              <form
                action={loginAction}
                className="space-y-4"
              >
                {/* ===========================================
                    CORREO
                =========================================== */}

                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="
                      ml-1
                      text-[11px]
                      font-semibold
                      text-[#17365f]
                    "
                  >
                    Correo institucional
                  </Label>

                  <div className="group relative">
                    {/* Icono */}

                    <div
                      className="
                        absolute
                        left-3.5
                        top-1/2
                        z-10
                        flex
                        h-8
                        w-8
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-lg
                        bg-blue-50
                        text-[#0d57a1]
                        transition-all
                        duration-200
                        group-focus-within:bg-[#0d57a1]
                        group-focus-within:text-white
                      "
                    >
                      <Mail className="h-4 w-4" />
                    </div>

                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="usuario@uncsm.edu.ni"
                      required
                      className="
                        h-[50px]
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50/70
                        pl-[58px]
                        pr-4
                        text-[13px]
                        text-slate-700
                        shadow-none
                        transition-all
                        placeholder:text-slate-400
                        hover:border-slate-300
                        focus-visible:border-[#0d57a1]
                        focus-visible:bg-white
                        focus-visible:ring-4
                        focus-visible:ring-blue-500/10
                        focus-visible:ring-offset-0
                      "
                    />
                  </div>
                </div>

                {/* ===========================================
                    CONTRASEÑA
                =========================================== */}

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="
                      ml-1
                      text-[11px]
                      font-semibold
                      text-[#17365f]
                    "
                  >
                    Contraseña
                  </Label>

                  <div className="group relative">
                    {/* Icono contraseña */}

                    <div
                      className="
                        absolute
                        left-3.5
                        top-1/2
                        z-10
                        flex
                        h-8
                        w-8
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-lg
                        bg-blue-50
                        text-[#0d57a1]
                        transition-all
                        duration-200
                        group-focus-within:bg-[#0d57a1]
                        group-focus-within:text-white
                      "
                    >
                      <LockKeyhole className="h-4 w-4" />
                    </div>

                    <Input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      placeholder="••••••••"
                      required
                      className="
                        h-[50px]
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50/70
                        pl-[58px]
                        pr-14
                        text-[13px]
                        text-slate-700
                        shadow-none
                        transition-all
                        placeholder:text-slate-400
                        hover:border-slate-300
                        focus-visible:border-[#0d57a1]
                        focus-visible:bg-white
                        focus-visible:ring-4
                        focus-visible:ring-blue-500/10
                        focus-visible:ring-offset-0
                      "
                    />

                    {/* Mostrar / ocultar */}

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      className="
                        absolute
                        right-3.5
                        top-1/2
                        flex
                        h-8
                        w-8
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-lg
                        text-slate-400
                        transition-all
                        hover:bg-slate-100
                        hover:text-[#0d57a1]
                      "
                    >
                      {showPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ===========================================
                    BOTÓN ACCEDER
                =========================================== */}

                <Button
                  type="submit"
                  className="
                    h-[50px]
                    w-full
                    rounded-xl
                    bg-gradient-to-r
                    from-[#0b4f96]
                    to-[#1374bd]
                    text-[13px]
                    font-bold
                    text-white
                    shadow-lg
                    shadow-blue-900/15
                    transition-all
                    duration-200
                    hover:-translate-y-[1px]
                    hover:from-[#093f7a]
                    hover:to-[#0d63a4]
                    hover:shadow-xl
                    hover:shadow-blue-900/20
                    active:translate-y-0
                  "
                >
                  <LockKeyhole className="mr-2 h-4 w-4" />

                  Acceder al sistema
                </Button>

                {/* ===========================================
                    DIVISOR GOOGLE
                =========================================== */}

                <div className="flex items-center gap-3 py-0.5">
                  <div className="h-px flex-1 bg-slate-200" />

                  <span
                    className="
                      whitespace-nowrap
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-slate-400
                    "
                  >
                    o continuar con
                  </span>

                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* ===========================================
                    GOOGLE
                =========================================== */}

                <button
                  type="button"
                  onClick={() =>
                    signIn("google", {
                      callbackUrl:
                        "/dashboard",
                    })
                  }
                  className="
                    flex
                    h-[48px]
                    w-full
                    items-center
                    justify-center
                    gap-3
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-[12px]
                    font-semibold
                    text-slate-600
                    transition-all
                    duration-200
                    hover:border-blue-200
                    hover:bg-blue-50/50
                    hover:text-[#0d57a1]
                  "
                >
                  <div
                    className="
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-slate-100
                      bg-white
                      shadow-sm
                    "
                  >
                    <Image
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                      width={17}
                      height={17}
                    />
                  </div>

                  <span>
                    Iniciar sesión con Google
                  </span>
                </button>
              </form>

              {/* =============================================
                  PIE
              ============================================= */}

              <div className="mt-4 text-center">
                <p className="text-[9px] text-slate-400">
                  Acceso exclusivo para usuarios autorizados
                </p>

                <div className="mt-1.5 flex items-center justify-center gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-[#0d57a1]" />

                  <div className="h-1 w-1 rounded-full bg-[#d7a55a]" />

                  <div className="h-1 w-1 rounded-full bg-[#0d57a1]" />
                </div>
              </div>
            </div>
          </div>

          
        </div>
      </div>
    </main>
  );
}