"use client";

// MotionFreeze — la guardia di /case/[slug] (A26 «Nessun sipario» di Alberto,
// D32; spec §5.4). La scheda immobile è una pagina di conversione e resta fuori
// dalla coreografia di A18-A20: qui dentro Reveal usa l'implementazione di
// prima, il motore dei reveal non arma nulla e `[data-motion-freeze] .reveal`
// tiene la CSS di prima. `display: contents`: il contenitore non ha scatola, e
// sticky e fixed della pagina restano come sono.
// Guardia: app/lib/__tests__/case-guard.test.ts.
import { createContext, useContext, type ReactNode } from "react";

const Frozen = createContext(false);

export function useMotionFrozen(): boolean {
  return useContext(Frozen);
}

export default function MotionFreeze({ children }: { children: ReactNode }) {
  return (
    <Frozen.Provider value={true}>
      <div data-motion-freeze="" className="contents">
        {children}
      </div>
    </Frozen.Provider>
  );
}
