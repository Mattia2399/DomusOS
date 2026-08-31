# Icona HACS e Home Assistant

Da Home Assistant 2026.3 le custom integration possono distribuire direttamente
i propri asset del brand. Domus UI include quindi le icone in
`custom_components/domusos/brand`, senza dipendere dal catalogo centralizzato
Home Assistant Brands.

## Asset pronti

- `brand/icon.png`: 256 x 256 px;
- `brand/icon@2x.png`: 512 x 512 px;
- gli stessi file sono inclusi in `custom_components/domusos/brand` e nel
  pacchetto `domusos.zip`.

Il comando che rigenera gli asset dal vettoriale sorgente e:

```bash
node scripts/generate-brand-assets.mjs
```

## Verifica della policy

La pull request di verifica aperta il 31 agosto 2026 e stata chiusa
automaticamente perché il repository non accetta più icone per nuove custom
integration:

- <https://github.com/home-assistant/brands/pull/11076>

La sorgente ufficiale indicata dal bot Home Assistant e:

- <https://developers.home-assistant.io/blog/2026/02/24/brands-proxy-api>

Per verificare una release e sufficiente controllare che `domusos.zip`
contenga entrambi gli asset nella cartella `brand/`.

Il nome della cartella deve restare uguale al dominio tecnico dichiarato nel
manifest (`domusos`), anche se il nome visualizzato dall'integrazione cambia.

## Metadati GitHub consigliati

Descrizione:

> Premium responsive dashboard and visual builder for Home Assistant - desktop, tablet and mobile.

Topic:

`home-assistant`, `hacs`, `dashboard`, `smart-home`, `home-automation`,
`react`, `responsive-design`, `custom-integration`.
