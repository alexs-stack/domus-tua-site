# Deployment — Domus Tua (Vercel)

Note operative per il deploy del sito su Vercel e la checklist prima del go-live.
Stack: Next.js 16 + React 19 + Tailwind v4 (vedi `package.json`).

## 1. Progetto Vercel

| Voce | Valore |
|---|---|
| Progetto Vercel | `domus-tua` (`.vercel/project.json`) |
| Dominio di preview | `domus-tua-ten.vercel.app` |
| Repo | `github.com/alexs-stack/domus-tua-site` (pubblico) |
| Branch di produzione | `main` (deploy automatico a ogni push) |
| Framework preset | Next.js (auto-rilevato) |
| Build command | `next build` (default) |
| Output | gestito da Vercel (nessuna config custom necessaria) |

Le Preview Deploy sono generate automaticamente per ogni PR / branch: utili per far vedere al
cliente le modifiche prima di andare su produzione.

---

## 2. Variabili d'ambiente

Impostare in **Vercel → Project `domus-tua` → Settings → Environment Variables**, replicando
i nomi di `.env.example`. In locale: copiare `.env.example` in `.env.local` (già in `.gitignore`,
mai committare valori reali).

| Variabile | Ambienti | Segreta? | Scopo |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production, Preview | No (pubblica) | URL canonico del sito. Alimenta `metadataBase`, OG/canonical, `sitemap`/`robots`. In Production = dominio finale; in Preview = URL Vercel. |
| `REALSMART_FEED_URL` | Production (+ Preview se si testa) | Sì | Endpoint del feed immobili (scenario A/B). Letto da `fetchRawListings()` in `client.ts`. |
| `REALSMART_API_KEY` | Production | Sì | Chiave/token per autenticare il feed o le API RealSmart. |
| `REALSMART_API_BASE` | Production | Sì (URL riservato) | Base URL delle API REST RealSmart (scenario C). |
| `REALSMART_WEBHOOK_SECRET` | Production | Sì | Segreto per verificare la firma dei webhook RealSmart (rivalidazione on-demand). |

Note:
- Solo le variabili con prefisso `NEXT_PUBLIC_` finiscono nel bundle client. Tutte le
  `REALSMART_*` sono **server-only** (usate in Server Components / route handler) e non vanno
  mai prefissate `NEXT_PUBLIC_`.
- Finché le `REALSMART_*` non sono impostate, `getLiveListings()` ripiega sui mock
  (`app/lib/realsmart/mocks.ts`): nessun errore in pagina.
- Se in futuro si userà FTP/SFTP, aggiungere `REALSMART_FTP_HOST/USER/PASS/PATH` (vedi
  `docs/realsmart-integration-notes.md`, §5).

---

## 3. `metadataBase` e `NEXT_PUBLIC_SITE_URL`

Stato attuale (`app/layout.tsx`): `metadataBase` è **hardcoded** a
`new URL("https://www.domustua.com")`.

Conseguenze e azione consigliata:

- Va **confermato il dominio di produzione**. Se il go-live avviene sul dominio custom
  `www.domustua.com`, il valore attuale è corretto. Se invece si resta (anche
  temporaneamente) su `domus-tua-ten.vercel.app`, gli URL assoluti di OG/canonical
  punterebbero a un dominio ancora non attivo.
- **Refactor consigliato** per non hardcodare l'host: leggere da env con fallback.

```ts
// app/layout.tsx
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.domustua.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // …resto invariato
};
```

Così: Production usa il dominio reale, le Preview usano l'URL Vercel, e gli URL assoluti
(canonical, OpenGraph, immagini social) restano coerenti in ogni ambiente. Lo stesso
`siteUrl` va riusato in `sitemap.ts`/`robots.ts` (vedi §5).

> Attenzione: `metadataBase` deve puntare a **un solo host canonico** (con o senza `www`).
> Scegliere la forma definitiva col cliente ed eventualmente impostare il redirect
> apex → `www` (o viceversa) nei DNS/Vercel.

---

## 4. Immagini remote (`next/image` + `remotePatterns`)

Oggi tutte le immagini sono **locali** (`/public/images/...`, `/public/images/reali/...`),
quindi `next.config.ts` non ha `remotePatterns` e va bene così.

**Quando arriveranno le foto RealSmart** (host esterno), `next/image` le rifiuterà finché
il loro dominio non è in allowlist. Aggiungere a `next.config.ts` (mantenendo `formats` e
`sizes` esistenti):

```ts
// next.config.ts — DA COMPILARE quando si conosce il dominio media RealSmart
const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 220, 300, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.realsmart.example",   // ← host reale da confermare
        // pathname: "/immobili/**",            // opzionale: restringere il path
      },
    ],
  },
};
```

Promemoria:
- Usare `hostname` il più specifico possibile (evitare wildcard troppo ampi).
- Se le foto hanno **watermark** o vincoli d'uso, chiarirlo (vedi note integrazione §7/§10).
- Se gli URL immagine non fossero stabili nel tempo, valutare il ribaltamento su storage
  proprio; per ora si assume URL diretti e stabili dal feed.
