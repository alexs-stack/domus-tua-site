"use client";

// PageTransition — dal 2026-09-10 non c'è più nessun sipario fra le pagine
// (direttiva cliente: via le transizioni curve, come nel riferimento
// immobiliaregoldengoal.it, che cambia pagina e basta). Restano le due
// funzioni che il resto del sito importa, ridotte all'osso: navigare subito
// col router dell'App Router, e rispondere «no» a chi chiede se un sipario
// sta coprendo lo schermo (VideoLightbox e CaseQuickLook decidono così se
// possono riavviare Lenis).
import { useEffect } from "react";
import { useRouter } from "next/navigation";

let navigateImpl: ((href: string) => void) | null = null;

/** Non c'è più nessun sipario: mai coperto. */
export function isTransitionCovering(): boolean {
  return false;
}

/** Naviga subito (router quando è montato, altrimenti navigazione piena). */
export function transitionTo(href: string) {
  if (navigateImpl) navigateImpl(href);
  else window.location.assign(href);
}

/** Non rende nulla: registra soltanto il router per `transitionTo`. */
export default function PageTransition() {
  const router = useRouter();
  useEffect(() => {
    navigateImpl = (href) => router.push(href);
    return () => {
      navigateImpl = null;
    };
  }, [router]);
  return null;
}
