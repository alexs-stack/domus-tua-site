"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "../lib/site";

// Iframe del widget Trustindex, estratto da Reviews.tsx (logica INVARIATA) per
// essere condiviso col capitolo recensioni della home. Sandbox senza
// allow-same-origin: lo script di Trustindex gira in origine opaca (niente
// cookie/localStorage nostri); srcDoc UTF-8 con script che posta la propria
// altezza al parent → nessun box vuoto sotto le card.
export default function TrustindexEmbed({ title }: { title: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameH, setFrameH] = useState(480);

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
    <iframe
      ref={frameRef}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      srcDoc={`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>html,body{margin:0;padding:0;background:transparent;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}</style></head><body><script src="${site.embeds.trustindexLoader}"></script><script>(function(){function p(){try{var h=document.body.scrollHeight;if(h>0)parent.postMessage({type:'dt-ti-height',h:h},'*');}catch(e){}}if(window.ResizeObserver){new ResizeObserver(p).observe(document.body);}window.addEventListener('load',p);[300,800,1500,2500,4000].forEach(function(t){setTimeout(p,t);});})();</script></body></html>`}
      title={title}
      loading="lazy"
      className="w-full"
      style={{ border: 0, height: frameH }}
    />
  );
}
