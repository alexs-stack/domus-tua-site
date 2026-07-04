"use client";

import dynamic from "next/dynamic";

// Code-split dell’assistente: il bundle viene caricato solo quando la feature è
// abilitata, e mai in SSR (l’assistente è puramente client-side). ssr:false richiede
// un Client Component (vedi next/dist/docs, lazy-loading), da cui questo wrapper.
const Assistant = dynamic(() => import("./Assistant"), { ssr: false });

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_ASSISTANT === "true";

export default function AssistantMount() {
  if (!ENABLED) return null;
  return <Assistant />;
}
