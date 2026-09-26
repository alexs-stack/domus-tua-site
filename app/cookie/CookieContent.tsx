"use client";

// NOTE: machine translation of legal text — requires professional/legal review before go-live.

import type { ReactNode } from "react";
import { useLocale } from "../components/i18n/LocaleProvider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PageHero from "../components/PageHero";
import { site } from "../lib/site";

type CookieType = { label: string; copy: string };
type Block = { title: string; body: string[] };

type Copy = {
  hero: {
    eyebrow: string;
    title: () => ReactNode;
    subcopy: string;
    alt: string;
    primaryLabel: string;
    secondaryLabel: string;
  };
  lastUpdate: string;
  notice: string;
  cookieTypes: CookieType[];
  // Legal body blocks. Some strings contain data placeholders ({legal}, {street},
  // {city}, {province}, {vat}, {email}) that are interpolated with `site` data below.
  blocks: Block[];
};

const copy: Record<"it" | "en" | "fr" | "de" | "es", Copy> = {
  it: {
    hero: {
      eyebrow: "Note legali",
      title: () => (
        <>
          Cookie
          <br />
          <span className="text-red-soft">Policy.</span>
        </>
      ),
      subcopy:
        "Quali cookie utilizziamo, perché lo facciamo e come puoi gestire in ogni momento le tue preferenze.",
      alt: "Salotto luminoso di un attico con travi a vista",
      primaryLabel: "Parla con Domus Tua",
      secondaryLabel: "Privacy Policy",
    },
    lastUpdate: "Ultimo aggiornamento: luglio 2026",
    notice:
      "Questa policy descrive l’uso dei cookie sul sito. I contenuti sono forniti a titolo indicativo e devono essere allineati ai cookie effettivamente installati e verificati da un consulente legale prima della pubblicazione.",
    cookieTypes: [
      {
        label: "Cookie tecnici",
        copy: "Necessari al funzionamento del sito e alla tua navigazione. Non richiedono consenso e non possono essere disattivati.",
      },
      {
        label: "Cookie analitici",
        copy: "Ci aiutano a capire, in forma aggregata, come viene utilizzato il sito per migliorarne i contenuti. Installati solo previo consenso.",
      },
      {
        label: "Cookie di marketing",
        copy: "Consentono di proporti contenuti pertinenti anche su piattaforme di terze parti. Installati solo previo tuo consenso esplicito.",
      },
    ],
    blocks: [
      {
        title: "1. Cosa sono i cookie",
        body: [
          "I cookie sono piccoli file di testo che i siti visitati inviano al dispositivo dell’utente, dove vengono memorizzati per essere ritrasmessi agli stessi siti alla visita successiva. Utilizziamo anche tecnologie simili con finalità analoghe.",
        ],
      },
      {
        title: "2. Tipologie di cookie utilizzati",
        body: [
          "Il sito utilizza cookie tecnici, cookie analitici e, previo consenso, cookie di marketing di terze parti. Le principali categorie sono riepilogate nella tabella qui sopra.",
        ],
      },
      {
        title: "3. Gestione del consenso",
        body: [
          "Al primo accesso al sito ti viene mostrato un banner tramite il quale puoi accettare, rifiutare o personalizzare l’uso dei cookie non tecnici. Puoi modificare le tue scelte in qualsiasi momento riaprendo il pannello delle preferenze.",
          "In assenza di consenso vengono installati esclusivamente i cookie tecnici necessari.",
        ],
      },
      {
        title: "4. Cookie di terze parti",
        body: [
          "Alcune funzionalità del sito possono ricorrere a servizi di terze parti (ad esempio strumenti di statistica, mappe o contenuti social) che potrebbero installare propri cookie. Per il dettaglio del trattamento ti invitiamo a consultare le rispettive informative dei fornitori.",
        ],
      },
      {
        title: "5. Come disabilitare i cookie dal browser",
        body: [
          "Puoi gestire o eliminare i cookie anche direttamente dalle impostazioni del tuo browser. La disattivazione dei cookie tecnici potrebbe però compromettere alcune funzionalità del sito.",
        ],
      },
      {
        title: "6. Titolare e contatti",
        body: [
          `Il titolare del trattamento è ${site.legal}, ${site.address.street}, ${site.address.city} (${site.address.province}), P.IVA ${site.vat}.`,
          `Per informazioni sull’uso dei cookie puoi scrivere a ${site.email.label}. Per il trattamento dei dati personali consulta la nostra Privacy Policy.`,
        ],
      },
    ],
  },
  en: {
    hero: {
      eyebrow: "Legal notice",
      title: () => (
        <>
          Cookie
          <br />
          <span className="text-red-soft">Policy.</span>
        </>
      ),
      subcopy:
        "Which cookies we use, why we use them and how you can manage your preferences at any time.",
      alt: "Bright penthouse living room with exposed beams",
      primaryLabel: "Talk to Domus Tua",
      secondaryLabel: "Privacy Policy",
    },
    lastUpdate: "Last updated: July 2026",
    notice:
      "This policy describes how cookies are used on the site. The content is provided for guidance only and must be aligned with the cookies actually installed and verified by a legal advisor before publication.",
    cookieTypes: [
      {
        label: "Technical cookies",
        copy: "Necessary for the site to function and for you to browse it. They require no consent and cannot be disabled.",
      },
      {
        label: "Analytics cookies",
        copy: "They help us understand, in aggregate form, how the site is used so we can improve its content. Installed only with your consent.",
      },
      {
        label: "Marketing cookies",
        copy: "They allow us to offer you relevant content, including on third-party platforms. Installed only with your explicit consent.",
      },
    ],
    blocks: [
      {
        title: "1. What cookies are",
        body: [
          "Cookies are small text files that the sites you visit send to your device, where they are stored so they can be sent back to those same sites on your next visit. We also use similar technologies for comparable purposes.",
        ],
      },
      {
        title: "2. Types of cookies used",
        body: [
          "The site uses technical cookies, analytics cookies and, subject to your consent, third-party marketing cookies. The main categories are summarised in the table above.",
        ],
      },
      {
        title: "3. Managing consent",
        body: [
          "On your first visit to the site you are shown a banner through which you can accept, reject or customise the use of non-technical cookies. You can change your choices at any time by reopening the preferences panel.",
          "Without your consent, only the necessary technical cookies are installed.",
        ],
      },
      {
        title: "4. Third-party cookies",
        body: [
          "Some features of the site may rely on third-party services (for example statistics tools, maps or social content) that could install their own cookies. For details on how they process your data, we invite you to consult the respective providers’ privacy notices.",
        ],
      },
      {
        title: "5. How to disable cookies from your browser",
        body: [
          "You can also manage or delete cookies directly from your browser settings. Disabling technical cookies may, however, compromise some features of the site.",
        ],
      },
      {
        title: "6. Data controller and contacts",
        body: [
          `The data controller is ${site.legal}, ${site.address.street}, ${site.address.city} (${site.address.province}), VAT no. ${site.vat}.`,
          `For information on the use of cookies you can write to ${site.email.label}. For the processing of personal data, please see our Privacy Policy.`,
        ],
      },
    ],
  },
  fr: {
    hero: {
      eyebrow: "Mentions légales",
      title: () => (
        <>
          Politique
          <br />
          <span className="text-red-soft">cookies.</span>
        </>
      ),
      subcopy:
        "Quels cookies nous utilisons, pourquoi nous le faisons et comment gérer vos préférences à tout moment.",
      alt: "Salon lumineux d’un attique avec poutres apparentes",
      primaryLabel: "Parler à Domus Tua",
      secondaryLabel: "Politique de confidentialité",
    },
    lastUpdate: "Dernière mise à jour : juillet 2026",
    notice:
      "Cette politique décrit l’utilisation des cookies sur le site. Les contenus sont fournis à titre indicatif et doivent être alignés sur les cookies réellement installés et vérifiés par un conseiller juridique avant la publication.",
    cookieTypes: [
      {
        label: "Cookies techniques",
        copy: "Nécessaires au fonctionnement du site et à votre navigation. Ils ne requièrent aucun consentement et ne peuvent pas être désactivés.",
      },
      {
        label: "Cookies analytiques",
        copy: "Ils nous aident à comprendre, de façon agrégée, comment le site est utilisé afin d’en améliorer les contenus. Installés uniquement avec votre consentement.",
      },
      {
        label: "Cookies de marketing",
        copy: "Ils permettent de vous proposer des contenus pertinents, y compris sur des plateformes tierces. Installés uniquement avec votre consentement explicite.",
      },
    ],
    blocks: [
      {
        title: "1. Que sont les cookies",
        body: [
          "Les cookies sont de petits fichiers texte que les sites visités envoient à l’appareil de l’utilisateur, où ils sont enregistrés pour être renvoyés à ces mêmes sites lors de la visite suivante. Nous utilisons également des technologies similaires à des fins analogues.",
        ],
      },
      {
        title: "2. Types de cookies utilisés",
        body: [
          "Le site utilise des cookies techniques, des cookies analytiques et, sous réserve de votre consentement, des cookies de marketing de tiers. Les principales catégories sont résumées dans le tableau ci-dessus.",
        ],
      },
      {
        title: "3. Gestion du consentement",
        body: [
          "Lors de votre première visite sur le site, un bandeau vous est présenté afin d’accepter, de refuser ou de personnaliser l’utilisation des cookies non techniques. Vous pouvez modifier vos choix à tout moment en rouvrant le panneau des préférences.",
          "En l’absence de consentement, seuls les cookies techniques nécessaires sont installés.",
        ],
      },
      {
        title: "4. Cookies de tiers",
        body: [
          "Certaines fonctionnalités du site peuvent faire appel à des services tiers (par exemple des outils de statistiques, des cartes ou des contenus sociaux) susceptibles d’installer leurs propres cookies. Pour le détail du traitement, nous vous invitons à consulter les politiques respectives des fournisseurs.",
        ],
      },
      {
        title: "5. Comment désactiver les cookies depuis votre navigateur",
        body: [
          "Vous pouvez également gérer ou supprimer les cookies directement depuis les paramètres de votre navigateur. La désactivation des cookies techniques pourrait toutefois compromettre certaines fonctionnalités du site.",
        ],
      },
      {
        title: "6. Responsable du traitement et contacts",
        body: [
          `Le responsable du traitement est ${site.legal}, ${site.address.street}, ${site.address.city} (${site.address.province}), n° de TVA ${site.vat}.`,
          `Pour toute information sur l’utilisation des cookies, vous pouvez écrire à ${site.email.label}. Pour le traitement des données personnelles, veuillez consulter notre Politique de confidentialité.`,
        ],
      },
    ],
  },
  de: {
    hero: {
      eyebrow: "Rechtliche Hinweise",
      title: () => (
        <>
          Cookie-
          <br />
          <span className="text-red-soft">Richtlinie.</span>
        </>
      ),
      subcopy:
        "Welche Cookies wir verwenden, warum wir das tun und wie Sie Ihre Einstellungen jederzeit verwalten können.",
      alt: "Helles Wohnzimmer eines Penthouses mit sichtbaren Balken",
      primaryLabel: "Mit Domus Tua sprechen",
      secondaryLabel: "Datenschutzerklärung",
    },
    lastUpdate: "Letzte Aktualisierung: Juli 2026",
    notice:
      "Diese Richtlinie beschreibt die Verwendung von Cookies auf der Website. Die Inhalte dienen nur zur Orientierung und müssen vor der Veröffentlichung mit den tatsächlich installierten Cookies abgeglichen und von einem Rechtsberater geprüft werden.",
    cookieTypes: [
      {
        label: "Technische Cookies",
        copy: "Für den Betrieb der Website und Ihre Navigation erforderlich. Sie bedürfen keiner Einwilligung und können nicht deaktiviert werden.",
      },
      {
        label: "Analyse-Cookies",
        copy: "Sie helfen uns, in aggregierter Form zu verstehen, wie die Website genutzt wird, um deren Inhalte zu verbessern. Werden nur mit Ihrer Einwilligung gesetzt.",
      },
      {
        label: "Marketing-Cookies",
        copy: "Sie ermöglichen es, Ihnen relevante Inhalte auch auf Plattformen Dritter anzubieten. Werden nur mit Ihrer ausdrücklichen Einwilligung gesetzt.",
      },
    ],
    blocks: [
      {
        title: "1. Was Cookies sind",
        body: [
          "Cookies sind kleine Textdateien, die von den besuchten Websites an das Gerät des Nutzers gesendet werden, wo sie gespeichert werden, um beim nächsten Besuch an dieselben Websites zurückübermittelt zu werden. Wir verwenden auch ähnliche Technologien mit vergleichbaren Zwecken.",
        ],
      },
      {
        title: "2. Verwendete Cookie-Arten",
        body: [
          "Die Website verwendet technische Cookies, Analyse-Cookies und, vorbehaltlich Ihrer Einwilligung, Marketing-Cookies von Dritten. Die wichtigsten Kategorien sind in der Tabelle oben zusammengefasst.",
        ],
      },
      {
        title: "3. Verwaltung der Einwilligung",
        body: [
          "Beim ersten Zugriff auf die Website wird Ihnen ein Banner angezeigt, über das Sie die Verwendung nicht technischer Cookies akzeptieren, ablehnen oder anpassen können. Sie können Ihre Auswahl jederzeit ändern, indem Sie das Einstellungsfenster erneut öffnen.",
          "Ohne Ihre Einwilligung werden ausschließlich die erforderlichen technischen Cookies gesetzt.",
        ],
      },
      {
        title: "4. Cookies von Dritten",
        body: [
          "Einige Funktionen der Website können auf Dienste Dritter zurückgreifen (zum Beispiel Statistik-Tools, Karten oder soziale Inhalte), die eigene Cookies setzen können. Für Einzelheiten zur Verarbeitung bitten wir Sie, die jeweiligen Datenschutzhinweise der Anbieter zu konsultieren.",
        ],
      },
      {
        title: "5. Wie Sie Cookies im Browser deaktivieren",
        body: [
          "Sie können Cookies auch direkt in den Einstellungen Ihres Browsers verwalten oder löschen. Die Deaktivierung technischer Cookies kann jedoch einige Funktionen der Website beeinträchtigen.",
        ],
      },
      {
        title: "6. Verantwortlicher und Kontakte",
        body: [
          `Verantwortlicher für die Verarbeitung ist ${site.legal}, ${site.address.street}, ${site.address.city} (${site.address.province}), USt-IdNr. ${site.vat}.`,
          `Für Informationen zur Verwendung von Cookies können Sie an ${site.email.label} schreiben. Zur Verarbeitung personenbezogener Daten lesen Sie bitte unsere Datenschutzerklärung.`,
        ],
      },
    ],
  },
  es: {
    hero: {
      eyebrow: "Aviso legal",
      title: () => (
        <>
          Política de
          <br />
          <span className="text-red-soft">cookies.</span>
        </>
      ),
      subcopy:
        "Qué cookies utilizamos, por qué lo hacemos y cómo puedes gestionar tus preferencias en cualquier momento.",
      alt: "Salón luminoso de un ático con vigas a la vista",
      primaryLabel: "Habla con Domus Tua",
      secondaryLabel: "Política de privacidad",
    },
    lastUpdate: "Última actualización: julio de 2026",
    notice:
      "Esta política describe el uso de cookies en el sitio. Los contenidos se ofrecen a título orientativo y deben alinearse con las cookies realmente instaladas y verificarse por un asesor legal antes de la publicación.",
    cookieTypes: [
      {
        label: "Cookies técnicas",
        copy: "Necesarias para el funcionamiento del sitio y para tu navegación. No requieren consentimiento y no pueden desactivarse.",
      },
      {
        label: "Cookies analíticas",
        copy: "Nos ayudan a entender, de forma agregada, cómo se utiliza el sitio para mejorar sus contenidos. Se instalan solo con tu consentimiento.",
      },
      {
        label: "Cookies de marketing",
        copy: "Permiten ofrecerte contenidos relevantes, también en plataformas de terceros. Se instalan solo con tu consentimiento explícito.",
      },
    ],
    blocks: [
      {
        title: "1. Qué son las cookies",
        body: [
          "Las cookies son pequeños archivos de texto que los sitios visitados envían al dispositivo del usuario, donde se almacenan para volver a transmitirse a esos mismos sitios en la visita siguiente. También utilizamos tecnologías similares con finalidades análogas.",
        ],
      },
      {
        title: "2. Tipos de cookies utilizadas",
        body: [
          "El sitio utiliza cookies técnicas, cookies analíticas y, previo consentimiento, cookies de marketing de terceros. Las principales categorías se resumen en la tabla anterior.",
        ],
      },
      {
        title: "3. Gestión del consentimiento",
        body: [
          "En el primer acceso al sitio se te muestra un banner mediante el cual puedes aceptar, rechazar o personalizar el uso de las cookies no técnicas. Puedes modificar tus decisiones en cualquier momento reabriendo el panel de preferencias.",
          "En ausencia de consentimiento se instalan exclusivamente las cookies técnicas necesarias.",
        ],
      },
      {
        title: "4. Cookies de terceros",
        body: [
          "Algunas funcionalidades del sitio pueden recurrir a servicios de terceros (por ejemplo, herramientas de estadística, mapas o contenidos sociales) que podrían instalar sus propias cookies. Para el detalle del tratamiento, te invitamos a consultar las respectivas políticas de los proveedores.",
        ],
      },
      {
        title: "5. Cómo desactivar las cookies desde el navegador",
        body: [
          "También puedes gestionar o eliminar las cookies directamente desde la configuración de tu navegador. No obstante, la desactivación de las cookies técnicas podría comprometer algunas funcionalidades del sitio.",
        ],
      },
      {
        title: "6. Responsable y contactos",
        body: [
          `El responsable del tratamiento es ${site.legal}, ${site.address.street}, ${site.address.city} (${site.address.province}), N.º de IVA ${site.vat}.`,
          `Para información sobre el uso de cookies puedes escribir a ${site.email.label}. Para el tratamiento de datos personales, consulta nuestra Política de privacidad.`,
        ],
      },
    ],
  },
};

