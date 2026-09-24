"use client";

import dynamic from "next/dynamic";

// Il "cromo" animato del sito: transizione di pagina e cursore custom.
//
// Perché sta dietro a un import dinamico: non è contenuto e non è interazione — è rifinitura.
// Caricato con il resto, occupa banda proprio mentre il browser sta cercando di dipingere il
// titolo dell'hero. Caricato dopo, non toglie niente a nessuno: il cursore custom sostituisce
// un cursore che già c'è, la transizione serve al primo cambio di pagina.
//
// IL PRELOADER NON STA PIÙ QUI (2026-08-17). Era `dynamic(..., { ssr: false })` e la
// baseline di Fase 0 (docs/mobile-parity-2.md §5.3) ha misurato il prezzo: sotto CPU ×4 e
// Slow-4G il chunk atterrava DOPO il failsafe del boot script e l'intro non suonava affatto.
// Ora il film intero è markup reso dal server (PreloaderShell.tsx) animato in CSS (opzione
// D, docs/mobile-parity-2.md §8.5) e Preloader.tsx — l'orchestratore dei timer — è importato
// staticamente dal root layout: il suo codice viaggia col bundle del layout, non con un
// chunk che aspetta l'idratazione. Un chunk «rifinitura» che deve arrivare in tempo per il
// primo fotogramma non è rifinitura.
//
// ssr: false perché sono tutti effetti puramente client.
const PageTransition = dynamic(() => import("./PageTransition"), { ssr: false });
const Cursor = dynamic(() => import("./Cursor"), { ssr: false });

export function ChromeMount() {
  return (
    <>
      <PageTransition />
      <Cursor />
    </>
  );
}
