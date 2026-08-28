# Stato delle funzionalità

Aggiornato: 2026-08-25

Questa pagina distingue ciò che è utilizzabile nella beta dalle funzioni in anteprima. “Operativa” indica che il percorso principale è implementato e coperto dai test del progetto; non garantisce la compatibilità con ogni integrazione hardware Home Assistant.

## Pagine

| Pagina | Stato | Esperienza esposta |
| --- | --- | --- |
| Home | Operativa beta | Dashboard, card, pannelli contestuali, builder, stack, versioni e layout condiviso |
| Stanze | Operativa beta | Esplorazione per piano/stanza e controllo delle entità consentite da HA |
| Sicurezza | Operativa beta | Hub Alarm, camere, sensori selezionabili e autorizzazione condivisa |
| Consumi | Operativa beta | Visualizzazioni basate sui dati realmente disponibili in HA |
| Profilo | Operativa beta | Preferenze personali e tema del dispositivo |
| Impostazioni | Operativa beta | Casa, entità, persone, sistema, backup, versioni e attenzione |
| App Gallery | Parziale | Launcher e Irrigazione beta disponibili; Locale Tecnico e Piscina & Spa mostrano uno stato “Prossimamente” |
| Automazioni | Prossimamente | Il vecchio workspace resta disattivato finché il flusso non sarà pronto per la beta |

## Card e controlli

| Famiglia | Stato | Limiti da comunicare |
| --- | --- | --- |
| Sensor, Light, Switch | Verificata | Percorsi principali testati anche con entità reali |
| Alarm, Lock | Verificata con limiti | L'autorizzazione finale resta di HA; la beta non è un sistema certificato |
| Camera, Media Player | Operativa beta | Funzioni avanzate dipendono dalle feature dichiarate dall'entità/dispositivo |
| Climate, Cover, Vacuum | Operativa, hardware parziale | Non tutte le combinazioni sono state collaudate su hardware reale |
| Members | Operativa beta | Dipende dalle entità persona/device tracker disponibili |

## Pianificato dopo la beta

- Calendar e relativa card;
- mappa e gestione della posizione;
- lista spesa/Todo;
- plance Locale Tecnico e Piscina & Spa;
- nuovo Costruttore Automazioni;
- sincronizzazione layout mobile progettata da desktop;
- notifiche evolute e snackbar contestuali;
- condivisione configurazione via QR code;
- app ufficiale.

Le pagine o plance non pronte devono usare `FeatureAvailabilityPage`: nessuna funzione incompleta va presentata come operativa o lasciata in uno stato ambiguo.
