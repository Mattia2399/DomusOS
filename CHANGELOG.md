# Changelog

## 0.1.0-beta.13 — 2026-09-01

### Aggiunto

- centro Supporto e feedback integrato in Domus UI, con accesso diretto a
  segnalazioni bug, richieste di funzionalità, discussioni e diagnostica locale;
- guida contestuale nelle liste dispositivi di Rooms per spiegare selezione,
  pressione prolungata e personalizzazione delle sezioni;
- scelta esplicita durante la rimozione di uno stack: conservare le card nel
  canvas, eliminarle insieme allo stack oppure annullare l'operazione.

### Migliorato

- sidebar desktop e tablet più compatta e completa sui viewport intermedi;
- header di Rooms più fluido durante lo scorrimento e compatibile con le
  interazioni touch di trascinamento;
- stack Grid e orizzontali con larghezza automatica derivata dal contenuto e
  larghezza manuale coerente con il numero di colonne configurato;
- stack Preferiti popolato automaticamente senza sottrarre dal canvas le card
  già configurate manualmente;
- asset e documentazione del repository pubblico ripuliti e allineati al
  marchio Domus UI e alla visualizzazione HACS.

### Corretto

- apertura della sezione Sistema sempre dall'inizio della pagina;
- immagini README compatibili con il renderer informativo di HACS;
- card in fondo agli stack non più tagliate e spazio orizzontale non più
  lasciato inutilizzato nei layout automatici;
- rimozione degli stack protetta da una decisione esplicita, senza perdita
  involontaria delle card contenute.

## 0.1.0-beta.12 — 2026-08-31

### Modificato

- il nome pubblico del prodotto diventa **Domus UI**, più aderente al ruolo di
  dashboard e builder per Home Assistant;
- repository pubblico rinominato in `Mattia2399/DomusUI`, con redirect GitHub
  mantenuto dal precedente indirizzo;
- titolo del pannello, Config Flow, HACS, onboarding, documentazione e messaggi
  utente uniformati al nuovo marchio;
- `domusos` resta il dominio tecnico compatibile per integrazione, storage,
  URL interni e pacchetto HACS; nessun layout esistente deve essere migrato;
- preparate icone 256/512 px e documentazione per Home Assistant Brands.

## 0.1.0-beta.11 — 2026-08-28

### Migliorato

- nuova immagine di presentazione responsive usata nel repository GitHub e
  nella scheda informativa HACS;
- separazione completa tra fixture Demo e dati reali: card, catalogo e pannelli
  non usano più valori simulati durante una sessione Home Assistant;
- Rooms conserva preferenze distinte per Demo e casa reale e non genera più
  stanze fittizie quando Home Assistant non espone aree;
- pagine secondarie di Consumi uniformate all'header nidificato condiviso;
- log di Security vuoto nelle case reali e chiaramente identificato come
  dimostrativo nella Demo.

### Corretto

- gli stack mantengono la larghezza configurata quando una Light cambia stato:
  l'espansione automatica può usare più righe senza ridimensionare le card
  vicine o modificare il layout persistente;
- pannello Light resiliente alle entità che non espongono `hs_color`;
- comandi e fallback delle card reali non ereditano più capacità o valori dalle
  entità mock della Demo;
- piccoli allineamenti responsive di Light, Climate, Consumi e App Library.

## 0.1.0-beta.10 — 2026-08-28

### Aggiunto

- App Irrigazione ridisegnata come workspace indipendente e responsive, con
  Panoramica, Zone, Calendario, Consumi e configurazione condivisa della casa;
- configurazione guidata di valvole, sensori meteo, terreno e contatori con
  suggerimenti basati sulle entità disponibili in Home Assistant;
- storico consumi reale con periodi 7 giorni, 30 giorni e 12 mesi, cache dei
  dati e aggiornamento senza sostituire i valori disponibili con `N/D`;
- mockup dimostrativi di Locale Tecnico e Piscina & Spa, chiaramente separati
  dalle funzioni interattive;
- riconoscimento della configurazione condivisa DomusOS da una nuova origine,
  incluso `localhost`, per evitare di ripetere il setup di una casa esistente;
- roadmap del motore Irrigazione server-side, con scheduler, watchdog,
  ripristino sicuro e controlli fail-closed nell'integrazione HACS.

### Migliorato

- onboarding panel/iframe distinto tra casa nuova e installazione DomusOS già
  configurata;
- layout mobile e desktop dell'App Library, navigazione contestuale e pagine
  immersive;
- gestione numerica dei sensori Irrigazione con arrotondamento coerente e unità
  di misura leggibili;
- persistenza della configurazione delle app condivisa tramite Home Assistant,
  mantenendo il browser come cache locale.

### Corretto

- rimozione della card Scenari dal Builder;
- recupero della configurazione condivisa e allowlist del panel bridge per i
  nuovi flussi di inizializzazione e reset;
- padding mobile, stati di caricamento e aggiornamento delle card Consumi.

### Limitazioni note

- l'attuale Irrigazione beta non sostituisce ancora un controller autonomo con
  watchdog server-side; i comandi manuali devono essere supervisionati e la
  programmazione non deve essere l'unica protezione di un impianto reale.

## 0.1.0-beta.9 — 2026-08-25

### Aggiunto

- reset autorevole condiviso con avanzamento bloccante e verifica dello storage Home Assistant;
- tombstone di reset sincronizzato per impedire a browser e dispositivi secondari di ripubblicare layout obsoleti;
- riconoscimento locale del reset per evitare loop nel nuovo onboarding.

### Corretto

- il reset elimina layout, cronologia, cache, bozze e segreti delle card senza confondere uno store azzerato con una prima migrazione;
- i dispositivi secondari mantengono credenziali Home Assistant, passkey e preferenze personali quando recepiscono il reset globale;
- panel bridge aggiornato con schema e allowlist stretti per il marcatore di reset.

## 0.1.0-beta.8 — 2026-08-25

### Corretto

- registrazione del pannello compatibile con le API Home Assistant correnti e future;
- `handle_safe_area` viene inviato solo quando la versione installata di Home Assistant lo supporta.

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
