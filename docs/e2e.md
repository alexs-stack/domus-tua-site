# Test end-to-end

Suite di browser del sito: Playwright, un framework solo. Quello che gira in un browser sta in
`e2e/`; lo smoke test sul feed vero dell'agenzia sta in `e2e-live/` e non blocca niente.

```bash
npm run test:e2e                          # tutta la suite, tutti i viewport
npx playwright test --project=mobile-390  # un viewport solo
npx playwright test e2e/search.spec.ts    # un file solo
npm run test:e2e:live                     # smoke sul feed RealSmart (separato)
```

---

## 1. Cosa copre

| # | Area | File |
|---|---|---|
| 1 | caricamento homepage | `home.spec.ts` |
| 2 | preloader e skip | `home.spec.ts` |
| 3 | header desktop / mobile | `home.spec.ts` |
| 4 | ricerca "villa a Tradate sotto 300000" | `search.spec.ts` |
| 5 | filtro comune | `search.spec.ts` |
| 6 | zero risultati | `search.spec.ts` |
| 7 | immobili venduti esclusi | `search.spec.ts` |
| 8 | apertura scheda immobile | `listing.spec.ts` |
| 9 | lightbox | `listing.spec.ts` |
| 10-13 | Acquista, Vendi, Metodo Domus, Open Domus | `pages.spec.ts` |
| 14 | recensioni prima e dopo il consenso | `consent-reviews.spec.ts` |
| 15 | form email | `contact.spec.ts` |
| 16 | WhatsApp | `contact.spec.ts` |
| 17 | telefono | `contact.spec.ts` |
| 18 | chatbot | `assistant.spec.ts` |
| 19 | privacy e cookie policy | `pages.spec.ts` |
| 20 | 404 ed errori delle API | `errors.spec.ts` |
| — | accessibilità e contrasto (axe) | `a11y.spec.ts` |
| — | reduced motion | `motion.spec.ts` |

Verifiche trasversali, attive su ogni test tramite la fixture `guards`: **nessun errore di
console** e **nessuna richiesta fallita inattesa**. Tastiera, focus e contrasto hanno test
propri in `a11y.spec.ts`.

---

## 2. Viewport

| Progetto | Dimensioni | Cosa esegue |
|---|---|---|
| `mobile-360` | 360×640 | solo i test `@layout` |
| `mobile-390` | 390×844 (iPhone 13) | tutto |
| `tablet-768` | 768×1024 (iPad Mini) | solo i test `@layout` |
| `desktop-1366` | 1366×768 | solo i test `@layout` |
| `desktop-1440` | 1440×900 | tutto |

Perché non tutto ovunque: moltiplicare per cinque ogni test allunga la CI senza aggiungere
informazione. Solo i test in cui la larghezza cambia davvero il comportamento — header, griglie,
pannelli, traboccamenti — portano il marcatore `@layout` e girano su tutti e cinque. I due
estremi eseguono l'intera suite.

Tutti i progetti girano su **Chromium**: i descrittori dei dispositivi Apple porterebbero WebKit,
che misurerebbe le differenze fra motori — un'altra cosa rispetto a ciò che serve qui.

---

## 3. Come sono fatti i test

**Nessuno conosce uno slug.** Si parte sempre da quello che la pagina mostra: `firstListingLink`
prende il primo immobile della griglia. Il giorno in cui il portafoglio dell'agenzia cambia, la
suite continua a dire la verità.

**Dati stabili.** In CI il server parte con `NEXT_PUBLIC_USE_REALSMART=false`: gli immobili sono
le fixture del repository, non il feed del giorno. Il feed vero ha il suo smoke test (§5).

**Terze parti mai contattate.** YouTube, Trustindex, le tessere della mappa: la fixture `guards`
le intercetta e risponde con qualcosa di innocuo, così il sito degrada come farebbe con un ad
blocker e i test non dipendono dalla rete né dai servizi altrui.

**Il preloader si salta dalla porta principale.** La fixture `goto` scrive la chiave di sessione
che il sito stesso usa per non ripetere l'intro. I test dedicati all'intro non la usano.

**I click aspettano l'idratazione.** L'HTML arriva prima del JavaScript: `clickUntil` riprova
finché l'effetto atteso non c'è, invece di sperare in un `waitForTimeout`.

### Due cose imparate montando la suite

- **Build di produzione, non `next dev`.** Sotto un browser pilotato l'HMR del dev server non si
  aggancia e la pagina non arriva mai a idratarsi: il bottone c'è, il click non fa niente.
- **Il server non si riusa mai.** Sulla stessa macchina possono esserci altri worktree dello
  stesso progetto: un server "riusato" venuto da un altro branch fa fallire i test per finta.

---

## 4. Accessibilità

`a11y.spec.ts` passa axe (WCAG 2.1 A/AA, contrasto compreso) su otto pagine, sul pannello
dell'assistente e sul banner cookie. Gli **iframe restano fuori**: dentro c'è il widget
Trustindex, con il suo markup e i suoi colori — segnalarli terrebbe la suite rossa per un
difetto che non possiamo correggere, e nasconderebbe i nostri.

La scansione gira con **reduced motion attivo**: le rivelazioni parola-per-parola passano da
opacità intermedie, e axe misurerebbe il contrasto di un testo a metà dissolvenza.

Un controllo automatico non certifica l'accessibilità: trova una parte dei problemi. Ma i
problemi che trova sono veri — questa suite ne ha trovati due (un `aria-label` vietato su
`<blockquote>` e uno su `<span>`), corretti nella stessa PR.

---

## 5. Smoke test sul feed live

`e2e-live/realsmart.smoke.spec.ts`, configurazione separata
(`playwright.live.config.ts`), comando separato, job CI **non bloccante**.

```bash
npm run test:e2e:live                            # build locale col feed acceso
E2E_LIVE_URL=https://… npm run test:e2e:live     # contro un deploy esistente
```

Verifica che il feed risponda, che la vetrina non mostri venduti e che una scheda reale mostri i
dati del gestionale con immagini da sorgenti consentite. Se il gestionale è lento o in
manutenzione il rosso non dice niente sul nostro codice: per questo non ferma la pipeline. Una
CI che diventa rossa per motivi altrui smette di essere letta.

---

## 6. In CI

`.github/workflows/ci.yml`, tre job:

| Job | Blocca la PR | Cosa fa |
|---|---|---|
| `build` | sì | lint, typecheck, test unitari, build |
| `e2e` | sì | la suite di browser su tutti i viewport |
| `live-smoke` | no (`continue-on-error`) | smoke sul feed RealSmart, solo sui push |

Screenshot, video e tracce si producono **solo in caso di errore** e vengono caricati come
artefatto solo se il job fallisce (`if: failure()`), con scadenza a 7 giorni.

Durata: la suite completa (168 test su cinque viewport, build compresa) sta intorno ai 15 minuti
in locale con 4 worker. Gira in parallelo al job `build`, quindi non allunga la CI di altrettanto.
