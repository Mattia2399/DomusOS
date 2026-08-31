# Aggiornamento e rollback

Aggiornata: 2026-08-25

## Prima di aggiornare

1. Scarica un backup della dashboard da Domus UI.
2. Crea un backup Home Assistant.
3. Leggi il `CHANGELOG.md` della nuova release.
4. Verifica che la release GitHub contenga `domusos.zip` e `SHA256SUMS`.
5. Ricorda che backup e sync non contengono token, PIN, codici o passkey.

## Aggiornamento tramite HACS

1. Apri HACS e seleziona Domus UI.
2. Installa la release proposta.
3. Riavvia Home Assistant quando richiesto.
4. Fai un hard refresh del browser o riapri completamente l'app HA.
5. Verifica la versione in Impostazioni e controlla Home, Stanze e Sicurezza.

HACS aggiorna insieme integrazione, bridge e frontend. Non sovrascrivere manualmente singoli file: un mix tra release può produrre una pagina nera o protocolli non compatibili.

## Verifica post-aggiornamento

- apertura del panel e completamento del caricamento;
- connessione e ruolo HA corretti;
- layout invariato su desktop, tablet e mobile;
- navigazione Home/Stanze;
- modifica e salvataggio di una card non critica;
- comando Light o Switch;
- download di un nuovo backup;
- assenza di errori bloccanti nella console e nei log Home Assistant.

## Rollback dell'integrazione

1. In HACS apri Domus UI.
2. Dal menu di download seleziona una release precedente tra quelle disponibili.
3. Reinstalla e riavvia Home Assistant.
4. Ricarica completamente il browser.
5. Se la nuova versione aveva modificato la configurazione condivisa, usa una versione layout o il backup creato prima dell'aggiornamento.

Il rollback HACS e il ripristino del layout sono operazioni diverse: il primo cambia il codice, il secondo cambia la configurazione della dashboard.

## Ripristino di emergenza

Se Domus UI non si apre:

- usa la dashboard standard Home Assistant;
- disabilita o rimuovi temporaneamente l'integrazione Domus UI;
- reinstalla da HACS una release nota e riavvia HA;
- conserva versione installata, browser, sistema operativo e messaggi `domusos` dei log;
- non condividere token, PIN o file di storage completi nei ticket.
