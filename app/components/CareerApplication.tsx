"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap, MQ } from "../lib/motion/gsap";
import { ArrowUpRight, Mail, Pin, Whatsapp } from "./Icons";
import { SendCta } from "./primitives/Cta";
import { SegnoDomusBadge } from "./BrandMotif";
import { site } from "../lib/site";
import { buildWhatsAppUrl } from "../lib/forms/whatsapp";
import { formatLeadMessage, submitLead, type Lead } from "../lib/forms/lead";
import WordReveal from "./WordReveal";
import Atmosphere from "./motion/Atmosphere";
import CameraIn from "./motion/CameraIn";
import { useLocale } from "./i18n/LocaleProvider";

// Form candidature di /lavora-con-noi. Stesso patto del form contatti
// (Contact.tsx): validazione client, consenso privacy obbligatorio, honeypot,
// salvataggio best-effort su /api/lead e WhatsApp precompilato come canale
// immediato. Qui l'intento è sempre "career".
//
// Il sito NON riceve allegati (nessuno storage, nessun antivirus, e un CV è un
// dato personale che non vogliamo far transitare da un webhook): il candidato
// lascia un link (LinkedIn/portfolio/CV online) oppure scrive all'indirizzo
// email dell'agenzia. Vedi docs/form-backend-next-step.md.

