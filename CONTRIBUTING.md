# Contribuire a DomusOS

Grazie per voler migliorare DomusOS. Prima di iniziare una modifica ampia, apri una discussione o una issue per concordare obiettivo e compatibilità con la roadmap.

## Preparazione

Richiede Node.js 22.22.0 o superiore.

```bash
npm ci
npm run dev
```

## Pull request

- mantieni ogni PR focalizzata su un solo problema;
- non includere token, PIN, URL Home Assistant, dati reali o screenshot personali;
- preserva accessibilità, temi Light/Dark e breakpoint supportati;
- aggiungi o aggiorna i test relativi al comportamento modificato;
- documenta cambiamenti visibili, migrazioni e limiti hardware;
- esegui `npm run release:gate` prima della richiesta di revisione.

Le contribuzioni inviate al repository vengono distribuite secondo la licenza GPL-3.0 del progetto. Inviando una PR dichiari di poter concedere tali diritti sul codice proposto.

## Sicurezza

Non usare issue o pull request pubbliche per vulnerabilità. Segui [SECURITY.md](SECURITY.md).
