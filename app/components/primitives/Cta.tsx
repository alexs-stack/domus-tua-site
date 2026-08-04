import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowUpRight, Send } from "../Icons";

/* I "redirect" di marca (globals.css §CTA SYSTEM):
   - cta        anello rosso → riempimento circolare + morph del raggio
   - cta-solid  variante piena per superfici scure/foto
   - reveal     doppia faccia a scorrimento (espresso → rosso)
   - reveal-cream  faccia a riposo crema, per bande espresso/ink
   - ghost      lift su carta con ombra calda (+ ghost-dark)
   Tutto CSS puro: nessun hook, usabile da server e client component. */

type Variant = "cta" | "cta-solid" | "reveal" | "reveal-cream" | "ghost" | "ghost-dark";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  cta: "dt-btn dt-btn--cta",
  "cta-solid": "dt-btn dt-btn--cta dt-btn--cta-solid",
  reveal: "dt-btn dt-btn--reveal",
  "reveal-cream": "dt-btn dt-btn--reveal dt-btn--reveal-cream",
  ghost: "dt-btn dt-btn--ghost",
  "ghost-dark": "dt-btn dt-btn--ghost dt-btn--ghost-dark",
};

const sizeClass: Record<Size, string> = {
  sm: "dt-btn--sm",
  md: "",
  lg: "dt-btn--lg",
};

function classesFor(variant: Variant, size: Size, className: string) {
  return [variantClass[variant], sizeClass[size], className].filter(Boolean).join(" ");
}

function CtaInner({
  variant,
  arrow,
  children,
}: {
  variant: Variant;
  arrow: boolean;
  children: ReactNode;
}) {
  if (variant === "reveal" || variant === "reveal-cream") {
    // Faccia doppia: la copia in arrivo è decorativa per gli screen reader
    return (
      <>
        <span className="dt-btn__face-a">{children}</span>
        <span className="dt-btn__face-b" aria-hidden>
          {children}
        </span>
      </>
    );
  }
  return (
    <>
      <span className="dt-btn__label">{children}</span>
      {arrow && (
        <span className="dt-btn__arr" aria-hidden>
          <ArrowUpRight />
          <ArrowUpRight />
        </span>
      )}
      {(variant === "cta" || variant === "cta-solid") && <span className="dt-btn__fill" aria-hidden />}
    </>
  );
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
};

type CtaLinkProps = CommonProps & { href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className" | "children"
  >;

export function Cta({
  href,
  variant = "cta",
  size = "md",
  arrow = true,
  className = "",
  children,
  ...rest
}: CtaLinkProps) {
  const cls = classesFor(variant, size, className);
  const content = (
    <CtaInner variant={variant} arrow={arrow}>
      {children}
    </CtaInner>
  );
  // Interne (anche con hash) via next/link; esterne/tel/mailto restano <a>
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} {...rest}>
      {content}
    </a>
  );
}

type CtaButtonProps = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function CtaButton({
  variant = "cta",
  size = "md",
  arrow = true,
  className = "",
  children,
  ...rest
}: CtaButtonProps) {
  return (
    <button className={classesFor(variant, size, className)} {...rest}>
      <CtaInner variant={variant} arrow={arrow}>
        {children}
      </CtaInner>
    </button>
  );
}

/* Submit dei form: l'aeroplanino spicca il volo e "porta via" l'etichetta
   (solo hover vero + motion ok, vedi CSS). Durante l'invio lo spinner
   sostituisce l'aereo e il volo è disattivato da :disabled. */
type SendCtaProps = {
  submitting?: boolean;
  size?: Size;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function SendCta({
  submitting = false,
  size = "md",
  className = "",
  disabled,
  children,
  ...rest
}: SendCtaProps) {
  return (
    <button
      type="submit"
      className={["dt-btn dt-btn--send", sizeClass[size], className].filter(Boolean).join(" ")}
      disabled={disabled ?? submitting}
      aria-busy={submitting || undefined}
      {...rest}
    >
      <span className="dt-btn__plane-wrap" aria-hidden>
        {submitting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <Send className="dt-btn__plane" />
        )}
      </span>
      <span className="dt-btn__label">{children}</span>
    </button>
  );
}
