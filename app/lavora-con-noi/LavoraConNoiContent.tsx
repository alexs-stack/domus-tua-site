"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import PageHero from "../components/PageHero";
import Reveal from "../components/Reveal";
import CareerApplication, { ROLE_IDS, isRoleId, type RoleId } from "../components/CareerApplication";
import LazyYouTubeEmbed from "../components/LazyYouTubeEmbed";
import { SegnoDomus, SegnoDomusDivider } from "../components/BrandMotif";
import DrawOnScroll from "../components/motion/DrawOnScroll";
import MaskReveal from "../components/motion/MaskReveal";
import Parallax from "../components/motion/Parallax";
import Atmosphere from "../components/motion/Atmosphere";
import TextLines from "../components/motion/TextLines";
import CameraIn from "../components/motion/CameraIn";
import { gsap, useGSAP, MQ } from "../lib/motion/gsap";
import { Cta } from "../components/primitives/Cta";
import { site } from "../lib/site";
import { team, teamInitials, teamRoleLabels } from "../lib/team";
import { faqIt } from "./faq";
import { useLocale } from "../components/i18n/LocaleProvider";

// Pagina "Lavora con noi": candidature spontanee, non annunci di lavoro.
//
// ⚠️ DA VALIDARE COL CLIENTE prima del lancio — questa pagina descrive COME si
// entra in Domus Tua, e sono affermazioni che impegnano l'agenzia:
//   • le cinque aree di candidatura (esistono? se ne cercano altre?);
//   • i quattro passi della selezione (telefonata → colloquio → affiancamento);
//   • la promessa "leggiamo ogni candidatura e ti ricontattiamo noi".
// Tutto il resto sono dati già verificati (sede, anno di fondazione, recensioni,
// composizione del team) — vedi app/lib/site.ts.

/** Le aree mostrate come card. "spontanea" non è una card: è la via d'uscita in coda. */
const ROLE_CARDS = ROLE_IDS.filter(
  (id): id is Exclude<RoleId, "spontanea"> => id !== "spontanea",
);

/**
 * Testata di sezione — la stessa grammatica del capitolo "Perché scegliere Domus Tua"
 * (HorizonStory): occhiello che sale, titolo display che si scopre RIGA PER RIGA da una
 * maschera (TextLines, la firma tipografica del sito), sommario in coda con un ritardo.
 *
 * Prima ogni testata era un unico blocco in fade-up: leggibile, ma muta. Il titolo è il
 * punto in cui la pagina prende voce, e sul resto del sito lo fa così.
 */
