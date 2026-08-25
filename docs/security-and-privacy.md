# Sicurezza e privacy

Aggiornata: 2026-08-03

DomusOS è un’interfaccia client per Home Assistant. Non è un sistema di allarme certificato, non sostituisce Home Assistant e non costituisce una barriera server-side autonoma.

## Autorità e permessi

- Home Assistant determina identità, ruolo e autorizzazione finale dei comandi.
- Owner e Admin possono modificare la struttura della dashboard.
- Gli utenti limitati possono usare soltanto le funzioni consentite dalla policy centrale e da Home Assistant.
- Se identità o connessione non sono verificabili, la modalità reale passa in sola lettura e blocca comandi e autosave.

## Dati nel browser

Il layout, le preferenze e parte della configurazione vivono nello storage locale del browser. Demo e casa reale usano spazi separati.

PIN e codici Alarm/Lock:

- restano in memoria per impostazione predefinita;
- possono essere ricordati sul dispositivo soltanto con consenso esplicito;
- non sono protetti da un vault certificato;
- non vengono inclusi in backup, sync, log o diagnostica.

La conferma dispositivo WebAuthn è una conferma locale di presenza. Non è un secondo fattore server Home Assistant.

## Comandi Alarm e pagina Security

Card Alarm, pannello contestuale e `/security` condividono la stessa policy. Quando configurata, la conferma dispositivo viene tentata prima del tastierino; un annullamento o un timeout non autorizzano il comando. Se è presente un codice extra locale, il browser verifica la combinazione ma invia a Home Assistant esclusivamente il PIN HA.

La pagina `/security` mostra soltanto le modalità dichiarate da `supported_features`. In modalità reale offline i comandi sono bloccati e nessuno stato viene simulato localmente. Dopo l'invio, il nuovo stato è presentato come confermato soltanto quando compare negli stati Home Assistant. Il comando SOS compare solo per entità che supportano `alarm_trigger`, richiede una conferma di pericolo esplicita e attraversa lo stesso gate di autenticazione degli altri comandi.

## Token

- l'integrazione HACS registra un panel same-origin che riusa la sessione HA già autenticata;
- OAuth usa token revocabili e non inserisce password HA nella dashboard;
- il token manuale resta solo un percorso avanzato interno e, se ricordato, deve essere considerato sensibile;
- token OAuth e manuali sono esclusi da backup e diagnostica.

## Backup

Il backup include configurazione e preferenze ripristinabili, ma esclude:

- token OAuth e manuali;
- PIN e codici widget;
- credential/passkey locali;
- snapshot di recupero dell’editor;
- stato runtime Demo/Reale.

Un restore sanitizza anche backup legacy o manipolati prima di scrivere nello storage.

## Contenuti dinamici

URL di immagini, media, iframe e server HA passano attraverso validazione condivisa. La build applica una Content Security Policy senza `unsafe-eval`; gli header del server di produzione devono mantenere una policy equivalente.

Camera, media e mappe possono comunque mostrare dati personali provenienti dalla casa. La beta non invia telemetria di prodotto per impostazione predefinita.

## Diagnostica per il supporto

Il report viene creato soltanto quando l’utente seleziona `Scarica diagnostica`. Contiene versione applicativa, modalità runtime, stato della connessione, dimensioni del viewport e conteggi aggregati di entità, domini, dispositivi, stanze, card e Device Health.

Il generatore non legge il `localStorage` e non esporta:

- URL o token Home Assistant;
- PIN, codici o credential WebAuthn;
- identificativi, nomi o valori delle entità;
- nomi di dispositivi, persone o stanze;
- coordinate, immagini o contenuti multimediali;
- messaggi completi di errore.

## Limiti noti

- rate limit e audit locali possono essere aggirati da chi controlla il browser;
- una persona con accesso fisico a un browser sbloccato può leggere configurazioni locali;
- la sicurezza reale di Alarm e Lock dipende dall’entità, dall’integrazione e dai permessi configurati in Home Assistant;
- un audit immutabile o un rate limit realmente protettivo richiedono un futuro backend/integration HA.

## Segnalare un problema

Non allegare token, PIN, backup non verificati o dump completi di `localStorage`.

Fornisci:

- il report creato da `Impostazioni > Avanzate > Scarica diagnostica`;
- versione dell’app;
- metodo di installazione;
- versione Home Assistant;
- browser e sistema operativo;
- passaggi riproducibili;
- messaggi della console dopo aver rimosso dati personali.
