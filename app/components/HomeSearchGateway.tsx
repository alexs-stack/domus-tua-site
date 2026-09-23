"use client";

// Ricerca a filo (rivista bianca, 2026-09-10): titolo grande, campi con il solo
// bordo inferiore, bottone rosso pieno, la scorciatoia "vendi" come riga di testo.
// Niente card. Al submit naviga a /acquista con query params (q, comune, budget,
// type, rooms) che PropertySearch legge e pre-imposta. La ricerca in linguaggio
// naturale resta un teaser (nessuna finta AI).
//
// COREOGRAFIA (Alberto, 13 settembre 2026: A18-A20; spec coreografia §3.4, CAT §6a):
// il pannello del form si aggancia allo scroll, opacità 0,02 → 1 e scala 0,75 → 1
// dal centro, in scrub fra `top 95%` e `top 55%` (firma `ricerca` in chapters.ts: la chiave
// del registro, non l'id `#cerca` della section). L'innesco
// `[data-dock]` resta fermo e scala e opacità stanno sul figlio `[data-dock-panel]`: così
// ScrollTrigger misura start ed end sul bordo che si vede a riposo.
// Il range di Era (`top 30%` → `bottom bottom`) lascerebbe il form a 0,69 al centro
// del viewport. Mai sotto 0,02 e mai `visibility`: i campi restano nel Tab e
// cliccabili. Al primo fuoco dentro il pannello il gesto si ferma a 1 per il resto
// del montaggio. Eyebrow, titolo e blocco venditore restano ai ruoli del testo.
import { useState, useRef } from "react";
import Reveal from "./Reveal";
import SplitTitle from "./motion/SplitTitle";
import { CtaButton } from "./primitives/Cta";
import { useDict, useLocale } from "./i18n/LocaleProvider";
import { transitionTo } from "./motion/PageTransition";
import { gsap, ScrollTrigger, useGSAP, whenStill } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import { chapters } from "../lib/motion/chapters";

const local = {
  it: {
    zona: "Comune o zona", zonaPh: "Es. Tradate", tipologia: "Tipologia", budget: "Budget max", locali: "Locali",
    anyType: "Tutte", anyBudget: "Nessun limite", anyRooms: "Qualsiasi", search: "Cerca casa",
    types: ["Appartamento", "Attico", "Villa"],
    chipsLabel: "Prova:",
    chips: ["Trilocale con giardino", "Villa a Tradate", "Attico con terrazzo", "Casa sotto 300.000 €"],
  },
  en: {
    zona: "Town or area", zonaPh: "E.g. Tradate", tipologia: "Type", budget: "Max budget", locali: "Rooms",
    anyType: "All", anyBudget: "No limit", anyRooms: "Any", search: "Search homes",
    types: ["Apartment", "Penthouse", "Villa"],
    chipsLabel: "Try:",
    chips: ["Two-bed with garden", "Villa in Tradate", "Penthouse with terrace", "Home under €300,000"],
  },
  fr: {
    zona: "Commune ou secteur", zonaPh: "Ex. Tradate", tipologia: "Type", budget: "Budget max", locali: "Pièces",
    anyType: "Tous", anyBudget: "Sans limite", anyRooms: "Indifférent", search: "Chercher un bien",
    types: ["Appartement", "Attique", "Villa"],
    chipsLabel: "Essayez :",
    chips: ["Trois-pièces avec jardin", "Villa à Tradate", "Attique avec terrasse", "Maison sous 300 000 €"],
  },
  de: {
    zona: "Ort oder Gegend", zonaPh: "Z. B. Tradate", tipologia: "Typ", budget: "Max. Budget", locali: "Zimmer",
    anyType: "Alle", anyBudget: "Kein Limit", anyRooms: "Beliebig", search: "Immobilien suchen",
    types: ["Wohnung", "Penthouse", "Villa"],
    chipsLabel: "Beispiele:",
    chips: ["Dreizimmer mit Garten", "Villa in Tradate", "Penthouse mit Terrasse", "Haus unter 300.000 €"],
  },
  es: {
    zona: "Municipio o zona", zonaPh: "Ej. Tradate", tipologia: "Tipo", budget: "Presupuesto máx.", locali: "Estancias",
    anyType: "Todas", anyBudget: "Sin límite", anyRooms: "Cualquiera", search: "Buscar casa",
    types: ["Piso", "Ático", "Villa"],
    chipsLabel: "Prueba:",
    chips: ["Piso de 3 ambientes con jardín", "Villa en Tradate", "Ático con terraza", "Casa por menos de 300.000 €"],
  },
};