function SectionHead({
  eyebrow,
  title,
  intro,
  className = "max-w-2xl",
  titleClassName = "text-4xl sm:text-5xl",
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div className={className}>
      <Reveal>
        <span className="eyebrow">{eyebrow}</span>
      </Reveal>
      <TextLines
        as="h2"
        className={`mt-5 font-display font-medium leading-[1.05] tracking-tight text-ink balance ${titleClassName}`}
      >
        {title}
      </TextLines>
      {intro && (
        <Reveal delay={140}>
          <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-stone">{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

/**
 * Il filo della selezione: una linea che si disegna dall'alto verso il basso mentre si
 * attraversano i quattro passi, ancorata alla colonna dei numeri.
 *
 * È il momento firma della pagina, ed è scrubbato per una ragione narrativa: il processo
 * di selezione È un percorso, e il filo lo percorre alla velocità di chi legge. Stessa
 * tecnica della cupola di HorizonStory — un tween inline legato allo scroll, `ease: "none"`
 * come impone lo scrub — e stesso vocabolario (`gsap.matchMedia(MQ.motionOk)`).
 *
 * Puramente decorativo (`aria-hidden`): senza JS e con reduced-motion la linea semplicemente
 * non c'è, e l'elenco resta l'elenco numerato che era.
 */
function ProcessThread({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const rail = ref.current?.querySelector<HTMLElement>("[data-thread-rail]");
      const track = ref.current;
      if (!rail || !track) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        gsap.fromTo(
          rail,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            transformOrigin: "50% 0%",
            scrollTrigger: {
              trigger: track,
              start: "top 72%",
              end: "bottom 78%",
              scrub: 0.4,
            },
          }
        );
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="relative">
      {/* Il filo corre nel CANALE fra la colonna dei numeri e quella del testo — non
          sopra i numeri, che attraverserebbe. Le due posizioni sono il centro del
          `gap-x` ai due breakpoint della griglia qui sotto (7rem+10/2, 10rem+16/2):
          se cambia la griglia, va cambiato anche questo. Su mobile la colonna è
          `auto` e il canale non esiste: il filo non c'è. */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-8 top-8 hidden w-px overflow-hidden sm:left-[8.25rem] sm:block md:left-[12rem]"
      >
        <span data-thread-rail className="block h-full w-full bg-gradient-to-b from-red/70 to-red/15" />
      </span>
      {children}
    </div>
  );
}

const copy = {
  it: {
    heroEyebrow: "Lavora con noi",
    heroTitle: (): ReactNode => (
      <>
        Cerchiamo persone,
        <br />
        <span className="text-red-soft">prima che curriculum.</span>
      </>
    ),
    heroSubcopy:
      "Domus Tua è un’agenzia indipendente di Tradate: piccola per scelta, esigente per abitudine. Se ti riconosci nel modo in cui lavoriamo, raccontaci chi sei.",
    heroAlt: "Raffaela Rizza consegna una proposta d’acquisto a una cliente, nella sede di Tradate",
    heroPrimary: "Invia la tua candidatura",
    heroSecondary: "Perché proprio qui",
    heroTrust: [
      `A Tradate dal ${site.since}`,
      `${site.reviewsCount} recensioni Google`,
      "Squadra a guida femminile",
    ],
    whyEyebrow: "Perché Domus Tua",
    whyTitle: "Che cosa trovi, il primo giorno.",
    whyIntro:
      "Non promettiamo carriere folgoranti. Promettiamo un mestiere serio, imparato accanto a chi lo fa da anni.",
    why: [
      {
        title: "Un metodo, non l’improvvisazione",
        copy: "Entri in un percorso già strutturato: il Metodo Domus Tua, il protocollo Domus D.O.C., gli Open Domus. Sai cosa fare dal primo giorno, e soprattutto perché si fa così.",
      },
      {
        title: "Strumenti veri, non solo annunci",
        copy: "Rendering, home staging, emotional video, campagne. Lavori con un pacchetto di servizi completo: è la differenza tra vendere una casa e limitarsi a pubblicarla.",
      },
      {
        title: "Una squadra, non una scrivania",
        copy: "Architetto, home stager, front office, coordinamento: sulle pratiche complicate non sei mai da sola. Le competenze sono in ufficio, non in un manuale.",
      },
      {
        title: "Un territorio, non un call center",
        copy: `Tradate e la provincia di Varese dal ${site.since}. Le persone che segui le reincontri al bar e al supermercato: è la ragione per cui il lavoro va fatto bene.`,
      },
    ],
    rolesEyebrow: "Le aree",
    rolesTitle: "Dove cerchiamo persone.",
    rolesIntro:
      "Non pubblichiamo annunci a scadenza: raccogliamo candidature tutto l’anno e le riprendiamo quando si apre una posizione.",
    rolesWhat: "Cosa farai",
    rolesLooking: "Cosa cerchiamo",
    rolesCta: "Candidati per quest’area",
    roles: {
      consulente: {
        title: "Consulente immobiliare",
        what: "Segui le persone dalla prima valutazione fino al rogito: acquisizioni, visite, trattative, rapporti con i clienti.",
        looking: "Ascolto prima della parlantina, ordine nei propri appuntamenti, disponibilità a muoverti sul territorio.",
      },
      frontOffice: {
        title: "Front office e pratiche",
        what: "Accogli chi entra in agenzia e tieni in ordine la macchina: agenda, documenti, pratiche, rapporti con tecnici e notai.",
        looking: "Precisione, memoria per i dettagli e calma quando le scadenze si accavallano.",
      },
      staging: {
        title: "Home staging e allestimenti",
        what: "Prepari le case prima delle foto, dei video e degli Open Domus: allestimenti, materiali, cura degli spazi.",
        looking: "Occhio, gusto e mani: qui si progetta e poi si monta davvero.",
      },
      contenuti: {
        title: "Contenuti, video e social",
        what: "Racconti le case e l’agenzia: riprese, montaggio, foto, contenuti per Instagram, TikTok e YouTube.",
        looking: "Autonomia sugli strumenti e voglia di raccontare storie vere, non di fare pubblicità.",
      },
      tirocinio: {
        title: "Tirocinio o prima esperienza",
        what: "Un ingresso guidato per chi comincia: affianchi il team, impari il metodo, attraversi tutte le fasi di una compravendita.",
        looking: "Curiosità, serietà e presenza. Il resto te lo insegniamo noi.",
      },
    },
    spontaneaTitle: "Non ti riconosci in nessuna di queste?",
    spontaneaCopy:
      "Scrivici lo stesso. Le competenze che non abbiamo ancora in squadra sono spesso quelle che ci servono di più.",
    spontaneaCta: "Manda una candidatura spontanea",
    processEyebrow: "La selezione",
    processTitle: "Come si entra, passo per passo.",
    processIntro:
      "Niente colloqui a sorpresa e niente prove non pagate: un percorso breve e chiaro, in cui capiamo entrambi se ha senso.",
    steps: [
      {
        title: "Ci scrivi",
        copy: "Compili il form qui sotto, ci mandi una mail o un messaggio WhatsApp. Bastano pochi minuti: il curriculum può arrivare dopo.",
      },
      {
        title: "Ti ricontattiamo noi",
        copy: "Una telefonata breve per conoscerti, capire cosa cerchi e raccontarti come lavoriamo davvero.",
      },
      {
        title: "Ci conosciamo in sede",
        copy: "Un colloquio in agenzia a Tradate, con chi lavora nell’area per cui ti candidi. Domande vere, da entrambe le parti.",
      },
      {
        title: "Una giornata con noi",
        copy: "Affianchi il team sul campo prima di decidere. Poi la scelta la facciamo insieme, con le idee chiare.",
      },
    ],
    teamEyebrow: "Chi troverai",
    teamTitle: "Le persone che ti insegneranno il mestiere.",
    teamCopy:
      "Un’agenzia a guida femminile, con ruoli chiari e volti veri: founder, architetto, home stager, front office, coordinamento. Prima di candidarti, guarda chi siamo.",
    teamCta: "Conosci il team",
    teamAlt: "La squadra Domus Tua nello studio",
    teamRosterLabel: "Il team oggi",
    teamVideoCaption: "Guarda la squadra che si presenta",
    ctaAria: "Candidati per l’area {area}",
    selectedAnnounce: "Area selezionata: {area}.",
    faqEyebrow: "Domande frequenti",
    faqTitle: "Le cose che ci chiedono sempre.",
    // Stesse voci del JSON-LD FAQPage in page.tsx: fonte unica in ./faq.ts.
    faq: faqIt,
  },

  en: {
    heroEyebrow: "Work with us",
    heroTitle: (): ReactNode => (
      <>
        We look for people,
        <br />
        <span className="text-red-soft">before résumés.</span>
      </>
    ),
    heroSubcopy:
      "Domus Tua is an independent agency in Tradate: small by choice, demanding by habit. If you recognise yourself in the way we work, tell us who you are.",
    heroAlt: "Raffaela Rizza handing a purchase offer to a client at the Tradate office",
    heroPrimary: "Send your application",
    heroSecondary: "Why here",
    heroTrust: [
      `In Tradate since ${site.since}`,
      `${site.reviewsCount} Google reviews`,
      "A woman-led team",
    ],
    whyEyebrow: "Why Domus Tua",
    whyTitle: "What you find on day one.",
    whyIntro:
      "We don’t promise dazzling careers. We promise a serious craft, learned alongside people who have been doing it for years.",
    why: [
      {
        title: "A method, not improvisation",
        copy: "You step into a structure that already exists: the Domus Tua Method, the Domus D.O.C. protocol, the Open Domus events. You know what to do from day one, and above all why it’s done that way.",
      },
      {
        title: "Real tools, not just listings",
        copy: "Rendering, home staging, emotional video, campaigns. You work with a complete set of services: that’s the difference between selling a home and merely publishing it.",
      },
      {
        title: "A team, not a desk",
        copy: "Architect, home stager, front office, coordination: on complicated files you are never on your own. The expertise sits in the office, not in a manual.",
      },
      {
        title: "A territory, not a call centre",
        copy: `Tradate and the province of Varese since ${site.since}. You meet the people you work for again at the bar and at the supermarket: that’s why the job has to be done properly.`,
      },
    ],
    rolesEyebrow: "The areas",
    rolesTitle: "Where we look for people.",
    rolesIntro:
      "We don’t post job ads with a deadline: we collect applications all year round and go back to them when a position opens.",
    rolesWhat: "What you’ll do",
    rolesLooking: "What we look for",
    rolesCta: "Apply for this area",
    roles: {
      consulente: {
        title: "Property consultant",
        what: "You follow people from the first valuation all the way to the deed: acquisitions, viewings, negotiations, client relationships.",
        looking: "Listening rather than talking, order in your own diary, willingness to move around the area.",
      },
      frontOffice: {
        title: "Front office and paperwork",
        what: "You welcome whoever walks in and keep the machine running: diary, documents, files, dealings with surveyors and notaries.",
        looking: "Precision, a memory for details and calm when deadlines pile up.",
      },
      staging: {
        title: "Home staging and set-up",
        what: "You prepare homes before the photos, the videos and the Open Domus events: staging, materials, care for the space.",
        looking: "An eye, taste and hands: here you design it and then you actually build it.",
      },
      contenuti: {
        title: "Content, video and social",
        what: "You tell the story of the homes and of the agency: filming, editing, photography, content for Instagram, TikTok and YouTube.",
        looking: "Independence with the tools and a wish to tell true stories, not to make adverts.",
      },
      tirocinio: {
        title: "Internship or first job",
        what: "A guided way in for those starting out: you shadow the team, learn the method and go through every stage of a sale.",
        looking: "Curiosity, seriousness and presence. The rest we teach you.",
      },
    },
    spontaneaTitle: "None of these sound like you?",
    spontaneaCopy:
      "Write to us anyway. The skills we don’t have on the team yet are often the ones we need most.",
    spontaneaCta: "Send a speculative application",
    processEyebrow: "The process",
    processTitle: "How you get in, step by step.",
    processIntro:
      "No surprise interviews and no unpaid trials: a short, clear path where both sides work out whether it makes sense.",
    steps: [
      {
        title: "You write to us",
        copy: "Fill in the form below, send us an email or a WhatsApp message. It takes a few minutes: the CV can come later.",
      },
      {
        title: "We get back to you",
        copy: "A short call to get to know you, understand what you’re after and tell you how we really work.",
      },
      {
        title: "We meet at the office",
        copy: "An interview at the agency in Tradate, with whoever works in the area you applied for. Real questions, on both sides.",
      },
      {
        title: "A day with us",
        copy: "You shadow the team in the field before deciding. Then we make the choice together, with clear heads.",
      },
    ],
    teamEyebrow: "Who you’ll meet",
    teamTitle: "The people who’ll teach you the craft.",
    teamCopy:
      "A woman-led agency with clear roles and real faces: founder, architect, home stager, front office, coordination. Before applying, take a look at who we are.",
    teamCta: "Meet the team",
    teamAlt: "The Domus Tua team in the studio",
    teamRosterLabel: "The team today",
    teamVideoCaption: "Watch the team introduce itself",
    ctaAria: "Apply for the {area} area",
    selectedAnnounce: "Selected area: {area}.",
    faqEyebrow: "Frequently asked",
    faqTitle: "The things people always ask.",
    faq: [
      {
        q: "Can I apply even if there’s no open position?",
        a: "Yes, that’s exactly what this page is for. Applications stay available to the team and we go back to them when a position opens.",
      },
      {
        q: "How do I send you my CV?",
        a: `The website doesn’t accept attachments. In the form you can leave a link to your profile or online CV, or email it to us at ${site.email.label}.`,
      },
      {
        q: "What happens to my data?",
        a: "We use it only to assess your application and to get back to you. The details are in the privacy policy, linked below the form.",
      },
      {
        q: "Where is the work based?",
        a: `At our office, ${site.address.street} in Tradate. The work itself is local: Tradate and the province of ${site.address.province}.`,
      },
    ],
  },

  fr: {
    heroEyebrow: "Rejoignez-nous",
    heroTitle: (): ReactNode => (
      <>
        Nous cherchons des personnes,
        <br />
        <span className="text-red-soft">avant des CV.</span>
      </>
    ),
    heroSubcopy:
      "Domus Tua est une agence indépendante de Tradate : petite par choix, exigeante par habitude. Si vous vous reconnaissez dans notre façon de travailler, dites-nous qui vous êtes.",
    heroAlt: "Raffaela Rizza remet une offre d’achat à une cliente, dans les locaux de Tradate",
    heroPrimary: "Envoyer ma candidature",
    heroSecondary: "Pourquoi ici",
    heroTrust: [
      `À Tradate depuis ${site.since}`,
      `${site.reviewsCount} avis Google`,
      "Une équipe dirigée par des femmes",
    ],
    whyEyebrow: "Pourquoi Domus Tua",
    whyTitle: "Ce que vous trouvez dès le premier jour.",
    whyIntro:
      "Nous ne promettons pas de carrières fulgurantes. Nous promettons un vrai métier, appris aux côtés de celles qui l’exercent depuis des années.",
    why: [
      {
        title: "Une méthode, pas de l’improvisation",
        copy: "Vous entrez dans un parcours déjà structuré : la Méthode Domus Tua, le protocole Domus D.O.C., les Open Domus. Vous savez quoi faire dès le premier jour, et surtout pourquoi.",
      },
      {
        title: "De vrais outils, pas seulement des annonces",
        copy: "Rendering, home staging, emotional video, campagnes. Vous travaillez avec une gamme complète de services : c’est la différence entre vendre une maison et se contenter de la publier.",
      },
      {
        title: "Une équipe, pas un bureau",
        copy: "Architecte, home stager, accueil, coordination : sur les dossiers compliqués, vous n’êtes jamais seule. Les compétences sont dans le bureau, pas dans un manuel.",
      },
      {
        title: "Un territoire, pas un centre d’appels",
        copy: `Tradate et la province de Varese depuis ${site.since}. Les personnes que vous suivez, vous les recroisez au café et au supermarché : c’est pour cela que le travail doit être bien fait.`,
      },
    ],
    rolesEyebrow: "Les domaines",
    rolesTitle: "Où nous cherchons des personnes.",
    rolesIntro:
      "Nous ne publions pas d’annonces avec date limite : nous recueillons les candidatures toute l’année et nous y revenons quand un poste se libère.",
    rolesWhat: "Ce que vous ferez",
    rolesLooking: "Ce que nous cherchons",
    rolesCta: "Postuler pour ce domaine",
    roles: {
      consulente: {
        title: "Conseiller immobilier",
        what: "Vous accompagnez les personnes de la première estimation jusqu’à l’acte : prospection, visites, négociations, relation client.",
        looking: "L’écoute avant le bagou, de l’ordre dans son agenda, la disponibilité pour se déplacer sur le secteur.",
      },
      frontOffice: {
        title: "Accueil et gestion des dossiers",
        what: "Vous accueillez celles et ceux qui entrent et vous tenez la machine : agenda, documents, dossiers, relations avec les techniciens et les notaires.",
        looking: "De la précision, une mémoire des détails et du calme quand les échéances s’accumulent.",
      },
      staging: {
        title: "Home staging et aménagement",
        what: "Vous préparez les maisons avant les photos, les vidéos et les Open Domus : mise en scène, matériaux, soin des espaces.",
        looking: "De l’œil, du goût et des mains : ici on conçoit, puis on monte pour de vrai.",
      },
      contenuti: {
        title: "Contenus, vidéo et réseaux sociaux",
        what: "Vous racontez les maisons et l’agence : tournage, montage, photo, contenus pour Instagram, TikTok et YouTube.",
        looking: "De l’autonomie sur les outils et l’envie de raconter des histoires vraies, pas de faire de la publicité.",
      },
      tirocinio: {
        title: "Stage ou première expérience",
        what: "Une entrée accompagnée pour qui débute : vous suivez l’équipe, apprenez la méthode et traversez toutes les étapes d’une vente.",
        looking: "De la curiosité, du sérieux et de la présence. Le reste, nous vous l’apprenons.",
      },
    },
    spontaneaTitle: "Vous ne vous reconnaissez dans aucun de ces domaines ?",
    spontaneaCopy:
      "Écrivez-nous quand même. Les compétences qui manquent encore à l’équipe sont souvent celles dont nous avons le plus besoin.",
    spontaneaCta: "Envoyer une candidature spontanée",
    processEyebrow: "La sélection",
    processTitle: "Comment on entre, étape par étape.",
    processIntro:
      "Pas d’entretien surprise ni d’essai non rémunéré : un parcours court et clair, où chacun comprend si cela a du sens.",
    steps: [
      {
        title: "Vous nous écrivez",
        copy: "Vous remplissez le formulaire ci-dessous, vous nous envoyez un e-mail ou un message WhatsApp. Quelques minutes suffisent : le CV peut venir après.",
      },
      {
        title: "Nous vous rappelons",
        copy: "Un appel bref pour faire connaissance, comprendre ce que vous cherchez et vous raconter comment nous travaillons vraiment.",
      },
      {
        title: "On se rencontre à l’agence",
        copy: "Un entretien à Tradate, avec celles qui travaillent dans le domaine visé. De vraies questions, des deux côtés.",
      },
      {
        title: "Une journée avec nous",
        copy: "Vous accompagnez l’équipe sur le terrain avant de décider. Ensuite, le choix se fait ensemble, en connaissance de cause.",
      },
    ],
    teamEyebrow: "Qui vous rencontrerez",
    teamTitle: "Celles qui vous apprendront le métier.",
    teamCopy:
      "Une agence dirigée par des femmes, avec des rôles clairs et des visages vrais : fondatrice, architecte, home stager, accueil, coordination. Avant de postuler, découvrez qui nous sommes.",
    teamCta: "Découvrir l’équipe",
    teamAlt: "L’équipe Domus Tua en studio",
    teamRosterLabel: "L’équipe aujourd’hui",
    teamVideoCaption: "Regardez l’équipe se présenter",
    ctaAria: "Postuler pour le domaine {area}",
    selectedAnnounce: "Domaine sélectionné : {area}.",
    faqEyebrow: "Questions fréquentes",
    faqTitle: "Ce qu’on nous demande toujours.",
    faq: [
      {
        q: "Puis-je postuler même sans poste ouvert ?",
        a: "Oui, cette page sert précisément à cela. Les candidatures restent à disposition de l’équipe et nous y revenons quand un poste se libère.",
      },
      {
        q: "Comment vous envoyer mon CV ?",
        a: `Le site ne reçoit pas de pièces jointes. Dans le formulaire, vous pouvez laisser un lien vers votre profil ou votre CV en ligne, ou nous l’envoyer par e-mail à ${site.email.label}.`,
      },
      {
        q: "Que deviennent mes données ?",
        a: "Nous les utilisons uniquement pour examiner votre candidature et vous recontacter. Les détails figurent dans la politique de confidentialité, liée sous le formulaire.",
      },
      {
        q: "Où travaille-t-on ?",
        a: `Dans nos locaux, ${site.address.street} à Tradate. Le travail, lui, est local : Tradate et la province de ${site.address.province}.`,
      },
    ],
  },

  de: {
    heroEyebrow: "Arbeiten Sie mit uns",
    heroTitle: (): ReactNode => (
      <>
        Wir suchen Menschen,
        <br />
        <span className="text-red-soft">nicht nur Lebensläufe.</span>
      </>
    ),
    heroSubcopy:
      "Domus Tua ist eine unabhängige Agentur in Tradate: klein aus Überzeugung, anspruchsvoll aus Gewohnheit. Wenn Sie sich in unserer Arbeitsweise wiederfinden, erzählen Sie uns, wer Sie sind.",
    heroAlt: "Raffaela Rizza übergibt einer Kundin ein Kaufangebot im Büro in Tradate",
    heroPrimary: "Bewerbung senden",
    heroSecondary: "Warum hier",
    heroTrust: [
      `In Tradate seit ${site.since}`,
      `${site.reviewsCount} Google-Bewertungen`,
      "Ein von Frauen geführtes Team",
    ],
    whyEyebrow: "Warum Domus Tua",
    whyTitle: "Was Sie am ersten Tag vorfinden.",
    whyIntro:
      "Wir versprechen keine glänzenden Karrieren. Wir versprechen ein solides Handwerk, gelernt an der Seite von Menschen, die es seit Jahren ausüben.",
    why: [
      {
        title: "Eine Methode, keine Improvisation",
        copy: "Sie steigen in einen bestehenden Ablauf ein: die Domus-Tua-Methode, das Domus-D.O.C.-Protokoll, die Open-Domus-Termine. Sie wissen vom ersten Tag an, was zu tun ist – und vor allem warum.",
      },
      {
        title: "Echte Werkzeuge, nicht nur Anzeigen",
        copy: "Rendering, Home Staging, Emotional Video, Kampagnen. Sie arbeiten mit einem vollständigen Leistungspaket: das ist der Unterschied zwischen eine Immobilie verkaufen und sie nur veröffentlichen.",
      },
      {
        title: "Ein Team, kein Schreibtisch",
        copy: "Architektin, Home Stagerin, Empfang, Koordination: Bei schwierigen Vorgängen sind Sie nie allein. Das Wissen sitzt im Büro, nicht in einem Handbuch.",
      },
      {
        title: "Eine Region, kein Callcenter",
        copy: `Tradate und die Provinz Varese seit ${site.since}. Die Menschen, die Sie betreuen, treffen Sie im Café und im Supermarkt wieder: Genau deshalb muss die Arbeit stimmen.`,
      },
    ],
    rolesEyebrow: "Die Bereiche",
    rolesTitle: "Wo wir Menschen suchen.",
    rolesIntro:
      "Wir schalten keine befristeten Stellenanzeigen: Wir sammeln das ganze Jahr über Bewerbungen und greifen darauf zurück, sobald eine Stelle frei wird.",
    rolesWhat: "Ihre Aufgaben",
    rolesLooking: "Was wir suchen",
    rolesCta: "Für diesen Bereich bewerben",
    roles: {
      consulente: {
        title: "Immobilienberatung",
        what: "Sie begleiten Menschen von der ersten Bewertung bis zum Notartermin: Akquise, Besichtigungen, Verhandlungen, Kundenbeziehungen.",
        looking: "Zuhören statt reden, Ordnung im eigenen Kalender, Bereitschaft, in der Region unterwegs zu sein.",
      },
      frontOffice: {
        title: "Empfang und Sachbearbeitung",
        what: "Sie empfangen alle, die hereinkommen, und halten den Betrieb zusammen: Termine, Unterlagen, Vorgänge, Kontakt zu Fachleuten und Notaren.",
        looking: "Genauigkeit, ein Gedächtnis für Details und Ruhe, wenn sich Fristen häufen.",
      },
      staging: {
        title: "Home Staging und Einrichtung",
        what: "Sie bereiten Immobilien vor den Fotos, den Videos und den Open-Domus-Terminen vor: Inszenierung, Materialien, Sorgfalt für den Raum.",
        looking: "Auge, Geschmack und Hände: Hier wird geplant und danach wirklich aufgebaut.",
      },
      contenuti: {
        title: "Content, Video und Social Media",
        what: "Sie erzählen die Immobilien und die Agentur: Dreh, Schnitt, Fotografie, Inhalte für Instagram, TikTok und YouTube.",
        looking: "Sicherheit im Umgang mit den Werkzeugen und Lust, wahre Geschichten zu erzählen statt Werbung zu machen.",
      },
      tirocinio: {
        title: "Praktikum oder Berufseinstieg",
        what: "Ein begleiteter Einstieg für alle, die anfangen: Sie arbeiten dem Team zu, lernen die Methode und durchlaufen alle Phasen eines Verkaufs.",
        looking: "Neugier, Ernsthaftigkeit und Präsenz. Den Rest bringen wir Ihnen bei.",
      },
    },
    spontaneaTitle: "Nichts davon passt zu Ihnen?",
    spontaneaCopy:
      "Schreiben Sie uns trotzdem. Die Fähigkeiten, die dem Team noch fehlen, sind oft genau die, die wir am dringendsten brauchen.",
    spontaneaCta: "Initiativbewerbung senden",
    processEyebrow: "Die Auswahl",
    processTitle: "Wie man hereinkommt, Schritt für Schritt.",
    processIntro:
      "Keine überraschenden Vorstellungsgespräche und keine unbezahlten Probearbeiten: ein kurzer, klarer Weg, auf dem beide Seiten prüfen, ob es passt.",
    steps: [
      {
        title: "Sie schreiben uns",
        copy: "Sie füllen das Formular unten aus, schicken uns eine E-Mail oder eine WhatsApp-Nachricht. Ein paar Minuten genügen: Der Lebenslauf kann später kommen.",
      },
      {
        title: "Wir melden uns bei Ihnen",
        copy: "Ein kurzes Telefonat, um Sie kennenzulernen, zu verstehen, was Sie suchen, und Ihnen zu erzählen, wie wir wirklich arbeiten.",
      },
      {
        title: "Wir treffen uns im Büro",
        copy: "Ein Gespräch in der Agentur in Tradate, mit den Personen aus Ihrem Wunschbereich. Echte Fragen, auf beiden Seiten.",
      },
      {
        title: "Ein Tag mit uns",
        copy: "Sie begleiten das Team vor Ort, bevor Sie sich entscheiden. Danach treffen wir die Entscheidung gemeinsam und mit klarem Kopf.",
      },
    ],
    teamEyebrow: "Wen Sie treffen",
    teamTitle: "Die Menschen, die Ihnen das Handwerk beibringen.",
    teamCopy:
      "Eine von Frauen geführte Agentur mit klaren Rollen und echten Gesichtern: Gründerin, Architektin, Home Stagerin, Empfang, Koordination. Sehen Sie sich an, wer wir sind, bevor Sie sich bewerben.",
    teamCta: "Das Team kennenlernen",
    teamAlt: "Das Domus-Tua-Team im Studio",
    teamRosterLabel: "Das Team heute",
    teamVideoCaption: "Sehen Sie, wie sich das Team vorstellt",
    ctaAria: "Für den Bereich {area} bewerben",
    selectedAnnounce: "Ausgewählter Bereich: {area}.",
    faqEyebrow: "Häufige Fragen",
    faqTitle: "Was uns immer gefragt wird.",
    faq: [
      {
        q: "Kann ich mich auch ohne offene Stelle bewerben?",
        a: "Ja, genau dafür ist diese Seite da. Bewerbungen bleiben dem Team zugänglich, und wir greifen darauf zurück, sobald eine Stelle frei wird.",
      },
      {
        q: "Wie schicke ich Ihnen meinen Lebenslauf?",
        a: `Die Website nimmt keine Anhänge entgegen. Im Formular können Sie einen Link zu Ihrem Profil oder Online-Lebenslauf hinterlassen oder ihn uns per E-Mail an ${site.email.label} senden.`,
      },
      {
        q: "Was passiert mit meinen Daten?",
        a: "Wir verwenden sie ausschließlich, um Ihre Bewerbung zu prüfen und Sie zurückzurufen. Die Details stehen in der Datenschutzerklärung, verlinkt unter dem Formular.",
      },
      {
        q: "Wo wird gearbeitet?",
        a: `In unserem Büro, ${site.address.street} in Tradate. Die Arbeit selbst findet vor Ort statt: Tradate und die Provinz ${site.address.province}.`,
      },
    ],
  },

  es: {
    heroEyebrow: "Trabaja con nosotras",
    heroTitle: (): ReactNode => (
      <>
        Buscamos personas,
        <br />
        <span className="text-red-soft">antes que currículums.</span>
      </>
    ),
    heroSubcopy:
      "Domus Tua es una agencia independiente de Tradate: pequeña por elección, exigente por costumbre. Si te reconoces en nuestra forma de trabajar, cuéntanos quién eres.",
    heroAlt: "Raffaela Rizza entrega una propuesta de compra a una clienta, en la sede de Tradate",
    heroPrimary: "Enviar la candidatura",
    heroSecondary: "Por qué aquí",
    heroTrust: [
      `En Tradate desde ${site.since}`,
      `${site.reviewsCount} reseñas de Google`,
      "Un equipo dirigido por mujeres",
    ],
    whyEyebrow: "Por qué Domus Tua",
    whyTitle: "Qué encuentras el primer día.",
    whyIntro:
      "No prometemos carreras fulgurantes. Prometemos un oficio serio, aprendido junto a quien lo ejerce desde hace años.",
    why: [
      {
        title: "Un método, no la improvisación",
        copy: "Entras en un recorrido ya estructurado: el Método Domus Tua, el protocolo Domus D.O.C., los Open Domus. Sabes qué hacer desde el primer día y, sobre todo, por qué se hace así.",
      },
      {
        title: "Herramientas de verdad, no solo anuncios",
        copy: "Rendering, home staging, emotional video, campañas. Trabajas con un paquete de servicios completo: esa es la diferencia entre vender una casa y limitarse a publicarla.",
      },
      {
        title: "Un equipo, no un escritorio",
        copy: "Arquitecta, home stager, recepción, coordinación: en los expedientes complicados nunca estás sola. Las competencias están en la oficina, no en un manual.",
      },
      {
        title: "Un territorio, no un call center",
        copy: `Tradate y la provincia de Varese desde ${site.since}. A las personas que acompañas te las vuelves a encontrar en el bar y en el supermercado: por eso el trabajo hay que hacerlo bien.`,
      },
    ],
    rolesEyebrow: "Las áreas",
    rolesTitle: "Dónde buscamos personas.",
    rolesIntro:
      "No publicamos anuncios con fecha de caducidad: recogemos candidaturas todo el año y las retomamos cuando se abre una posición.",
    rolesWhat: "Qué harás",
    rolesLooking: "Qué buscamos",
    rolesCta: "Presentarme para esta área",
    roles: {
      consulente: {
        title: "Consultor inmobiliario",
        what: "Acompañas a las personas desde la primera valoración hasta la escritura: captación, visitas, negociaciones, relación con los clientes.",
        looking: "Escuchar antes que hablar, orden en la propia agenda y disponibilidad para moverte por la zona.",
      },
      frontOffice: {
        title: "Recepción y gestión de expedientes",
        what: "Recibes a quien entra en la agencia y mantienes la maquinaria en orden: agenda, documentos, expedientes, trato con técnicos y notarios.",
        looking: "Precisión, memoria para los detalles y calma cuando se acumulan los plazos.",
      },
      staging: {
        title: "Home staging y ambientación",
        what: "Preparas las casas antes de las fotos, los vídeos y los Open Domus: montaje, materiales, cuidado de los espacios.",
        looking: "Ojo, gusto y manos: aquí se proyecta y luego se monta de verdad.",
      },
      contenuti: {
        title: "Contenidos, vídeo y redes",
        what: "Cuentas las casas y la agencia: grabación, montaje, fotografía, contenidos para Instagram, TikTok y YouTube.",
        looking: "Autonomía con las herramientas y ganas de contar historias reales, no de hacer publicidad.",
      },
      tirocinio: {
        title: "Prácticas o primera experiencia",
        what: "Una entrada acompañada para quien empieza: te sumas al equipo, aprendes el método y recorres todas las fases de una compraventa.",
        looking: "Curiosidad, seriedad y presencia. El resto te lo enseñamos nosotras.",
      },
    },
    spontaneaTitle: "¿No te reconoces en ninguna de estas áreas?",
    spontaneaCopy:
      "Escríbenos igualmente. Las competencias que todavía no tenemos en el equipo suelen ser las que más nos hacen falta.",
    spontaneaCta: "Enviar una candidatura espontánea",
    processEyebrow: "La selección",
    processTitle: "Cómo se entra, paso a paso.",
    processIntro:
      "Sin entrevistas sorpresa ni pruebas no remuneradas: un recorrido breve y claro en el que ambas partes entienden si tiene sentido.",
    steps: [
      {
        title: "Nos escribes",
        copy: "Rellenas el formulario de abajo, nos mandas un correo o un mensaje de WhatsApp. Bastan unos minutos: el currículum puede llegar después.",
      },
      {
        title: "Te contactamos nosotras",
        copy: "Una llamada breve para conocerte, entender qué buscas y contarte cómo trabajamos de verdad.",
      },
      {
        title: "Nos conocemos en la oficina",
        copy: "Una entrevista en la agencia de Tradate, con quien trabaja en el área a la que te presentas. Preguntas reales, por ambas partes.",
      },
      {
        title: "Un día con nosotras",
        copy: "Acompañas al equipo sobre el terreno antes de decidir. Después la elección la hacemos juntas, con las ideas claras.",
      },
    ],
    teamEyebrow: "A quién encontrarás",
    teamTitle: "Las personas que te enseñarán el oficio.",
    teamCopy:
      "Una agencia dirigida por mujeres, con roles claros y rostros reales: fundadora, arquitecta, home stager, recepción, coordinación. Antes de presentarte, mira quiénes somos.",
    teamCta: "Conoce al equipo",
    teamAlt: "El equipo Domus Tua en el estudio",
    teamRosterLabel: "El equipo hoy",
    teamVideoCaption: "Mira al equipo presentarse",
    ctaAria: "Presentarme para el área {area}",
    selectedAnnounce: "Área seleccionada: {area}.",
    faqEyebrow: "Preguntas frecuentes",
    faqTitle: "Lo que siempre nos preguntan.",
    faq: [
      {
        q: "¿Puedo presentarme aunque no haya una posición abierta?",
        a: "Sí, esta página sirve exactamente para eso. Las candidaturas quedan a disposición del equipo y las retomamos cuando se abre una posición.",
      },
      {
        q: "¿Cómo os envío el currículum?",
        a: `La web no recibe archivos adjuntos. En el formulario puedes dejar un enlace a tu perfil o a tu CV online, o enviárnoslo por correo a ${site.email.label}.`,
      },
      {
        q: "¿Qué pasa con mis datos?",
        a: "Los usamos solo para valorar tu candidatura y para contactarte. Los detalles están en la política de privacidad, enlazada debajo del formulario.",
      },
      {
        q: "¿Dónde se trabaja?",
        a: `En la sede, ${site.address.street} en Tradate. El trabajo, eso sí, es local: Tradate y la provincia de ${site.address.province}.`,
      },
    ],
  },
} as const;

export default function LavoraConNoiContent() {
  const { locale } = useLocale();
  const c = copy[locale];
  // L'area scelta vive qui: le card dei ruoli la impostano e il form la riceve
  // già selezionata (una sola verità).
  const [role, setRole] = useState<RoleId>("consulente");
  // Messaggio per screen reader: chi non vede la pagina scorrere deve comunque
  // sapere che il click sulla card ha cambiato l'area nel form.
  const [announce, setAnnounce] = useState("");

  const chooseRole = (id: RoleId, label: string) => {
    setRole(id);
    setAnnounce(c.selectedAnnounce.replace("{area}", label));
  };

  // Deep link /lavora-con-noi?ruolo=staging — stesso patto di /contatti?intent=buyer:
  // l'agenzia può linkare un'area precisa da un post Instagram o da un annuncio.
  // Letto solo lato client (nessun mismatch di hydration).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("ruolo");
    if (q && isRoleId(q)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRole(q);
    }
  }, []);

  return (
    <main className="flex-1">
      <PageHero
        eyebrow={c.heroEyebrow}
        title={c.heroTitle()}
        subcopy={c.heroSubcopy}
        image="/images/reali/consulenza.jpg"
        alt={c.heroAlt}
        primary={{ label: c.heroPrimary, href: "#candidatura" }}
        secondary={{ label: c.heroSecondary, href: "#perche" }}
        trust={[...c.heroTrust]}
        // Foto d'ufficio molto luminosa (finestre, pareti bianche): col velo
        // standard il titolo crema si perdeva sulla metà chiara dell'immagine.
        scrim="strong"
      />

      <SegnoDomusDivider className="py-14" />

      {/* ── Perché Domus Tua ─────────────────────────────────────────────── */}
      <section id="perche" className="relative bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
          <SectionHead eyebrow={c.whyEyebrow} title={c.whyTitle} intro={c.whyIntro} />

          {/* Griglia asimmetrica: la prima voce occupa due colonne su desktop,
              così le quattro schede non leggono come quattro scatole identiche. */}
          <ul className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-line bg-line sm:mt-16 sm:grid-cols-2">
            {c.why.map((item, i) => (
              <Reveal
                as="li"
                key={item.title}
                delay={i * 60}
                className={`bg-paper p-7 sm:p-9 ${i === 0 ? "sm:col-span-2" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <DrawOnScroll duration={0.8}>
                    <SegnoDomus className="h-4 w-11 text-red opacity-80" embrace={false} />
                  </DrawOnScroll>
                  <span className="tnum text-[0.72rem] font-semibold tracking-[0.2em] text-stone">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3
                  className={`mt-5 font-display font-medium leading-snug tracking-tight text-ink ${
                    i === 0 ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
                  }`}
                >
                  {item.title}
                </h3>
                <p className="mt-3 max-w-xl text-[0.98rem] leading-relaxed text-stone">{item.copy}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Le aree ──────────────────────────────────────────────────────── */}
      <section id="aree" className="relative bg-cream">
        <Atmosphere word="Domus Tua" glow drift={-1} wordClassName="right-[3%] top-[6%] text-[12vw]" />
        <div className="relative mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
          <SectionHead eyebrow={c.rolesEyebrow} title={c.rolesTitle} intro={c.rolesIntro} />

          <ul className="mt-14 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
            {ROLE_CARDS.map((id, i) => {
              const r = c.roles[id];
              return (
                <Reveal
                  as="li"
                  key={id}
                  delay={i * 50}
                  className="group flex h-full flex-col rounded-[2rem] border border-line bg-paper p-7 transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-red/40 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <h3 className="font-display text-xl font-medium leading-snug tracking-tight text-ink sm:text-[1.4rem]">
                    {r.title}
                  </h3>

                  <dl className="mt-5 flex flex-1 flex-col gap-4">
                    <div>
                      <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-red-dark">
                        {c.rolesWhat}
                      </dt>
                      <dd className="mt-1.5 text-[0.95rem] leading-relaxed text-stone">{r.what}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-stone">
                        {c.rolesLooking}
                      </dt>
                      <dd className="mt-1.5 text-[0.95rem] leading-relaxed text-stone">{r.looking}</dd>
                    </div>
                  </dl>

                  {/* Sceglie l'area e porta al form (l'ancora fa lo scroll, Lenis
                      rispetta lo scroll-margin dell'header). aria-label esplicita:
                      cinque link con lo stesso testo, letti fuori contesto, sono
                      indistinguibili in un elenco di link dello screen reader. */}
                  <Cta
                    href="#candidatura"
                    variant="ghost"
                    size="sm"
                    aria-label={c.ctaAria.replace("{area}", r.title)}
                    onClick={() => chooseRole(id, r.title)}
                    className="mt-7 self-start"
                  >
                    {c.rolesCta}
                  </Cta>
                </Reveal>
              );
            })}

            {/* Candidatura spontanea: stessa griglia, trattamento invertito
                (fondo scuro) così chiude la sequenza invece di ripeterla. */}
            <Reveal
              as="li"
              delay={ROLE_CARDS.length * 50}
              className="flex h-full flex-col justify-between rounded-[2rem] border border-espresso bg-espresso p-7 text-cream"
            >
              <div>
                <SegnoDomus className="h-4 w-11 text-red-soft" embrace={false} />
                <h3 className="mt-5 font-display text-xl font-medium leading-snug tracking-tight sm:text-[1.4rem]">
                  {c.spontaneaTitle}
                </h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-cream/75">{c.spontaneaCopy}</p>
              </div>
              <Cta
                href="#candidatura"
                variant="reveal-cream"
                size="sm"
                onClick={() => chooseRole("spontanea", c.spontaneaCta)}
                className="mt-7 self-start"
              >
                {c.spontaneaCta}
              </Cta>
            </Reveal>
          </ul>
        </div>
      </section>

      {/* ── La selezione ─────────────────────────────────────────────────── */}
      <section id="selezione" className="relative bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
          {/* Respiro fra i capitoli: lo stesso filo rosso verticale che separa gli atti
              di HorizonStory. Segna il passaggio da "perché noi" a "come si entra". */}
          <Reveal className="mx-auto mb-16 h-14 w-px bg-red/40" as="div">
            <span className="sr-only" />
          </Reveal>

          <SectionHead eyebrow={c.processEyebrow} title={c.processTitle} intro={c.processIntro} />

          <ProcessThread>
            <ol className="mt-14 border-t border-line sm:mt-16">
              {c.steps.map((step, i) => (
                <Reveal
                  as="li"
                  key={step.title}
                  delay={i * 45}
                  className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-b border-line py-8 sm:grid-cols-[7rem_1fr] sm:gap-x-10 sm:py-10 md:grid-cols-[10rem_1fr] md:gap-x-16"
                >
                  <span className="tnum font-display text-3xl font-medium leading-none text-red sm:text-4xl md:text-5xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="max-w-xl pt-0.5">
                    <h3 className="font-display text-xl font-medium leading-snug tracking-tight text-ink sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 text-[0.98rem] leading-relaxed text-stone">{step.copy}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </ProcessThread>
        </div>
      </section>

      {/* ── Chi troverai ─────────────────────────────────────────────────────
          Le persone con nome e ruolo (fonte unica: app/lib/team.ts) + il video
          reale in cui la squadra si presenta. A un candidato interessa vedere
          in faccia chi lo formerà, non leggere che "il team è affiatato". */}
      <section className="relative bg-cream">
        {/* Dolly d'ingresso: la scena delle persone entra con una micro-zoomata legata
            allo scroll (solo desktop + motion ok). Niente sticky/fixed qui dentro —
            è il vincolo di CameraIn. */}
        <CameraIn className="mx-auto block max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <Parallax speed={-0.06}>
              <Reveal>
                <figure className="overflow-hidden rounded-[2rem] border border-line bg-paper p-2">
                  <MaskReveal from="bottom" zoom={1.08} className="overflow-hidden rounded-[calc(2rem-0.5rem)]">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[calc(2rem-0.5rem)]">
                      <Image
                        src="/images/reali/team-group.jpg"
                        alt={c.teamAlt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 520px"
                        className="object-cover"
                      />
                    </div>
                  </MaskReveal>
                </figure>

                {/* Video vero dal canale dell'agenzia: iframe caricato solo al click. */}
                <figure className="mt-5">
                  <LazyYouTubeEmbed id={site.videos.team.id} title={site.videos.team.title} />
                  <figcaption className="mt-3 flex items-center gap-2 text-[0.8rem] text-stone">
                    <SegnoDomus className="h-3 w-8 shrink-0 text-red" embrace={false} />
                    {c.teamVideoCaption}
                  </figcaption>
                </figure>
              </Reveal>
            </Parallax>

            <div>
              <SectionHead
                eyebrow={c.teamEyebrow}
                title={c.teamTitle}
                intro={c.teamCopy}
                className=""
                titleClassName="text-3xl sm:text-[2.6rem] leading-[1.06]"
              />

              <div className="mt-9">
                <div className="flex items-center gap-3">
                  <p className="eyebrow">{c.teamRosterLabel}</p>
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                </div>
                <ul className="mt-5 grid gap-x-7 gap-y-px sm:grid-cols-2">
                  {team.map((member, i) => (
                    <li
                      key={member.name}
                      className="group flex items-center gap-3.5 border-t border-line/70 py-3.5 sm:first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
                    >
                      <span
                        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] font-display text-[0.95rem] font-semibold text-graphite ring-1 ring-inset ring-line transition-[background-color,color,box-shadow] duration-300 group-hover:bg-red group-hover:text-white group-hover:ring-red ${
                          i % 2 === 0 ? "bg-paper" : "bg-cream-deep"
                        }`}
                      >
                        {teamInitials(member.name)}
                        {member.founder && (
                          <span
                            className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red ring-2 ring-cream transition-colors duration-300 group-hover:bg-white"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <span className="leading-tight">
                        <span className="block text-sm font-semibold text-ink">{member.name}</span>
                        <span className="block text-[0.8rem] text-stone">
                          {teamRoleLabels[locale][member.role]}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Reveal delay={80}>
                <Cta href="/chi-siamo" variant="ghost" size="md" className="mt-8">
                  {c.teamCta}
                </Cta>
              </Reveal>
            </div>
          </div>
        </CameraIn>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="relative bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <SectionHead
              eyebrow={c.faqEyebrow}
              title={c.faqTitle}
              className=""
              titleClassName="text-3xl sm:text-[2.6rem] leading-[1.06]"
            />

            {/* <details> nativo: apre senza JS, resta accessibile da tastiera. */}
            <div className="border-t border-line">
              {c.faq.map((item, i) => (
                <Reveal as="div" key={item.q} delay={i * 45}>
                  <details className="group border-b border-line py-5">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left font-display text-lg font-medium leading-snug text-ink transition-colors duration-300 hover:text-red [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span
                        aria-hidden
                        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-stone transition-transform duration-300 group-open:rotate-45"
                      >
                        <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current stroke-[1.6]">
                          <path d="M6 1v10M1 6h10" strokeLinecap="round" />
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-3 max-w-2xl pr-12 text-[0.95rem] leading-relaxed text-stone">
                      {item.a}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Conferma per screen reader del cambio area (il resto lo dice lo scroll). */}
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      <CareerApplication role={role} onRoleChange={setRole} />
    </main>
  );
}
