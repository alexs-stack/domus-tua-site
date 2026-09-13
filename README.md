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

Dal 2026-09-10 il sito è **«la rivista bianca»**. La cliente, tramite Alberto, ha bocciato lo stile curvo e smussato, con le card e le transizioni di pagina curve («nessuna scritta piccola, niente colore nero, e niente curvo»). La direzione in quattro righe:

- **Forma.** Un solo fondo avorio `#f9f5ef`, raggi e ombre a zero nei token (`--radius-*` 0px, `--shadow-*` none), niente card, fiori o vignettature, nessuna transizione fra le pagine. Restano tondi i bottoni-icona (play, frecce, WhatsApp, i link social a `9999px`, i comandi a icona di schede, galleria e assistente) e il disco carta sotto il badge del preloader. Restano anche quattro ombre, tutte aggiunte costruendo: `INK_ON_VIDEO` sul titolo del Congedo, un'ombra leggera sulla parola della copertina delle cinque stelle, un alone dietro il nome in corsivo del preloader e il `box-shadow` all'hover dei link social. A riposo non si vede nessun velo, ma sopra la foto delle cinque stelle c'è ancora uno strato a tutta superficie, `.dt-starrev_flash`: sta a opacity 0 e si accende solo nel lampo.
- **Tipografia e colore.** Titoli in Playfair Display maiuscolo, con una scala in vw/vh. Paragrafi in Plus Jakarta Sans, grandi e leggeri, in colonna da 38ch. Il corsivo è Pinyon Script rosso. Il testo è grafite `#46423d` e mai nero («NIENTE SCRITTE BLACK», Alberto, 2026-09-11). Il rosso `#d20a0a` serve per accento e conversione, l'oro `#d9a441` solo sulle stelle (decisione di lavoro, aff9b0e), e il blu non c'è. Nessun testo sotto i 16 px, tranne due didascalie del preloader (vedi «Aperto»).
- **Movimento.** Righe che salgono, fade-up e una parallasse leggera. In più tre nastri pilotati dallo scroll, attivi da 1024 px e solo con motion ok: «Perché Domus Tua», le cinque stelle e la rotaia del team. I primi due sono tornati l'11 settembre, e l'unica fonte primaria, 024d354, cita Alberto («dovevamo fare un redesign, ma mantenendo quelle animazioni che non erano curve»). Il commento in testa ad `app/page.tsx` li dà invece al cliente, come facevano i documenti scritti prima del 13 settembre: se Alberto riferisse la cliente nessuna fonte lo dice, ed è una domanda aperta. Il preloader ad arco dura 4,63 s: la cliente l'ha chiesto «più veloce», Alberto ha scelto «stesso film di oggi ma dimezzato» (2026-09-10). Niente cursore custom.
- **Aperto.** Il logo nuovo non è stato consegnato, e `--font-brand` punta a Jakarta come segnaposto. Il preloader ha quattro eccezioni ancora da decidere, e ognuna va contro una direttiva della cliente: il pannello espresso contro «eliminare nero ovunque» (2026-09-10); le didascalie a 0.68rem e 0.82rem contro «nessuna scritta piccola»; il disco carta sotto il badge contro «metti il logo senza sfondo bianco» (2026-08-06); il lockup «Domus Tua» in Playfair, mentre quello dell'hero è in `--font-brand`, contro «stesso font del logo in tutte le scritte Domus Tua». Le altre domande aperte, fra cui la foto aerea tornata subito dopo la ricerca contro il punto 6 della cliente, sono nella spec, §11.3.

**Documenti vivi.** Chi deve cambiare qualcosa li legge in quest'ordine:

- [DESIGN.md](DESIGN.md) (radice): il sistema scritto dal costruito, con token, scala, moduli media, componenti, do e don't.
- [PRODUCT.md](PRODUCT.md): per chi è il sito e gli impegni di marca (Brand Commitments).
- [docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md](docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md): la spec del redesign. §1 è la lista della chiamata del 2026-09-10 punto per punto, §2 le risposte di Alberto alle quattro domande dello stesso giorno. §11, «Direttive arrivate dopo la costruzione», registra chi ha detto cosa e quando dopo quella sera, tenendo separate la cliente, Alberto e le decisioni di lavoro; §11.3 elenca le domande aperte.
- [.impeccable/design.json](.impeccable/design.json): lo stesso sistema in forma leggibile dagli strumenti Impeccable. Va tenuto allineato a DESIGN.md e confrontato con `app/globals.css` prima di fidarsi di un valore. *Storia:* la versione del 2026-09-10 (0890f89) portava ancora i valori di prima delle correzioni dell'11 settembre: inchiostro `#1a1816`, oro `#c9a227`, lead a 50ch, titolo di capitolo a interlinea 0.95, etichette a tracking 0.08em. Nel codice sono `#46423d`, `#d9a441`, 38ch, 1 per d2 (0.98 per d1) e 0.12em per l'occhiello.

