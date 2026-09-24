"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "../lib/site";

// Iframe del widget Trustindex, estratto da Reviews.tsx (logica INVARIATA) per
// essere condiviso col capitolo recensioni della home. Sandbox senza
// allow-same-origin: lo script di Trustindex gira in origine opaca (niente
// cookie/localStorage nostri); srcDoc UTF-8 con script che posta la propria
// altezza al parent → nessun box vuoto sotto le card.
//
// PIGRIZIA VERA, NON `loading="lazy"`. Il widget vive sotto la piega (fondo del
// capitolo recensioni), quindi lo si vuole caricare solo quando ci si avvicina.
// Ma `loading="lazy"` non fa nulla su un iframe con `srcDoc`: quell'attributo
// differisce un `src` da scaricare, e qui di src non ce n'è — il documento è
// già in mano al browser, che lo monta subito e con lui lo script di Trustindex.
// Misurato (build di produzione, mobile ×4 CPU, Slow-4G): ~736ms di thread
// principale di TERZE PARTI spesi al primo paint, mentre l'utente guarda ancora
// l'hero, per un widget a diverse schermate di distanza. In più la misura di
// laboratorio dà il consenso preimpostato, quindi quel costo finiva nel TBT
// della home anche se un visitatore nuovo — senza consenso — non lo paga mai.
//
// La pigrizia la fa un IntersectionObserver: il documento (e quindi lo script)
// nasce solo quando il contenitore entra entro 600px dal viewport. Il consenso
// resta il cancello di PRIMA istanza (deciso da chi monta questo componente);
// questo è il secondo cancello, di sola performance. Fuori da un browser, o
// senza IntersectionObserver, si arma subito: nessuna regressione dove la
// pigrizia non è osservabile.
export default function TrustindexEmbed({ title }: { title: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const [frameH, setFrameH] = useState(480);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    if (typeof IntersectionObserver === "undefined") {
      // Browser senza IntersectionObserver (molto datato): la pigrizia non è
      // possibile, si arma comunque — ma al frame successivo, fuori dal corpo
      // dell'effect, per non innescare un render a cascata.
      const id = requestAnimationFrame(() => setArmed(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true);
          io.disconnect();
        }
      },
      // 600px di anticipo: il widget è caldo prima di entrare davvero in vista,
      // così scorrendo non si vede un buco che si riempie in ritardo.
      { rootMargin: "600px 0px" }
    );
    io.observe(holder);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.source !== frameRef.current?.contentWindow) return;
      const d = e.data as { type?: string; h?: number };
      if (d?.type === "dt-ti-height" && typeof d.h === "number") {
        setFrameH(Math.max(240, Math.min(1800, Math.round(d.h))));
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    // Il contenitore riserva SEMPRE l'altezza corrente (min-height): sia da
    // fermo prima di armarsi, sia mentre l'iframe cresce ai messaggi di
    // altezza — niente salto di layout (CLS) al momento del caricamento.
    <div ref={holderRef} style={{ minHeight: frameH }}>
      {armed ? (
        <iframe
          ref={frameRef}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          srcDoc={`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>html,body{margin:0;padding:0;background:transparent;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}</style></head><body><script src="${site.embeds.trustindexLoader}"></script><script>(function(){function p(){try{var h=document.body.scrollHeight;if(h>0)parent.postMessage({type:'dt-ti-height',h:h},'*');}catch(e){}}if(window.ResizeObserver){new ResizeObserver(p).observe(document.body);}window.addEventListener('load',p);[300,800,1500,2500,4000].forEach(function(t){setTimeout(p,t);});})();</script></body></html>`}
          title={title}
          className="w-full"
          style={{ border: 0, height: frameH }}
        />
      ) : null}
    </div>
  );
}
