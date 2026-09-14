// ═══════════════════════════════════════════════════════════════════════════
// IL SEGNO DOMUS — sistema di identità visiva ricorrente di Domus Tua.
//
// Derivato dal logo (casa + cuore):
//   • linea-tetto ROSSA   = riparo / casa / direzione / protezione
//   • curva-abbraccio GRIGIA = accompagnamento / cura
//   • angolo/cornice       = la firma Domus Tua su qualsiasi superficie
//
// Regola d'uso: sottile ma riconoscibile. Mai invadente, mai più di un segno "forte"
// per schermata. Vedi docs/segno-domus.md.
// ═══════════════════════════════════════════════════════════════════════════

import MarkDomus from "./MarkDomus";

type MotifProps = {
  className?: string;
  /** compat storica (variante col tetto disegnato): oggi ignorata */
  embrace?: boolean;
};

// ── Segno base: il MONOGRAMMA UFFICIALE ──────────────────────────────────────
// Non ha una variante di colore, e non deve averne: la prop `variant="light"`
// che stava qui era una porta aperta sul logo bianco (nessun call-site la
// usava, ma bastava un giorno e qualcuno l'avrebbe usata). Su fondo scuro il
// segno va posato su una pastiglia chiara, non ricolorato.
// Direttiva cliente: usare il logo reale ovunque. Dal 2026-08-06 è VETTORIALE
// (vedi MarkDomus.tsx): il PNG da 99×92 si sgranava appena passava i ~50px,
// e il monogramma serve anche grande. Il viewBox con preserveAspectRatio di
// default si comporta esattamente come l'object-contain di prima, quindi tutti
// i call-site con box larghi (h-4 w-10) restano validi. Niente stroke-draw:
// il brand book vieta di animare il logo con morph/draw — le entrance restano
// fade/scale/maschere del CONTENITORE.
export function SegnoDomus({ className = "h-4 w-10" }: MotifProps) {
  return <MarkDomus className={className} />;
}

// ── Segno "tick": mini linea-tetto come punto elenco di marca (sostituisce il ✓ generico) ──
export function SegnoTick({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path d="M4 15 L12 7 L20 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Il resto del vecchio «sistema di segni» — angoli, cornici, divisore col
// tetto che si ridisegna, filigrana di monogrammi, badge a pillola — è stato
// tolto il 2026-09-10 con la rivista bianca: niente card da firmare, niente
// filigrane, e il brand book vieta di sbiadire o animare il logo.
