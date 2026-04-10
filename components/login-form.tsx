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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden rounded-3xl border-0 bg-white shadow-[0_10px_35px_rgba(15,45,92,0.10)]">
          <CardContent className="p-8">
            <div className="mb-8 flex flex-col items-center text-center">
              <Image
                src="/Logo oficial.png"
                alt="Logo UNCSM"
                width={180}
                height={180}
                className="mb-4 h-auto w-auto object-contain"
                priority
              />

              <h1 className="text-3xl font-bold tracking-tight text-[#0f2d5c]">
                Sistema de Control Interno
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Dirección de Gestión de la Calidad Institucional
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form action={loginAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#0f2d5c]">
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
                    className="h-14 rounded-2xl border-2 border-[#d7a55a] bg-white pl-12 pr-4 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#0f2d5c]">
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
                    className="h-14 rounded-2xl border-2 border-[#d7a55a] bg-white pl-12 pr-12 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-14 w-full rounded-2xl bg-[#0d57a1] text-base font-semibold text-white hover:bg-[#0b4c8d]"
              >
                Acceder
              </Button>

              <button
  type="button"
  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50"
>
  <Image
    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
    alt="Google"
    width={20}
    height={20}
  />
  Iniciar sesión con Google
</button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}