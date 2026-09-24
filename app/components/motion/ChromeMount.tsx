"use client";

import dynamic from "next/dynamic";

// Il "cromo" animato del sito: sipario del preloader, transizione di pagina, cursore custom.
//
// Perché sta dietro a un import dinamico: non è contenuto e non è interazione — è rifinitura.
// Caricato con il resto, occupa banda proprio mentre il browser sta cercando di dipingere il
// titolo dell'hero. Caricato dopo, non toglie niente a nessuno: il cursore custom sostituisce
// un cursore che già c'è, la transizione serve al primo cambio di pagina, e il sipario ha già
// il suo overlay CSS montato dallo script inline nel layout.
//
// ssr: false perché sono tutti effetti puramente client.
const Preloader = dynamic(() => import("./Preloader"), { ssr: false });
const PageTransition = dynamic(() => import("./PageTransition"), { ssr: false });
const Cursor = dynamic(() => import("./Cursor"), { ssr: false });

export function PreloaderMount() {
  return <Preloader />;
}

export function ChromeMount() {
  return (
    <>
      <PageTransition />
      <Cursor />
    </>
  );
}
