import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "dark";
type Size = "sm" | "md";

const variantClass: Record<Variant, string> = {
  primary: "bg-red text-white hover:bg-red-dark",
  outline: "border border-ink/15 bg-paper text-ink hover:border-red hover:text-red",
  dark: "bg-ink text-cream hover:bg-red",
};

const iconCircleClass: Record<Variant, string> = {
  primary: "bg-white/15",
  outline: "bg-cream-deep",
  dark: "bg-white/15",
};

type Props = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** icona opzionale nel cerchietto finale (pattern button-in-button) */
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  target?: string;
  rel?: string;
  className?: string;
  ariaLabel?: string;
};

// CTA coerente col brand. Con `icon` usa il pattern button-in-button.
export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  href,
  onClick,
  type = "button",
  target,
  rel,
  className = "",
  ariaLabel,
}: Props) {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]";

  const pad = icon
    ? size === "sm"
      ? "py-3 pl-6 pr-2.5 text-sm"
      : "py-4 pl-7 pr-3 text-base"
    : size === "sm"
      ? "px-6 py-3 text-sm"
      : "px-7 py-4 text-base";

  const cls = `${base} ${pad} ${variantClass[variant]} ${className}`;

  const inner = (
    <>
      {children}
      {icon && (
        <span
          className={`flex items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${iconCircleClass[variant]} ${
            size === "sm" ? "h-7 w-7" : "h-8 w-8"
          }`}
        >
          {icon}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} target={target} rel={rel} aria-label={ariaLabel} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} aria-label={ariaLabel} className={cls}>
      {inner}
    </button>
  );
}
