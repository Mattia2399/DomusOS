<div align="center">
  <img src="https://raw.githubusercontent.com/Mattia2399/DomusUI/main/brand/icon.png" width="112" alt="Logo Domus UI" />
  <h1>Domus UI</h1>
  <p><strong>Una nuova esperienza Home Assistant, progettata per desktop, tablet e smartphone.</strong></p>
  <p>Dashboard reattiva, builder visuale e controlli avanzati con un'interfaccia coerente e premium.</p>

  [![Release](https://img.shields.io/github/v/release/Mattia2399/DomusUI?include_prereleases&style=flat-square)](https://github.com/Mattia2399/DomusUI/releases)
  [![Release gate](https://img.shields.io/github/actions/workflow/status/Mattia2399/DomusUI/release-gate.yml?branch=main&label=release%20gate&style=flat-square)](https://github.com/Mattia2399/DomusUI/actions/workflows/release-gate.yml)
  [![HACS validation](https://img.shields.io/github/actions/workflow/status/Mattia2399/DomusUI/hacs.yml?branch=main&label=HACS&style=flat-square)](https://github.com/Mattia2399/DomusUI/actions/workflows/hacs.yml)
  ![Beta](https://img.shields.io/badge/status-public%20beta-f5a623?style=flat-square)
  ![Responsive](https://img.shields.io/badge/desktop%20%C2%B7%20tablet%20%C2%B7%20mobile-responsive-1473e6?style=flat-square)
  [![License GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-2f855a?style=flat-square)](LICENSE)
</div>

![Domus UI su desktop, tablet e smartphone](https://raw.githubusercontent.com/Mattia2399/DomusUI/main/docs/images/domusos-showcase.png)

## La casa, in un'unica esperienza

| 🧩 Builder visuale | 📱 Layout realmente responsive | 🏠 Integrato in Home Assistant |
| --- | --- | --- |
| Card, stack, drag and drop, dimensioni e configurazione senza scrivere YAML. | Griglie dedicate a desktop, tablet e smartphone, sincronizzate nella stessa casa. | Installazione HACS, sessione HA, permessi e comandi autorizzati dal server. |

| 🔒 Sicurezza esplicita | 🎨 Esperienza coerente | 🛠️ Diagnostica e ripristino |
| --- | --- | --- |
| Demo isolata, segreti esclusi dai layout e azioni sensibili protette. | Temi chiari e scuri, superfici glass e controlli ottimizzati per touch. | Versioni del layout, backup sanitizzati, rollback e report senza dati personali. |

## Perché Domus UI

- Layout condiviso dalla casa e sincronizzato tra i dispositivi.
- Reset autorevole condiviso: nessun browser puo ripristinare accidentalmente un layout eliminato usando una cache precedente.
- Griglie diverse per desktop, tablet e mobile, con drag and drop e undo/redo.
- Card responsive e pannelli contestuali per le principali entità Home Assistant.
- Onboarding guidato, Demo isolata e connessione tramite la sessione Home Assistant.
- Builder visuale con catalogo, stack, dimensioni per breakpoint e configurazione correlati.
- Temi chiari e scuri, superfici glass e controlli ottimizzati per touch.
- Permessi centralizzati: Home Assistant resta l'autorità per identità, ruoli e comandi.

<div align="center">
  <img src="https://raw.githubusercontent.com/Mattia2399/DomusUI/main/docs/images/domusos-mobile.jpg" width="390" alt="Domus UI su smartphone" />
</div>

## Installazione con HACS

HACS è l'unico metodo di installazione distribuito per la beta. La futura app ufficiale sarà il secondo canale supportato.

[![Apri il repository in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Mattia2399&repository=DomusUI&category=integration)

1. Installa e configura [HACS](https://www.hacs.xyz/) in Home Assistant.
2. Apri il collegamento qui sopra oppure aggiungi `Mattia2399/DomusUI` come repository personalizzato di tipo **Integration**.
3. Scarica **Domus UI** e riavvia Home Assistant.
4. Vai in **Impostazioni → Dispositivi e servizi → Aggiungi integrazione**.
5. Cerca **Domus UI**, conferma e apri la nuova voce nella barra laterale.

Non servono modifiche a `configuration.yaml`, token manuali o copie dentro `/www`. Consulta la [guida completa](docs/installation-beta.md) per aggiornamento, rollback e risoluzione problemi.

> Una release HACS deve contenere l'asset `domusos.zip`. I tag Git senza una GitHub Release pubblicata non sono installabili da HACS.

## Stato delle funzioni

| Area | Stato beta | Note |
| --- | --- | --- |
| Home e Builder | Operativa | Layout condiviso, edit mode, catalogo, stack, versioni e ripristino |
| Stanze | Operativa | Piani, stanze, dispositivi e controlli autorizzati da HA |
| Sicurezza | Operativa | Alarm, camere e sensori; non sostituisce un sistema certificato |
| Consumi | Operativa | Riepiloghi e dati disponibili dalle entità HA |
| Profilo e Impostazioni | Operativa | Preferenze personali separate dalla configurazione della casa |
| App Gallery | Parziale | Irrigazione in beta; Locale Tecnico e Piscina & Spa in preparazione |
| Automazioni | Prossimamente | L'interfaccia incompleta non è esposta come funzione utilizzabile |
| Calendar, Mappa e Liste | Pianificata | Previste dopo la prima beta |

Lo stato dettagliato e i limiti hardware verificati sono mantenuti in [Stato funzionalità](docs/feature-status.md).

> **Irrigazione:** panoramica, configurazione, calendario, consumi e comandi
> supervisionati sono disponibili. Il motore server-side con watchdog e
> ripristino dopo riavvio e pianificato nel prossimo ciclo: fino ad allora non
> usare la programmazione beta come unica protezione per irrigazioni non
> presidiate.

## Card disponibili

Sensor, Light, Switch, Climate, Alarm, Lock, Cover, Camera, Media Player, Vacuum e Members. Le card usano dimensioni e contenuti adattivi; alcune capability dipendono dagli attributi e dai servizi realmente esposti dall'integrazione Home Assistant del dispositivo.

## Sicurezza e privacy

- Token, PIN, codici Alarm/Lock e passkey non entrano in layout, backup o sincronizzazione.
- Demo e casa reale usano spazi separati.
- Le modifiche strutturali sono riservate a Owner/Admin e funzionano in modalità fail-closed.
- I comandi finali vengono comunque autorizzati dal server Home Assistant.
- La conferma dispositivo WebAuthn è una protezione locale, non un secondo fattore server certificato.
- Domus UI beta non è un sistema di allarme, sicurezza o safety certificato.

Leggi [Sicurezza e privacy](docs/security-and-privacy.md) e la [checklist beta](docs/security-beta-checklist.md) prima dell'uso su una casa reale.

## Supporto e feedback

Domus UI include una pagina nativa **Profilo > Supporto e feedback**. Da lì puoi scaricare una diagnostica locale ripulita e scegliere il canale corretto:

- [segnala un bug riproducibile](https://github.com/Mattia2399/DomusUI/issues/new?template=bug_report.yml);
- [proponi un'idea o fai una domanda](https://github.com/Mattia2399/DomusUI/discussions);
- [invia privatamente una vulnerabilità](https://github.com/Mattia2399/DomusUI/security/advisories/new).

La diagnostica non viene inviata automaticamente e non contiene token, PIN, URL, nomi di entità, stanze o valori della casa. Prima di pubblicare screenshot o log, verifica comunque che non mostrino informazioni personali.

## Sviluppo

Richiede Node.js 22.22.0 o superiore.

```bash
npm ci
npm run dev
```

Verifica completa prima di una release:

```bash
npm run release:gate
npm run release:package
```

Il packaging produce sia l'archivio diagnostico della web app sia `release-artifacts/domusos.zip`, pronto per una GitHub Release HACS.

## Documentazione

- [Installazione HACS](docs/installation-beta.md)
- [Aggiornamento e rollback](docs/update-and-rollback.md)
- [Roadmap](docs/roadmap.md)
- [Checklist di rilascio](docs/release-checklist.md)
- [Changelog](CHANGELOG.md)

## Licenza e supporto

Domus UI è distribuito con licenza [GNU GPL-3.0](LICENSE). Può essere usato, studiato, modificato e ridistribuito nel rispetto della licenza. L'app ufficiale, eventuali servizi ospitati e il supporto commerciale potranno essere offerti separatamente.

Per contribuire consulta [CONTRIBUTING.md](CONTRIBUTING.md). Le vulnerabilità devono essere inviate tramite il canale privato descritto in [SECURITY.md](SECURITY.md), mai tramite issue pubbliche.
