"use client";

// NOTE: machine translation of legal text — requires professional/legal review before go-live.

import type { ReactNode } from "react";
import { useLocale } from "../components/i18n/LocaleProvider";
import PageHero from "../components/PageHero";
import { site } from "../lib/site";

type Block = {
  title: string;
  body: string[];
};

type Copy = {
  hero: {
    eyebrow: string;
    title: () => ReactNode;
    subcopy: string;
    alt: string;
    primaryLabel: string;
    secondaryLabel: string;
  };
  lastUpdated: string;
  notice: string;
  blocks: Block[];
};

const copy: Record<"it" | "en" | "fr" | "de" | "es", Copy> = {
  it: {
    hero: {
      eyebrow: "Note legali",
      title: () => (
        <>
          Privacy
          <br />
          <span className="text-red-soft">Policy.</span>
        </>
      ),
      subcopy:
        "Come Domus Tua raccoglie, utilizza e protegge i tuoi dati personali. La tua fiducia merita trasparenza, in ogni passaggio.",
      alt: "Salotto luminoso di un attico con travi a vista",
      primaryLabel: "Parla con Domus Tua",
      secondaryLabel: "Cookie Policy",
    },
    lastUpdated: "Ultimo aggiornamento: luglio 2026",
    notice:
      "Questa informativa è redatta ai sensi del Regolamento UE 2016/679 (GDPR). I contenuti sono forniti a titolo indicativo e devono essere verificati da un consulente legale prima della pubblicazione.",
    blocks: [
      {
        title: "1. Titolare del trattamento",
        body: [
          `Il titolare del trattamento dei dati è ${site.legal}, con sede in ${site.address.street}, ${site.address.city} (${site.address.province}), P.IVA ${site.vat}.`,
          `Per ogni richiesta relativa ai tuoi dati personali puoi scrivere a ${site.email.label} o telefonare al ${site.phone.label}.`,
        ],
      },
      {
        title: "2. Dati che raccogliamo",
        body: [
          "Raccogliamo i dati che ci fornisci volontariamente tramite il form di contatto e i canali di messaggistica del sito: nome e cognome, numero di telefono, eventuale indirizzo email e le informazioni sull'immobile o sulla ricerca che desideri condividere con noi.",
          "Possiamo inoltre raccogliere dati tecnici di navigazione (ad esempio indirizzo IP e cookie), trattati come descritto nella Cookie Policy.",
        ],
      },
      {
        title: "3. Finalità del trattamento",
        body: [
          "Utilizziamo i tuoi dati per rispondere alle tue richieste, fornirti una valutazione o una consulenza immobiliare, gestire il rapporto di collaborazione e, ove necessario, adempiere agli obblighi di legge.",
          "Con il tuo consenso, potremmo contattarti per comunicazioni informative e commerciali relative ai nostri servizi.",
        ],
      },
      {
        title: "4. Base giuridica",
        body: [
          "Il trattamento si fonda sull'esecuzione di misure precontrattuali e contrattuali richieste dall'interessato (art. 6.1.b GDPR), sul consenso per le finalità di marketing (art. 6.1.a GDPR) e sull'adempimento di obblighi di legge (art. 6.1.c GDPR).",
        ],
      },
      {
        title: "5. Conservazione dei dati",
        body: [
          "Conserviamo i dati per il tempo strettamente necessario alle finalità per cui sono stati raccolti e nel rispetto dei termini di legge applicabili. I dati trattati per finalità di marketing sono conservati fino alla revoca del consenso.",
        ],
      },
      {
        title: "6. Comunicazione dei dati",
        body: [
          "I tuoi dati possono essere trattati da personale autorizzato e da fornitori di servizi che agiscono come responsabili del trattamento (ad esempio servizi di hosting, gestionali e strumenti di comunicazione). Non diffondiamo i tuoi dati a terzi per finalità proprie senza il tuo consenso.",
        ],
      },
      {
        title: "7. I tuoi diritti",
        body: [
          "In qualità di interessato hai diritto di accedere ai tuoi dati, chiederne la rettifica o la cancellazione, limitarne od opporti al trattamento, richiederne la portabilità e revocare in qualsiasi momento il consenso prestato.",
          `Per esercitare questi diritti puoi contattarci a ${site.email.label}. Hai inoltre diritto di proporre reclamo all'Autorità Garante per la protezione dei dati personali.`,
        ],
      },
      {
        title: "8. Contatti",
        body: [
          `${site.legal} — ${site.address.street}, ${site.address.city} (${site.address.province}). Telefono ${site.phone.label} · Email ${site.email.label}.`,
        ],
      },
    ],
  },
  en: {
    hero: {
      eyebrow: "Legal notes",
      title: () => (
        <>
          Privacy
          <br />
          <span className="text-red-soft">Policy.</span>
        </>
      ),
      subcopy:
        "How Domus Tua collects, uses and protects your personal data. Your trust deserves transparency, at every step.",
      alt: "Bright penthouse living room with exposed beams",
      primaryLabel: "Talk to Domus Tua",
      secondaryLabel: "Cookie Policy",
    },
    lastUpdated: "Last updated: July 2026",
    notice:
      "This notice is drawn up pursuant to EU Regulation 2016/679 (GDPR). The content is provided for guidance only and must be reviewed by a legal advisor before publication.",
    blocks: [
      {
        title: "1. Data controller",
        body: [
          `The data controller is ${site.legal}, with registered office at ${site.address.street}, ${site.address.city} (${site.address.province}), VAT no. ${site.vat}.`,
          `For any request regarding your personal data you can write to ${site.email.label} or call ${site.phone.label}.`,
        ],
      },
      {
        title: "2. Data we collect",
        body: [
          "We collect the data you voluntarily provide through the contact form and the site’s messaging channels: first and last name, phone number, any email address and the information about the property or the search you wish to share with us.",
          "We may also collect technical browsing data (for example IP address and cookies), processed as described in the Cookie Policy.",
        ],
      },
      {
        title: "3. Purposes of processing",
        body: [
          "We use your data to respond to your requests, provide you with a valuation or real-estate consultancy, manage our working relationship and, where necessary, comply with legal obligations.",
          "With your consent, we may contact you for informational and commercial communications relating to our services.",
        ],
      },
      {
        title: "4. Legal basis",
        body: [
          "Processing is based on the performance of pre-contractual and contractual measures requested by the data subject (art. 6.1.b GDPR), on consent for marketing purposes (art. 6.1.a GDPR) and on compliance with legal obligations (art. 6.1.c GDPR).",
        ],
      },
      {
        title: "5. Data retention",
        body: [
          "We retain data for as long as strictly necessary for the purposes for which it was collected and in compliance with the applicable legal terms. Data processed for marketing purposes is retained until consent is withdrawn.",
        ],
      },
      {
        title: "6. Disclosure of data",
        body: [
          "Your data may be processed by authorised personnel and by service providers acting as data processors (for example hosting services, management software and communication tools). We do not disclose your data to third parties for their own purposes without your consent.",
        ],
      },
      {
        title: "7. Your rights",
        body: [
          "As a data subject you have the right to access your data, request its rectification or erasure, restrict or object to its processing, request its portability and withdraw at any time the consent you have given.",
          `To exercise these rights you can contact us at ${site.email.label}. You also have the right to lodge a complaint with the Data Protection Authority.`,
        ],
      },
      {
        title: "8. Contacts",
        body: [
          `${site.legal} — ${site.address.street}, ${site.address.city} (${site.address.province}). Phone ${site.phone.label} · Email ${site.email.label}.`,
        ],
      },
    ],
  },
  fr: {
    hero: {
      eyebrow: "Mentions légales",
      title: () => (
        <>
          Politique de
          <br />
          <span className="text-red-soft">confidentialité.</span>
        </>
      ),
      subcopy:
        "Comment Domus Tua collecte, utilise et protège vos données personnelles. Votre confiance mérite de la transparence, à chaque étape.",
      alt: "Salon lumineux d’un attique aux poutres apparentes",
      primaryLabel: "Parler à Domus Tua",
      secondaryLabel: "Politique de cookies",
    },
    lastUpdated: "Dernière mise à jour : juillet 2026",
    notice:
      "La présente information est rédigée conformément au Règlement UE 2016/679 (RGPD). Son contenu est fourni à titre indicatif et doit être vérifié par un conseiller juridique avant sa publication.",
    blocks: [
      {
        title: "1. Responsable du traitement",
        body: [
          `Le responsable du traitement des données est ${site.legal}, dont le siège est situé ${site.address.street}, ${site.address.city} (${site.address.province}), n° de TVA ${site.vat}.`,
          `Pour toute demande relative à vos données personnelles, vous pouvez écrire à ${site.email.label} ou téléphoner au ${site.phone.label}.`,
        ],
      },
      {
        title: "2. Données que nous recueillons",
        body: [
          "Nous recueillons les données que vous nous fournissez volontairement via le formulaire de contact et les canaux de messagerie du site : nom et prénom, numéro de téléphone, éventuelle adresse e-mail et les informations sur le bien ou la recherche que vous souhaitez partager avec nous.",
          "Nous pouvons également recueillir des données techniques de navigation (par exemple l’adresse IP et les cookies), traitées comme décrit dans la Politique de cookies.",
        ],
      },
      {
        title: "3. Finalités du traitement",
        body: [
          "Nous utilisons vos données pour répondre à vos demandes, vous fournir une estimation ou un conseil immobilier, gérer notre relation de collaboration et, lorsque cela est nécessaire, satisfaire aux obligations légales.",
          "Avec votre consentement, nous pourrions vous contacter pour des communications informatives et commerciales relatives à nos services.",
        ],
      },
      {
        title: "4. Base juridique",
        body: [
          "Le traitement repose sur l’exécution de mesures précontractuelles et contractuelles demandées par la personne concernée (art. 6.1.b RGPD), sur le consentement pour les finalités de marketing (art. 6.1.a RGPD) et sur le respect des obligations légales (art. 6.1.c RGPD).",
        ],
      },
      {
        title: "5. Conservation des données",
        body: [
          "Nous conservons les données pendant la durée strictement nécessaire aux finalités pour lesquelles elles ont été recueillies et dans le respect des délais légaux applicables. Les données traitées à des fins de marketing sont conservées jusqu’au retrait du consentement.",
        ],
      },
      {
        title: "6. Communication des données",
        body: [
          "Vos données peuvent être traitées par du personnel autorisé et par des prestataires de services agissant en qualité de sous-traitants (par exemple services d’hébergement, logiciels de gestion et outils de communication). Nous ne divulguons pas vos données à des tiers pour leurs propres finalités sans votre consentement.",
        ],
      },
      {
        title: "7. Vos droits",
        body: [
          "En tant que personne concernée, vous avez le droit d’accéder à vos données, d’en demander la rectification ou l’effacement, d’en limiter le traitement ou de vous y opposer, d’en demander la portabilité et de retirer à tout moment le consentement accordé.",
          `Pour exercer ces droits, vous pouvez nous contacter à ${site.email.label}. Vous avez en outre le droit d’introduire une réclamation auprès de l’Autorité de protection des données.`,
        ],
      },
      {
        title: "8. Contacts",
        body: [
          `${site.legal} — ${site.address.street}, ${site.address.city} (${site.address.province}). Téléphone ${site.phone.label} · E-mail ${site.email.label}.`,
        ],
      },
    ],
  },
  de: {
    hero: {
      eyebrow: "Rechtliche Hinweise",
      title: () => (
        <>
          Datenschutz-
          <br />
          <span className="text-red-soft">erklärung.</span>
        </>
      ),
      subcopy:
        "Wie Domus Tua Ihre personenbezogenen Daten erhebt, verwendet und schützt. Ihr Vertrauen verdient Transparenz, in jedem Schritt.",
      alt: "Helles Wohnzimmer eines Penthouses mit sichtbaren Balken",
      primaryLabel: "Mit Domus Tua sprechen",
      secondaryLabel: "Cookie-Richtlinie",
    },
    lastUpdated: "Letzte Aktualisierung: Juli 2026",
    notice:
      "Diese Datenschutzerklärung ist gemäß der EU-Verordnung 2016/679 (DSGVO) verfasst. Die Inhalte dienen nur zur Orientierung und müssen vor der Veröffentlichung von einem Rechtsberater geprüft werden.",
    blocks: [
      {
        title: "1. Verantwortlicher",
        body: [
          `Verantwortlich für die Verarbeitung der Daten ist ${site.legal}, mit Sitz in ${site.address.street}, ${site.address.city} (${site.address.province}), USt-IdNr. ${site.vat}.`,
          `Für jede Anfrage zu Ihren personenbezogenen Daten können Sie an ${site.email.label} schreiben oder unter ${site.phone.label} anrufen.`,
        ],
      },
      {
        title: "2. Daten, die wir erheben",
        body: [
          "Wir erheben die Daten, die Sie uns freiwillig über das Kontaktformular und die Messaging-Kanäle der Website übermitteln: Vor- und Nachname, Telefonnummer, gegebenenfalls E-Mail-Adresse sowie die Informationen zur Immobilie oder zur Suche, die Sie mit uns teilen möchten.",
          "Darüber hinaus können wir technische Navigationsdaten erheben (zum Beispiel IP-Adresse und Cookies), die wie in der Cookie-Richtlinie beschrieben verarbeitet werden.",
        ],
      },
      {
        title: "3. Zwecke der Verarbeitung",
        body: [
          "Wir verwenden Ihre Daten, um auf Ihre Anfragen zu antworten, Ihnen eine Bewertung oder Immobilienberatung zu bieten, unsere Zusammenarbeit zu verwalten und, sofern erforderlich, gesetzlichen Verpflichtungen nachzukommen.",
          "Mit Ihrer Einwilligung können wir Sie für informative und werbliche Mitteilungen zu unseren Dienstleistungen kontaktieren.",
        ],
      },
      {
        title: "4. Rechtsgrundlage",
        body: [
          "Die Verarbeitung stützt sich auf die Durchführung vorvertraglicher und vertraglicher Maßnahmen, die von der betroffenen Person angefordert wurden (Art. 6.1.b DSGVO), auf die Einwilligung zu Marketingzwecken (Art. 6.1.a DSGVO) und auf die Erfüllung gesetzlicher Verpflichtungen (Art. 6.1.c DSGVO).",
        ],
      },
      {
        title: "5. Aufbewahrung der Daten",
        body: [
          "Wir bewahren die Daten so lange auf, wie es für die Zwecke, für die sie erhoben wurden, unbedingt erforderlich ist, und unter Einhaltung der geltenden gesetzlichen Fristen. Zu Marketingzwecken verarbeitete Daten werden bis zum Widerruf der Einwilligung aufbewahrt.",
        ],
      },
      {
        title: "6. Weitergabe der Daten",
        body: [
          "Ihre Daten können von befugtem Personal und von Dienstleistern verarbeitet werden, die als Auftragsverarbeiter handeln (zum Beispiel Hosting-Dienste, Verwaltungssoftware und Kommunikationstools). Wir geben Ihre Daten nicht ohne Ihre Einwilligung zu eigenen Zwecken an Dritte weiter.",
        ],
      },
      {
        title: "7. Ihre Rechte",
        body: [
          "Als betroffene Person haben Sie das Recht, auf Ihre Daten zuzugreifen, deren Berichtigung oder Löschung zu verlangen, deren Verarbeitung einzuschränken oder ihr zu widersprechen, deren Übertragbarkeit zu verlangen und die erteilte Einwilligung jederzeit zu widerrufen.",
          `Um diese Rechte auszuüben, können Sie uns unter ${site.email.label} kontaktieren. Sie haben außerdem das Recht, eine Beschwerde bei der Datenschutzbehörde einzureichen.`,
        ],
      },
      {
        title: "8. Kontakt",
        body: [
          `${site.legal} — ${site.address.street}, ${site.address.city} (${site.address.province}). Telefon ${site.phone.label} · E-Mail ${site.email.label}.`,
        ],
      },
    ],
  },
  es: {
    hero: {
      eyebrow: "Avisos legales",
      title: () => (
        <>
          Política de
          <br />
          <span className="text-red-soft">privacidad.</span>
        </>
      ),
      subcopy:
        "Cómo Domus Tua recopila, utiliza y protege tus datos personales. Tu confianza merece transparencia, en cada paso.",
      alt: "Salón luminoso de un ático con vigas a la vista",
      primaryLabel: "Habla con Domus Tua",
      secondaryLabel: "Política de cookies",
    },
    lastUpdated: "Última actualización: julio de 2026",
    notice:
      "Esta información se redacta de conformidad con el Reglamento UE 2016/679 (RGPD). Los contenidos se ofrecen a título indicativo y deben ser verificados por un asesor legal antes de su publicación.",
    blocks: [
      {
        title: "1. Responsable del tratamiento",
        body: [
          `El responsable del tratamiento de los datos es ${site.legal}, con domicilio en ${site.address.street}, ${site.address.city} (${site.address.province}), N.º de IVA ${site.vat}.`,
          `Para cualquier solicitud relativa a tus datos personales puedes escribir a ${site.email.label} o llamar al ${site.phone.label}.`,
        ],
      },
      {
        title: "2. Datos que recopilamos",
        body: [
          "Recopilamos los datos que nos facilitas voluntariamente a través del formulario de contacto y los canales de mensajería del sitio: nombre y apellidos, número de teléfono, la dirección de correo electrónico que corresponda y la información sobre el inmueble o la búsqueda que desees compartir con nosotros.",
          "Además, podemos recopilar datos técnicos de navegación (por ejemplo, dirección IP y cookies), tratados según lo descrito en la Política de cookies.",
        ],
      },
      {
        title: "3. Finalidades del tratamiento",
        body: [
          "Utilizamos tus datos para responder a tus solicitudes, ofrecerte una valoración o un asesoramiento inmobiliario, gestionar nuestra relación de colaboración y, cuando sea necesario, cumplir con las obligaciones legales.",
          "Con tu consentimiento, podríamos ponernos en contacto contigo para comunicaciones informativas y comerciales relativas a nuestros servicios.",
        ],
      },
      {
        title: "4. Base jurídica",
        body: [
          "El tratamiento se fundamenta en la ejecución de medidas precontractuales y contractuales solicitadas por el interesado (art. 6.1.b RGPD), en el consentimiento para las finalidades de marketing (art. 6.1.a RGPD) y en el cumplimiento de obligaciones legales (art. 6.1.c RGPD).",
        ],
      },
      {
        title: "5. Conservación de los datos",
        body: [
          "Conservamos los datos durante el tiempo estrictamente necesario para las finalidades para las que fueron recopilados y respetando los plazos legales aplicables. Los datos tratados con fines de marketing se conservan hasta la revocación del consentimiento.",
        ],
      },
      {
        title: "6. Comunicación de los datos",
        body: [
          "Tus datos pueden ser tratados por personal autorizado y por proveedores de servicios que actúan como encargados del tratamiento (por ejemplo, servicios de alojamiento, software de gestión y herramientas de comunicación). No difundimos tus datos a terceros para finalidades propias sin tu consentimiento.",
        ],
      },
      {
        title: "7. Tus derechos",
        body: [
          "En calidad de interesado tienes derecho a acceder a tus datos, solicitar su rectificación o supresión, limitar su tratamiento u oponerte a él, solicitar su portabilidad y revocar en cualquier momento el consentimiento otorgado.",
          `Para ejercer estos derechos puedes contactarnos en ${site.email.label}. Además, tienes derecho a presentar una reclamación ante la Autoridad de Protección de Datos.`,
        ],
      },
      {
        title: "8. Contacto",
        body: [
          `${site.legal} — ${site.address.street}, ${site.address.city} (${site.address.province}). Teléfono ${site.phone.label} · Correo electrónico ${site.email.label}.`,
        ],
      },
    ],
  },
};

export default function PrivacyContent() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <main className="flex-1">
      <PageHero
        eyebrow={c.hero.eyebrow}
        title={c.hero.title()}
        subcopy={c.hero.subcopy}
        image="/images/hero_01_attico_travi_salotto.jpg"
        alt={c.hero.alt}
        primary={{ label: c.hero.primaryLabel, href: "/contatti" }}
        secondary={{ label: c.hero.secondaryLabel, href: "/cookie" }}
      />

      <section className="bg-paper">
        <div className="mx-auto max-w-[820px] px-5 py-24 sm:px-8 sm:py-32">
          <p className="text-[0.82rem] uppercase tracking-[0.16em] text-stone">
            {c.lastUpdated}
          </p>

          {/* ⚠️ Avviso interno: testo da validare con un legale prima del go-live. */}
          <div className="mt-6 rounded-2xl border border-line bg-cream-deep px-5 py-4 text-sm leading-relaxed text-graphite">
            {c.notice}
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
  );
}
