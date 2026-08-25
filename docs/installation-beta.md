# Installazione HACS

Aggiornata: 2026-08-25

HACS è il solo canale di installazione distribuito per DomusOS beta. La futura app ufficiale sarà il secondo metodo supportato. Le precedenti installazioni manuali tramite `/www` e `panel_custom` sono considerate legacy e non fanno parte del percorso pubblico.

## Requisiti

- Home Assistant 2025.1.0 o successivo;
- HACS configurato;
- accesso Owner/Admin per installare e aggiungere l'integrazione;
- backup recente della configurazione Home Assistant;
- una GitHub Release di DomusOS contenente `domusos.zip`.

## Installazione

1. Apri il repository direttamente in HACS:

   [![Apri il repository in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Mattia2399&repository=DomusOS&category=integration)

2. Se il collegamento non importa il repository, in HACS apri il menu dei repository personalizzati e aggiungi:

   ```text
   https://github.com/Mattia2399/DomusOS
   ```

   Categoria: `Integration`.

3. Scarica l'ultima release di **DomusOS**.
4. Riavvia Home Assistant.
5. Vai in **Impostazioni → Dispositivi e servizi → Aggiungi integrazione**.
6. Cerca **DomusOS** e conferma il modulo.
7. Apri **DomusOS** dalla barra laterale e completa il primo avvio.

L'integrazione registra automaticamente il pannello e i file frontend. Non devi modificare `configuration.yaml`, creare token o copiare file in `/config/www`.

## Primo avvio

1. Deve comparire la schermata di benvenuto con `Inizia ora`.
2. Scegli tra Demo e collegamento della casa.
3. Nel panel HACS la casa viene rilevata attraverso la sessione Home Assistant già autenticata.
4. Anche quando la casa viene trovata automaticamente, completa Analisi, Layout e Organizza.
5. Al termine scegli se mantenere il layout dimostrativo o iniziare con un canvas vuoto quando l'opzione sarà disponibile nella release installata.

## Aggiornamento

1. Crea un backup dalla sezione DomusOS e un backup Home Assistant.
2. Installa l'aggiornamento proposto da HACS.
3. Riavvia Home Assistant se HACS lo richiede.
4. Ricarica completamente il browser o chiudi e riapri l'app Home Assistant.
5. Verifica la versione in Impostazioni e controlla Home, Stanze e Sicurezza.

HACS usa le GitHub Release pubblicate, non i soli tag Git. Il workflow `Publish release` genera e allega automaticamente `domusos.zip` quando viene pubblicato un tag corrispondente alla versione del `package.json`.

## Rollback

Da HACS apri DomusOS, seleziona una delle release precedenti e reinstalla. Dopo il riavvio verifica che la versione del layout sia ancora leggibile. Il rollback dell'integrazione non sostituisce il ripristino di una versione layout.

Consulta anche [Aggiornamento e rollback](update-and-rollback.md).

## Risoluzione problemi

### DomusOS non appare tra le integrazioni

- riavvia Home Assistant dopo l'installazione HACS;
- svuota la cache del browser;
- controlla che esista `/config/custom_components/domusos/manifest.json`;
- verifica nei log HA eventuali errori `domusos`.

### Il pannello è nero o non si carica

- reinstalla la release da HACS per ripristinare la cartella `frontend` inclusa nello ZIP;
- verifica che `domusos.zip` appartenga alla stessa versione mostrata dalla release;
- esegui un hard refresh del browser;
- controlla la console per richieste fallite sotto `/domusos_static/`.

### La modifica del layout non è disponibile

- controlla che l'identità HA sia Owner/Admin;
- verifica lo stato della connessione nel pannello;
- attendi il completamento del caricamento della configurazione condivisa;
- non usare entità mock per inviare servizi Home Assistant.

## Verifica minima dopo l'installazione

- welcome e onboarding compaiono al primo accesso;
- il ruolo Home Assistant mostrato è corretto;
- un utente limitato non può entrare in Edit Mode;
- il layout si salva su Home Assistant e viene letto da un secondo dispositivo;
- Home e Stanze navigano senza ricaricare il documento;
- i comandi reali vengono bloccati quando la connessione è offline;
- backup e versioni non espongono token, PIN o codici.

## Distribuzione da sorgente

Per i maintainer:

```bash
npm ci
npm run release:gate
npm run release:package
```

Il comando produce:

- `release-artifacts/domusos.zip` per HACS;
- l'archivio web diagnostico;
- `release-artifacts/SHA256SUMS`.
