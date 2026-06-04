"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { signIn } from "next-auth/react"

type Props = {
  error?: string
  loginAction: (formData: FormData) => void
}

export default function LoginForm({ error, loginAction }: Props) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-9 sm:px-6 lg:px-8">

      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{
          backgroundImage: "url('/Fondo3.png')",
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0  from-[#081a33]/90 via-[#0d57a1]/70 to-black/80" />

      {/* Efectos decorativos */}
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#d7a55a]/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#0d57a1]/30 blur-3xl" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/90 shadow-2xl backdrop-blur-md">

          <CardContent className="p-6 sm:p-8 md:p-10">

            {/* Header */}
            <div className="mb-8 flex flex-col items-center text-center">

              <Image
                src="/Logo oficial.png"
                alt="Logo UNCSM"
                width={180}
                height={180}
                priority
                className="
                  mb-4
                  h-auto
                  w-[130px]
                  object-contain
                  sm:w-[150px]
                  md:w-[180px]
                "
              />

              <h1
                className="
                  text-2xl
                  font-bold
                  leading-tight
                  tracking-tight
                  text-[#0f2d5c]
                  sm:text-3xl
                "
              >
                Sistema de Control Interno
              </h1>

              <p
                className="
                  mt-2
                  text-xs
                  text-slate-600
                  sm:text-sm
                "
              >
                Dirección de Gestión de la Calidad Institucional
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Formulario */}
            <form action={loginAction} className="space-y-5">

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-[#0f2d5c]"
                >
                  Correo institucional
                </Label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c89a4b]" />

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="usuario@uncsm.edu.ni"
                    required
                    className="
                      h-12
                      rounded-2xl
                      border-2
                      border-[#d7a55a]
                      bg-white
                      pl-12
                      pr-4
                      text-sm
                      shadow-none
                      focus-visible:ring-0
                      focus-visible:ring-offset-0
                      sm:h-14
                      sm:text-base
                    "
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-[#0f2d5c]"
                >
                  Contraseña
                </Label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c89a4b]" />

                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="
                      h-12
                      rounded-2xl
                      border-2
                      border-[#d7a55a]
                      bg-white
                      pl-12
                      pr-12
                      text-sm
                      shadow-none
                      focus-visible:ring-0
                      focus-visible:ring-offset-0
                      sm:h-14
                      sm:text-base
                    "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón Login */}
              <Button
                type="submit"
                className="
                  h-12
                  w-full
                  rounded-2xl
                  bg-[#0d57a1]
                  text-sm
                  font-semibold
                  text-white
                  transition-all
                  hover:bg-[#0b4c8d]
                  hover:scale-[1.01]
                  sm:h-14
                  sm:text-base
                "
              >
                Acceder
              </Button>

              {/* Google */}
              <button
                type="button"
                onClick={() =>
                  signIn("google", { callbackUrl: "/dashboard" })
                }
                className="
                  flex
                  h-12
                  w-full
                  items-center
                  justify-center
                  gap-3
                  rounded-2xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  text-sm
                  font-medium
                  text-slate-700
                  transition-all
                  hover:bg-slate-50
                  hover:scale-[1.01]
                  sm:h-14
                "
              >
                <Image
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />

                <span className="truncate">
                  Iniciar sesión con Google
                </span>
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}