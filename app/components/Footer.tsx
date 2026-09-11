"use client";

import Link from "next/link";
import Image from "next/image";
import { Logo } from "./Logo";
import { reopenConsent } from "../lib/consent";
import { Cta } from "./primitives/Cta";
import SocialLinks from "./primitives/SocialLinks";
import { nav, site } from "../lib/site";
import { useDict } from "./i18n/LocaleProvider";

/* Footer «rivista bianca» (2026-09-10, spec §4.16, rif. immobiliaregoldengoal.it):
   una fascia chiara in flusso, hairline in alto, quattro colonne — marca e
   payoff · contatti · dove siamo e orari · naviga — con titoli d4 maiuscoli,
   testo a 19 px e una riga legale a 16 px.

   Qui prima c'era il footer graphite con l'uncover fisso (classe sull'html,
   variabile d'altezza e coda fissa), i fiori notturni e il wordmark
   gigante in filigrana: tutto via. Nessun ref, nessun GSAP, niente posizione fissa:
   il footer è un blocco normale e i link stanno sempre nel tab order.

   Cosa NON è cambiato: ogni link che il footer portava resta — nav, Domus
   D.O.C., FAQ, case vendute, sigillo Wikicasa, telefono/WhatsApp/mail,
   indirizzo, orari, social, privacy/cookie/preferenze/contatti — e i dati
   societari arrivano da `site` (content-integrity), mai scritti a mano. */

const link = "underline-offset-4 hover:underline";