// I valori inviati come query param restano canonici (italiano = valori dati), le etichette sono tradotte.
const typeValues = ["Appartamento", "Attico", "Villa"];
const budgetValues = [
  { v: 0 }, { v: 250000 }, { v: 350000 }, { v: 500000 }, { v: 750000 },
];
const roomValues = [0, 2, 3, 4];

// Tetto dell'attesa dell'arrivo al frammento prima di armare l'aggancio (D57): lo stesso di
// whenStill in gsap.ts (D39).
const ARRIVO_CAP_MS = 4000;

// Etichetta 16 px maiuscola e campo con il solo bordo inferiore (canone del riferimento).
// `border-ink!`: il `* { border-color: line }` di globals.css è unlayered e batte le utility.
const labelCls = "block text-ui font-semibold uppercase tracking-[0.08em] text-stone";
const fieldCls =
  "block w-full border-0 border-b border-ink! bg-transparent py-3 text-body text-ink placeholder:text-stone focus:border-red! focus:outline-none";

// La freccia della tendina: `appearance-none` toglie quella del browser.
function Caret() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
    >
      <path d="M3 6l5 5 5-5" />
    </svg>
  );
}

export default function HomeSearchGateway() {
  const d = useDict();
  const { locale } = useLocale();
  const c = local[locale];

  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [comune, setComune] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("0");
  const [rooms, setRooms] = useState("0");
  const dockRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dockFocused = useRef(false);

  useGSAP(
    () => {
      const dock = dockRef.current;
      const panel = panelRef.current;
      if (!dock || !panel) return;
      const sig = chapters.ricerca.signature;
      if (!("st" in sig.trigger) || !("scrub" in sig.time)) return;
      const [start, end] = sig.trigger.st;
      const scrub = sig.time.scrub;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        if (dockFocused.current) return;
        // Spec §3.4 (A20): lo stato spento nasce via JS, e solo col bordo alto dell'innesco sotto la
        // linea di start (95 %). Con un'ancora su #cerca o più giù (`/#cerca`, `/#voci`…) non nasce:
        // il browser porta lì lo scroll e il pannello resta pieno.
        const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
        const sezione = dock.closest("section");
        // Un frammento malformato (`/#%`, `/#a%E2`, link troncati) fa lanciare decodeURIComponent, e qui
        // siamo nel layout effect: la home cadrebbe su app/error.tsx. Stessa guardia di fragmentPending
        // (reveal-engine.ts): ripiego sull'id grezzo, che basta agli id ASCII del sito.
        const ancoraDelFrammento = (): HTMLElement | null => {
          const id = location.hash.slice(1);
          if (!id) return null;
          try {
            return document.getElementById(decodeURIComponent(id));
          } catch {
            return document.getElementById(id);
          }
        };
        const ancora = ancoraDelFrammento();
        const ancoraQuiOPiuGiu = !!ancora && !!sezione && docTop(ancora) >= docTop(sezione) - 1;
        const sottoLaLinea = () => dock.getBoundingClientRect().top > 0.95 * window.innerHeight;
        // D120: set, tween e ScrollTrigger dell'aggancio vivono in un gsap.context proprio,
        // `contestoAggancio`, e `arma` è idempotente: smonta quello che ha creato prima di
        // ricrearlo, quindi resta UN tween e UNO ScrollTrigger sul pannello anche quando
        // `arma` si ripete (whenStill qui sotto; il doppio montaggio di React in sviluppo).
        // Il contesto è figlio del solo ramo di gsap.matchMedia, e nessun `contextSafe` del
        // Context di useGSAP gira dentro il ramo: `Context.add` esegue `prev.data.push(self)`
        // (gsap-core.js 3.15, riga 3925), e un Context che finisce nei dati dell'altro in
        // entrambi i versi fa ricorrere senza fondo `Context.prototype.getTweens` (riga
        // 3949). Così l'albero dei Context resta un albero; il cleanup lo reverte.
        // `gsap.context()` senza argomenti restituisce il contesto CORRENTE: è la funzione
        // vuota che ne crea uno nuovo.
        const contestoAggancio = gsap.context(() => {});
        let tween: gsap.core.Tween | undefined;
        const smonta = () => {
          tween?.scrollTrigger?.kill();
          tween?.kill();
          tween = undefined;
          contestoAggancio.revert();
        };
        const arma = () => {
          if (dockFocused.current) return;
          smonta();
          contestoAggancio.add(() => {
            if (!ancoraQuiOPiuGiu && sottoLaLinea()) {
              gsap.set(panel, { opacity: 0.02, scale: 0.75 });
            }
            let primoRefresh = true;
            // Senza invalidateOnRefresh: i valori sono costanti e, con immediateRender false, il revert
            // del refresh (ScrollTrigger.js:1958-1962) lascerebbe il pannello pieno a progresso 0 finché
            // il progresso non cambia (misurato: refresh a scroll fermo col bordo al 95 %, da 0,25 a 1).
            tween = gsap.fromTo(
              panel,
              { opacity: 0.02, scale: 0.75, transformOrigin: "50% 50%" },
              {
                opacity: 1,
                scale: 1,
                ease: sig.ease,
                immediateRender: false,
                scrollTrigger: {
                  trigger: dock,
                  start,
                  end,
                  scrub,
                  // Spec §3.4: `/#cerca` senza fotogrammi sotto 0,99. Il primo aggiornamento dopo il refresh
                  // passa dallo scrub levigato (ScrollTrigger.js:2198-2222; nel refresh di tutti :1244-1248,
                  // prima degli onRefresh): qui lo scrub si chiude subito, una volta sola.
                  onRefresh: (self) => {
                    if (!primoRefresh) return;
                    primoRefresh = false;
                    self.getTween()?.progress(1);
                  },
                },
              },
            );
            tween.scrollTrigger?.getTween()?.progress(1);
          });
        };
        const onFocus = () => {
          dockFocused.current = true;
          smonta();
          gsap.set(panel, { opacity: 1, scale: 1 });
        };
        dock.addEventListener("focusin", onFocus, { once: true });
        // D57 (spec §3.4; D39, D56): con l'ancora qui o più giù e l'innesco ancora sotto la linea di
        // start, l'arrivo nativo al frammento è in corso o sta per partire (Chrome lo ripete a ogni
        // layout fino a load, smooth per circa 1 s): l'aggancio nasce a scroll fermo (whenStill di
        // gsap.ts), aspettando il primo scroll se non è ancora partito, col tetto ARRIVO_CAP_MS. Creato
        // durante l'arrivo, lo ScrollTrigger renderebbe il pannello a 0,02 e lo scrub lo farebbe salire
        // mentre l'innesco attraversa il viewport (misurato: 0,02 a 265 ms, 0,39 a 526 ms, 1 a 1 s).
        // Lo stesso con l'innesco già sopra la linea ma lo scroll in corso: sotto un'idratazione lenta
        // (un task di 300-510 ms, misurato a 390×664 e a 1440×900) l'arrivo porta l'innesco oltre il
        // 95 % prima che questo effetto giri, e armato lì il pannello nasce al progresso di quel
        // momento (0,83-0,94) e torna a 1 solo se l'arrivo lo porta oltre il 55 %.
        let annulla = () => {};
        if (ancoraQuiOPiuGiu && (sottoLaLinea() || ScrollTrigger.isScrolling())) {
          let fermo = () => {};
          let cap = 0;
          const parti = () => {
            window.clearTimeout(cap);
            window.removeEventListener("scroll", parti);
            fermo = whenStill(arma);
          };
          if (ScrollTrigger.isScrolling()) parti();
          else {
            window.addEventListener("scroll", parti, { once: true, passive: true });
            cap = window.setTimeout(parti, ARRIVO_CAP_MS);
          }
          annulla = () => {
            window.clearTimeout(cap);
            window.removeEventListener("scroll", parti);
            fermo();
          };
        } else {
          arma();
        }
        return () => {
          annulla();
          dock.removeEventListener("focusin", onFocus);
          smonta();
          gsap.set(panel, { clearProps: "opacity,transform,transformOrigin" });
        };
      });
    },
    { scope: dockRef },
  );

  function submit(e?: React.FormEvent, presetType?: string) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (comune.trim()) params.set("comune", comune.trim());
    const t = presetType ?? type;
    if (t) params.set("type", t);
    if (budget && budget !== "0") params.set("budget", budget);
    if (rooms && rooms !== "0") params.set("rooms", rooms);
    const qs = params.toString();
    // Micro-transizione coreografata verso i risultati (fallback: push pulito
    // con reduced-motion, gestito dentro PageTransition).
    transitionTo(qs ? `/acquista?${qs}` : "/acquista");
  }

  return (
    <section id="cerca" className="dt-chapter bg-cream">
      <div className="dt-row">
        <Reveal>
          <span className="eyebrow">{d.search.nlTeaser}</span>
        </Reveal>
        <SplitTitle as="h2" className="mt-6 max-w-[18ch] font-display text-d2">
          {d.search.title}
        </SplitTitle>

        <div ref={dockRef} data-dock>
          <div ref={panelRef} data-dock-panel>
          <form onSubmit={submit} className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-4">
            {/* Linguaggio naturale: primo campo, a tutta larghezza (alimenta q). */}
            <div className="md:col-span-4">
              <label className={labelCls}>
                {d.search.nlHint}
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={d.search.nlPlaceholder}
                  aria-label={d.search.title}
                  className={`mt-3 ${fieldCls}`}
                />
              </label>

              {/* Esempi: cliccando si compila il campo (nessun auto-invio: l'utente
                  può ritoccare la frase prima di cercare). */}
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1">
                <span className="text-body text-stone">{c.chipsLabel}</span>
                {c.chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setQ(chip);
                      inputRef.current?.focus();
                    }}
                    className="dt-btn dt-btn--ghost dt-btn--sm"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtri classici */}
            <label className={labelCls}>
              {c.zona}
              <input
                value={comune}
                onChange={(e) => setComune(e.target.value)}
                placeholder={c.zonaPh}
                className={`mt-3 ${fieldCls}`}
              />
            </label>
            <label className={labelCls}>
              {c.tipologia}
              <span className="relative mt-3 block">
                <select value={type} onChange={(e) => setType(e.target.value)} className={`${fieldCls} appearance-none pr-8`}>
                  <option value="">{c.anyType}</option>
                  {typeValues.map((v, i) => (
                    <option key={v} value={v}>{c.types[i]}</option>
                  ))}
                </select>
                <Caret />
              </span>
            </label>
            <label className={labelCls}>
              {c.budget}
              <span className="relative mt-3 block">
                <select value={budget} onChange={(e) => setBudget(e.target.value)} className={`${fieldCls} appearance-none pr-8`}>
                  {budgetValues.map((b) => (
                    <option key={b.v} value={b.v}>{b.v === 0 ? c.anyBudget : `${(b.v / 1000).toLocaleString()}k €`}</option>
                  ))}
                </select>
                <Caret />
              </span>
            </label>
            <label className={labelCls}>
              {c.locali}
              <span className="relative mt-3 block">
                <select value={rooms} onChange={(e) => setRooms(e.target.value)} className={`${fieldCls} appearance-none pr-8`}>
                  {roomValues.map((r) => (
                    <option key={r} value={r}>{r === 0 ? c.anyRooms : `${r}+`}</option>
                  ))}
                </select>
                <Caret />
              </span>
            </label>

            <div className="flex justify-end md:col-span-4">
              <CtaButton type="submit" variant="cta-solid" size="lg">
                {c.search}
              </CtaButton>
            </div>
          </form>
          </div>
        </div>

        {/* La scorciatoia per chi vende («Devi vendere casa?» + lead + link a
            /vendi) non c'e' piu' (2026-09-20, Alberto: «riassumere e eliminare
            diversi copy che sono inutili»): la stessa frase sta due schermi
            sopra, nell'hero («Richiedi la valutazione», «Vendi casa») e in
            Posizionamento; qui costava 300 px sotto il modulo di ricerca. Le
            chiavi `search.seller*` restano nel dizionario per le altre pagine. */}
      </div>
    </section>
  );
}
