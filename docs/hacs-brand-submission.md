# Icona HACS e Home Assistant Brands

La scheda HACS usa ancora il catalogo centralizzato Home Assistant Brands per
mostrare l'icona delle custom integration. Gli asset inclusi direttamente in
`custom_components/domusos/brand` restano utili per Home Assistant recente, ma
non sostituiscono la submission al catalogo per tutti i client HACS.

## Asset pronti

- `brand/icon.png`: 256 x 256 px;
- `brand/icon@2x.png`: 512 x 512 px;
- gli stessi file sono inclusi in `custom_components/domusos/brand` e nel
  pacchetto `domusos.zip`.

Il comando che rigenera gli asset dal vettoriale sorgente e:

```bash
node scripts/generate-brand-assets.mjs
```

## Submission esterna

Pull request aperta il 31 agosto 2026:

- <https://github.com/home-assistant/brands/pull/11076>

Procedura utilizzata:

1. creare un fork di `home-assistant/brands`;
2. aggiungere `icon.png` e `icon@2x.png` in
   `custom_integrations/domusos/`;
3. aprire una pull request seguendo il template del repository;
4. attendere merge e propagazione della cache del CDN;
5. verificare `https://brands.home-assistant.io/domusos/icon.png`.

Il nome della cartella deve restare uguale al dominio tecnico dichiarato nel
manifest (`domusos`), anche se il nome visualizzato dall'integrazione cambia.

## Metadati GitHub consigliati

Descrizione:

> Premium responsive dashboard and visual builder for Home Assistant - desktop, tablet and mobile.

Topic:

`home-assistant`, `hacs`, `dashboard`, `smart-home`, `home-automation`,
`react`, `responsive-design`, `custom-integration`.
