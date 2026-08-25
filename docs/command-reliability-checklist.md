# P4 - Checklist affidabilita comandi

Ultimo aggiornamento: 2026-07-22.

Questa checklist verifica che la dashboard non mostri come riuscito un comando che Home Assistant non ha confermato.

## Connessione

- [x] Durante `offline`, `reconnecting` e `reauth_required` nessun comando viene inviato. Verificato scollegando fisicamente Ethernet il 2026-07-22.
- [x] Se la connessione cade durante un comando, l'anteprima ottimistica viene rimossa. Verificato su HA reale il 2026-07-22.
- [x] Dopo la riconnessione la UI riparte dallo stato HA, non dall'ultimo valore locale. Verificato su HA reale il 2026-07-22.

## Light e Climate

- [x] Trascinare rapidamente la luminosita: soltanto l'ultimo valore resta visibile e viene confermato. Verificato su card e pannello HA reale il 2026-07-22.
- [x] Cambiare rapidamente colore o temperatura colore: una conferma precedente non sovrascrive l'ultima scelta. Colore RGB verificato su HA reale il 2026-07-22.
- [ ] Modificare temperatura, range, umidita, ventola, preset e oscillazione Climate.
  - [x] Temperatura target verificata da card e pannello su HA reale il 2026-07-22; supportati anche gli alias di setpoint dell'integrazione provata.
  - [ ] Range temperatura e umidita target, se supportati. Rinviato: entita Climate di collaudo non funzionante.
  - [ ] Modalita HVAC, ventola, preset e oscillazione, se supportati. Rinviato: entita Climate di collaudo non funzionante.
- [ ] Rifiuto del servizio o timeout ripristinano il valore HA senza lasciare un falso successo; il timeout del setpoint Climate resta silenzioso per non generare notifiche invasive.

## Cover, Alarm e Lock

- [ ] Inviare `Apri`, poi subito `Chiudi`: il comando piu recente sostituisce quello precedente.
- [ ] Verificare posizione e lamelle con una cover che espone gli attributi reali.
- Test Cover rinviati: nessuna entita reale disponibile nell'impianto di collaudo.
- [ ] Alarm e Lock cambiano stato soltanto dopo la conferma finale HA.
- [ ] Una perdita di connessione non lascia stati `arming`, `unlocking` o `opening` bloccati.

## Media Player

- [x] Play/Pausa, Stop e Power attendono il nuovo stato HA. Verificato su HA reale il 2026-07-22.
- [x] Volume, mute, shuffle, repeat, sorgente, modalita audio e seek attendono il relativo attributo. Funzioni supportate verificate su HA reale il 2026-07-22.
- [x] Traccia precedente/successiva e pulizia playlist terminano sulla risposta positiva del servizio. Funzioni supportate verificate su HA reale il 2026-07-22.
- [x] Join/Unjoin verificano `group_members` quando disponibile. Verificato quando esposto dal dispositivo il 2026-07-22.
- [x] Il bordo di attesa compare soltanto durante `sending` o `awaiting_confirmation`. Verificato il 2026-07-22.

## Switch

- [x] Accensione e spegnimento da card, pannello e Home Assistant restano sincronizzati. Verificato su HA reale il 2026-07-22.
- [x] In Edit Mode i controlli non inviano comandi. Coperto dal contratto automatico e verificato nel collaudo della dashboard.

## Vacuum e controlli secondari

- [ ] Start, Pausa, Stop, Rientro, pulizia spot/area e potenza attendono lo stato o attributo HA.
- [ ] `Locate` e comandi proprietari terminano sulla risposta positiva del servizio.
- Test Vacuum rinviati: nessuna entita reale disponibile nell'impianto di collaudo.
- [ ] PTZ e flash luce non inventano uno stato: usano la risposta del servizio.
- [ ] I controlli correlati Select/Number/Toggle attendono il nuovo valore HA.
- [ ] Lo sblocco Lock da un micro-controllo generico resta bloccato e rimanda alla card protetta.

## Esito richiesto

Il nucleo P4 e collaudato su HA reale per Light, Switch, Media Player e perdita intenzionale della connessione. Climate avanzato, Cover e Vacuum restano nella matrice hardware rinviata e dovranno essere verificati quando saranno disponibili entita reali compatibili.
