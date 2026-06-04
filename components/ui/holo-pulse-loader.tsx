"use client";

import React from "react";
import { PlusIcon } from "lucide-react";

export function HoloPulse() {
  const [dots, setDots] = React.useState("");

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Loader */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 scale-150 rounded-full bg-blue-500/10 blur-xl animate-pulse" />

        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="absolute h-16 w-[1px] bg-blue-500" />
          <div className="absolute h-[1px] w-16 bg-blue-500" />
        </div>

        <div className="relative rounded-full border border-dashed border-blue-500/20 p-2 animate-[spin_2s_linear_infinite]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-blue-400/40 animate-[spin_1.2s_linear_infinite_reverse]">
            <div className="relative z-10 rounded-full border border-blue-500/30 bg-background p-1 shadow-[0_0_15px_-5px_#3b82f6]">
              <PlusIcon
                size={16}
                className="text-blue-500 animate-pulse"
              />
            </div>
          </div>

          {/* Dots */}
          <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />

          <div className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]" />

          <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]" />

          <div className="absolute right-0 top-1/2 h-1.5 w-1.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
        </div>
      </div>

      <div className="flex flex-col items-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blue-500">
          Exportando PDF{dots}
        </p>
      </div>
    </div>
  );
}