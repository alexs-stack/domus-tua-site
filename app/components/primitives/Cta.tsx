import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowUpRight, Send } from "../Icons";

/* Le varianti di marca (globals.css, blocco «CTA — rettangoli e link
   sottolineati»). Squadrate, senza ombre e senza movimento: all'hover cambia
   solo il colore.
   - cta           contorno rosso, all'hover pieno rosso
   - cta-solid     pieno rosso, all'hover rosso scuro
   - reveal, reveal-cream  alias di cta-solid: i nomi restano per non cambiare
                   l'API, le facce a scorrimento non esistono più
   - ghost         link maiuscolo sottolineato, nessuna scatola; all'hover rosso
   (`ghost-dark`, il ghost in bianco per le scritte sopra una foto, è morto: il
   Congedo non ha più lettere sul video dal 20 set., A35, e le teste stanno
   sull'avorio dal 21 set., A46; tolto il 22 set. dalla revisione avversaria di
   A46, senza chiamanti.)
   Tutto CSS puro: nessun hook, usabile da server e client component. */

type Variant = "cta" | "cta-solid" | "reveal" | "reveal-cream" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  cta: "dt-btn dt-btn--cta",
  "cta-solid": "dt-btn dt-btn--cta dt-btn--cta-solid",
  reveal: "dt-btn dt-btn--cta dt-btn--cta-solid",
  "reveal-cream": "dt-btn dt-btn--cta dt-btn--cta-solid",
  ghost: "dt-btn dt-btn--ghost",
};

const sizeClass: Record<Size, string> = {
  sm: "dt-btn--sm",
  md: "",
  lg: "dt-btn--lg",
};

function classesFor(variant: Variant, size: Size, className: string) {
  return [variantClass[variant], sizeClass[size], className].filter(Boolean).join(" ");
}

function CtaInner({ arrow, children }: { arrow: boolean; children: ReactNode }) {
  return (
    <>
      <span className="dt-btn__label">{children}</span>
      {arrow && (
        <span className="dt-btn__arr" aria-hidden>
          <ArrowUpRight />
          <ArrowUpRight />
        </span>
      )}
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
    <CtaInner arrow={arrow}>
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
      <CtaInner arrow={arrow}>
        {children}
      </CtaInner>
    </button>
  );
}

/* Submit dei form: pieno rosso come cta-solid. L'aeroplanino resta nel markup
   ma il CSS lo nasconde (niente aeroplanini nella rivista bianca); durante
   l'invio lo spinner prende il suo posto accanto all'etichetta e :disabled
   abbassa l'opacità. */
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
