"use client";

// Reveal — un blocco che entra allo scroll col motore dei reveal (A18 e A20 di
// Alberto; D21; spec §2.2 e §2.4). Ruolo `ctn` (default): sale di --dt-ctn-y in
// 1,2 s dtOut; `still`: solo opacità. Le pose le scrive il motore con GSAP,
// inline, solo dopo l'armamento: qui nessuno stile e nessuno stato nascosto.
// Un blocco con un link, un bottone, un summary o un campo diventa `still` da
// sé. Replay a ogni passaggio nei due versi (C22, cliente 2026-08-04):
// risalendo esce alla linea dell'85 %. Dentro un RevealGroup è un membro;
// fuori è un gruppo di sé. `delay` (ms) è lo scarto transitorio di
// lane-sistema §5.2: sta in data-reveal-extra, il motore lo somma al ritardo
// del gruppo (0,3 + i × 0,1 s, D19) nel delay del tween d'ingresso, e in
// sviluppo dà un avviso una volta per caricamento; lo toglie il commit 21 con
// tutte le chiamate.
// Sotto MotionFreeze (/case/[slug], A26 e D32) resta l'implementazione di
// prima: FrozenReveal, qui sotto.
import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { useInRevealGroup, useRevealRegistration } from "./motion/RevealGroup";
import { useMotionFrozen } from "./motion/MotionFreeze";

type RevealProps = {
  role?: "ctn" | "still";
  as?: ElementType;
  className?: string;
  children: ReactNode;
  /** Scarto in ms sommato al ritardo del gruppo (transitorio, lane-sistema §5.2). */
  delay?: number;
};

let delayAvvisato = false;

/** Un avviso per caricamento, in sviluppo: i ritardi li dà l'ordine nel gruppo (spec §2.2, D19). */
function avvisaDelay(): void {
  if (process.env.NODE_ENV === "production" || delayAvvisato) return;
  delayAvvisato = true;
  console.warn("[Reveal] la prop delay è uno scarto transitorio (lane-sistema §5.2): i ritardi li dà l'ordine nel gruppo (D19)");
}

export default function Reveal({ role = "ctn", as = "div", className = "", children, delay = 0 }: RevealProps) {
  const frozen = useMotionFrozen();
  const inGroup = useInRevealGroup();
  useEffect(() => {
    if (delay && !frozen) avvisaDelay();
  }, [delay, frozen]);
  if (frozen) {
    return (
      <FrozenReveal as={as} className={className} delay={delay}>
        {children}
      </FrozenReveal>
    );
  }
  if (inGroup) {
    const Tag = as;
    return (
      <Tag data-reveal={role} data-reveal-extra={delay ? String(delay) : undefined} className={`reveal ${className}`}>
        {children}
      </Tag>
    );
  }
  return (
    <SelfReveal role={role} as={as} className={className} delay={delay}>
      {children}
    </SelfReveal>
  );
}

function SelfReveal({
  role,
  as: Tag,
  className,
  delay,
  children,
}: Required<Omit<RevealProps, "children">> & { children: ReactNode }) {
  const ref = useRef<HTMLElement | null>(null);
  useRevealRegistration(ref, { trigger: "io", hold: false });
  return (
    <Tag
      ref={ref}
      data-reveal-group=""
      data-reveal-trigger="io"
      data-reveal={role}
      data-reveal-extra={delay ? String(delay) : undefined}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  );
}

/**
 * Il Reveal di /case/[slug]: fade-up all'ingresso nel viewport con un
 * IntersectionObserver, blocco nascosto dalla CSS di `[data-motion-freeze] .reveal`
 * finché non arriva `.is-in`.
 */
function FrozenReveal({
  children,
  className,
  delay,
  as: Tag,
}: {
  children: ReactNode;
  className: string;
  delay: number;
  as: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Replay a ogni passaggio (richiesta cliente 2026-08-04): niente unobserve —
    // l'osservatore accende E spegne, così il reveal rigioca in entrambe le
    // direzioni di scroll ogni volta che l'elemento rientra nel viewport.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setShown(entry.isIntersecting));
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    // Rete di sicurezza: se l'observer non scatta mai (blocco più alto del viewport,
    // errore di layout), rivela comunque il contenuto; se l'observer è vivo, le
    // sue notifiche successive riprendono il controllo.
    const safety = window.setTimeout(() => setShown(true), 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? "is-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
