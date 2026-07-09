# Security beta checklist

Aggiornata: 2026-07-08

Obiettivo: verificare manualmente i flussi sensibili prima di distribuire la beta. Questa checklist non rende la dashboard un sistema di sicurezza certificato; serve a evitare falle evidenti nella UX, nello storage locale e nei backup.

## Storage e backup

- [x] Backup JSON non contiene `hass_auth_tokens`.
- [x] Backup JSON non contiene token manuali Home Assistant.
- [x] Backup JSON non contiene `alarmUnlockCode`, `alarmLocalExtraCode` o `lockCode`.
- [x] Backup JSON non contiene `ha.dashboard.secrets.widgetCodes.v1`.
- [x] Restore di un backup vecchio/sporco non ripristina token, passkey, PIN locali o codici widget.
- [x] Condivisione configurazione/ruolo non contiene token, passkey, PIN locali o codici widget.
- [x] Reset totale rimuove anche token, codici locali e credential locali.

Verifica automatica 2026-07-08:

- `src/services/configBackup.test.ts`
- `src/services/haUserConfigSync.test.ts`
- `src/services/dashboardStorage.test.ts`

## Alarm card e pannello contestuale

Verifica automatica parziale 2026-07-08:

- `src/utils/alarmSecurityPolicy.test.ts`
- `src/services/securityAuth.test.ts`
- `src/components/security/SecurityAuthModal.test.tsx`
- `src/components/widgets/AlarmCard.test.tsx`

- [ ] Arm home/away/night/vacation/custom bypass invia il servizio corretto.
- [ ] Disarm richiede autenticazione quando configurata.
- [ ] Se Home Assistant richiede codice, viene inviato solo il PIN HA.
- [ ] Se e' configurato il codice extra locale, il popup richiede PIN HA + codice extra.
- [ ] Il codice extra locale non viene inviato ad Home Assistant.
- [ ] L'autenticazione dispositivo viene provata prima del tastierino.
- [ ] Se l'autenticazione dispositivo fallisce, appare il tastierino.
- [ ] Il popup non mostra "codice non valido" prima dell'invio.
- [ ] Dopo troppi tentativi scatta il rate limit.
- [ ] Il bottone SOS non bypassa i controlli richiesti dal flusso.

## Lock card e pannello contestuale

- [ ] Unlock tramite slider richiede autenticazione quando configurata.
- [ ] Lock tramite bottone resta rapido e coerente con lo stato dell'entita.
- [ ] Open, se supportato, invia il codice HA solo quando necessario.
- [ ] Il codice lock resta nello storage segreti locale.
- [ ] La batteria viene mostrata nel pannello contestuale solo se disponibile; altrimenti appare `ND`.
- [ ] Gli stati `locking`, `unlocking`, `jammed`, `open`, `locked`, `unlocked` restano leggibili.

## Pagina legacy `/security`

- [ ] Verificare che il PIN locale `ha.dashboard.security.alarmPin` non venga esportato.
- [ ] Verificare che la pagina non mostri se un codice e' errato prima dell'invio.
- [ ] Verificare rate limit e fallback tastierino.
- [ ] Verificare che il PIN locale vuoto blocchi il fallback invece di accettare azioni.
- [ ] Decidere prima della beta se la pagina legacy resta visibile o se viene nascosta dietro flag/route secondaria.

## Comunicazione beta

- [ ] UI connessione HA avvisa che il token manuale, se ricordato, vive nel browser.
- [ ] UI Alarm/Lock avvisa che i codici restano solo nello storage segreti locale.
- [ ] Landing/README dichiarano che la beta non e' un sistema di sicurezza certificato.
- [ ] Landing/README consigliano `panel_custom`/bridge HA appena disponibile per evitare token nel browser.