export default function Footer() {
  const d = useDict();
  const year = new Date().getFullYear();

  return (
    /* pb 7rem a ogni larghezza (il vecchio `pb-28`): in fondo alla pagina ci
       sono sempre due cose fisse — la MobileActionBar sotto `sm` (52 px + 12 px
       di margine) e il WhatsAppFloat sopra (64 px a 20 px dal bordo) — e con
       2.5rem la riga legale finiva sotto la pillola WhatsApp (misurato a 1440). */
    <footer className="dt-row border-t border-line bg-cream pt-[clamp(4rem,10vh,7rem)] pb-[calc(7rem+env(safe-area-inset-bottom))] text-ink">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* 1 · Marca: logo ufficiale a 200 px, payoff editoriale, la CTA di
            valutazione come link sottolineato e il sigillo Wikicasa (§6.3:
            l'unica prova indipendente dell'agenzia, su OGNI pagina).
            /valutazione-immobile-tradate e non #contatti: su /privacy e
            /cookie l'ancora locale non esiste. */}
        <div>
          <Logo className="h-auto w-[200px]" />
          {/* Payoff e CTA solo da md: sul telefono questa era la SESTA
              comparsa di «Richiedi la valutazione» nella stessa pagina, con
              la settima — la barra fissa — visibile due centimetri sotto. */}
          <p className="lead mt-6 hidden md:block">{d.footer.payoff}</p>
          <Cta
            href="/valutazione-immobile-tradate"
            variant="ghost"
            className="mt-6 hidden md:inline-flex"
          >
            {d.footer.valuta}
          </Cta>
          {/* Il sigillo è pensato per fondi chiari: ora sta direttamente sul
              crema, senza pastiglia. `alt=""`: il testo accanto lo dice già. */}
          <a
            href={site.award.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex items-center gap-4 text-body"
          >
            <Image
              src="/badges/wikicasa-top-agency.svg"
              alt=""
              width={78}
              height={38}
              unoptimized
              className="block h-[38px] w-[78px] shrink-0"
            />
            <span>
              <span className={`block ${link}`}>{site.award.label}</span>
              <span className="block text-ui text-stone">{site.award.years.join(" · ")}</span>
            </span>
          </a>
        </div>

        {/* 2 · Contatti. «WhatsApp» è un nome proprio, uguale in ogni lingua:
            senza l'icona di prima il numero da solo si confonderebbe col fisso. */}
        <div>
          <h2 className="font-display text-d4 font-light">{d.footer.contatti}</h2>
          <ul className="tap-list mt-5 space-y-3 text-body">
            <li>
              <a href={site.phone.href} className={`tap-target ${link}`}>
                {site.phone.label}
              </a>
            </li>
            <li>
              <a
                href={site.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`tap-target ${link}`}
              >
                WhatsApp {site.whatsapp.label}
              </a>
            </li>
            <li>
              <a href={site.email.href} className={`tap-target ${link}`}>
                {site.email.label}
              </a>
            </li>
          </ul>
        </div>

        {/* 3 · Dove siamo e quando: indirizzo da `site.address`, orari da
            `site.hours` con le etichette del dizionario. */}
        <div>
          <h2 className="font-display text-d4 font-light">{d.footer.orari}</h2>
          <address className="mt-5 text-body not-italic">
            {site.address.street}
            <br />
            {site.address.city} ({site.address.province})
          </address>
          {/* Etichetta sopra e orario sotto, non affiancati: la colonna a 1fr
              di quattro è stretta e «9:00 – 12:30 · 14:30 – 19:00» a 19 px
              spezzava «Lun – Ven» a metà (misurato a 1440). */}
          <dl className="mt-5 space-y-3 text-body">
            <div>
              <dt className="text-stone">{d.footer.monFri}</dt>
              <dd className="tnum">{site.hours.weekdays}</dd>
            </div>
            <div>
              <dt className="text-stone">{d.footer.sat}</dt>
              <dd className="tnum">{site.hours.saturday}</dd>
            </div>
            <div>
              <dt className="text-stone">{d.footer.sun}</dt>
              <dd>{d.footer.onAppt}</dd>
            </div>
          </dl>
        </div>

        {/* 4 · Naviga: le voci della barra, poi i tre ingressi di supporto che
            vivono solo qui (Domus D.O.C. è un nome-brand, invariato tra le
            lingue; FAQ e case vendute non sono destinazioni primarie). */}
        <div>
          <h2 className="font-display text-d4 font-light">{d.footer.naviga}</h2>
          {/* Due colonne sotto md: tredici voci a passo 44px facevano da sole
              572px di footer in colonna. */}
          <ul className="tap-list mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-body md:block md:space-y-3">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className={`tap-target ${link}`}>
                  {d.nav[n.key]}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/#domus-doc" className={`tap-target ${link}`}>
                Domus D.O.C.
              </Link>
            </li>
            <li>
              <Link href="/case-vendute" className={`tap-target ${link}`}>
                {d.footer.caseVendute}
              </Link>
            </li>
            <li>
              <Link href="/domande-frequenti" className={`tap-target ${link}`}>
                {d.footer.faq}
              </Link>
            </li>
          </ul>
          <SocialLinks tone="light" className="mt-8" />
        </div>
      </div>

      {/* Riga legale: dati societari da `site`, mai a mano. La revoca del
          consenso resta a un clic (GDPR): il bottone riapre il banner. */}
      <div className="mt-16 flex flex-col gap-3 border-t border-line pt-6 text-ui text-stone md:flex-row md:justify-between">
        <p className="tnum">
          © {year} {site.legal} · P.IVA {site.vat} · REA {site.rea} · Cap. € {site.capital} i.v.
        </p>
        <ul className="tap-list flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <Link href="/privacy" className={`tap-target ${link}`}>
              {d.footer.privacy}
            </Link>
          </li>
          <li>
            <Link href="/cookie" className={`tap-target ${link}`}>
              {d.footer.cookie}
            </Link>
          </li>
          <li>
            <button type="button" onClick={() => reopenConsent()} className={`tap-target text-left ${link}`}>
              {d.footer.cookiePrefs}
            </button>
          </li>
          <li>
            <Link href="/contatti" className={`tap-target ${link}`}>
              {d.footer.contatti}
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