/** Aree di candidatura. L'id è stabile; il valore inviato all'agenzia è italiano. */
export const ROLE_IDS = [
  "consulente",
  "frontOffice",
  "staging",
  "contenuti",
  "tirocinio",
  "spontanea",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

/** Guardia per i valori che arrivano da fuori (deep link ?ruolo=…). */
export function isRoleId(value: string): value is RoleId {
  return (ROLE_IDS as readonly string[]).includes(value);
}

/**
 * Valore trasmesso nel lead: SEMPRE in italiano, anche se il sito è in un'altra
 * lingua. Chi in agenzia legge il foglio o il messaggio WhatsApp lavora in
 * italiano: tradurgli le etichette renderebbe i lead difficili da filtrare.
 */
const ROLE_VALUE: Record<RoleId, string> = {
  consulente: "Consulente immobiliare",
  frontOffice: "Front office e pratiche",
  staging: "Home staging e allestimenti",
  contenuti: "Contenuti, video e social",
  tirocinio: "Tirocinio / prima esperienza",
  spontanea: "Candidatura spontanea",
};

const EXPERIENCE_IDS = ["none", "junior", "mid", "senior"] as const;
type ExperienceId = (typeof EXPERIENCE_IDS)[number];

/**
 * Rende cliccabile il link del candidato. Quasi nessuno scrive "https://" a mano:
 * senza schema il link finisce nel foglio come testo morto, e chi in agenzia lo
 * apre deve ricopiarlo. Non validiamo altro: un link storto è un problema umano,
 * non un motivo per bloccare una candidatura.
 */
function normalizeUrl(value: string): string {
  const v = value.trim();
  if (!v) return v;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

const EXPERIENCE_VALUE: Record<ExperienceId, string> = {
  none: "Nessuna esperienza nel settore",
  junior: "Meno di 2 anni",
  mid: "Da 2 a 5 anni",
  senior: "Oltre 5 anni",
};

const copy = {
  it: {
    eyebrow: "Candidature",
    badge: "Il primo passo",
    title: "Raccontaci chi sei.",
    subcopy:
      "Non serve un curriculum perfetto: servono cura, ascolto e voglia di imparare un mestiere fatto di persone. Leggiamo ogni candidatura e ti ricontattiamo noi.",
    roleLabel: "Per quale area ti candidi",
    roles: {
      consulente: "Consulente immobiliare",
      frontOffice: "Front office e pratiche",
      staging: "Home staging e allestimenti",
      contenuti: "Contenuti, video e social",
      tirocinio: "Tirocinio o prima esperienza",
      spontanea: "Candidatura spontanea",
    },
    experienceLabel: "Esperienza nel settore",
    experiences: {
      none: "Nessuna, parto da zero",
      junior: "Meno di 2 anni",
      mid: "Da 2 a 5 anni",
      senior: "Oltre 5 anni",
    },
    nameLabel: "Nome e cognome",
    namePlaceholder: "Es. Maria Rossi",
    contactLabel: "Telefono o email",
    contactPlaceholder: "Es. 333 1234567 o maria@email.it",
    portfolioLabel: "Profilo o CV online (facoltativo)",
    portfolioPlaceholder: "Es. linkedin.com/in/tuonome",
    messageLabel: "Raccontaci di te",
    messagePlaceholder:
      "Cosa fai oggi, cosa ti piacerebbe fare con noi, cosa ti ha colpito di Domus Tua…",
    submit: "Invia la candidatura",
    errName: "Inserisci il tuo nome.",
    errContact: "Lasciaci un telefono o un’email per ricontattarti.",
    errConsent: "Per procedere accetta l’informativa privacy.",
    sentPrefix: "Stiamo aprendo WhatsApp. Se non si apre,",
    sentLink: "scrivici al",
    consentPre: "Ho letto l’",
    consentLinkText: "informativa privacy",
    consentPost:
      " e acconsento al trattamento dei miei dati per la valutazione della candidatura.",
    cvTitle: "Hai un CV da allegare?",
    cvCopy:
      "Il sito non riceve allegati. Lascia qui un link al tuo profilo, oppure inviaci il CV per email: lo leggiamo con la stessa attenzione.",
    cvCta: "Scrivici a",
    whereTitle: "Dove si lavora",
    whereCopy: "In sede, a Tradate. Il lavoro è sul territorio: Tradate e la provincia di Varese.",
    whatsappTitle: "Preferisci scrivere?",
    whatsappCopy: "Mandaci un messaggio: rispondiamo negli orari di apertura.",
    whatsappCta: "Scrivici su WhatsApp",
    imageAlt: "Il team Domus Tua nella sede di Tradate",
  },
  en: {
    eyebrow: "Applications",
    badge: "The first step",
    title: "Tell us who you are.",
    subcopy:
      "You don’t need a perfect CV: you need care, the ability to listen and the will to learn a craft made of people. We read every application and we get back to you.",
    roleLabel: "Which area are you applying for",
    roles: {
      consulente: "Property consultant",
      frontOffice: "Front office and paperwork",
      staging: "Home staging and set-up",
      contenuti: "Content, video and social",
      tirocinio: "Internship or first job",
      spontanea: "Speculative application",
    },
    experienceLabel: "Experience in the sector",
    experiences: {
      none: "None, I’m starting from scratch",
      junior: "Less than 2 years",
      mid: "2 to 5 years",
      senior: "More than 5 years",
    },
    nameLabel: "Full name",
    namePlaceholder: "E.g. Maria Rossi",
    contactLabel: "Phone or email",
    contactPlaceholder: "E.g. 333 1234567 or maria@email.it",
    portfolioLabel: "Online profile or CV (optional)",
    portfolioPlaceholder: "E.g. linkedin.com/in/yourname",
    messageLabel: "Tell us about yourself",
    messagePlaceholder:
      "What you do today, what you’d like to do with us, what struck you about Domus Tua…",
    submit: "Send your application",
    errName: "Please enter your name.",
    errContact: "Leave us a phone number or an email so we can reply.",
    errConsent: "Please accept the privacy policy to continue.",
    sentPrefix: "We’re opening WhatsApp. If it doesn’t open,",
    sentLink: "message us at",
    consentPre: "I have read the ",
    consentLinkText: "privacy policy",
    consentPost: " and consent to the processing of my data to assess my application.",
    cvTitle: "Got a CV to attach?",
    cvCopy:
      "The website doesn’t accept attachments. Leave a link to your profile here, or email us your CV: we read it just as carefully.",
    cvCta: "Write to",
    whereTitle: "Where you’ll work",
    whereCopy: "At our office in Tradate. The work is local: Tradate and the province of Varese.",
    whatsappTitle: "Prefer to write?",
    whatsappCopy: "Send us a message: we reply during opening hours.",
    whatsappCta: "Message us on WhatsApp",
    imageAlt: "The Domus Tua team at the Tradate office",
  },
  fr: {
    eyebrow: "Candidatures",
    badge: "La première étape",
    title: "Dites-nous qui vous êtes.",
    subcopy:
      "Pas besoin d’un CV parfait : il faut du soin, de l’écoute et l’envie d’apprendre un métier fait de rencontres. Nous lisons chaque candidature et nous vous recontactons.",
    roleLabel: "Pour quel domaine postulez-vous",
    roles: {
      consulente: "Conseiller immobilier",
      frontOffice: "Accueil et gestion des dossiers",
      staging: "Home staging et aménagement",
      contenuti: "Contenus, vidéo et réseaux sociaux",
      tirocinio: "Stage ou première expérience",
      spontanea: "Candidature spontanée",
    },
    experienceLabel: "Expérience dans le secteur",
    experiences: {
      none: "Aucune, je débute",
      junior: "Moins de 2 ans",
      mid: "De 2 à 5 ans",
      senior: "Plus de 5 ans",
    },
    nameLabel: "Nom et prénom",
    namePlaceholder: "Ex. Maria Rossi",
    contactLabel: "Téléphone ou e-mail",
    contactPlaceholder: "Ex. 333 1234567 ou maria@email.it",
    portfolioLabel: "Profil ou CV en ligne (facultatif)",
    portfolioPlaceholder: "Ex. linkedin.com/in/votrenom",
    messageLabel: "Parlez-nous de vous",
    messagePlaceholder:
      "Ce que vous faites aujourd’hui, ce que vous aimeriez faire avec nous, ce qui vous a marqué chez Domus Tua…",
    submit: "Envoyer ma candidature",
    errName: "Veuillez indiquer votre nom.",
    errContact: "Laissez-nous un téléphone ou un e-mail pour vous recontacter.",
    errConsent: "Veuillez accepter la politique de confidentialité pour continuer.",
    sentPrefix: "Nous ouvrons WhatsApp. S’il ne s’ouvre pas,",
    sentLink: "écrivez-nous au",
    consentPre: "J’ai lu la ",
    consentLinkText: "politique de confidentialité",
    consentPost: " et je consens au traitement de mes données pour l’examen de ma candidature.",
    cvTitle: "Un CV à joindre ?",
    cvCopy:
      "Le site ne reçoit pas de pièces jointes. Laissez ici un lien vers votre profil, ou envoyez-nous votre CV par e-mail : nous le lisons avec la même attention.",
    cvCta: "Écrivez à",
    whereTitle: "Où l’on travaille",
    whereCopy: "Dans nos locaux, à Tradate. Le travail est local : Tradate et la province de Varese.",
    whatsappTitle: "Vous préférez écrire ?",
    whatsappCopy: "Envoyez-nous un message : nous répondons aux heures d’ouverture.",
    whatsappCta: "Écrivez-nous sur WhatsApp",
    imageAlt: "L’équipe Domus Tua dans les locaux de Tradate",
  },
  de: {
    eyebrow: "Bewerbungen",
    badge: "Der erste Schritt",
    title: "Erzählen Sie uns, wer Sie sind.",
    subcopy:
      "Es braucht keinen perfekten Lebenslauf: Es braucht Sorgfalt, Zuhören und Lust, einen Beruf zu lernen, in dem Menschen im Mittelpunkt stehen. Wir lesen jede Bewerbung und melden uns bei Ihnen.",
    roleLabel: "Für welchen Bereich bewerben Sie sich",
    roles: {
      consulente: "Immobilienberatung",
      frontOffice: "Empfang und Sachbearbeitung",
      staging: "Home Staging und Einrichtung",
      contenuti: "Content, Video und Social Media",
      tirocinio: "Praktikum oder Berufseinstieg",
      spontanea: "Initiativbewerbung",
    },
    experienceLabel: "Erfahrung in der Branche",
    experiences: {
      none: "Keine, ich fange bei null an",
      junior: "Weniger als 2 Jahre",
      mid: "2 bis 5 Jahre",
      senior: "Mehr als 5 Jahre",
    },
    nameLabel: "Vor- und Nachname",
    namePlaceholder: "Z. B. Maria Rossi",
    contactLabel: "Telefon oder E-Mail",
    contactPlaceholder: "Z. B. 333 1234567 oder maria@email.it",
    portfolioLabel: "Online-Profil oder Lebenslauf (optional)",
    portfolioPlaceholder: "Z. B. linkedin.com/in/ihrname",
    messageLabel: "Erzählen Sie uns von sich",
    messagePlaceholder:
      "Was Sie heute tun, was Sie mit uns machen möchten, was Ihnen an Domus Tua aufgefallen ist…",
    submit: "Bewerbung senden",
    errName: "Bitte geben Sie Ihren Namen ein.",
    errContact: "Hinterlassen Sie uns eine Telefonnummer oder E-Mail für den Rückruf.",
    errConsent: "Bitte akzeptieren Sie die Datenschutzerklärung, um fortzufahren.",
    sentPrefix: "Wir öffnen WhatsApp. Falls es sich nicht öffnet,",
    sentLink: "schreiben Sie uns an",
    consentPre: "Ich habe die ",
    consentLinkText: "Datenschutzerklärung",
    consentPost: " gelesen und willige in die Verarbeitung meiner Daten zur Prüfung der Bewerbung ein.",
    cvTitle: "Haben Sie einen Lebenslauf?",
    cvCopy:
      "Die Website nimmt keine Anhänge entgegen. Hinterlassen Sie hier einen Link zu Ihrem Profil oder senden Sie uns den Lebenslauf per E-Mail: Wir lesen ihn genauso aufmerksam.",
    cvCta: "Schreiben Sie an",
    whereTitle: "Wo gearbeitet wird",
    whereCopy: "In unserem Büro in Tradate. Die Arbeit findet vor Ort statt: Tradate und die Provinz Varese.",
    whatsappTitle: "Lieber schreiben?",
    whatsappCopy: "Senden Sie uns eine Nachricht: Wir antworten während der Öffnungszeiten.",
    whatsappCta: "Schreiben Sie uns auf WhatsApp",
    imageAlt: "Das Domus-Tua-Team im Büro in Tradate",
  },
  es: {
    eyebrow: "Candidaturas",
    badge: "El primer paso",
    title: "Cuéntanos quién eres.",
    subcopy:
      "No hace falta un currículum perfecto: hacen falta cuidado, escucha y ganas de aprender un oficio hecho de personas. Leemos cada candidatura y te contactamos nosotras.",
    roleLabel: "A qué área te presentas",
    roles: {
      consulente: "Consultor inmobiliario",
      frontOffice: "Recepción y gestión de expedientes",
      staging: "Home staging y ambientación",
      contenuti: "Contenidos, vídeo y redes",
      tirocinio: "Prácticas o primera experiencia",
      spontanea: "Candidatura espontánea",
    },
    experienceLabel: "Experiencia en el sector",
    experiences: {
      none: "Ninguna, empiezo de cero",
      junior: "Menos de 2 años",
      mid: "De 2 a 5 años",
      senior: "Más de 5 años",
    },
    nameLabel: "Nombre y apellidos",
    namePlaceholder: "Ej. Maria Rossi",
    contactLabel: "Teléfono o correo",
    contactPlaceholder: "Ej. 333 1234567 o maria@email.it",
    portfolioLabel: "Perfil o CV online (opcional)",
    portfolioPlaceholder: "Ej. linkedin.com/in/tunombre",
    messageLabel: "Cuéntanos sobre ti",
    messagePlaceholder:
      "Qué haces ahora, qué te gustaría hacer con nosotras, qué te ha llamado la atención de Domus Tua…",
    submit: "Enviar la candidatura",
    errName: "Introduce tu nombre.",
    errContact: "Déjanos un teléfono o un correo para poder responderte.",
    errConsent: "Para continuar, acepta la política de privacidad.",
    sentPrefix: "Estamos abriendo WhatsApp. Si no se abre,",
    sentLink: "escríbenos al",
    consentPre: "He leído la ",
    consentLinkText: "política de privacidad",
    consentPost: " y doy mi consentimiento al tratamiento de mis datos para valorar la candidatura.",
    cvTitle: "¿Tienes un CV para adjuntar?",
    cvCopy:
      "La web no recibe archivos adjuntos. Deja aquí un enlace a tu perfil, o envíanos el CV por correo: lo leemos con la misma atención.",
    cvCta: "Escríbenos a",
    whereTitle: "Dónde se trabaja",
    whereCopy: "En la oficina, en Tradate. El trabajo es local: Tradate y la provincia de Varese.",
    whatsappTitle: "¿Prefieres escribir?",
    whatsappCopy: "Mándanos un mensaje: respondemos en horario de apertura.",
    whatsappCta: "Escríbenos por WhatsApp",
    imageAlt: "El equipo Domus Tua en la sede de Tradate",
  },
} as const;

export default function CareerApplication({
  role,
  onRoleChange,
}: {
  /** Area preselezionata (le card dei ruoli della pagina la impostano). */
  role?: RoleId;
  onRoleChange?: (role: RoleId) => void;
} = {}) {
  const { locale } = useLocale();
  const c = copy[locale];
  // Controllato dall'esterno quando la pagina passa role/onRoleChange,
  // altrimenti il componente si gestisce da sé (resta usabile stand-alone).
  const [internalRole, setInternalRole] = useState<RoleId>("consulente");
  const currentRole = role ?? internalRole;
  const setRole = onRoleChange ?? setInternalRole;

  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; contact?: string; consent?: string }>({});
  const formRef = useRef<HTMLFormElement | null>(null);
  const sentRef = useRef<HTMLParagraphElement | null>(null);
  const checkRef = useRef<SVGPathElement | null>(null);

  // Stessi micro-feedback del form contatti: shake sui campi in errore,
  // check che si disegna al successo. Puramente cosmetici.
  useEffect(() => {
    const keys = Object.keys(errors) as Array<keyof typeof errors>;
    if (!keys.length || !formRef.current) return;
    if (!window.matchMedia(MQ.motionOk).matches) return;
    const targets = keys
      .map((k) => formRef.current!.querySelector(`[name="${k}"]`))
      .filter(Boolean);
    if (targets.length) {
      gsap.fromTo(
        targets,
        { x: 0 },
        { x: 6, duration: 0.06, repeat: 5, yoyo: true, ease: "none", clearProps: "x", overwrite: "auto" }
      );
    }
  }, [errors]);

  useEffect(() => {
    if (!sent) return;
    if (!window.matchMedia(MQ.motionOk).matches) return;
    if (sentRef.current) {
      gsap.from(sentRef.current, { y: 10, opacity: 0, duration: 0.5, ease: "domus" });
    }
    const check = checkRef.current;
    if (check) {
      const len = check.getTotalLength() + 2;
      gsap.fromTo(
        check,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 0.6, delay: 0.15, ease: "power2.inOut" }
      );
    }
  }, [sent]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const val = (k: string) => ((data.get(k) as string) || "").trim();

    // Honeypot anti-spam: un umano non vede/compila "company". Se pieno → bot, esci in silenzio.
    if (val("company")) return;

    const name = val("name");
    const contact = val("contact");
    const consent = data.get("consent") != null;

    const nextErrors: { name?: string; contact?: string; consent?: string } = {};
    if (!name) nextErrors.name = c.errName;
    if (!contact) nextErrors.contact = c.errContact;
    if (!consent) nextErrors.consent = c.errConsent;
    if (nextErrors.name || nextErrors.contact || nextErrors.consent) {
      setErrors(nextErrors);
      // A11y: focus sul primo campo non valido (dopo il re-render).
      const form = e.currentTarget;
      const firstInvalid = nextErrors.name ? "name" : nextErrors.contact ? "contact" : "consent";
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus(),
      );
      return;
    }
    setErrors({});

    const experienceId = (val("experience") || "none") as ExperienceId;
    const lead: Lead = {
      intent: "career",
      name,
      contact,
      // Etichette canoniche in italiano: le legge l'agenzia, non il candidato.
      role: ROLE_VALUE[currentRole],
      experience: EXPERIENCE_VALUE[experienceId],
      portfolio: normalizeUrl(val("portfolio")) || undefined,
      message: val("message") || undefined,
      consent: true,
      sourcePage: typeof window !== "undefined" ? window.location.pathname : undefined,
    };

    setSubmitting(true);
    void submitLead(lead).finally(() => setSubmitting(false));

    // Canale immediato: WhatsApp precompilato (apertura sincrona col gesto = niente popup block).
    const url = buildWhatsAppUrl(site.whatsapp.href, formatLeadMessage(lead));
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  const sideCards = [
    {
      icon: Mail,
      title: c.cvTitle,
      copy: c.cvCopy,
      cta: `${c.cvCta} ${site.email.label}`,
      href: site.email.href,
      external: false,
    },
    {
      icon: Whatsapp,
      title: c.whatsappTitle,
      copy: c.whatsappCopy,
      cta: c.whatsappCta,
      href: site.whatsapp.href,
      external: true,
    },
  ];

  return (
    <section id="candidatura" className="relative bg-cream-deep text-ink">
      <Atmosphere glow />
      <div className="relative mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <CameraIn className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* Colonna sinistra: promessa + canali alternativi */}
          <div>
            <div>
              <SegnoDomusBadge>{c.badge}</SegnoDomusBadge>
            </div>
            <span className="eyebrow mt-4">{c.eyebrow}</span>
            <WordReveal
              as="h2"
              className="mt-5 block font-display text-4xl font-medium leading-[1.04] tracking-tight text-ink balance sm:text-[3.2rem]"
              text={c.title}
            />
            <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-stone">{c.subcopy}</p>

            <figure className="arch-frame mt-8 w-full max-w-[15rem] border border-line">
              <Image
                src="/images/reali/team-trio.jpg"
                alt={c.imageAlt}
                width={480}
                height={640}
                sizes="(min-width: 1024px) 15rem, 60vw"
                className="photo-warm h-auto w-full object-cover"
              />
            </figure>

            <div className="mt-10 flex flex-col gap-3">
              {sideCards.map((card) => (
                <a
                  key={card.title}
                  href={card.href}
                  target={card.external ? "_blank" : undefined}
                  rel={card.external ? "noopener noreferrer" : undefined}
                  className="group flex items-start gap-3.5 rounded-2xl border border-line bg-paper p-4 transition-colors duration-300 hover:border-red/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-dark">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <span className="leading-snug">
                    <span className="block text-sm font-semibold text-ink">{card.title}</span>
                    <span className="mt-1 block text-[0.72rem] leading-relaxed text-stone">{card.copy}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-[0.72rem] font-semibold text-red-dark">
                      {card.cta}
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </span>
                </a>
              ))}

              <div className="flex items-start gap-3.5 rounded-2xl border border-line bg-paper p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-dark">
                  <Pin className="h-5 w-5" />
                </span>
                <span className="leading-snug">
                  <span className="block text-sm font-semibold text-ink">{c.whereTitle}</span>
                  <span className="mt-1 block text-[0.72rem] leading-relaxed text-stone">{c.whereCopy}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Colonna destra: form */}
          <div className="rounded-[2rem] border border-line bg-paper p-6 pb-28 shadow-[0_40px_90px_-60px_rgba(26,24,22,0.5)] sm:p-8 sm:pb-8">
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {/* Honeypot anti-spam: fuori schermo, non focusabile, ignorato dagli screen reader. */}
              <div
                aria-hidden
                className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
              >
                <label htmlFor="career-company">Company</label>
                <input id="career-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <Select
                name="role"
                label={c.roleLabel}
                value={currentRole}
                onChange={(v) => setRole(v as RoleId)}
                options={ROLE_IDS.map((id) => ({ value: id, label: c.roles[id] }))}
              />

              <Field
                name="name"
                label={c.nameLabel}
                placeholder={c.namePlaceholder}
                required
                autoComplete="name"
                autoCapitalize="words"
                error={errors.name}
              />
              <Field
                name="contact"
                label={c.contactLabel}
                placeholder={c.contactPlaceholder}
                required
                autoCapitalize="none"
                spellCheck={false}
                error={errors.contact}
              />

              <Select
                name="experience"
                label={c.experienceLabel}
                defaultValue="none"
                options={EXPERIENCE_IDS.map((id) => ({ value: id, label: c.experiences[id] }))}
              />

              <Field
                name="portfolio"
                label={c.portfolioLabel}
                placeholder={c.portfolioPlaceholder}
                type="url"
                inputMode="url"
                autoComplete="url"
              />

              <TextArea name="message" label={c.messageLabel} placeholder={c.messagePlaceholder} />

              {/* Consenso privacy: obbligatorio perché la candidatura viene salvata (GDPR). */}
              <div>
                <label className="flex items-start gap-3 text-[0.78rem] leading-relaxed text-stone">
                  <input
                    type="checkbox"
                    name="consent"
                    aria-invalid={errors.consent ? true : undefined}
                    aria-describedby={errors.consent ? "career-consent-error" : undefined}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                  />
                  <span>
                    {c.consentPre}
                    <a href="/privacy" className="underline underline-offset-2 hover:text-ink">
                      {c.consentLinkText}
                    </a>
                    {c.consentPost}
                  </span>
                </label>
                {errors.consent ? (
                  <span id="career-consent-error" role="alert" className="mt-2 block text-[0.72rem] text-red-dark">
                    {errors.consent}
                  </span>
                ) : null}
              </div>

              <SendCta submitting={submitting} size="lg" className="mt-1 w-full">
                {c.submit}
              </SendCta>

              {sent ? (
                <p
                  ref={sentRef}
                  role="status"
                  className="flex items-center justify-center gap-2.5 rounded-2xl border border-red/25 bg-red-soft/60 px-4 py-3 text-center text-sm text-red-dark"
                >
                  {/* Check che si disegna (senza JS/reduced-motion: già completo) */}
                  <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-red">
                    <path
                      ref={checkRef}
                      d="M4.5 12.5l5 5L19.5 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>
                    {c.sentPrefix}{" "}
                    <a href={site.whatsapp.href} className="font-semibold underline">
                      {c.sentLink} {site.whatsapp.label}
                    </a>
                    .
                  </span>
                </p>
              ) : null}
            </form>
          </div>
        </CameraIn>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required,
  error,
  autoComplete,
  inputMode,
  autoCapitalize,
  spellCheck,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
  autoComplete?: string;
  inputMode?: "text" | "url" | "email" | "tel";
  /** "words" per i nomi; "none" dove si scrive un'email (vedi Contact.tsx). */
  autoCapitalize?: "none" | "words" | "sentences";
  /** false su email e link: l'autocorrezione di iOS li riscrive. */
  spellCheck?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-stone">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        autoCapitalize={autoCapitalize}
        spellCheck={spellCheck}
        autoCorrect={spellCheck === false ? "off" : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        // text-base su mobile: sotto i 16px iOS zooma al focus.
        className={`rounded-xl border bg-cream px-4 py-3 text-base text-ink placeholder:text-stone/60 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red sm:text-sm ${
          error ? "border-red" : "border-line"
        }`}
      />
      {error ? (
        <span id={`${name}-error`} role="alert" className="text-[0.72rem] text-red-dark">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function Select({
  name,
  label,
  options,
  value,
  defaultValue,
  onChange,
}: {
  name: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-stone">
        {label}
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className="w-full appearance-none rounded-xl border border-line bg-cream px-4 py-3 pr-10 text-base text-ink transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red sm:text-sm"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone"
        >
          <svg viewBox="0 0 12 8" className="h-2.5 w-3 fill-none stroke-current stroke-[1.6]">
            <path d="M1 1.5 6 6.5 11 1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}

function TextArea({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-stone">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={4}
        placeholder={placeholder}
        className="rounded-xl border border-line bg-cream px-4 py-3 text-base text-ink placeholder:text-stone/60 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red sm:text-sm"
      />
    </div>
  );
}
