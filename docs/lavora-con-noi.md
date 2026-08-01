# Lavora con noi (`/lavora-con-noi`)

Pagina di **candidature spontanee**, non bacheca di annunci. Raccoglie profili tutto
l'anno e li fa arrivare all'agenzia con lo stesso tubo dei lead commerciali.

## File

| File | Ruolo |
| --- | --- |
| `app/lavora-con-noi/page.tsx` | Server component: metadata, canonical, OG, JSON-LD. |
| `app/lavora-con-noi/LavoraConNoiContent.tsx` | Corpo pagina (client, 5 lingue). |
| `app/lavora-con-noi/faq.ts` | FAQ italiane: le legge la pagina **e** il JSON-LD. |
| `app/components/CareerApplication.tsx` | Form candidatura + canali alternativi. |
| `app/lib/team.ts` | Roster e titoli del team (condiviso con `Team.tsx`). |

Sezioni: hero → perché Domus Tua → le aree → la selezione → chi troverai
(roster reale + video del team) → FAQ → form.

## Deep link per area

`/lavora-con-noi?ruolo=<id>` apre la pagina con l'area già selezionata nel form
(`consulente`, `frontOffice`, `staging`, `contenuti`, `tirocinio`, `spontanea`).
Stesso patto di `/contatti?intent=buyer`: serve a linkare un'area precisa da un post
Instagram o da un annuncio. Un valore sconosciuto viene ignorato, non rompe la pagina.

## Hero: `scrim="strong"`

La foto dell'hero è la scena reale in ufficio (`reali/consulenza.jpg`), molto
luminosa. Col velo standard di `PageHero` il titolo crema scendeva a **1,53:1** di
contrasto nel punto peggiore — sotto la soglia WCAG AA per il testo grande (3:1).
Da qui la prop `scrim="strong"`, che porta il caso peggiore a **3,51:1** (media
6,4:1). Se un domani si cambia la foto dell'hero, rimisurare: la soglia dipende
dall'immagine, non dalla prop.

## Come arriva una candidatura

Stesso percorso del form contatti, con `intent: "career"`:

1. `submitLead()` → `POST /api/lead` → `SHEETS_WEBHOOK_URL` (Google Sheet), se configurato.
2. In parallelo si apre **WhatsApp precompilato**: è il canale che funziona anche
   senza webhook, quindi la candidatura non si perde mai.

Campi aggiuntivi rispetto a un lead commerciale (`app/lib/forms/lead.ts`):
`role`, `experience`, `portfolio`. Sono in whitelist anche in `validateLead.ts`
(cap 120 / 80 / 300 caratteri).

**Le etichette di `role` ed `experience` viaggiano sempre in italiano**, anche se il
sito è in un'altra lingua: a leggerle è l'agenzia, e un foglio con sei traduzioni
della stessa area sarebbe infiltrabile. La traduzione resta solo nell'interfaccia.

### Niente allegati, di proposito

Il sito non accetta upload: nessuno storage, nessuna scansione antivirus, e un CV è
un dato personale che non vogliamo far transitare da un webhook Apps Script. Il
candidato lascia un **link** (LinkedIn / portfolio / CV online) oppure scrive a
`info@domustua.com`. Entrambe le vie sono in pagina.

## Dati strutturati

La pagina emette **FAQPage** e **BreadcrumbList**. Le domande del FAQPage sono le
stesse mostrate in pagina, perché entrambe leggono `./faq.ts`: markup che promette
risposte diverse da quelle visibili è spam secondo le linee guida di Google. Nota:
dal 2023 i rich result FAQ sono riservati a siti governativi e sanitari, quindi in
SERP il box non comparirà — il markup serve ai lettori automatici (Bing, assistenti).

## Perché non c'è il JSON-LD JobPosting

`schema.org/JobPosting` vuole annunci reali e databili (titolo, data di
pubblicazione, sede, tipo di contratto) e Google declassa le offerte scadute o
inesistenti. Finché la pagina raccoglie candidature spontanee il markup sarebbe
falso. Quando il cliente aprirà posizioni vere: si aggiunge `JobPosting` per
ciascuna, con i suoi dati e la sua `validThrough`.

## Perché non è nel menu principale

`nav` in `app/lib/site.ts` ha già otto voci: la nona manda la barra desktop a capo
sotto i 1200px. La voce vive nel **footer** (presente su ogni pagina) più i link
interni dalla pagina Chi siamo. Se il cliente la vuole in header, va tolto o
accorpato qualcos'altro.

## ⚠️ Da validare col cliente prima del lancio

Il resto della pagina poggia su dati già verificati (sede, anno, recensioni,
composizione del team). Queste invece sono affermazioni che impegnano l'agenzia e
**vanno confermate da Raffaela**:

- [ ] Le **cinque aree** di candidatura: sono quelle giuste? Ne mancano?
- [ ] I **quattro passi della selezione** (form → telefonata → colloquio in sede →
      giornata di affiancamento): è davvero così che selezionano?
- [ ] La riga *"Leggiamo ogni candidatura e ti ricontattiamo noi"*: è una promessa,
      va mantenuta o ammorbidita.
- [ ] *"Niente prove non pagate"* nella sezione selezione.
- [ ] Chi riceve le candidature in agenzia (oggi finiscono nello stesso Google Sheet
      dei lead commerciali, con `intent = career`: valutare un foglio separato).

## Assistente

Voce di conoscenza `lavora-con-noi` in `app/lib/assistant/knowledge/entries.ts`.
Copre **solo il meccanismo** (dove ci si candida, come si manda il CV): niente
posizioni aperte, requisiti o tempi di risposta, che l'assistente non può sapere.
