# Domus Tua Immobiliare — Sito

Sito premium per Domus Tua Immobiliare (Tradate, VA). Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript.

## Avvio

```bash
npm run dev        # sviluppo → http://localhost:3000
npm run build      # build di produzione
npm start          # serve la build
npm run typecheck  # tsc --noEmit (sito + test di browser)
npm test           # test unitari (node:test)
npm run test:e2e   # suite di browser su 5 viewport (Playwright)
npm run lighthouse # budget prestazioni/accessibilità (docs/performance.md)
npm run verify:deploy -- <url>   # verifica un ambiente pubblicato (docs/vercel-live-checklist.md)
npm run check      # lint + typecheck + test + build (usato anche in CI)
```

Variabili d'ambiente: copia `.env.example` in `.env.local` e compila. Chiavi principali:
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_USE_REALSMART`, `NEXT_PUBLIC_PREVIEW_BADGE`,
`NEXT_PUBLIC_ENABLE_I18N`, `REALSMART_*` (server-only), `CONTACT_*`. Vedi
[docs/env-and-deploy.md](docs/env-and-deploy.md).

## Design system

Dal 2026-09-10 il sito è **«la rivista bianca»**: la cliente, tramite Alberto, ha bocciato lo stile curvo e smussato, con le card e le transizioni di pagina curve. La direzione in breve (valori ed eccezioni sono in DESIGN.md):

- **Forma.** Un solo fondo avorio `#f9f5ef`, raggi e ombre a zero, niente card, fiori, veli o transizioni fra le pagine. Le poche curve rimaste sono inventariate in DESIGN.md, sezione Shapes.
- **Tipografia e colore.** Titoli Playfair Display maiuscoli in vw/vh, paragrafi Plus Jakarta Sans grandi e leggeri, corsivo Pinyon Script rosso. Testo grafite `#46423d`, mai nero; rosso `#d20a0a` per accento e conversione; oro solo sulle stelle. Nessun testo delle pagine sotto i 16 px, tranne il preloader (domanda aperta) e la mappa della ricerca: l'inventario è in DESIGN.md, «La regola dei 16 px».
- **Movimento.** Righe che salgono, fade-up, parallasse leggera, il monogramma orario, un preloader ad arco di 4,63 s e tre nastri pilotati dallo scroll da 1024 px: «Perché Domus Tua», le cinque stelle e la rotaia del team. Niente cursore custom.
- **Aperto.** Il logo nuovo non è arrivato (`--font-brand` punta a Jakarta come segnaposto). Le quattro eccezioni del preloader (pannello espresso, didascalie sotto i 16 px, disco carta, lockup in Playfair) e le altre domande aperte sono nella spec, §11.3.

**Documenti vivi**, in ordine di lettura:

1. [DESIGN.md](DESIGN.md): il sistema scritto dal costruito, con token, scala, moduli media, componenti, do e don't.
2. [PRODUCT.md](PRODUCT.md): per chi è il sito e gli impegni di marca.
3. [La spec della rivista bianca](docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md): §1 la chiamata del 2026-09-10; §11 il registro delle direttive (chi ha chiesto cosa e quando, con le domande aperte in §11.3 e i materiali attesi dalla cliente in §11.4).
4. [.impeccable/design.json](.impeccable/design.json): lo stesso sistema per gli strumenti Impeccable, rigenerato da DESIGN.md.

I valori nascono in `app/globals.css` (`@theme inline`) e i font in `app/layout.tsx`: se un documento e il codice non coincidono vale il codice. Per sapere chi ha chiesto una cosa vale la §11 della spec.

**Riferimenti e dossier** (cartelle gitignorate: non arrivano con un clone):

