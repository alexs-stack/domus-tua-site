# Copy Domus D.O.C. — da approvare (Domus Tua / consulente legale)

Questo file raccoglie il testo del blocco **Domus D.O.C.** sulla scheda immobile. È qui perché
tocca un'affermazione delicata (documenti/conformità/trasparenza) e deve essere approvato prima
di considerarlo definitivo. Il testo attualmente in produzione è **volutamente conservativo**.

## Il problema risolto

Prima, la scheda diceva **per ogni immobile**: «Questo immobile segue il protocollo Domus D.O.C.:
documenti, conformità e trasparenza **controllati prima della vendita**». È un'affermazione di
conformità sul **singolo immobile** che i dati normalizzati non confermano per tutti — e che
contraddiceva l'assistente, già prudente («vale per ogni incarico… quali verifiche siano già
state fatte su un immobile preciso te lo conferma il team: io non posso attestarlo»).

## La regola nuova (condizione di verità, unica per pagina e assistente)

- **Default → variante NEUTRA (metodo).** Descrive il protocollo come metodo dell'agenzia, senza
  affermare che *questo* immobile è stato certificato. È ciò che vede l'utente su un immobile
  senza evidenza esplicita.
- **Variante VERIFICATA → solo con evidenza.** L'affermazione sul singolo immobile appare solo se
  un **override** manuale con `docVerified: true` la attesta (con `fonte`/`data`/`autore`). Mai
  dedotta dal testo di marketing o dalle caratteristiche.

Le due varianti (5 lingue) vivono in **`app/lib/domusDoc.ts`**, fonte unica: pagina e assistente
non possono divergere.

## Testo in produzione (italiano) — da approvare

**NEUTRA (default)**
- Titolo: «Domus D.O.C., il nostro metodo sui documenti»
- Testo: «Con Domus D.O.C. controlliamo documenti, conformità e trasparenza prima di portare una
  casa sul mercato: è il metodo con cui seguiamo ogni incarico, per arrivare al rogito senza
  sorprese. Quali verifiche siano già state fatte su questo immobile te lo conferma il team.»
- Punti: «Controllo dei documenti» · «Verifica di conformità» · «Trasparenza prima della visita»

**VERIFICATA (con override `docVerified`)**
- Titolo: «Una casa verificata, prima ancora di entrare.»
- Testo: «Questo immobile segue il protocollo Domus di Origine Certificata: documenti, conformità
  e trasparenza controllati prima della vendita. Così visiti e scegli con serenità, senza
  sorprese.»
- Punti: «Documenti in ordine» · «Conformità controllata» · «Trasparenza pre-visita»

Le traduzioni EN/FR/DE/ES sono in `app/lib/domusDoc.ts` con la stessa struttura.

## Domande per il cliente

1. **La variante neutra va bene come default?** In alternativa, indicate la formulazione preferita
   (senza affermare l'esito sul singolo immobile finché non c'è evidenza).
2. **Il protocollo Domus D.O.C. è applicato e documentato per OGNI immobile, o solo per alcuni?**
   - Se **ogni** immobile: possiamo mostrare ovunque la variante verificata, ma serve un modo per
     attestarlo (basta confermarlo per iscritto e lo attiviamo per tutti gli incarichi).
   - Se **solo alcuni**: si aggiunge un override `docVerified: true` sugli immobili verificati
     (con fonte/data/autore), e gli altri restano sulla variante neutra.
3. **Il badge «Documenti verificati»** ora compare solo con la stessa evidenza esplicita (non più
   dedotto dalle caratteristiche del feed). Confermate questa scelta?

Finché non arriva l'approvazione, resta attiva la variante **neutra** (conservativa).
