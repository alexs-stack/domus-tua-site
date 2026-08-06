# Consolidamento dopo le PR — report

Passata di consolidamento sul risultato cumulativo delle PR integrate su `main`. Nessun redesign:
font, palette, hero, fotografie e animazioni restano quelli di `main`. Le uniche rimozioni visibili
sono contenuti **senza fonte** (numeri stimati, firma calligrafica generica, video ripetuti).

## 1. Duplicati trovati e come sono stati risolti

| Area | Stato prima | Ora |
|---|---|---|
| Normalizzazione comuni/zone | Già unica (`app/lib/comune.ts`), usata da API, parser, filtri e mappa | Invariata — nessun duplicato da rimuovere |
| Disponibile / venduto | Regola ripetuta in 4 punti (`PropertySearch`, `ai/rank`, `geo/comuni`) e **assente** in `Listings` (home) | Predicato unico in `app/lib/availability.ts` + `getAvailableListings()` nella facciata |
| Consenso cookie | Logica chiusa dentro `CookieConsent.tsx`; nessun altro poteva interrogarla | `app/lib/consent.ts` (cookie, lettura, scrittura, evento, hook `useConsent`) |
| Configurazione video | ID sparsi: `site.videos`, due ID hardcodati in `OpenDomus`/`Team`, canale YouTube in 3 costanti, e 8 slot per 4 video | `app/lib/videos.ts` compone i blocchi; tutti gli ID in `site.videos`; canale solo in `site.social.youtube` |
| Configurazione hero media | `heroMedia` **e** `heroCinematic`, con `heroMedia` morto (letto solo da `demoStatus`) | Solo `heroCinematic` |
| Origin del sito | `NEXT_PUBLIC_SITE_URL \|\| "https://www.domustua.com"` copiato in `layout`, `sitemap`, `robots`, `case/[slug]` | `siteUrl` esportato da `app/lib/site.ts` |
| Flag feed RealSmart | `NEXT_PUBLIC_USE_REALSMART !== "false"` calcolato in `listings.ts`, `demoStatus.ts`, `realsmart/env.ts` | `isRealSmartLive()` in `realsmart/env.ts` |
| Recapiti | Telefono hardcodato nel JSON-LD del layout e nei metadata di `/contatti` | Derivati da `site.phone` / `site.whatsapp` |
| Gerarchia della homepage | Già unica (`app/page.tsx`, un solo `<h1>`, ThreadNav derivato dagli id reali) | Invariata |
| Dipendenze | Nessuna duplicata: ogni pacchetto di `package.json` ha almeno un consumatore | Invariata |

### Helper morti rimossi
`app/components/primitives/{Button,Card,Section,Container}.tsx` (mai importati; `Container` solo da
`Section`), `app/lib/realsmart/index.ts` (barrel mai usato, superficie di export parallela a quella
dei singoli moduli), `app/components/Signature.tsx`.

## 2. Contenuti non verificati: verifica ed esito

I contenuti dell'elenco **non erano stati rimossi** dalle PR precedenti: erano ancora in pagina.

| Contenuto | Dov'era | Esito |
|---|---|---|
| 269.395 m² valutati | `Stats.tsx` (home, /chi-siamo, /recensioni) | Rimosso |
| 6.433 persone | `Stats.tsx` | Rimosso |
| 1.523 transazioni | `Stats.tsx` | Rimosso |
| 92% venduto | `Stats.tsx` + claim in `/vendi` (5 lingue) | Rimosso |
| 440+ video | `site.videosCountLabel` → `SocialVideoWall` | Rimosso |
| Firma grafica inventata | `Signature.tsx`, in hero e sezione contatti | Rimossa |
| Video YouTube duplicati | 8 slot per 4 ID (featured ×2, testimonianza ×2, una recensione ×2) | 6 slot, 6 video distinti |
| Venduti tra i disponibili | Sezione "le nostre case" della home | Corretto |
| Trustindex prima del consenso | `Reviews.tsx`: iframe montato al primo render | Dietro `dt_consent=accepted` |

**La sezione "I numeri" resta**, con le stesse animazioni (odometro + CountUp + marquee), ma mostra
solo dati con fonte annotata in `site.ts`: **531 recensioni Google verificate**, **4,9 valutazione
media**, **anni di attività** calcolati da `site.since` (2007). La griglia secondaria passa da 3 a 2
colonne perché i numeri verificati sono due.

## 3. Da approvare col cliente

Queste modifiche toccano testo visibile e vanno confermate (o sostituite con i dati reali):

1. Etichette della sezione "I numeri": *Recensioni Google verificate*, *Valutazione media*,
   *Anni a Tradate*. Se il cliente documenta metriche proprie (m² valutati, transazioni, % venduto),
   si rimettono in `site.ts` con la fonte e si aggiorna il test.
2. `/vendi`: la frase sulle tre leve non chiude più con "…ed è così che il 92% dei nostri immobili
   viene venduto" (5 lingue).
3. `SocialVideoWall`: le sei card con titoli di tour immobiliari ("Villa Mozart", "Villa con
   domotica", "Quadrilocale con giardino di 870 mq") **non corrispondevano** ai video linkati.
   Ora ci sono le tre video recensioni reali, con il titolo effettivo del canale. Se il cliente
   fornisce ID e titoli dei tour, si riaggiungono in `site.videos`.
4. Firma della fondatrice: serve l'SVG/PNG reale (vedi `docs/da-chiedere-alla-cliente.md`).
   L'animazione `DrawOnScroll` è pronta nella sezione contatti.

## 4. Rete di sicurezza

`app/lib/__tests__/content-integrity.test.ts` fallisce se rientrano: i cinque numeri/claim senza
fonte, il componente `Signature`, un video ripetuto, una vetrina che legge `getVisibleListings()`
invece della lista filtrata, il widget Trustindex fuori dal gate di consenso, o una seconda lettura
di `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_USE_REALSMART` / del numero di telefono.
