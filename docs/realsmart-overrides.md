# Override manuali degli immobili

Come correggere o completare a mano i dati di un immobile, senza database, senza CMS e senza
pannello amministrativo.

## Quando serve

RealSmart resta la fonte principale: il 95% dei dati arriva dal gestionale e il sito li legge
da solo. Un override serve solo per le **eccezioni**, quando l'agenzia ci comunica qualcosa che
il gestionale non contiene o contiene sbagliato. Per esempio:

- l'APE è stato consegnato dopo la pubblicazione e la classe energetica nel feed è vuota;
- il feed dice "Box: Sì" ma le autorimesse sono due e nessun campo lo dice;
- una caratteristica del feed è sbagliata e va tolta;
- il cliente fornisce un testo di descrizione già approvato;
- si vuole pubblicare l'indirizzo civico (per default è nascosto).

## Dove si scrive

Un solo file: **`app/lib/realsmart/overrides.data.ts`**, nell'array `OVERRIDES`.

L'indice è il **codice RealSmart** dell'immobile — il campo `<Codice>` del feed, per esempio
`"2055"`. Non il titolo e non il riferimento commerciale: i titoli cambiano, il codice no.

## Esempio

```ts
const OVERRIDES: ListingOverride[] = [
  {
    codice: "2055",
    motivo: "APE consegnato dopo la pubblicazione dell'annuncio",
    fonte: "email dell'agenzia del 12/03/2026",
    data: "2026-03-12",
    autore: "Domus Tua — Raffaela",
    fatti: [
      { key: "classeEnergetica", value: "A2" },
      { key: "autorimesse", value: "2" },
      { key: "vicinoAlParco", group: "forza", label: "Affaccio sul parco" },
    ],
    rimuovi: ["ariaCondizionata"],
    mostraIndirizzo: true,
  },
];
```

## I campi

| Campo             | Obbligatorio | Cosa fa                                                              |
| ----------------- | ------------ | -------------------------------------------------------------------- |
| `codice`          | sì           | `<Codice>` RealSmart dell'immobile                                    |
| `motivo`          | sì           | perché stiamo intervenendo a mano                                     |
| `fonte`           | sì           | da dove arriva l'informazione (email, APE, sopralluogo…)              |
| `data`            | sì           | data della verifica, formato `YYYY-MM-DD`                             |
| `autore`          | sì           | chi ha verificato e approvato                                         |
| `fatti`           | no           | dati da aggiungere o correggere: vincono su gestionale e descrizione  |
| `rimuovi`         | no           | chiavi da non pubblicare (dato errato o non pubblicabile)             |
| `descrizione`     | no           | paragrafi approvati che sostituiscono integralmente la descrizione    |
| `mostraIndirizzo` | no           | `true` per pubblicare l'indirizzo civico (default: nascosto)          |

`motivo`, `fonte`, `data` e `autore` non sono burocrazia: fra sei mesi sono l'unica cosa che
permette di capire se un dato scritto a mano vale ancora.

## Le chiavi dei fatti

Le chiavi già conosciute (`classeEnergetica`, `terrazzi`, `autorimesse`, `postiAuto`,
`riscaldamento`, `vista`, `ascensore`, …) ereditano automaticamente gruppo ed etichetta dal
catalogo in `app/lib/realsmart/facts.ts`.

Per un dato che il catalogo non prevede — tipicamente un punto di forza specifico di quella
casa — serve dichiarare anche `group` (uno tra `principali`, `esterni`, `comfort`, `spazi`,
`forza`) e `label`.

Un fatto **senza** `value` è una dotazione: in pagina diventa una spunta con la sola etichetta.
Un fatto **con** `value` diventa "etichetta: valore".

## Verifica

```bash
npm run check
```

Un override non valido **fa fallire la build**: chiave sconosciuta, campo obbligatorio mancante,
data nel formato sbagliato, codice duplicato, gruppo incoerente. È voluto: meglio una build
rossa che un dato sbagliato online.

Gli override che puntano a un immobile non più presente nel feed (**orfani**) non rompono la
build — il gestionale può aver ritirato l'immobile — ma vengono segnalati nei log del server e
nel report di `npm run audit:listings-content`.

## Priorità

```
override manuale  >  campo RealSmart  >  estrazione deterministica dalla descrizione
```

Unica eccezione, l'**arricchimento**: se una fonte più alta dice solo che una cosa esiste
("Terrazzo: Sì") e una più bassa aggiunge la misura ("due terrazzi"), vince il dato più preciso.
Le due fonti non si contraddicono: una conta, l'altra conferma.
