"use client";

// RevealGroup — un gruppo del motore dei reveal (spec §2.7; D21). I figli
// portano data-reveal="<ruolo>" e possono essere server component: il motore li
// trova nel DOM all'armamento e ne legge l'ordine per i ritardi (D19).
// trigger "io" (default): lo osserva il motore. "manual": lo pilota un set piece
// con onReady().play(), e resta manuale solo sotto un corridoio acceso o il film
// delle stelle. hold: il gruppo aspetta release(). Al cambio lingua il gruppo
// NON si registra di nuovo: resync() porta i nodi nuovi allo stato corrente
// senza animare, e un gruppo uscito resta uscito (spec §2.3; lane-sistema §5.2).
import { createContext, useContext, useRef, type ElementType, type ReactNode, type RefObject } from "react";
import { useGSAP } from "../../lib/motion/gsap";
import { register, resync, type RevealApi } from "../../lib/motion/reveal-engine";
import { useLocale } from "../i18n/LocaleProvider";

type RevealGroupProps = {
  as?: ElementType;
  className?: string;
  id?: string;
  children: ReactNode;
  trigger?: "io" | "manual";
  hold?: boolean;
  onReady?: (api: { play(dir: "in" | "out", o?: { instant?: boolean }): void; release(): void }) => void;
};

const InGroup = createContext(false);

/** true dentro un RevealGroup: Reveal allora è un membro, non un gruppo di sé. */
export function useInRevealGroup(): boolean {
  return useContext(InGroup);
}

/**
 * Registra l'elemento come gruppo del motore e lo toglie allo smontaggio o al cambio di
 * trigger e hold. Al cambio lingua non disarma: resync() nel microtask dopo il layout
 * effect, fuori dal contesto di useGSAP, così revertOnUpdate non annulla le pose che
 * resync() scrive (useGSAP registra solo ciò che nasce durante il callback).
 */
export function useRevealRegistration(
  ref: RefObject<HTMLElement | null>,
  o: { trigger: "io" | "manual"; hold: boolean; onReady?: (api: RevealApi) => void },
): void {
  const { locale } = useLocale();
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const { api, unregister } = register(el, { trigger: o.trigger, hold: o.hold });
      o.onReady?.(api);
      return unregister;
    },
    { dependencies: [o.trigger, o.hold], revertOnUpdate: true },
  );
  const primo = useRef(true);
  useGSAP(
    () => {
      if (primo.current) {
        primo.current = false;
        return;
      }
      const el = ref.current;
      if (el) queueMicrotask(() => resync(el));
    },
    { dependencies: [locale], revertOnUpdate: true },
  );
}

export default function RevealGroup({
  as: Tag = "div",
  className,
  id,
  children,
  trigger = "io",
  hold = false,
  onReady,
}: RevealGroupProps) {
  const ref = useRef<HTMLElement | null>(null);
  useRevealRegistration(ref, { trigger, hold, onReady });
  return (
    <InGroup.Provider value={true}>
      <Tag
        ref={ref}
        id={id}
        className={className}
        data-reveal-group=""
        data-reveal-trigger={trigger}
        data-reveal-hold={hold ? "" : undefined}
      >
        {children}
      </Tag>
    </InGroup.Provider>
  );
}
