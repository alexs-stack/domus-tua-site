# Audit finale — pronto per la call cliente

> Documento **interno sersan**. Fotografia dello stato del sito dopo il pacchetto di rifiniture
> 1–20. **Il video hero è escluso dal punteggio** (gestito su un binario parallelo). Aggiornato
> al 2026-07-07.

## Punteggio (1–10)

| # | Dimensione | Voto | Nota |
|---|---|---|---|
| 1 | Brand fidelity | **9.5** | Palette rosso/grigio/bianco, niente oro/blu, tono umano e caldo |
| 2 | Logo fidelity | **9.0** | Logo ufficiale PNG in uso (original-first); manca SVG + variante chiara |
| 3 | First impression (no hero video) | **9.5** | Hero cinematico con foto reale founder, forte |
| 4 | Buyer search | **9.5** | NL search live + filtri + chip esempio + alta su /acquista + empty-state convertente |
| 5 | Seller conversion | **9.5** | /vendi: rischi + preparazione + D.O.C. + CTA Open Domus + valutazione |
| 6 | Reviews credibility | **9.0** | Trustindex reale + 4.9/500 + "verificate tramite Trustindex" + gating produzione |
| 7 | Social/video proof | **9.0** | SocialVideoWall reel + categorie + lazy embed singolo |
| 8 | Open Domus productization | **9.5** | Pagina completa: cos'è, 5 step, confronto, FAQ, prova video |
| 9 | Domus D.O.C. clarity | **9.5** | 5 pilastri nominati + beneficio venditore/acquirente + cross-link |
| 10 | RealSmart readiness | **9.0** | Feed live + fallback + status helper + /api/health; mapping campi da confermare |
| 11 | Lead capture | **9.5** | Form + validazione + rate limit + honeypot + WhatsApp + deep-link intento |
| 12 | Mobile | **9.0** | Nessun overflow, menu, action bar, tap target, i18n nascosto |
| 13 | Performance / LCP | **9.0** | 1 sola immagine priority, lazy, video non blocca LCP; sorgenti immagini da alleggerire |
| 14 | SEO / local trust | **9.5** | Metadata per pagina, schema RealEstateAgent, sitemap, robots env-gated |
| 15 | Demo honesty | **10** | Badge + checklist, reviews gating, logo placeholder, /api/health |
| 16 | Infrastructure / CI | **9.0** | CI presente, `npm run check` verde, health endpoint |
| 17 | Client presentation clarity | **9.5** | Script di presentazione + demo-mode + vercel-live-checklist |

**Punteggio complessivo: ~9.3 / 10** (escluso hero video). Sopra la soglia per una presentazione
cliente seria. Il residuo verso il 10 è quasi tutto **contenuto/asset del cliente**, non codice.

---

## 1. Cosa è SICURO mostrare

- **Homepage** completa (hero founder-led, ricerca, stats, social wall, metodo, Open Domus, D.O.C.,
  before/after, listings, testimonial, recensioni, team, contatti).
- **Ricerca acquirenti** live: linguaggio naturale (parser locale sempre attivo), chip di esempio,
  filtri, empty-state che converte su WhatsApp acquirente.
- **/vendi**, **/acquista**, **/metodo**, **/open-domus** — percorsi completi e convertenti.
- **Schede immobile** (in produzione: dati reali dal feed RealSmart) con CTA visita + WhatsApp
  precompilato + blocco fiducia + related + "non è quella giusta".
- **Recensioni**: riepilogo 4.9/5 · oltre 500, "verificate tramite Trustindex", link a Google;
  widget Trustindex reale se carica sul dominio.
- **Form contatti** → WhatsApp (+ Google Sheet se `SHEETS_WEBHOOK_URL` configurato).
- **Mobile** e navigazione.

## 2. Cosa va INQUADRATO come placeholder (dirlo, con onestà)

Il **badge di anteprima** (in basso a sx) + la sua checklist lo ricordano in tempo reale.

- **Immobili demo** se `NEXT_PUBLIC_USE_REALSMART=false` (in prod = feed reale; verifica /api/health).
- **Testo delle recensioni** demo (compare solo se il widget Trustindex manca **e** in anteprima).
- **Hero** = poster (foto reale); il video arriva dal binario parallelo.
- **Logo**: ufficiale PNG in uso; ideale l'SVG + variante chiara.
- **Legale** (privacy/cookie): testo placeholder, `noindex` finché non validato.
- **Video**: abbinamento thumbnail↔ID/timestamp da confermare (TODO nel codice).
- **`videosCountLabel` "440+"** e le **stat**: da confermare col cliente.

## 3. Cosa NASCONDERE per la call

- Tieni il **badge anteprima** attivo (è lo strumento di onestà, non un difetto). In produzione è off.
- **Selettore lingua**: lascialo **nascosto** (`NEXT_PUBLIC_ENABLE_I18N=false`, già default) →
  italiano-only. Fatto.
- **Non condividere a schermo** la dashboard Vercel con i secret (`REALSMART_*`, webhook, API key).
- Nient'altro: le card demo sono già gated fuori dall'anteprima.

## 4. Env da verificare su Vercel (via `GET /api/health`)

| Variabile | Produzione | Preview |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.domustua.com` | URL Vercel |
| `NEXT_PUBLIC_USE_REALSMART` | assente/≠`false` (live) | `true` se feed stabile |
| `NEXT_PUBLIC_PREVIEW_BADGE` | `false` | `true` |
| `NEXT_PUBLIC_ENABLE_I18N` | `false` | `false` |
| `SHEETS_WEBHOOK_URL` | impostato (persistenza lead) | opzionale |
| `TRUSTINDEX_WIDGET_URL` / `INSTAGRAM_WIDGET_URL` | opzionale | opzionale |
| `ANTHROPIC_API_KEY` / `VOYAGE_API_KEY` | opzionale (ricerca funziona senza) | opzionale |

Check: `curl https://www.domustua.com/api/health` → `listingsMode:"realsmart"`, `previewBadge:false`,
`i18nEnabled:false`. Dettaglio: `docs/vercel-live-checklist.md`.

## 5. Asset cliente ancora bloccanti verso il 10/10

1. **Logo**: SVG a colori + variante chiara monocromatica + favicon.
2. **Clip video hero** ottimizzata (mp4 + webm).
3. **Trustindex** verificato sul **dominio di produzione** + **CID Google** confermato + top recensioni.
4. **RealSmart**: conferma mapping campi (provincia, classe energetica) + URL foto.
5. **Video YouTube**: ID/timestamp definitivi + thumbnail approvate.
6. **Numero video** reale (`site.videosCountLabel`).
7. **Testi legali** privacy/cookie validati da legale/DPO.
8. **Stat esatte** (immobili venduti, anni, ecc.).
9. **Sorgenti immagini** > 400 KB ri-esportate (vedi `docs/media-final-checklist.md`).

## 6. Ultimo patch-list codice (opzionale, per limare verso 9.5+)

Il codice è strutturalmente pronto; questi sono affinamenti facoltativi, non bloccanti:

- [ ] (Opz.) Ri-esportare le 5 immagini sorgente pesanti (asset, documentato).
- [ ] (Opz.) Nascondere la MobileActionBar quando la sezione contatti è in viewport (micro-polish;
      oggi il `pb-28` del form già evita la sovrapposizione).
- [ ] (Opz.) Quando arriva l'SVG del logo, sostituire il PNG e aggiungere la variante chiara footer.

Tutto il resto verso il 10/10 è **contenuto/asset del cliente**, atteso e già tracciato.