I valori nascono in `app/globals.css` (`@theme inline`) e i font in `app/layout.tsx` (next/font). Quando un documento e il codice non coincidono vale il codice, e il documento va corretto. Per sapere chi ha chiesto una cosa vale la §11 della spec, che parte dalle fonti primarie: i transcript e i messaggi di commit. Serve perché alcuni commit dell'11 settembre e alcuni commenti nel codice attribuiscono al cliente frasi di Alberto, e i documenti scritti prima del 13 le avevano riprese. Restano nel codice e nella storia git: il ritorno dei set piece (il commento di `app/page.tsx`), il «menu sopra» (6e6559b, il commento di `nav` in `app/lib/site.ts`) e la «posizione delle foto» (5304dfd). La differenza conta: a una direttiva della cliente si risponde alla cliente, a una decisione di lavoro no.

**Riferimenti e dossier.**

- **[immobiliaregoldengoal.it](https://www.immobiliaregoldengoal.it/)** è il riferimento visivo. Lo ha indicato la cliente, riferita da Alberto il 2026-09-10: gliel'ha mostrato più volte perché è pulito, professionale, con scritte grandi, niente card, foto e video grandi e spazi gestiti bene. È un riferimento, non una regola che si possa leggere nel codice. Si misurano le conseguenze: un fondo solo, nessuna card, raggi a zero, media a tutta larghezza o a 42vw. Il giudizio d'insieme («pulito, professionale») non si ricava dal codice.
- **`reverse-engineering/goldengoal/`** è il dossier del riferimento. L'ha chiesto Alberto il 2026-09-10 («fai un reverse engineering del sito in questione»). Contiene misure, scala tipografica, colori e griglia nel `README.md`, più `capture.mjs` per gli screenshot (`node reverse-engineering/goldengoal/capture.mjs ours` fotografa il nostro sito). La cartella è gitignorata perché contiene asset di terzi, quindi non arriva con un clone. Una differenza è voluta ma ancora in discussione: il riferimento scrive titoli e corpo in `#1f1f1f`, noi in `#46423d`. Se accettare un inchiostro più scuro per i soli titoli è una domanda aperta per Alberto, non ancora decisa.
- **`reverse-engineering/era-residence/`** è il riferimento secondario: il dossier sulla tecnica di animazione (codice, tempi, struttura) di era-residence.com. Alberto l'ha rimesso in gioco il 2026-09-11 («utilizza anche come riferimento il sito vecchio al quale avevamo preso spunto»). È servito a ripristinare l'ingresso del preloader, e i commenti di `Preloader.tsx`, `RotatingMark.tsx`, `HorizonScroller.tsx` e `TextLines.tsx` ne citano i paragrafi. Anche questa cartella è gitignorata.

**Storia.** I documenti seguenti sono stati superati il 2026-09-10. Restano come storia, non come guida: [docs/DESIGN.md](docs/DESIGN.md) (il sistema precedente, con card, raggi, ombre e Fraunces) · [docs/brand-direction.md](docs/brand-direction.md) · [docs/brand-motif.md](docs/brand-motif.md) · [docs/effetti-reference.md](docs/effetti-reference.md) · [docs/wow-layer-plan.md](docs/wow-layer-plan.md). Il piano con cui la rivista bianca è stata costruita, [docs/superpowers/plans/2026-09-10-rivista-bianca.md](docs/superpowers/plans/2026-09-10-rivista-bianca.md), è stato eseguito per intero il 2026-09-10. Diversi suoi task sono stati ribaltati nei giorni seguenti, e il riquadro in testa al piano dice quali.

## Struttura

La homepage è composta in `app/page.tsx`. Il commento in testa è il contratto di direzione, con una riga da correggere: dà al cliente il ritorno dei due set piece, che 024d354 attribuisce ad Alberto (domanda aperta, spec §11.3). I capitoli stanno in `app/components/`, in quest'ordine:

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

L'elenco completo, verificato contro il codice e con i bloccanti marcati, è [docs/da-chiedere-alla-cliente.md](docs/da-chiedere-alla-cliente.md). In breve, al 2026-09-13:

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
- [docs/logo-assets.md](docs/logo-assets.md) — **Logo ufficiale** (original-first): file richiesti, dimensioni, sfondo trasparente, varianti, favicon. *Non ridisegnare il logo in MVP.* Il §5 tratta il logo nuovo e il font delle scritte «Domus Tua», che la cliente ha chiesto il 2026-09-10 e che non sono ancora arrivati. La seconda metà della richiesta, lo stesso font in tutte le scritte «Domus Tua», oggi non è rispettata: `--font-brand` (Jakarta, segnaposto) lo usa solo il lockup dell'hero, mentre quello del preloader è in Playfair.
- [docs/segno-domus.md](docs/segno-domus.md) — sistema visivo differenziante Segno Domus (componenti, uso web/brochure/video, overuse)
- Design system vivo: [DESIGN.md](DESIGN.md) · [PRODUCT.md](PRODUCT.md) · [spec della rivista bianca](docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md) · [.impeccable/design.json](.impeccable/design.json) (vedi «Design system» sopra). Solo storia, superati il 2026-09-10: [docs/DESIGN.md](docs/DESIGN.md) · [docs/brand-direction.md](docs/brand-direction.md) · [docs/brand-motif.md](docs/brand-motif.md)

**Media**
- [docs/hero-video.md](docs/hero-video.md) — hero cinematico: file video/poster, compressione, mobile. *In parte storia:* descrive l'hero full-bleed di prima, con `HeroClassic` e `Hero.tsx` come ripiego, e nessuno dei due file esiste più. Dal 2026-09-11 l'hero è una banda fotografica di 60svh (09aff4b), e il video è spento (`heroCinematic.enabled = false` in `app/lib/media.ts`, che lo dà per scelta della cliente del 2026-08-03). Se si riaccende, restano valide le note su file e compressione.
- [docs/media-optimization.md](docs/media-optimization.md) — immagini, video, YouTube lazy, naming

**Contenuti & integrazioni**
- [docs/realsmart-integration-notes.md](docs/realsmart-integration-notes.md) · [docs/realsmart-client-questions.md](docs/realsmart-client-questions.md) · [docs/realsmart-security.md](docs/realsmart-security.md) — feed immobili RealSmart
- [docs/reviews-integration.md](docs/reviews-integration.md) — recensioni Google/Trustindex
- [docs/form-backend-next-step.md](docs/form-backend-next-step.md) · [docs/forms-crm-notes.md](docs/forms-crm-notes.md) — lead capture → email/CRM
- [docs/lavora-con-noi.md](docs/lavora-con-noi.md) — pagina candidature (`intent: career`, niente allegati, claim da validare)
- [docs/i18n.md](docs/i18n.md) — multilingua IT/EN/FR/DE/ES (flag `NEXT_PUBLIC_ENABLE_I18N`)

**Qualità**
- [docs/audit-finale.md](docs/audit-finale.md) — **audit indipendente**: checklist PASS/FAIL, problemi P0–P3, decisioni rimaste al cliente
- [docs/performance.md](docs/performance.md) — misure Lighthouse, budget, cosa è stato ottimizzato e il divario che resta
- [docs/e2e.md](docs/e2e.md) — suite end-to-end: cosa copre, viewport, accessibilità, smoke sul feed live
- [docs/assistant-ui-e-eval.md](docs/assistant-ui-e-eval.md) — interfaccia, sicurezza e cento eval del chatbot

**Delivery & operatività**
- [docs/env-and-deploy.md](docs/env-and-deploy.md) — variabili d'ambiente, Vercel, preview vs produzione
- [docs/vercel-live-checklist.md](docs/vercel-live-checklist.md) — **verifica del deploy** e azioni manuali rimaste in Vercel
- [docs/production-readiness.md](docs/production-readiness.md) — checklist di lancio
- [docs/da-chiedere-alla-cliente.md](docs/da-chiedere-alla-cliente.md) — **cosa deve ancora fornire la cliente**: contenuti, foto, video, dati, accessi, con i bloccanti marcati. Documento unico, verificato contro il codice
- [docs/client-review-script.md](docs/client-review-script.md) — talk-track per la call di presentazione
- [docs/phase-plan.md](docs/phase-plan.md) — Fase 1 (sito) vs Fase 2 (AI/CRM)

## Prossimi passi (dal brief iniziale: storia)

*Storia, non lista di lavoro.* La riga qui sotto viene dal brief iniziale. Le pagine che elenca oggi esistono tutte (vedi «Pagine»): il listing sta su `/acquista`, e `/case` vi reindirizza. I prossimi passi veri dipendono da quello che la cliente deve ancora consegnare ([docs/da-chiedere-alla-cliente.md](docs/da-chiedere-alla-cliente.md)) e dalle domande aperte della spec (§11.3).

> Pagine MVP successive: Vendi, Acquista, Metodo, Open Domus, Servizi, Listing/Scheda immobile, Recensioni, Chi siamo, Contatti. I componenti sono pensati per essere riusati su queste pagine.
