"use client";

// CameraIn — l'ingresso in scena di una sezione, in due dialetti.
// Desktop: "dolly" cinematografico, una micro-zoomata (scale 0.96→1 + risalita)
// legata allo scroll. Sempre visibile (niente opacity: dentro ci sono link e
// testo SEO).
// Telefono: la stessa frase senza la scala — il gemello sta in fondo alla
// coreografia, con scritta la ragione per cui lì l'opacità invece ci sta.
// VINCOLO — vale per ENTRAMBI i rami, perché anche il gemello scrive un
// transform: wrappare solo contenuto SENZA sticky/fixed all'interno (il
// transform del wrapper diventerebbe il loro containing block). Verificato sui
// quattro chiamanti — Stats, Contact, CareerApplication, LavoraConNoiContent:
// nessuno ha discendenti sticky o fixed.
import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP, MQ, dur, dist } from "../../lib/motion/gsap";

// La riga d'ingresso, una sola per i due dialetti: la scena comincia quando il
// bordo alto della sezione è al 94% del viewport. La usano il trigger del
// telefono e la sua rete di sicurezza, e devono dire lo stesso numero.
const START_PCT = 94;

type Props = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Intensità della zoomata (scala iniziale). Solo desktop: sul telefono non c'è scala. */
  from?: number;
};

export default function CameraIn({ children, className = "", as: Tag = "div", from = 0.96 }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      // Qui stava la promessa «sotto i 768 la scena resta ferma solo per ora,
      // la fase 2 le darà il gemello, una risalita semplice senza la scala».
      // La fase 2 l'ha mantenuta alla lettera: il gemello è il secondo mm.add.
      mm.add(`${MQ.motionOk} and ${MQ.desktop}`, () => {
        gsap.fromTo(
          el,
          { scale: from, y: 30, transformOrigin: "50% 62%" },
          {
            scale: 1,
            y: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: `top ${START_PCT}%`, end: "top 42%", scrub: true },
          }
        );
      });

      /* REGOLA CHANEL — ciò che esce è LA SCALA, cioè metà del dolly.
         Su una colonna da 390px scalare il blocco non legge come una camera che
         entra: legge come un'oscillazione — la colonna respira e i bordi del
         testo tremolano, perché a piena larghezza ogni glifo si sposta di una
         frazione di pixel diversa. Resta l'intenzione, «la scena arriva», e a
         dirla la risalita basta da sola. Un solo momento per schermata: qui il
         momento è l'arrivo, non il respiro. */
      mm.add(`${MQ.motionOk} and ${MQ.belowDesktop}`, () => {
        // CONTRADDICE il commento in testa al file («niente opacity: dentro ci
        // sono link e testo SEO»), e la contraddizione va messa per iscritto.
        // Quella decisione è giusta CONTRO UNO SCRUB: un'opacità legata allo
        // scroll lascia la sezione a mezza tinta a ogni quota intermedia, e su
        // un telefono la quota intermedia è dove ci si ferma a leggere. Qui
        // invece il reveal è suonato una volta e ATTERRA su 1 — nessuno stato
        // di riposo è semitrasparente. Il testo per i motori non è in gioco in
        // nessuno dei due casi: lo stato nascosto lo scrive JS, quindi senza JS
        // (e sotto reduced-motion, che questo gate esclude) la pagina è intera.
        //
        // opacity + pointerEvents, mai autoAlpha: qui sotto passano il form
        // contatti e quello delle candidature. È la coppia obbligata della
        // regola scritta in lib/motion/gsap.ts — l'opacità lascia i campi
        // nell'ordine di tabulazione, i pointer-events impediscono che un form
        // invisibile resti un bersaglio vivo sotto il dito.
        //
        // Nessuno dei quattro chiamanti è vicino a un candidato LCP (stanno
        // tutti a metà o a fondo pagina): l'opacità scritta all'idratazione non
        // entra nel conto del caricamento, a differenza di PageHero.
        // NIENTE LAMPO, stessa regola di PageHero e per lo stesso motivo. Un
        // `fromTo` scrive il suo stato iniziale NEL MOMENTO IN CUI NASCE: se il
        // blocco è già dipinto a schermo all'idratazione, si spegne e si
        // riaccende sotto gli occhi. Su /contatti e /lavora-con-noi, dove il
        // wrapper può essere in campo appena sotto l'hero, sarebbe un lampo su
        // un form. Chi è già stato visto non si nasconde più: si lascia dov'è.
        const r0 = el.getBoundingClientRect();
        if (r0.top < window.innerHeight && r0.bottom > 0) return;

        const rise = gsap.fromTo(
          el,
          { y: dist.rise / 2, opacity: 0, pointerEvents: "none" },
          {
            y: 0,
            opacity: 1,
            pointerEvents: "auto",
            // dur.short e non dur.reveal: dentro questi wrapper i reveal per
            // blocco ci sono già (.reveal, TextLines, CharFlip) e su mobile
            // girano tutti. Se l'arrivo della sezione durasse quanto i loro, le
            // due opacità si moltiplicherebbero e il primo schermo sarebbe un
            // doppio velo. Corto, parte per primo e si toglie di mezzo: prima
            // arriva la scena, poi parlano i blocchi.
            duration: dur.short,
            ease: "domus",
            // Si toglie di mezzo finito: senza, ogni wrapper CameraIn resta con
            // un `transform: translate(0,0)` inline per sempre, cioè un layer di
            // compositing promosso a vita per un'animazione già suonata.
            // `once` garantisce che nessuno rilegga quei valori dopo.
            clearProps: "opacity,pointerEvents,transform",
            // `once`: la scena arriva una volta e resta. È anche la difesa dal
            // difetto di famiglia dell'audit (§6.15) — un refresh da resize su
            // `toggleActions … reverse` rispegnerebbe la sezione con la rete di
            // sicurezza già spesa, e qui dentro ci sono form veri.
            scrollTrigger: { trigger: el, start: `top ${START_PCT}%`, once: true },
          }
        );

        // Rete da tastiera: il fuoco che entra in una sezione ancora spenta la
        // accende. Non è un'ipotesi — due chiamanti su quattro sono form.
        const reveal = () => rise.progress(1);
        el.addEventListener("focusin", reveal, { once: true });
        // La rete a tempo VA GUARDATA, e la trappola resta scritta: su una
        // sezione a molte schermate dalla cima un timeout secco non salva
        // l'animazione, LA ANNULLA — completa il tween fuori campo, poi il
        // trigger chiama play() su un tween già finito e la salita non si vede
        // mai. Si legge il rettangolo VIVO e non uno start memorizzato: una
        // guardia che confronta scrollY con st.start eredita esattamente il
        // numero stantio che dovrebbe coprire (audit §9.4).
        const safety = window.setTimeout(() => {
          if (rise.progress() > 0) return;
          if (el.getBoundingClientRect().top < (window.innerHeight * START_PCT) / 100) reveal();
        }, 2500);

        // Tween e trigger li revoca il contesto di matchMedia (nascono in
        // sincrono, non dopo un await): attraversando i 768 l'inline style
        // sparisce e il ramo desktop trova l'elemento pulito. A mano restano
        // solo il listener e il timeout.
        return () => {
          el.removeEventListener("focusin", reveal);
          window.clearTimeout(safety);
        };
      });
    },
    { scope: ref }
  );

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className}>
      {children}
    </Tag>
  );
}
