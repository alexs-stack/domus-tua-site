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
//
// L'ALTEZZA SI RICORDA (23 set. 2026). Il widget dichiara la sua altezza solo
// quando ha caricato, e non è quella riservata da subito: a 1440×900 399 px
// contro 480. Ricaricando la home col widget in cima allo schermo (sotto
// #voci), un secondo dopo l'idratazione tutto ciò che segue saliva di 81 px.
// Ogni altezza dichiarata si scrive in localStorage (ALTEZZA_KEY + pathname,
// { w: innerWidth, h }); alla visita dopo, alla stessa larghezza, il
// contenitore nasce già con quella, e il boot script del layout la fa
// riservare prima del paint al cancello di Voci (--dt-ti-h, globals.css).
const ALTEZZA_KEY = "dt-ti-h";
/** I limiti dell'altezza del widget, applicati quando la dichiara: in localStorage non entra altro. */
const H_MIN = 240;
const H_MAX = 1800;

/** L'altezza dichiarata l'ultima volta su questa pagina e a questa larghezza, o null (stesso controllo del boot script). */
function altezzaRicordata(): number | null {
  try {
    const s = JSON.parse(localStorage.getItem(ALTEZZA_KEY + location.pathname) ?? "null") as { w?: unknown; h?: unknown } | null;
    return s && s.w === window.innerWidth && typeof s.h === "number" && s.h > 0 ? s.h : null;
  } catch {
    return null; // storage negato o valore rotto: si parte dall'altezza di sempre
  }
}

export default function TrustindexEmbed({ title }: { title: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  // Parte dall'altezza che il widget aveva l'ultima volta, se c'è. Leggere localStorage durante il
  // render qui è sicuro: chi monta questo componente lo fa solo col consenso dato, che sul server e
  // all'idratazione è ancora null (useConsent), quindi nasce sempre nel browser, già idratato.
  const [frameH, setFrameH] = useState(() => altezzaRicordata() ?? 480);
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
        const h = Math.max(H_MIN, Math.min(H_MAX, Math.round(d.h)));
        setFrameH(h);
        try {
          localStorage.setItem(ALTEZZA_KEY + location.pathname, JSON.stringify({ w: window.innerWidth, h }));
        } catch {
          /* storage negato: alla visita dopo si riparte dall'altezza di sempre */
        }
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
