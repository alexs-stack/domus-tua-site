import { Instagram, Facebook, TikTok, YouTube } from "../Icons";
import { site } from "../../lib/site";

/* Icone social rotonde con tooltip elastico (globals.css §CTA SYSTEM).
   Un solo colore di arrivo — il rosso Domus — per tutte le reti: la palette
   del sito non ospita i colori proprietari dei network. */

const networks = [
  { icon: Instagram, label: "Instagram", href: site.social.instagram.href },
  { icon: Facebook, label: "Facebook", href: site.social.facebook.href },
  { icon: TikTok, label: "TikTok", href: site.social.tiktok.href },
  { icon: YouTube, label: "YouTube", href: site.social.youtube.href },
];

export default function SocialLinks({
  tone = "light",
  className = "",
  ariaLabel = (label: string) => `Domus Tua su ${label}`,
}: {
  tone?: "light" | "dark";
  className?: string;
  ariaLabel?: (label: string) => string;
}) {
  return (
    <ul className={["dt-social", tone === "dark" ? "dt-social--dark" : "", className].filter(Boolean).join(" ")}>
      {networks.map((n) => (
        <li key={n.label}>
          <a
            href={n.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ariaLabel(n.label)}
            className="dt-social__link"
          >
            <span className="dt-social__tip" aria-hidden>
              {n.label}
            </span>
            <n.icon className="h-5 w-5" />
          </a>
        </li>
      ))}
    </ul>
  );
}
