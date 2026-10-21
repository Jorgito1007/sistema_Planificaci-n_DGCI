"use client";

import { useEffect, useState } from "react";

import {
  ShieldCheck,
  CalendarDays,
  CheckCircle2,
  Eye,
  Target,
  TrendingUp,
  Sparkles,
  HeartHandshake,
  Building2,
  Quote,
} from "lucide-react";

export default function DashboardStatsClient() {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // ============================================================
  // FECHA Y HORA
  // ============================================================

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleTimeString("es-NI", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      setCurrentDate(
        now.toLocaleDateString("es-NI", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateDateTime();

    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-5">

      {/* ============================================================
          PORTADA PRINCIPAL
      ============================================================ */}

      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#082f5b] via-[#0d5791] to-[#1393a8] shadow-xl shadow-blue-900/10">

        {/* DECORACIONES */}
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[40px] border-white/[0.04]" />

        <div className="pointer-events-none absolute right-36 top-10 h-40 w-40 rounded-full bg-white/[0.04]" />

        <div className="pointer-events-none absolute -bottom-32 left-[28%] h-72 w-72 rounded-full bg-cyan-300/[0.05]" />

        <div className="pointer-events-none absolute left-[45%] top-10 h-24 w-24 rotate-45 rounded-3xl border border-white/[0.04]" />

        <div className="relative grid min-h-[350px] lg:grid-cols-[1fr_330px]">

          {/* ========================================================
              LADO IZQUIERDO
          ======================================================== */}

          <div className="flex flex-col justify-center p-7 md:p-10 lg:p-12">

         

            {/* TÍTULO */}

            <div className="max-w-3xl">

              <p className="mb-2 text-sm font-semibold text-cyan-200">
                ¡Bienvenid@s!
              </p>

              <h1 className="text-3xl font-black leading-tight tracking-tight text-white md:text-4xl xl:text-[44px]">
               Sistema de
                <span className="block text-cyan-200">
                  control Interno Institucional
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 md:text-[15px]">
                Un entorno diseñado para apoyar la evaluación,
                seguimiento y mejora continua del Control Interno,
                contribuyendo al cumplimiento de los objetivos
                institucionales de la Universidad.
              </p>

            </div>

            {/* VALORES */}

            <div className="mt-7 flex flex-wrap gap-2">

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />

                <span className="text-[10px] font-semibold text-white">
                  Integridad
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 backdrop-blur-sm">
                <Eye className="h-3.5 w-3.5 text-cyan-300" />

                <span className="text-[10px] font-semibold text-white">
                  Transparencia
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 backdrop-blur-sm">
                <Target className="h-3.5 w-3.5 text-amber-300" />

                <span className="text-[10px] font-semibold text-white">
                  Cumplimiento
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 backdrop-blur-sm">
                <TrendingUp className="h-3.5 w-3.5 text-violet-200" />

                <span className="text-[10px] font-semibold text-white">
                  Mejora continua
                </span>
              </div>

            </div>

          </div>

          {/* ========================================================
              PANEL DERECHO
          ======================================================== */}

          <div className="relative border-t border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm lg:border-l lg:border-t-0">

            <div className="flex h-full flex-col justify-between">

              {/* FECHA */}

              <div>

                <div className="flex items-center gap-2 text-blue-100">
                  <CalendarDays className="h-4 w-4" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.18em]">
                    Hoy
                  </span>
                </div>

                <div className="mt-4">

                  <p className="text-4xl font-black tracking-tight text-white">
                    {currentTime}
                  </p>

                  <p className="mt-2 max-w-[230px] text-xs capitalize leading-5 text-blue-100">
                    {currentDate}
                  </p>

                </div>

              </div>

              {/* DIVISOR */}

              <div className="my-6 h-px bg-white/10" />

              {/* MENSAJE */}

              <div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Sparkles className="h-5 w-5 text-cyan-200" />
                </div>

                <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-200">
                  Compromiso institucional
                </p>

              
              

                <p className="mt-2 text-[12px] leading-5 text-blue-100">
                  Participación, responsabilidad y mejora continua para
                  alcanzar nuestros objetivos.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ============================================================
          SECCIÓN INFERIOR
      ============================================================ */}

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">

        {/* ========================================================
            MENSAJE PRINCIPAL
        ======================================================== */}

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          {/* DECORACIÓN */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-50 transition-transform duration-500 group-hover:scale-110" />

          <div className="pointer-events-none absolute right-16 bottom-[-60px] h-32 w-32 rounded-full bg-cyan-50/70" />

          <div className="relative flex h-full flex-col justify-between">

            <div>

              {/* CABECERA */}

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                  <Building2 className="h-6 w-6" />
                </div>

                <div>
                

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    Una gestión orientada a resultados
                  </h2>
                </div>

              </div>

              {/* TEXTO */}

              <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">
                El Sistema de Control Interno constituye una herramienta
                fundamental para fortalecer la gestión institucional,
                promoviendo el cumplimiento, la responsabilidad y la
                mejora permanente de los procesos de la Institución.
              </p>

            </div>

            {/* PRINCIPIOS */}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">

              {/* 01 */}

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">

                <div className="flex items-center gap-2">

                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[10px] font-black text-blue-700 shadow-sm">
                    01
                  </div>

                  <p className="text-xs font-bold text-slate-800">
                    Evaluar
                  </p>

                </div>

                <p className="mt-2 text-[10px] leading-4 text-slate-500">
                  Identificar el estado de los procesos institucionales.
                </p>

              </div>

              {/* 02 */}

              <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-3">

                <div className="flex items-center gap-2">

                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[10px] font-black text-cyan-700 shadow-sm">
                    02
                  </div>

                  <p className="text-xs font-bold text-slate-800">
                    Fortalecer
                  </p>

                </div>

                <p className="mt-2 text-[10px] leading-4 text-slate-500">
                  Impulsar acciones que mejoren continuamente la gestión.
                </p>

              </div>

              {/* 03 */}

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">

                <div className="flex items-center gap-2">

                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[10px] font-black text-emerald-700 shadow-sm">
                    03
                  </div>

                  <p className="text-xs font-bold text-slate-800">
                    Cumplir
                  </p>

                </div>

                <p className="mt-2 text-[10px] leading-4 text-slate-500">
                  Contribuir al logro eficiente de los objetivos.
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ========================================================
            FRASE / COMPROMISO
        ======================================================== */}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#14213d] via-[#172a46] to-[#164e63] p-6 text-white shadow-sm">

          {/* DECORACIÓN */}

          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-400/10" />

          <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-blue-400/10" />

          <div className="relative flex h-full flex-col justify-between">

            <div>

              <div className="flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <HeartHandshake className="h-5 w-5 text-cyan-300" />
                </div>

                <Quote className="h-8 w-8 text-white/10" />

              </div>

              <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                Nuestra responsabilidad
              </p>

            
              <p className="mt-8 text-x leading-6 text-slate-300">
                La participación responsable de cada servidor contribuye
                al fortalecimiento de una institución más eficiente,
                transparente y orientada al cumplimiento.
              </p>

            </div>

            <div className="mt-6">

              <div className="h-px bg-white/10" />

              <div className="mt-4 flex items-center gap-2">

                <ShieldCheck className="h-4 w-4 text-emerald-300" />

                <span className="text-[10px] font-semibold text-slate-300">
                  Compromiso con la mejora institucional
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}