export default function CookieContent() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero
          eyebrow={c.hero.eyebrow}
          title={c.hero.title()}
          subcopy={c.hero.subcopy}
          image="/images/hero_01_attico_travi_salotto.jpg"
          alt={c.hero.alt}
          primary={{ label: c.hero.primaryLabel, href: "/contatti" }}
          secondary={{ label: c.hero.secondaryLabel, href: "/privacy" }}
        />

        <section className="bg-paper">
          <div className="mx-auto max-w-[820px] px-5 py-24 sm:px-8 sm:py-32">
            <p className="text-[0.82rem] uppercase tracking-[0.16em] text-stone">
              {c.lastUpdate}
            </p>

            {/* ⚠️ Avviso interno: testo da validare con un legale prima del go-live. */}
            <div className="mt-6 rounded-2xl border border-line bg-cream-deep px-5 py-4 text-sm leading-relaxed text-graphite">
              {c.notice}
            </div>

            {/* Tipologie di cookie */}
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {c.cookieTypes.map((ct) => (
                <div
                  key={ct.label}
                  className="rounded-2xl border border-line bg-cream p-5"
                >
                  <span className="eyebrow">{ct.label}</span>
                  <p className="mt-3 text-sm leading-relaxed text-stone">{ct.copy}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col gap-12">
              {c.blocks.map((block) => (
                <div key={block.title}>
                  <h2 className="font-display text-2xl font-medium leading-snug tracking-tight text-ink balance sm:text-[1.7rem]">
                    {block.title}
                  </h2>
                  <div className="mt-4 flex flex-col gap-4 text-[1.02rem] leading-relaxed text-stone">
                    {block.body.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
