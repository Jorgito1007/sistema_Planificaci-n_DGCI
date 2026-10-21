"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChangePasswordFormProps = {
  changePasswordAction: (
    formData: FormData
  ) => Promise<void>;
  error?: string;
};

export default function ChangePasswordForm({
  changePasswordAction,
  error,
}: ChangePasswordFormProps) {
  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">

    {/* FONDO DEL LOGIN */}
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

    {/* OVERLAY */}
    <div className="absolute inset-0 bg-slate-950/20" />

    {/* TARJETA */}
    <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/30 bg-white/95 shadow-2xl backdrop-blur-sm">

      <div className="bg-gradient-to-r from-slate-50 via-white to-amber-50 px-6 py-6">

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c7a97a]/20 text-[#927348]">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div>
              <h1 className="text-xl font-bold text-slate-900">
                Cambiar contraseña
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Configure su contraseña personal para continuar.
              </p>
            </div>

          </div>

        </div>

        <form
          action={changePasswordAction}
          onSubmit={() => setLoading(true)}
          className="space-y-5 p-6"
        >

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

            <div className="flex items-start gap-3">

              <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Contraseña provisional detectada
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Por seguridad, debe establecer una nueva contraseña antes de ingresar al SCI.
                </p>
              </div>

            </div>

          </div>

          {/* NUEVA CONTRASEÑA */}

          <div className="space-y-2">

            <label className="text-sm font-semibold text-slate-700">
              Nueva contraseña
            </label>

            <div className="relative">

              <Input
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Ingrese su nueva contraseña"
                required
                disabled={loading}
                className="h-11 rounded-xl pr-11"
              />

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>

            </div>

          </div>

          {/* CONFIRMAR CONTRASEÑA */}

          <div className="space-y-2">

            <label className="text-sm font-semibold text-slate-700">
              Confirmar contraseña
            </label>

            <div className="relative">

              <Input
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Repita la nueva contraseña"
                required
                disabled={loading}
                className="h-11 rounded-xl pr-11"
              />

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setShowConfirmPassword(
                    (prev) => !prev
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>

            </div>

          </div>

          {/* REQUISITOS */}

          <div className="rounded-xl bg-slate-50 px-4 py-3">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Requisitos
            </p>

            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>• Mínimo 8 caracteres</li>
              <li>• Al menos una letra mayúscula</li>
              <li>• Al menos una letra minúscula</li>
              <li>• Al menos un número</li>
              <li>• Al menos un símbolo</li>
            </ul>

          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-[#c7a97a] font-semibold text-white hover:bg-[#b99865]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                Cambiar contraseña
              </>
            )}
          </Button>

        </form>

      </div>

    </div>
  );
}