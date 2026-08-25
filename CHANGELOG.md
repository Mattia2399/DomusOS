# Changelog

## 0.1.0-beta.7 — 2026-08-25

### Corretto

- manifest Home Assistant allineato a Hassfest con classe IoT locale push e chiavi ordinate;
- configurazione YAML esclusa esplicitamente per l’integrazione basata esclusivamente su Config Flow;
- aggiunto il workflow Hassfest richiesto per la candidatura al catalogo HACS pubblico.

## 0.1.0-beta.6 — 2026-08-25

### Aggiunto

- identità pubblica **DomusOS** applicata ad app, progetto GitHub, pannello Home Assistant e distribuzione HACS;
- integrazione HACS con Config Flow e registrazione automatica del pannello DomusOS;
- pacchetto release `domusos.zip`, validazione HACS e pubblicazione automatica su tag;
- README GitHub completo con screenshot reali, matrice delle pagine e installazione HACS;
- componente condiviso per gli stati `Prossimamente` delle funzioni non ancora pronte.

### Corretto

- la build `dist` include ora anche `ha-dashboard-builder-panel.js`, evitando aggiornamenti parziali tra app e bridge iframe;
- app e bridge dichiarano protocollo e capability di persistenza per rendere diagnosticabile un disallineamento;
- l’accesso all’Edit Mode mostra un errore specifico per bridge obsoleto, permessi insufficienti, conflitto o archivio HA non disponibile.
- aggiornati `js-yaml` e `nanoid` alle versioni che risolvono le advisory bloccanti del gate.

## 0.1.0-beta.5 — in preparazione

### Migliorato

- Greeting trasformata in una sintesi stabile della casa, senza duplicare meteo e valori delle singole card;
- meteo mock confinato alla Demo e ai mockup espliciti;
- stati distinti per meteo non configurato e Home Assistant offline.

### Corretto

- rimosse le previsioni artificiali generate quando Home Assistant non restituisce forecast;
- card e pannello meteo mostrano ora stati espliciti non configurato, offline e previsioni non disponibili.

## 0.1.0-beta.4 — in preparazione

### Corretto

- stato attivo della navigazione desktop, drawer mobile e bottom bar durante l’esecuzione nel pannello iframe;
- route Home iniziale esplicita per la navigazione interna del pannello;
- matching delle route annidate basato sulla route React effettiva invece che sull’URL statico dell’iframe.

## 0.1.0-beta.3 — in preparazione

### Corretto

- aggiunta `config/area_registry/list` alle allowlist dell’app e del panel bridge;
- fase Organizza nuovamente in grado di leggere il registro delle stanze tramite panel;
- app e bridge distribuiti insieme nella directory versionata per aggiornamenti e rollback atomici.

## 0.1.0-beta.2 — in preparazione

### Aggiunto

- welcome obbligatoria per ogni nuova installazione, incluso il panel Home Assistant;
- ricerca automatica della sessione Home Assistant dopo la scelta `Collega la tua casa`;
- fallback temporizzato alla configurazione classica quando non viene rilevata una casa.

### Corretto

- migrazione delle installazioni panel rimaste nel vecchio stato intermedio `detected`;
- test responsive aggiornati al nuovo percorso di collegamento.

## 0.1.0-beta.1 — baseline tecnica

### Aggiunto

- onboarding iniziale con Demo isolata, OAuth e rilevamento panel bridge;
- conferma esplicita della casa rilevata dentro iframe/panel;
- permessi centralizzati, fail-closed e conferma locale delle azioni sensibili;
- backup, restore, reset e snapshot di recupero senza segreti;
- command coordinator condiviso con pending, conferma, timeout e rollback;
- undo/redo, preview responsive e stato di salvataggio dell’editor;
- componenti Glass condivisi e sistema temi semantico;
- documentazione di installazione, aggiornamento, rollback e sicurezza.
- pacchetto di distribuzione versionato con manifest e checksum SHA-256.

### Modificato

- React e React DOM aggiornati a 19.2.8;
- React Router aggiornato a 8.3.0;
- nome `panel_custom` allineato al Web Component registrato dal bridge;
- route applicative rese immutabili tramite registry centrale;
- MainBoard ridotto e suddiviso in controller/servizi dedicati;
- Sensor, Light e Switch migrati alla prima fase container-owned.

### Sicurezza

- token, PIN, codici, passkey e snapshot locali esclusi da backup e sync;
- OAuth state monouso con scadenza e return URL same-origin;
- panel bridge same-origin con allowlist e correlazione request/response;
- CSP di produzione senza `unsafe-eval`;
- Alarm e Lock riutilizzano un gate condiviso e non mostrano validazione negativa prima dell’invio.

### Limitazioni note

- la beta non è un sistema di sicurezza certificato;
- Calendar, Mappa, Liste e app ufficiale non sono ancora disponibili;
- test hardware avanzati Climate, Cover, Vacuum e alcune capability Lock/Alarm restano da completare;
- il bundle rispetta il limite bloccante ma richiede ulteriore code splitting;
- la matrice finale anti-clipping riprenderà dopo la pausa delle container query.
