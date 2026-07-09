# Beta roadmap e go-to-market

Aggiornata: 2026-07-08

Obiettivo: arrivare a una beta vendibile di HA Dashboard Builder senza inseguire tutte le card subito. La priorita e' distribuire un nucleo stabile, bello e sicuro, raccogliere feedback reali e iniziare a validare il prezzo.

## Posizionamento beta

HA Dashboard Builder e' una dashboard premium per Home Assistant pensata per utenti che vogliono:

- una UI piu' curata delle dashboard standard;
- card responsive e configurabili;
- controlli rapidi per dispositivi reali;
- un builder visivo senza scrivere YAML;
- un'esperienza stile app nativa su desktop, tablet e mobile.

La prima beta non deve promettere "supporto perfetto per tutto". Deve promettere un'esperienza premium su un set forte e chiaro di card.

## Stato tecnico attuale

### Core gia' ristrutturato

| Area | Stato | Note |
| --- | --- | --- |
| Sensor | Buono per beta | Card dinamica, varianti, skeleton, pannello contestuale evoluto. |
| Light | Buono per beta | Card riscritta, slider/picker, auto-expand, varianti. |
| Switch | Buono per beta | Card separata, consumi, varianti. |
| Climate | Buono per beta | Overlay modalita, controlli supportati, skeleton. |
| Alarm | Buono ma security-critical | Card e pannello molto avanzati; richiede test manuale accurato. |
| Lock | Buono ma security-critical | Card premium, slider/button, batteria, pannello aggiornato. |
| Grid/layout | Quasi beta | Struttura responsive buona; serve pipeline test pulita. |

### Card ancora fuori dal nuovo standard

| Area | Priorita | Motivo |
| --- | --- | --- |
| Cover | Alta dopo beta base | Simile a Lock/Climate; molto utile in smart home. |
| Media | Media-alta | Alto valore percepito, ma complessa. |
| Camera | Media-alta | Molto vendibile, ma impatta privacy e performance. |
| Vacuum | Media | Bella feature, meno universale. |
| Weather | Media | Utile, ma non blocca la monetizzazione iniziale. |
| Scenes | Media | Importante per UX, puo' restare semplice nella beta. |
| Members | Bassa-media | Valore interessante ma non core per la prima vendita. |
| Greeting/GreetingWeather | Bassa-media | Rifinitura emozionale, non blocco beta. |

## Gate obbligatori prima della beta

Questi sono non negoziabili.

### G1 - Pipeline verde

Stato: completato il 2026-07-08.

Done quando:

- `npm run check` passa;
- `npm run build` passa;
- `npm run test:unit` passa;
- la spec Playwright non viene piu' eseguita da Vitest;
- `npm audit --omit=dev` non segnala vulnerabilita high.

Azioni:

- separare test unitari e test e2e:
  - `test:unit`: Vitest solo su `src/**/*.test.*`;
  - `test:e2e`: Playwright per `tests/*.spec.cjs`;
  - `test`: comando aggregato o solo unit, a seconda della CI.
- aggiornare dipendenze vulnerabili;
- valutare se installare/configurare Playwright ufficialmente o spostare la spec fuori dal comando standard.

Verifica 2026-07-08:

- `npm run test:unit`: 89 test passati;
- `npm run test:e2e`: 1 spec Playwright passata;
- `npm run check`: passato;
- `npm run build`: passato, con warning chunk grandi gia' noto;
- `npm run audit:release`: passato con soglia moderate; resta 1 advisory low su `esbuild` collegata al dev server Windows.

### G2 - Security hardening minimo

Stato: in corso.

Done quando:

- export/backup/sync continuano a rimuovere token, PIN e codici;
- i flussi Alarm/Lock sono testati manualmente;
- nessuna UI rivela se un codice e' errato prima dell'invio;
- rate limit/fallback auth sono verificati;
- `/grid-test` non e' disponibile nella build pubblica;
- i token salvati in browser hanno un warning chiaro;
- i codici lock/alarm sono gestiti con testo esplicativo e non vengono esportati.

Note:

- Il browser non e' un vault. Se salviamo token Home Assistant, dobbiamo comunicarlo chiaramente.
- La modalita migliore, in futuro, e' il panel bridge dentro Home Assistant, per usare la sessione HA del parent invece di salvare token dentro l'app iframe.

Avanzamento 2026-07-08:

- `/grid-test` e' stato reso disponibile solo in dev tramite lazy route condizionata da `import.meta.env.DEV`.
- creata checklist manuale security: `docs/security-beta-checklist.md`.
- i codici Alarm/Lock sono stati separati dal layout persistito e spostati nello storage segreti locale `ha.dashboard.secrets.widgetCodes.v1`, escluso da backup e sync.

### G3 - Scope beta chiaro

Done quando:

- landing page e README dichiarano chiaramente cosa e' supportato nella beta;
- le card core sono elencate come "beta ready";
- le card legacy/non rifatte non sono promesse come feature principali;
- esiste un canale feedback.

## Roadmap operativa

### Fase 0 - Freeze e baseline

Tempo stimato: 0.5-1 giorno.

Azioni:

- creare branch `release/beta-0.1`;
- committare lo stato attuale;
- aggiungere questo documento al README;
- separare script unit/e2e;
- verificare `check`, `test:unit`, `build`.

Output:

- base pulita e recuperabile;
- lista problemi reale, non mentale.

### Fase 1 - Sicurezza e affidabilita

Tempo stimato: 2-3 giorni.

Azioni:

- aggiornare dipendenze vulnerabili;
- rimuovere console log non necessari;
- rimuovere/proteggere route di test in produzione;
- verificare CSP possibile per la build;
- test manuale Alarm/Lock:
  - arm/disarm;
  - lock/unlock;
  - PIN corretto;
  - PIN errato;
  - biometria disponibile;
  - biometria non disponibile;
  - fallback tastierino;
  - troppi tentativi.

Output:

- beta difendibile sul lato security.

### Fase 2 - Beta vendibile

Tempo stimato: 3-5 giorni.

Azioni:

- rifinire README installazione manuale;
- preparare pagina "Security & privacy";
- preparare landing page;
- preparare changelog `0.1.0-beta`;
- preparare pacchetto build scaricabile;
- definire pricing early access;
- aprire lista early adopters.

Output:

- prime vendite/test paganti.

### Fase 3 - Installazione Home Assistant piu' comoda

Tempo stimato: 3-7 giorni, a seconda del formato scelto.

Opzioni:

1. Static web app esterna
   - Piu' veloce.
   - Utente apre la dashboard come web app.
   - Connessione via OAuth o token.
   - Buona per beta rapida.

2. File statici serviti da Home Assistant `/local`
   - Utente copia la build in `www`.
   - Si puo' usare come iframe/panel.
   - Installazione manuale, ma vicina al contesto HA.

3. `panel_custom` con iframe bridge
   - Migliore per esperienza nativa.
   - Permette di sfruttare la sessione HA del parent.
   - Gia' documentato in `docs/home-assistant-panel-bridge.md`.

4. HACS custom repository
   - Ottimo step successivo.
   - Richiede repository pubblico, release e conformita HACS.
   - Prima usabile come custom repository; poi eventuale inclusione default.

5. Add-on Home Assistant
   - Utile se serve backend, proxy, licenze server-side o storage piu' sicuro.
   - Piu' complesso; non lo farei come primo canale beta.

Scelta consigliata:

- Beta 0.1: static web app + installazione manuale `/local`.
- Beta 0.2: `panel_custom` documentato bene.
- Beta 0.3: HACS custom repository.
- Post-beta: valutare add-on solo se serve davvero.

### Fase 4 - Card successive

Ordine consigliato:

1. Cover
2. Media
3. Camera
4. Vacuum
5. Weather
6. Scenes
7. Members
8. Greeting/GreetingWeather

Regola: ogni card nuova deve seguire il modello delle ultime card:

- modello dati separato;
- view separata;
- CSS dedicato;
- varianti pixel-aware;
- skeleton nel pannello config;
- test minimi;
- pannello contestuale coerente.

## Strategia vendita mini

### Obiettivo iniziale

Non cercare subito "il grande lancio". Cercare 20-50 early adopters paganti che:

- usano Home Assistant davvero;
- hanno dashboard custom;
- sono disposti a tollerare una beta se vedono valore;
- danno feedback concreto.

### Offerta beta consigliata

Opzione semplice:

- Early Access Lifetime: 29-49 euro una tantum;
- include beta + aggiornamenti fino alla 1.0;
- prezzo piu' basso per i primi utenti;
- disclaimer chiaro: beta, non sistema certificato di sicurezza.

Opzione piu' sostenibile:

- Early Access: 29 euro;
- Pro annuale dopo 1.0: 39-59 euro/anno;
- chi entra ora mantiene prezzo/founder discount.

Per partire veloce, userei una tantum. Le subscription le valuterei dopo che abbiamo utenti reali.

### Canali iniziali

- Home Assistant Community forum;
- Reddit `r/homeassistant`;
- gruppi Telegram/Discord italiani smart home;
- X/Twitter con video brevi;
- YouTube Shorts/TikTok demo UI;
- contatti diretti a creator smart home;
- piccoli post "build in public".

### Messaggio da testare

Titolo:

> Una dashboard Home Assistant premium, responsive e configurabile senza YAML.

Promessa:

- bella da vedere;
- comoda da modificare;
- pronta per desktop/tablet/mobile;
- integrata con Home Assistant;
- beta focalizzata su Sensor, Light, Switch, Climate, Alarm e Lock.

Non promettere:

- sicurezza certificata;
- supporto perfetto per ogni integrazione;
- installazione one-click se non e' ancora pronta.

## Landing page

Si, una landing page e' utile. Non serve enorme, serve precisa.

Scopo della landing:

- spiegare il valore in 20 secondi;
- mostrare video/gif della dashboard;
- raccogliere email;
- vendere early access;
- chiarire lo stato beta;
- spiegare installazione disponibile ora e installazioni in arrivo.

Struttura consigliata:

1. Hero
   - claim;
   - screenshot/video;
   - CTA: "Entra nella beta" / "Acquista early access".

2. Problema
   - dashboard HA potenti ma spesso lente da configurare o poco premium.

3. Soluzione
   - builder visivo;
   - card responsive;
   - pannelli contestuali;
   - integrazione HA.

4. Card supportate
   - Sensor, Light, Switch, Climate, Alarm, Lock.

5. Sicurezza e privacy
   - app beta;
   - dati nel browser;
   - export senza segreti;
   - raccomandazione panel bridge quando disponibile.

6. Installazione
   - attuale: web app/manuale;
   - prossima: panel custom;
   - futura: HACS/add-on.

7. Pricing beta
   - prezzo early access;
   - numero limitato di slot;
   - cosa include.

8. Roadmap trasparente
   - cosa c'e' ora;
   - cosa arriva dopo.

9. FAQ
   - serve Home Assistant?
   - funziona su mobile?
   - serve YAML?
   - e' sicura?
   - posso avere rimborso?

### Pagamento

Per partire:

- Stripe Payment Links: veloce, anche senza checkout custom.
- Lemon Squeezy: interessante se vuoi merchant of record, tasse/VAT e licenze digitali integrate.

Scelta consigliata:

- Se vuoi massima velocita: Stripe Payment Links.
- Se vuoi licenze e gestione fiscale piu' "creator/software": Lemon Squeezy.

## Riferimenti utili

- Home Assistant `panel_custom`: https://www.home-assistant.io/integrations/panel_custom/
- Home Assistant custom panels developer docs: https://developers.home-assistant.io/docs/frontend/custom-ui/creating-custom-panels/
- HACS custom repositories: https://www.hacs.xyz/docs/faq/custom_repositories/
- HACS publish requirements: https://www.hacs.xyz/docs/publish/start/
- Stripe Payment Links: https://docs.stripe.com/payment-links
- Lemon Squeezy licensing: https://docs.lemonsqueezy.com/help/licensing

## Prossimo punto da eseguire

Partire da G2 / Fase 1:

1. verificare export/backup/sync senza token, PIN e codici;
2. eseguire la checklist `docs/security-beta-checklist.md`;
3. pulire eventuali console log non necessari;
4. preparare pagina/note "Security & privacy" per beta.


