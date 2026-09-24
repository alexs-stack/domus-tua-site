# Pilota territoriale — 2026-08-14T10:00:00.000Z

Modalità: **fixture** · comuni: lonate-ceppino, tradate, venegono-inferiore, venegono-superiore

> MODALITÀ FIXTURE: provider e immobili SINTETICI, nessuna rete. Dimostra il flusso; i POI NON sono reali.
> Nessun flag di produzione è stato attivato; nessun draft è stato approvato; nulla è pubblicato.
> Riuso del profilo: con più immobili nello stesso comune, una sola query per origine (vedi listingsPerQuery).

## Uso del provider
- Chiamate al provider: 4 · profili aggiornati (origini uniche): 4 · cache hit: 0 · fallimenti: 0
- Riuso: **3 immobili per query** (una query per origine/comune).

## Per comune

### lonate-ceppino
- Immobili in scope: 3 · draft: 3 · cambiati/stale: 3
- Origine: municipality-centroid — "Lonate Ceppino" (±2000 m)
- POI per categoria: railway-station: 3, pharmacy: 6, supermarket: 6, school: 3, park: 6
- Fonti (esempi): —
- Fatti d'area: vuoti (ricerca da autorizzare)

### tradate
- Immobili in scope: 3 · draft: 3 · cambiati/stale: 3
- Origine: municipality-centroid — "Tradate" (±2000 m)
- POI per categoria: railway-station: 3, pharmacy: 6, supermarket: 6, school: 3, park: 6
- Fonti (esempi): —
- Fatti d'area: vuoti (ricerca da autorizzare)

### venegono-inferiore
- Immobili in scope: 3 · draft: 3 · cambiati/stale: 3
- Origine: municipality-centroid — "Venegono Inferiore" (±2000 m)
- POI per categoria: railway-station: 3, pharmacy: 6, supermarket: 6, school: 3, park: 6
- Fonti (esempi): —
- Fatti d'area: vuoti (ricerca da autorizzare)

### venegono-superiore
- Immobili in scope: 3 · draft: 3 · cambiati/stale: 3
- Origine: municipality-centroid — "Venegono Superiore" (±2000 m)
- POI per categoria: railway-station: 3, pharmacy: 6, supermarket: 6, school: 3, park: 6
- Fonti (esempi): —
- Fatti d'area: vuoti (ricerca da autorizzare)

## Decisioni umane in sospeso
- Approvare/rifiutare i draft POI per ogni comune (CLI territory:review) — nessun draft è approvato automaticamente.
- Autorizzare la ricerca dei fatti d'area (fonti primarie) — oggi vuoti in attesa di autorizzazione.
- Autorizzare (se voluto) l'uso dell'origine a livello di immobile per singoli annunci — altrimenti resta il centroide comunale.
- Confermare l'attivazione dello storage durevole e dei flag di produzione SOLO alla verifica finale (Prompt 18).

## Come approvare (nessun auto-approve)
```bash
npm run territory:review -- list --status=draft
npm run territory:review -- show <codice>
npm run territory:review -- approve <codice> --by=<nome>
```
