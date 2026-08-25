# Security beta checklist

Aggiornata: 2026-08-03

Obiettivo: verificare manualmente i flussi sensibili prima di distribuire la beta. Questa checklist non rende la dashboard un sistema di sicurezza certificato; serve a evitare falle evidenti nella UX, nello storage locale e nei backup.

## Storage e backup

- [x] Backup JSON non contiene `hass_auth_tokens`.
- [x] Backup JSON non contiene token manuali Home Assistant.
- [x] Backup JSON non contiene `alarmUnlockCode`, `alarmLocalExtraCode` o `lockCode`.
- [x] Backup JSON non contiene `ha.dashboard.secrets.widgetCodes.v1`.
- [x] Backup JSON non contiene `ha.dashboard.secrets.widgetCodes.v2`.
- [x] Restore di un backup vecchio/sporco non ripristina token, passkey, PIN locali o codici widget.
- [x] Condivisione configurazione/ruolo non contiene token, passkey, PIN locali o codici widget.
- [x] Reset totale rimuove documento condiviso e cronologia da Home Assistant; sul dispositivo che avvia il reset elimina anche token, codici e credential locali soltanto dopo la conferma server.
- [x] Un tombstone condiviso impedisce agli altri dispositivi di ripubblicare cache obsolete dopo il reset; questi eliminano layout, bozze e segreti delle vecchie card ma preservano credenziali HA, passkey e preferenze personali.

Verifica automatica 2026-07-17:

- `src/services/configBackup.test.ts`
- `src/services/haUserConfigSync.test.ts`
- `src/services/dashboardStorage.test.ts`
- `src/services/widgetSecrets.test.ts`
- `src/services/dashboardRuntime.test.ts`

## Identita, permessi e runtime

- [x] Matrice automatica Owner/Admin/utente limitato/loading/offline/Demo.
- [x] Modalita reale fail-closed senza identita HA verificata.
- [x] Autosave, callback amministrative, Builder e catalogo protetti dalla capability centrale.
- [x] Layout Demo e Reale usano storage separati.
- [x] Card con sorgente `mock` non possono inviare servizi o API ad HA.
- [x] Stati automatici separati per riconnessione tecnica, offline, nuova autenticazione e disconnessione volontaria.
- [x] Perdita della WebSocket rende immediatamente indisponibile l'identita, blocca comandi/autosave e conserva solo l'ultimo snapshot reale.
- [x] Revoca manuale della sessione verificata: nuovo accesso richiesto, layout preservato e nessun ritorno al setup iniziale.
- [x] Verificare visivamente overlay bloccante e pagina breve di riconnessione dopo una nuova revoca reale.
- [x] Verificare manualmente perdita connessione durante una sessione edit: Edit Mode chiusa, comandi bloccati e riconnessione automatica riuscita.
- [x] Rivalidazione automatica `auth/current_user` ogni 15 secondi e su focus/visibilita, con decadenza fail-closed dei privilegi memorizzati.
- [x] Verificare manualmente cambio ruolo durante una sessione edit: privilegi aggiornati senza refresh, Edit Mode e Builder chiusi entro la finestra di rivalidazione.
- [x] Verificare manualmente Owner su un'istanza HA reale: ruolo Creatore riconosciuto, funzioni amministrative disponibili e layout persistito correttamente.
- [x] Verificare manualmente Admin non Owner su un'istanza HA reale: Edit Mode, Builder, catalogo, riordino, salvataggio layout, gestione stanze, backup e configurazione sicurezza disponibili.
- [x] Verificare manualmente utente limitato su un'istanza HA reale: modifiche, autosave e funzioni amministrative risultano bloccati.
- [x] Ricontrollare visivamente `/rooms` dopo la correzione: aggiunta dispositivi, modifica piani e gestione stanze non devono comparire.

Test: `src/security/dashboardAccess.test.ts`, `src/security/mockSourcePolicy.test.ts`.

## Alarm card e pannello contestuale

Verifica automatica parziale 2026-07-08:

- `src/utils/alarmSecurityPolicy.test.ts`
- `src/services/securityAuth.test.ts`
- `src/components/security/SecurityAuthModal.test.tsx`
- `src/components/widgets/AlarmCard.test.tsx`

- [x] Un PIN diverso da quello HA configurato viene respinto localmente con errore generico e senza inviare il servizio.

- [x] Arm home/away/night/vacation/custom bypass invia il servizio corretto; card e pannello si allineano soltanto allo stato confermato da HA.
- [x] Disarm richiede autenticazione quando configurata.
- [x] Con il solo PIN HA configurato, un codice differente viene bloccato e quello corretto disinserisce l'allarme.
- [x] Se e' configurato il codice extra locale, il popup richiede PIN HA + codice extra.
- [x] Il codice extra locale non viene inviato ad Home Assistant.
- [x] L'autenticazione dispositivo viene provata prima del tastierino.
- [x] Se l'autenticazione dispositivo viene annullata, fallisce o scade, appare il tastierino.
- [x] Il popup non mostra "codice non valido" prima dell'invio.
- [x] Dopo troppi tentativi scatta il rate limit e durante il blocco non viene inviato alcun comando.
- [x] Il bottone SOS compare solo con feature `TRIGGER`, richiede una conferma di pericolo esplicita e non bypassa PIN/codice locale o conferma dispositivo. Copertura automatica; la prova su impianto reale resta da eseguire soltanto in un ambiente sicuro.

## Lock card e pannello contestuale

