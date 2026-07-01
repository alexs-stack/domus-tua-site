// Icone a tratto sottile e preciso (stroke 1.4). No icone spesse generiche.
import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const ArrowUpRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

export const ArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const Star = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}>
    <path d="M12 2.5l2.7 5.9 6.3.7-4.7 4.3 1.3 6.3L12 17.9 6.1 20l1.3-6.3L2.7 9.4l6.3-.7L12 2.5z" />
  </svg>
);

export const Check = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 12.5l5 5 11-11" />
  </svg>
);

export const Phone = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6.5 4h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z" />
  </svg>
);

export const Pin = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const Mail = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

export const Whatsapp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}>
    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-2.8.8.7-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.3.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.2-.3-.2-.5-.3z" />
  </svg>
);

export const Menu = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 8h16M4 16h16" />
  </svg>
);

export const Bed = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 8v10M3 12h18a0 0 0 0 1 0 0v6M21 18v-4a3 3 0 0 0-3-3H7M3 9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" />
  </svg>
);

export const Ruler = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="8" width="18" height="8" rx="1.5" transform="rotate(0 12 12)" />
    <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
  </svg>
);

export const Rooms = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
    <path d="M12 4v16M4 12h16" />
  </svg>
);

export const Play = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}>
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);

export const Quote = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}>
    <path d="M10 7H6a3 3 0 0 0-3 3v7h7v-7H5.5A1.5 1.5 0 0 1 7 8.5V7zm11 0h-4a3 3 0 0 0-3 3v7h7v-7h-2.5A1.5 1.5 0 0 1 18 8.5V7z" />
  </svg>
);

export const Instagram = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const Facebook = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}>
    <path d="M14 9V7.2c0-.8.2-1.2 1.3-1.2H17V3h-2.7C11.6 3 10.5 4.7 10.5 7v2H8.5v3h2v9H14v-9h2.5l.5-3H14z" />
  </svg>
);

export const TikTok = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}>
    <path d="M16.5 3c.3 2 1.5 3.6 3.5 3.9v2.7c-1.3.1-2.5-.3-3.6-1v5.6a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.8a2.9 2.9 0 1 0 2 2.8V3h2.9z" />
  </svg>
);

export const YouTube = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}>
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" />
  </svg>
);

export const Google = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path fill="#4285F4" d="M21.6 12.2c0-.6 0-1.2-.2-1.8H12v3.4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.1z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
    <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6z" />
    <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.6 9.4 5.9 12 5.9z" />
  </svg>
);
