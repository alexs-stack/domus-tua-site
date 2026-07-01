# Direzione brand — Domus Tua

Sintesi operativa della direzione di brand per il sito e i materiali collegati. Non riscrive il
design system (`docs/DESIGN.md`) né il motif (`docs/brand-motif.md`): li riassume e li lega alla
strategia emersa dalla call cliente, così chi scrive testi, sceglie foto o costruisce sezioni sa
subito "dove stare".

Concept di fondo: **Editorial Luxury × fiducia locale**. Un'agenzia di Tradate che comunica come
un brand premium ma resta calda, umana e del territorio.

---

## 1. Palette

Fonte tecnica: `app/globals.css` (token `@theme inline`). Regola d'oro: **rosso che accende,
grigi caldi che strutturano, bianco caldo che respira**. Un solo punto di rosso per volta.

| Ruolo | Token | Hex | Uso |
| --- | --- | --- | --- |
| Accento primario | `--color-red` | `#d20a0a` | CTA, "Tua", eyebrow, stelle, accenti puntuali. |
| Rosso hover | `--color-red-dark` | `#a30707` | Stato hover del rosso. |
| Rosso tenue | `--color-red-soft` | `#fbeaea` | Sfondi soft, badge, focus su superfici scure. |
| Testo/scuro | `--color-ink` | `#1a1816` | Testo principale e sezioni scure. **Non** è nero pieno. |
| Grigio forte | `--color-graphite` | `#46423d` | "Domus" nel wordmark, testo forte. |
| Grigio secondario | `--color-stone` | `#6b665f` | Testo secondario, didascalie. |
| Linee | `--color-line` | `#e7e2da` | Bordi hairline. |
| Sfondo caldo | `--color-cream` | `#faf7f1` | Sfondo sezioni. |
| Sfondo caldo profondo | `--color-cream-deep` | `#f3eee5` | Card/superfici alternate. |
| Carta | `--color-paper` | `#fffdfa` | Superfici in evidenza. |

### Da NON usare (vincolo esplicito del cliente)
- ❌ **Oro** — niente accenti gold/lusso classico.
- ❌ **Blu** — niente blu (nemmeno per link/stati).
- ❌ **Nero pieno** (`#000`) — al suo posto `--color-ink` `#1a1816`.
- ❌ Gradienti sgargianti, palette fredde, secondi colori d'accento.

Logica cromatica del marchio: **"Domus" grigio + "Tua" rosso** — la struttura è grigia/calda,
l'accento umano è rosso.

---

## 2. Tono di voce

Cinque attributi, sempre insieme, mai uno solo:

- **Empatico** — parla alle persone, non agli immobili ("Persone prima degli immobili").
- **Raffinato** — editoriale, curato, mai gridato; frasi pulite, niente iperboli da volantino.
- **Entusiasta** — energia positiva, orgoglio del lavoro, voglia di raccontare.
- **Tecnologico** — innovazione concreta (video, rendering, home staging, Open Domus), mai freddo.
- **Sicuro** — trasmette competenza e protezione ("senza stress", "con sicurezza", "documenti verificati").

Fili conduttori del copy già in uso: *"Vendere casa, senza stress. Acquistare casa, con sicurezza."*,
*"Persone prima degli immobili"*, *"Ci vedi prima ancora di conoscerci"*.

Da evitare nel tono: gergo tecnico-legale respingente, promesse non dimostrabili, freddezza
corporate, aggressività da hard-selling.

---

## 3. Il Segno Domus (motif)

Dettaglio completo in `docs/brand-motif.md`. In breve: due tratti derivati dal logo —
**linea-tetto** rossa (protezione) + **linea-abbraccio** grigia (accoglienza). Regole: uno per vista,
sempre sottile (1–2.6px), bassa opacità sulle superfici (4–8%), rivelato dall'interazione,
mai sul testo, mai vicino al logo, solo colori di palette. È la firma, non un ornamento.

---

## 4. Founder-led

Il brand è guidato dalla fondatrice **Raffaella Rizza** (agenzia nata nel 2007). Il sito la mette
in primo piano: ritratto nell'hero, citazione in "Chi siamo", presenza nei video. La founder è il
volto della fiducia: umana, competente, presente "con te dal 2007".

> ⚠️ **Nota grafia:** nel codice il nome compare come "Raffael**a**" (una L) in quasi tutti i punti,
> mentre il brief indica "Raffael**la**" (due L). Da uniformare — vedi `docs/content-replacement-checklist.md`.

Implicazione per il copy: parlare in prima persona plurale ("noi", "il nostro team") ma con un volto
riconoscibile dietro; le storie reali (clienti, Open Domus) sono la prova, non le statistiche astratte.

---

## 5. Video e social first

Il sito è **video/social-driven**: la fiducia si costruisce facendo *vedere* prima di raccontare.
- **Emotional video real estate**: tour e racconti emozionali degli immobili.
- **Muro video** in home (`SocialVideoWall.tsx`) con video reali dal canale YouTube.
- **Canali**: Instagram e YouTube confermati; Facebook e TikTok da confermare.
- Il feed Instagram e le recensioni Trustindex possono diventare **live** via embed (`site.ts`).

Implicazione: ogni sezione dovrebbe poter ospitare una prova visiva (clip, foto reale, recensione),
non solo testo. Il testo introduce, il video convince.

---

## 6. Asset proprietari

Due asset che distinguono Domus Tua dalla concorrenza e vanno valorizzati come **marchi interni**:

- **Open Domus** — format di visita evoluto (immobile preparato, documentazione pronta, acquirenti
  prequalificati, visite ordinate). Prova sociale forte ("venduta al primo Open Domus").
- **Domus D.O.C. — Domus di Origine Certificata** — protocollo di fiducia: verifica documentale,
  trasparenza pre-visita, immobile preparato, meno sorprese al rogito. Claim di "certificazione":
  il testo definitivo va approvato dal cliente.

Trattarli sempre con la maiuscola e come nomi propri; non genericizzarli ("una visita" ≠ "un Open Domus").

---

## 7. RealSmart come single source of truth

Gli immobili non sono contenuti editoriali del sito: sono una **vista in sola lettura** del gestionale
RealSmart. Nessun dato immobile va scritto/duplicato a mano nel sito. Coerenza col brand:
la promessa di "documenti verificati" e "nessuna sorpresa" richiede che prezzi/stati siano sempre
allineati alla fonte. Dettaglio in `docs/realsmart-integration-notes.md`.

---

## 8. AI = fasi future

L'AI **non** è nello scope attuale del brand/sito. Niente riferimenti a "intelligenza artificiale",
chatbot o automazioni AI nei testi o nella UI per ora. Il posizionamento "tecnologico" oggi si esprime
con video, rendering, home staging e Open Domus — non con l'AI. Da riservare a fasi successive.

---

## In una riga

Un'agenzia di Tradate, guidata dalla sua fondatrice, che usa il **rosso** con misura, racconta con i
**video**, si fa vedere sui **social**, protegge con **Open Domus** e **Domus D.O.C.**, tiene gli
immobili sempre veri via **RealSmart** — e parla in modo **empatico, raffinato, entusiasta,
tecnologico e sicuro**.
