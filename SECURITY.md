# Sicurezza di Domus UI

Domus UI è in beta pubblica. Non è un sistema di allarme, sicurezza o safety certificato e Home Assistant resta l'autorità finale per identità, permessi e comandi.

## Versioni supportate

Le correzioni di sicurezza vengono applicate esclusivamente all'ultima release beta pubblicata. Prima di segnalare un problema, verifica che sia ancora riproducibile sulla versione più recente.

## Segnalare una vulnerabilità

Non aprire una issue pubblica per vulnerabilità, token, PIN, URL privati o dati della casa.

Usa **Security → Report a vulnerability** nel repository GitHub. Includi:

- versione Domus UI e Home Assistant;
- metodo di installazione;
- impatto e prerequisiti;
- passaggi minimi per riprodurre il problema;
- eventuale proposta di correzione;
- log già ripuliti da token, PIN, indirizzi, nomi e identificativi.

Cercheremo di confermare la ricezione entro 72 ore e comunicheremo in privato stato, correzione e pubblicazione coordinata. Non possiamo garantire ricompense economiche.

## Ambito

Sono particolarmente rilevanti:

- bypass di ruoli o capability Home Assistant;
- esposizione di token, PIN, passkey o dati sensibili;
- esecuzione di comandi senza conferma o autorizzazione;
- injection, XSS, URL o messaggi panel bridge non validati;
- contaminazione tra Demo e casa reale;
- segreti inclusi in backup, sincronizzazione o diagnostica.

Rate limit e audit locali al browser sono protezioni UX e non controlli server immutabili. Consulta [Sicurezza e privacy](docs/security-and-privacy.md) per il modello di sicurezza completo.