- [immobiliaregoldengoal.it](https://www.immobiliaregoldengoal.it/) è il **riferimento visivo**, indicato dalla cliente il 2026-09-10. Dossier `reverse-engineering/goldengoal/`: misure, scala, colori e griglia nel `README.md`; `node reverse-engineering/goldengoal/capture.mjs ours` fotografa il nostro sito.
- era-residence.com è il **riferimento di tecnica** (Alberto, 11 e 13 settembre). Dossier `reverse-engineering/era-residence/README.md`, da cui vengono la tipografia dei titoli, Playfair e la scala in vw (§2), il preloader ad arco con la sua timeline e le sue ease (§4), il logo rotante (§5), i testi che salgono per righe (§7) e lo scroller orizzontale con le parallasse interne (§11.1-11.2). Ne restano fuori le cupole, i fiori e le transizioni di pagina.

**Storia** (superati, non guida): [docs/DESIGN.md](docs/DESIGN.md) · [docs/brand-direction.md](docs/brand-direction.md) · [docs/brand-motif.md](docs/brand-motif.md) · [docs/effetti-reference.md](docs/effetti-reference.md) · [docs/wow-layer-plan.md](docs/wow-layer-plan.md) · [docs/segno-domus.md](docs/segno-domus.md) · [docs/client-review-script.md](docs/client-review-script.md) · [docs/plan-sprint.md](docs/plan-sprint.md) · i prompt [docs/mobile-parity-prompt.md](docs/mobile-parity-prompt.md), [docs/mobile-parity-2-prompt.md](docs/mobile-parity-2-prompt.md) e [docs/onda-4-prompt.md](docs/onda-4-prompt.md), da non eseguire. Il [piano della rivista bianca](docs/superpowers/plans/2026-09-10-rivista-bianca.md) è stato eseguito il 2026-09-10; il riquadro in testa dice quali task sono cambiati dopo.

## Struttura

La homepage è composta in `app/page.tsx`. Il commento in testa è il contratto di direzione. I capitoli stanno in `app/components/`, in quest'ordine:

| Componente | Capitolo |
|---|---|
| `Header` | Testata su una riga: logo, sei voci primarie e lingua; il badge rotante solo da 1280 px |
| `HeroCinematic` | `#top`: banda fotografica con il lockup «Domus Tua» e la firma; sotto, sull'avorio, sovratitolo, H1, CTA e voto |
| `Posizionamento` | Il blocco di posizionamento |
| `HomeSearchGateway` | `#cerca`: la ricerca a filo |
| `HorizonStory` | «Perché Domus Tua»: pannelli orizzontali pilotati dallo scroll (`#storia`) |
| `StarReviews` | `#recensioni`: il film delle cinque stelle |
| `Voci` | `#voci`: carosello dei video dei clienti e widget Trustindex |
| `Paths` | Vendere / Acquistare |
| `Method compact` | `#metodo`: tre atti e un link ai nove passi di /metodo |
| `OpenDomus` | `#open-domus` |
| `DomusDocProtocol` | Protocollo Domus D.O.C. |
| `Services` | `#servizi` |
| `CostiChiari` | `#costi` |
| `FeaturedTestimonial` | Il video reale di un cliente |
| `Social` | I canali social |
| `Team` | `#chi-siamo`: intro e rotaia orizzontale |
| `Contact` | `#contatti`: form di valutazione e recapiti |
| `Congedo` | La banda video finale |
| `Footer` · `WhatsAppFloat` | — |

Costanti contatto/nav: `app/lib/site.ts`. Immagini: `public/images/` (sorgenti in `_assets_raw/`).

### Pagine

| Rotta | File | Note |
|---|---|---|
| `/` | `app/page.tsx` | Homepage |
| `/vendi` | `app/vendi/page.tsx` | Per chi vende |
| `/acquista` | `app/acquista/page.tsx` | Case in vendita: catalogo vivo del gestionale RealSmart, con ricerca e filtri (`PropertySearch`) |
| `/case-vendute` | `app/case-vendute/page.tsx` | Case vendute |
| `/metodo` | `app/metodo/page.tsx` | Manifesto del Metodo Domus Tua |
| `/open-domus` | `app/open-domus/page.tsx` | Pagina prodotto Open Domus |
| `/servizi` | `app/servizi/page.tsx` | Hub servizi |
| `/case` | `next.config.ts` | Redirect permanente a `/acquista` (non c'è più una pagina propria) |
| `/case/[slug]` | `app/case/[slug]/page.tsx` | Scheda immobile, resa a richiesta dal catalogo vivo (`getVisibleListings`) |
| `/valutazione-immobile-tradate` | `app/valutazione-immobile-tradate/page.tsx` | Richiesta di valutazione |
| `/recensioni` | `app/recensioni/page.tsx` | Recensioni |
| `/chi-siamo` | `app/chi-siamo/page.tsx` | Storia, valori, team |
| `/contatti` | `app/contatti/page.tsx` | Mappa, orari, form |
| `/lavora-con-noi` | `app/lavora-con-noi/page.tsx` | Candidature |
| `/domande-frequenti` | `app/domande-frequenti/page.tsx` | Domande frequenti |
| `/privacy` · `/cookie` | `app/privacy/page.tsx` · `app/cookie/page.tsx` | Informative |

Componenti condivisi: `PageHero` (da lg testa su due colonne, poi una banda fotografica), `EditorialRows` (elenco numerato; le foto compaiono solo se ogni riga ne ha una vera in `/reali/`, e oggi nessuno dei quattro chiamanti, cioè Acquista, Open Domus, Servizi e Vendi, le mostra), `Highlights` (lista editoriale numerata separata da hairline, senza card), `PropertyCard`, `PropertyGallery`, `PropertySearch` (ricerca e filtri su /acquista), `ListingsGrid`, oltre a `BeforeAfter`, `Reviews`, `Stats`, `Team`, `Method`, `OpenDomus`, `Services`, `Contact`. La nav (`lib/site.ts`) usa href assoluti verso le pagine dedicate.

Gli immobili arrivano dal gestionale RealSmart; `app/lib/properties.ts` tiene 6 immobili fittizi come ripiego quando il feed cade (vedi il commento in testa ad `app/lib/assistant/listings.ts`: l'assistente, invece, non li cita mai). La mappa contatti usa un embed Google Maps (non carica nel sandbox di preview, funziona in produzione) con link di fallback "Apri in Google Maps".

## ⚠️ Dati DEMO da sostituire con quelli reali del cliente

L'elenco completo, con i bloccanti marcati, è [docs/da-chiedere-alla-cliente.md](docs/da-chiedere-alla-cliente.md). In breve, al 2026-09-13:

- **Immobili**: il catalogo è quello vivo del gestionale, e le 6 fixture fittizie di `app/lib/properties.ts` compaiono solo se il feed cade. Quali immobili siano ancora davvero in vendita va confermato (§4.1).
- **Recensioni** (`Reviews.tsx`): in produzione mostra solo le recensioni approvate, oggi nessuna; le card demo compaiono solo in anteprima, col banner «Esempi dimostrativi». Servono sei-otto recensioni vere da mostrare come testo (§4.6).
- **Foto team** (`Team.tsx`): la rotaia ha tre foto vere, il ritratto di Raffaela, `team-red.jpg` e `team-group.jpg`. Mancano i cinque ritratti singoli di Paloma Cavalcante, Eleonora D’Agati, Viola Benatti, Tiziana Galeone e Katya Fedrigo (§2.4).
- **Numeri**: 4,9/5 e 542 recensioni (`app/lib/site.ts:45-46`), letti dal widget Trustindex l'11 settembre. Il numero è vivo: va riletto dal widget ogni volta che si tocca quella riga (§4.7).
- **Citazioni e firma**: `FeaturedTestimonial` non rende più citazione, autore e contesto, perché erano inventati, e mostra solo il video reale di un cliente (§1.2). `brand.signature` è vuota: l'hero scrive il nome in Pinyon Script, non una firma finta (§2.12).
- **Foto aerea del territorio** (`HorizonStory.tsx`): non si sa di quale immobile si tratti, se il proprietario l'abbia autorizzata né di chi siano i diritti del file (§2.2).
- **Form contatti**: invia la richiesta a `/api/lead` (email e/o Google Sheet, se configurati) e apre WhatsApp precompilato. Dove devono arrivare i contatti lo decide la cliente (§5.2).
- **Orari** (`site.hours`, mostrati nel footer): da confermare (§3.3).

## Documentazione

**Brand & identità**
- [docs/logo-assets.md](docs/logo-assets.md) — **Logo ufficiale** (original-first): file richiesti, dimensioni, sfondo trasparente, varianti, favicon. *Non ridisegnare il logo in MVP.* Il §5 tratta il logo nuovo e il font delle scritte «Domus Tua», non ancora consegnati.
- Design system vivo, riferimenti e documenti superati: vedi «Design system» sopra.

**Media**
- [docs/hero-video.md](docs/hero-video.md) — hero cinematico: file video/poster, compressione, mobile. *In parte storia:* descrive l'hero full-bleed di prima, con `HeroClassic` e `Hero.tsx` come ripiego, che non esistono più. Oggi l'hero è una banda fotografica di 60svh e il video è spento (`heroCinematic.enabled = false` in `app/lib/media.ts`); se si riaccende, restano valide le note su file e compressione.
- [docs/media-optimization.md](docs/media-optimization.md) — immagini, video, YouTube lazy, naming. *In parte storia:* alcuni esempi di codice usano raggi, fondi scuri e ombre che la rivista bianca ha tolto; per la forma vale DESIGN.md.

**Contenuti & integrazioni**
- [docs/realsmart-integration-notes.md](docs/realsmart-integration-notes.md) · [docs/realsmart-client-questions.md](docs/realsmart-client-questions.md) · [docs/realsmart-security.md](docs/realsmart-security.md) — feed immobili RealSmart
- [docs/reviews-integration.md](docs/reviews-integration.md) — recensioni Google/Trustindex
- [docs/form-backend-next-step.md](docs/form-backend-next-step.md) · [docs/forms-crm-notes.md](docs/forms-crm-notes.md) — lead capture → email/CRM
- [docs/lavora-con-noi.md](docs/lavora-con-noi.md) — pagina candidature (`intent: career`, niente allegati, claim da validare)
- [docs/i18n.md](docs/i18n.md) — multilingua IT/EN/FR/DE/ES (flag `NEXT_PUBLIC_ENABLE_I18N`)

**Qualità**
- [docs/audit-finale.md](docs/audit-finale.md) — **audit indipendente**: checklist PASS/FAIL, problemi P0–P3, decisioni rimaste al cliente. *In parte storia:* precede la rivista bianca, e la testata e i font che descrive non sono più quelli di oggi.
- [docs/performance.md](docs/performance.md) — misure Lighthouse, budget, cosa è stato ottimizzato e il divario che resta
- [docs/e2e.md](docs/e2e.md) — suite end-to-end: cosa copre, viewport, accessibilità, smoke sul feed live
- [docs/assistant-ui-e-eval.md](docs/assistant-ui-e-eval.md) — interfaccia, sicurezza e cento eval del chatbot

**Delivery & operatività**
- [docs/env-and-deploy.md](docs/env-and-deploy.md) — variabili d'ambiente, Vercel, preview vs produzione
- [docs/vercel-live-checklist.md](docs/vercel-live-checklist.md) — **verifica del deploy** e azioni manuali rimaste in Vercel
- [docs/production-readiness.md](docs/production-readiness.md) — checklist di lancio
- [docs/da-chiedere-alla-cliente.md](docs/da-chiedere-alla-cliente.md) — **cosa deve ancora fornire la cliente**: contenuti, foto, video, dati, accessi, con i bloccanti marcati. Documento unico
- [docs/phase-plan.md](docs/phase-plan.md) — Fase 1 (sito) vs Fase 2 (AI/CRM)

## Prossimi passi (dal brief iniziale: storia)

*Storia, non lista di lavoro.* La riga qui sotto viene dal brief iniziale. Le pagine che elenca oggi esistono tutte (vedi «Pagine»): il listing sta su `/acquista`, e `/case` vi reindirizza. I prossimi passi veri dipendono da quello che la cliente deve ancora consegnare ([docs/da-chiedere-alla-cliente.md](docs/da-chiedere-alla-cliente.md)) e dalle domande aperte della spec (§11.3).

> Pagine MVP successive: Vendi, Acquista, Metodo, Open Domus, Servizi, Listing/Scheda immobile, Recensioni, Chi siamo, Contatti. I componenti sono pensati per essere riusati su queste pagine.