- Verificare le risoluzioni servite: `deviceSizes`/`imageSizes` sono già tarati sul layout.

---

## 5. `robots` e `sitemap`

**Stato attuale: assenti.** Non esistono `app/robots.ts` né `app/sitemap.ts`. Da aggiungere
prima del go-live (Next 16 li genera nativamente da questi file in `app/`).

`app/robots.ts` (bozza):

```ts
import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.domustua.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
```

`app/sitemap.ts` (bozza): pagine statiche + schede immobile da `getLiveListings()`.

```ts
import type { MetadataRoute } from "next";
import { getLiveListings } from "./lib/realsmart";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.domustua.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "", "/vendi", "/acquista", "/metodo", "/open-domus",
    "/case", "/recensioni", "/chi-siamo", "/contatti",
    "/privacy", "/cookie",
  ];
  const pages = staticPaths.map((p) => ({
    url: `${siteUrl}${p}`,
    lastModified: new Date(),
  }));

  const listings = await getLiveListings();
  const properties = listings.map((l) => ({
    url: `${siteUrl}/case/${l.slug}`,
    lastModified: l.updatedAt || l.publishedAt || undefined,
  }));

  return [...pages, ...properties];
}
```

> Verificare con il codice reale l'elenco esatto delle route statiche (le cartelle sotto `app/`:
> `acquista`, `case`, `chi-siamo`, `contatti`, `cookie`, `metodo`, `open-domus`, `privacy`,
> `recensioni`, `servizi`, `vendi`). Aggiornare `staticPaths` di conseguenza.

Consigliato anche impostare i `canonical` per-pagina (via `alternates.canonical`), ora che
`metadataBase` è coerente con `NEXT_PUBLIC_SITE_URL`.

---

## 6. Checklist pre go-live

**Dominio e URL**
- [ ] Dominio di produzione deciso e collegato su Vercel (apex vs `www`, redirect impostato).
- [ ] `NEXT_PUBLIC_SITE_URL` impostata in Production e Preview.
- [ ] `metadataBase` allineato a `NEXT_PUBLIC_SITE_URL` (refactor §3) — non più hardcoded.
- [ ] `app/robots.ts` e `app/sitemap.ts` aggiunti e verificati (`/robots.txt`, `/sitemap.xml`).

**SEO / social**
- [ ] Titoli/description per pagina coerenti; canonical per-pagina impostati.
- [ ] Immagine OG di default presente e correttamente risolta (URL assoluto via `metadataBase`).
- [ ] `favicon.ico` presente (già in `app/favicon.ico`).

**RealSmart / dati**
- [ ] Deciso lo scenario di integrazione (feed A/B o API C) — vedi note integrazione.
- [ ] `REALSMART_*` impostate come secret su Vercel (o consapevoli di girare sui mock).
- [ ] `normalizeStatus()` aggiornato con gli stati reali del feed (evitare "published" per errore).
- [ ] `remotePatterns` configurato col dominio media reale prima di usare foto esterne (§4).
- [ ] Fallback ai mock verificato (feed irraggiungibile ⇒ nessuna pagina vuota).
- [ ] ISR: `REVALIDATE_SECONDS` (720s) confermato; eventuale webhook di rivalidazione impostato.

**Contenuti reali (oggi DEMO)**
- [ ] Immobili: sostituiti dal feed reale (oggi `app/lib/properties.ts` è demo).
- [ ] Recensioni: reali/embed (oggi `app/lib/reviews.ts` è demo; `site.embeds` Trustindex vuoto).
- [ ] Contatti/social verificati in `app/lib/site.ts` (Facebook/TikTok e URL Google recensioni da confermare).
- [ ] Embed live (`site.embeds.trustindexSrc`, `instagramIframe`) popolati o fallback statico accettato.

**Legale**
- [ ] Pagine `privacy` e `cookie` allineate al trattamento dati reale (feed immobili, indirizzi, foto).
- [ ] Indirizzo civico immobili: pubblicabile o solo comune/zona (vedi note integrazione §10).

**Qualità build**
- [ ] `next build` verde in locale e su Vercel.
- [ ] `next lint` senza errori bloccanti.
- [ ] Controllo rapido Lighthouse/performance sulla Preview (immagini, CLS, LCP).
- [ ] Test responsive rapido (mobile/desktop) sulle pagine chiave.

---

## File / percorsi rilevanti

- `next.config.ts` — config immagini (`formats`, `deviceSizes`, `imageSizes`); qui va `remotePatterns`.
- `app/layout.tsx` — `metadata` + `metadataBase` (da collegare a `NEXT_PUBLIC_SITE_URL`).
- `app/lib/realsmart/client.ts` — fetch feed, `REVALIDATE_SECONDS`, filtro stati.
- `.env.example` — elenco variabili attese (root).
- `.vercel/project.json` — riferimento progetto Vercel (`domus-tua`).
- Da creare: `app/robots.ts`, `app/sitemap.ts`.
- Contesto integrazione: `docs/realsmart-integration-notes.md`; mappatura campi: `docs/realsmart-field-mapping.md`.