- [x] Unlock tramite slider richiede autenticazione quando configurata; con `Conferma dispositivo` disattivata apre direttamente il tastierino.
- [x] Un PIN Lock errato viene respinto localmente con errore generico e senza inviare il servizio; il PIN corretto esegue lo sblocco.
- [x] Lock tramite bottone resta rapido, non richiede autenticazione e resta coerente con lo stato confermato dall'entita.
- [ ] Open, se supportato, invia il codice HA solo quando necessario. Prova rinviata: l'entita Lock utilizzata non espone lo scrocco.
- [ ] Il codice lock resta nello storage segreti locale.
- [x] Batteria e connessione vengono mostrate soltanto nel pannello contestuale quando HA espone attributi o entita diagnostiche reali dello stesso dispositivo; la card resta priva di telemetria secondaria.
- [ ] Gli stati `locking`, `unlocking`, `jammed`, `open`, `locked`, `unlocked` restano leggibili.

## Pagina `/security`

- [x] Il PIN autonomo `ha.dashboard.security.alarmPin` viene eliminato e non viene esportato.
- [x] La pagina riutilizza configurazione e segreti della card Alarm corrispondente.
- [x] La pagina non mostra feedback negativo prima dell'invio e usa un errore generico dopo un tentativo fallito.
- [x] Rate limit e fallback al tastierino riusano il motore condiviso di Alarm; la conferma dispositivo ha la precedenza quando configurata.
- [x] Un'entita HA senza codice esegue il comando senza creare un PIN locale autonomo.
- [x] Il codice combinato viene verificato nel client e soltanto il PIN HA viene inviato al servizio.
- [x] La pagina resta fail-closed offline e non simula stati locali in modalita reale.
- [x] Lo stato finale viene mostrato soltanto dopo la conferma ricevuta dagli stati Home Assistant; un comando senza conferma scade con messaggio neutro.
- [x] Le modalita Casa, Fuori, Notte, Vacanza, Bypass e SOS derivano da `supported_features`.

Test: `src/pages/SecurityDashboard.test.jsx`, `src/components/security/SecurityAuthModal.test.tsx`, `src/utils/alarmSecurityPolicy.test.ts`, `tests/security-responsive.spec.cjs`.

## Connessione e contenuti dinamici

- [x] OAuth state monouso, confronto integrale e scadenza a 10 minuti.
- [x] Return URL OAuth limitato allo stesso origin.
- [x] URL HA pericolosi, credenziali incorporate, query/fragment e HTTP pubblico rifiutati.
- [x] Bridge same-origin con schema, request ID e allowlist WebSocket.
- [x] CSP senza `unsafe-eval` e template header stretti documentati.
- [x] Sanitizzatore condiviso per URL dinamici.
- [ ] Smoke test manuale camera, media, mappe, OAuth e WebSocket con gli header di produzione.

Test: `src/security/oauthState.test.ts`, `src/services/haLive.test.ts`, `src/hooks/useHaPanelBridgeConnection.test.ts`, `src/security/safeUrl.test.ts`, `src/security/cspPolicy.test.ts`.

## Gate automatico corrente

Verifica 2026-08-03:

- TypeScript: superato;
- unit test: `548/548` su 142 file;
- build e bundle budget: superati, con warning di peso assegnati al P6;
- audit dipendenze di produzione: zero vulnerabilita e nessuna eccezione attiva;
- Playwright mirato `/security` e coerenza route principali: `6/6` scenari superati, inclusi viewport da 320 a 1024 px e temi light/dark.

### Primo setup panel

- [x] Un iframe nuovo non viene più marcato automaticamente come setup completato.
- [x] Anche nel panel il primo accesso parte sempre da Welcome e scelta Demo/Casa reale.
- [x] La scelta Casa reale mostra il loader di ricerca prima della conferma o del fallback manuale.
- [x] Un token già visibile nel contesto embedded non salta Analisi, Layout e Organizza.
- [x] Il metodo `panel` resta selezionato durante refresh e passaggi successivi.
- [x] Le navigazioni del wizard non abbandonano il documento `/local/.../index.html`.
- [x] Il callback OAuth embedded usa il percorso reale del documento.

### Backup tra browser isolati

- [x] Il backup Demo viene esportato dal primo contesto browser e ripristinato nel secondo.
- [x] Il restore sostituisce soltanto lo spazio Demo e conserva storage estraneo all’app.
- [x] Token OAuth e codici widget iniettati nel browser sorgente non compaiono nel file.
- [x] Il runtime del browser destinazione resta Demo dopo il ripristino.
- [ ] Ripetere manualmente il flusso reale su due dispositivi prima della pubblicazione.

### React Router 8 e audit senza eccezioni

- [x] Runtime minimo Node 22.22.0 verificato dal release gate.
- [x] React e React DOM 19.2.8.
- [x] React Router 8.3.0 senza `react-router-dom`.
- [x] Il progetto usa soltanto la modalita SPA dichiarativa.
- [x] Un contratto automatico vieta API Router Data, Framework e RSC.
- [x] Qualsiasi advisory `moderate`, `high` o `critical` blocca il release gate senza whitelist.
- [x] `GHSA-qwww-vcr4-c8h2` risolto e relativa eccezione rimossa.

Dettagli e criteri di rimozione: `docs/security-audit-exceptions.md`.

Il gate automatico non sostituisce le prove con utenti, permessi, codici e dispositivi Home Assistant reali elencate sopra.

## Comunicazione beta

- [x] UI connessione HA avvisa che il token manuale, se ricordato, vive nel browser.
- [x] UI Alarm/Lock distingue memoria temporanea e persistenza locale esplicita non protetta da vault.
- [x] README dichiara che la beta non e' un sistema di sicurezza certificato.
- [x] README consiglia l'integrazione HACS con panel same-origin per evitare token nel browser.

## Limiti dichiarati

Il rate limit e il registro attivita locali sono protezioni UX modificabili dal proprietario del browser. Non costituiscono una barriera server-side o un audit immutabile. Queste garanzie richiedono una futura integrazione/backend Home Assistant.
