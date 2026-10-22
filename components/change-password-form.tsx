"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
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

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  /* ============================================================
     REQUISITOS EN VIVO

     Deben coincidir EXACTAMENTE con las validaciones de
     changeTemporaryPassword en app/auth/actions.ts.
  ============================================================ */

  const criterios = [
    {
      label: "Mínimo 8 caracteres",
      ok: password.length >= 8,
    },
    {
      label: "Al menos una letra mayúscula",
      ok: /[A-Z]/.test(password),
    },
    {
      label: "Al menos una letra minúscula",
      ok: /[a-z]/.test(password),
    },
    {
      label: "Al menos un número",
      ok: /[0-9]/.test(password),
    },
    {
      label: "Al menos un símbolo",
      ok: /[^A-Za-z0-9]/.test(password),
    },
    {
      label: "Las contraseñas coinciden",
      ok:
        confirmPassword.length > 0 &&
        password === confirmPassword,
    },
  ];

  const cumplidos =
    criterios.filter((c) => c.ok).length;

  const todosCumplen =
    cumplidos === criterios.length;

  const progreso =
    (cumplidos / criterios.length) * 100;

  const etiquetaFuerza =
    cumplidos === 0
      ? "Sin definir"
      : cumplidos <= 2
        ? "Débil"
        : cumplidos <= 4
          ? "Aceptable"
          : cumplidos === 5
            ? "Fuerte"
            : "Excelente";

  const colorFuerza =
    cumplidos <= 2
      ? "bg-red-500"
      : cumplidos <= 4
        ? "bg-amber-500"
        : cumplidos === 5
          ? "bg-blue-500"
          : "bg-emerald-500";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* FONDO */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/Fondo3.png')",
        }}
      />

      <div className="absolute inset-0 bg-slate-950/30" />

      {/* ====================================================
          TARJETA
      ==================================================== */}

      <div className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_25px_60px_-15px_rgba(7,27,51,0.45)]">
        {/* ------------------------------------------------
            HEADER
        ------------------------------------------------ */}

        <div className="relative overflow-hidden bg-gradient-to-br from-[#071b33] via-[#0b4f96] to-[#0d57a1] px-7 pb-8 pt-7 text-white">
          {/* Decoraciones */}
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-white/[0.05]" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-cyan-400/[0.07]" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner backdrop-blur-sm">
              <ShieldCheck className="h-7 w-7 text-cyan-300" />
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200">
                <Sparkles className="h-3 w-3" />
                Seguridad
              </span>

              <h1 className="mt-1.5 text-[22px] font-bold leading-tight">
                Cambiar contraseña
              </h1>

              <p className="mt-0.5 text-[13px] text-blue-200">
                Configure su contraseña personal para continuar.
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------
            CONTENIDO
        ------------------------------------------------ */}

        <form
          action={changePasswordAction}
          onSubmit={() => setLoading(true)}
          className="space-y-5 px-7 pb-7 pt-6"
        >
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AVISO */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-black text-amber-700">
              !
            </span>

            <p className="text-xs leading-5 text-amber-800">
              <strong className="font-bold">
                Contraseña provisional detectada.
              </strong>{" "}
              Por seguridad, debe establecer una nueva contraseña
              antes de ingresar al SCI.
            </p>
          </div>

          {/* NUEVA CONTRASEÑA */}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Nueva contraseña
            </label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <Input
                name="password"
                type={
                  showPassword ? "text" : "password"
                }
                placeholder="Ingrese su nueva contraseña"
                required
                disabled={loading}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/60 pl-10 pr-11 focus:border-blue-400 focus:bg-white"
              />

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
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
          </div>

          {/* CONFIRMAR CONTRASEÑA */}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Confirmar contraseña
            </label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

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
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/60 pl-10 pr-11 focus:border-blue-400 focus:bg-white"
              />

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setShowConfirmPassword((prev) => !prev)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* ==================================================
              REQUISITOS EN VIVO
          ================================================== */}

          <div
            className={`
              rounded-2xl border px-4 py-4
              transition-all duration-300
              ${
                todosCumplen
                  ? "border-emerald-300 bg-emerald-50/70 shadow-[0_0_0_3px_rgba(16,185,129,0.10)]"
                  : "border-slate-200 bg-slate-50/70"
              }
            `}
          >
            {/* Encabezado + contador */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Requisitos
              </p>

              <span
                className={`
                  rounded-full px-2.5 py-0.5
                  text-xs font-bold tabular-nums
                  transition-colors duration-300
                  ${
                    todosCumplen
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200/80 text-slate-500"
                  }
                `}
              >
                {cumplidos} / {criterios.length}
              </span>
            </div>

            {/* Medidor de fuerza */}
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`
                    h-full rounded-full
                    transition-all duration-300 ease-out
                    ${colorFuerza}
                  `}
                  style={{ width: `${progreso}%` }}
                />
              </div>

              <span
                className={`
                  w-[92px] text-right
                  text-xs font-bold
                  transition-colors duration-300
                  ${
                    todosCumplen
                      ? "text-emerald-600"
                      : cumplidos === 0
                        ? "text-slate-400"
                        : cumplidos <= 2
                          ? "text-red-500"
                          : cumplidos <= 4
                            ? "text-amber-600"
                            : "text-blue-600"
                  }
                `}
              >
                {etiquetaFuerza}
              </span>
            </div>

            {/* Lista */}
            <ul className="mt-3.5 space-y-1.5">
              {criterios.map((criterio) => (
                <li
                  key={criterio.label}
                  className={`
                    flex items-center gap-2.5
                    rounded-xl px-2.5 py-1.5
                    text-xs transition-all duration-200
                    ${
                      criterio.ok
                        ? "bg-emerald-50 font-semibold text-emerald-700"
                        : "bg-transparent text-slate-500"
                    }
                  `}
                >
                  <span
                    className={`
                      flex h-5 w-5 shrink-0
                      items-center justify-center
                      rounded-full transition-colors duration-200
                      ${
                        criterio.ok
                          ? "bg-emerald-500 text-white shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                          : "bg-red-100 text-red-500"
                      }
                    `}
                  >
                    {criterio.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                  </span>

                  <span>
                    {criterio.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* BOTÓN */}

          <Button
            type="submit"
            disabled={loading || !todosCumplen}
            className={`
              h-12 w-full rounded-2xl
              text-[15px] font-bold text-white
              transition-all duration-300
              disabled:cursor-not-allowed disabled:opacity-45
              ${
                todosCumplen
                  ? "bg-gradient-to-r from-[#0d57a1] to-[#1393a8] shadow-lg shadow-blue-900/20 hover:from-[#0b4f96] hover:to-[#0f7f92]"
                  : "bg-slate-400 hover:bg-slate-400"
              }
            `}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : todosCumplen ? (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Establecer contraseña
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Complete los {criterios.length} requisitos
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
