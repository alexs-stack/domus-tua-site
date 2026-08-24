# Tradate — dossier di ricerca d'area

> **Questo NON è un elenco di fatti.** È l'elenco di ciò che va letto per scriverli, con quello
> che una ricerca ha suggerito e quanto poco ci si può fidare. Nessuna riga di qui va copiata in
> `app/lib/territory/area/data.ts` senza aver aperto la pagina indicata e averla letta.
>
> Raccolto il 2026-08-23. Metodo: solo ricerca web, **nessuna pagina è stata aperta** — vedi sotto.

---

## Perché il dossier e non i fatti

Da questo ambiente le pagine degli enti **non sono raggiungibili**. Il proxy di rete le rifiuta
per policy dell'organizzazione, non per un guasto:

```
WebFetch https://www.comune.tradate.va.it/   → EGRESS_BLOCKED
WebFetch https://comune.tradate.va.it/…      → EGRESS_BLOCKED
WebFetch https://www.trenord.it/             → EGRESS_BLOCKED
```

La documentazione del proxy (`/root/.ccr/README.md`) è esplicita su questa classe: *«403/407 — il
destinatario non è ammesso dalla policy di egress della tua organizzazione. Non riprovare e non
aggirarla — segnala l'host bloccato»*. Quindi non è stata aggirata.

La ricerca web invece funziona, perché gira altrove. Ma un risultato di ricerca **non è una
fonte**: è un riassunto di più pagine, di freschezza ignota, che mescola siti istituzionali e
aggregatori commerciali. Scrivere un fatto con `source.url` di una pagina che non si è aperta, e
`retrievedAt` a adesso, significa **fabbricare la traccia dell'evidenza** — la cosa esatta che
questo sistema esiste per impedire, e la stessa categoria dell'`approvedBy` iniettato dal modello
già corretto in `writer.ts`.

### La prova che non è pignoleria

Cercando la superficie del Parco Pineta, il riassunto ha risposto:

> «a surface area of **83.433 hectares** (or **8.343,3 hectares**)»

Una frase sola che si contraddice di un fattore dieci. Su una scheda immobile sarebbe finita una
cifra sbagliata, con la citazione di un sito istituzionale a farle da garanzia. È esattamente il
difetto «corretto in ogni frase, falso nel merito» che il cancello di pubblicazione deve fermare.

---

## Cosa verificare, dove, e quanto fidarsi

Legenda fiducia: **A** più fonti concordi e dato stabile · **B** una fonte, plausibile ·
**C** contraddittorio o volatile, da leggere con attenzione.

### Trasporti

| Da verificare | Pagina da aprire | Cosa ha suggerito la ricerca | Fid. |
|---|---|---|---|
| Tradate è fermata sulla linea regionale Varese–Saronno–Milano | `trenord.it/…/varese-saronno-milano-regional-line/?code=R22` | linea **R22**, direttrice Varese–Saronno–Milano | B |
| Tradate è fermata del RegioExpress Laveno–Varese–Saronno–Milano | `trenord.it/…/laveno-varese-saronno-milano-regioexpress-line/` | servizio **RE5** | B |
| Destinazioni e tempi di percorrenza | orario ufficiale della linea | — | C |

⚠️ **`trenord.it` non è fra le fonti autorizzate.** `ALLOWED_SOURCE_HOSTS`
(`app/lib/territory/area/sources/policy.ts`) ammette oggi solo `comune.tradate.va.it`,
`provincia.va.it`, `regione.lombardia.it`. Usare Trenord come fonte è una **decisione da
prendere**, non un dettaglio: aggiungere una riga a quell'elenco autorizza a interrogare il sito
di un soggetto terzo. Trenord è il gestore del servizio, quindi è la fonte primaria per le proprie
linee — ma la riga va aggiunta consapevolmente.

### Verde pubblico

| Da verificare | Pagina da aprire | Cosa ha suggerito la ricerca | Fid. |
|---|---|---|---|
| Nome ufficiale del parco | `regione.lombardia.it/…/parco-pineta-di-appiano-gentile-e-tradate` | «Parco della Pineta di Appiano Gentile e Tradate» | A |
| Superficie | stessa pagina | **contraddittorio**: 83.433 ha *oppure* 8.343,3 ha | **C** |
| Che sia parco regionale fra le province di Como e Varese | stessa pagina | sì, alta pianura lombarda | B |

La superficie è il caso da trattare con più cura di tutti: due valori incompatibili nello stesso
riassunto. Va letta sulla pagina, e se la pagina non la dichiara, **il fatto non si scrive** —
una superficie non si stima.

### Servizi comunali

| Da verificare | Pagina da aprire | Cosa ha suggerito la ricerca | Fid. |
|---|---|---|---|
| Nome della biblioteca | `comune.tradate.va.it/…/biblioteca-civica/` | «Biblioteca Frera» / «Biblioteca Civica» — **due nomi diversi nei risultati** | C |
| Indirizzo | stessa pagina | Via Zara 37, 21049 Tradate | B |
| Telefono | stessa pagina | 0331-841820 | B |
| Orari di apertura | `comune.tradate.va.it/servizio/biblioteca/` | giovedì sera chiusura 21.00, alcuni locali fino alle 23.00 per aula studio/emeroteca | **C** |

⚠️ **Gli orari non vanno pubblicati da un indice di ricerca.** La pagina stessa, secondo il
riassunto, avverte che *«nel periodo estivo e in concomitanza di ponti e periodi di festività gli
orari potranno subire variazioni temporanee»*. Un orario è il fatto più volatile che ci sia: se si
pubblica, serve un `reviewBy` corto (sei mesi, non un anno).

⚠️ Parte dei risultati veniva da **`oraridiapertura24.it`**, un aggregatore commerciale. Non è una
fonte istituzionale e non è nell'elenco autorizzato: quei dati vanno riconfermati sul sito del
Comune prima di esistere.

---

## Come si scrive un fatto, una volta letta la pagina

```ts
{
  id: "af_tradate_biblioteca",           // stabile: si cita negli eventi di revisione
  municipality: "tradate",
  category: "municipal-service",          // transport | municipal-service | park-facility | …
  scope: "municipality",
  text: "…parafrasi neutra in italiano di ciò che la pagina afferma…",
  source: {
    url: "https://comune.tradate.va.it/…",   // LA pagina che lo afferma, non la home
    owner: "Comune di Tradate",
    retrievedAt: "2026-…T…Z",                // quando l'hai aperta davvero
  },
  reviewBy: "2027-…T…Z",                     // corto per gli orari, lungo per la geografia
  status: "approved",
  approvedBy: "…", approvedAt: "2026-…T…Z",  // senza questi il guard rifiuta lo stato
  translations: [], conflicts: [], schemaVersion: 1,
}
```

Sulla parafrasi valgono le regole editoriali dell'audit, che il guard applica da sé: niente
citazioni, niente superlativi, niente «zona tranquilla», «servitissima», «posizione strategica».
Si scrive cosa c'è e da dove risulta.

## Per vedere la sezione online

1. i fatti verificati in `app/lib/territory/area/data.ts` (la pull request **è** l'approvazione);
2. `NEXT_PUBLIC_TERRITORY_SECTION_ENABLED=true`.

In quest'ordine: al contrario si accende un contenitore vuoto. Nessun database, nessun costo —
vedi `docs/area-audit-status.md`.
