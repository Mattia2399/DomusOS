# Header di sicurezza per la produzione

La policy nel file `index.html` è il fallback di sviluppo. Durante `vite build` viene sostituita con una policy stretta. Per un’installazione esterna, dichiarare gli origin realmente necessari separati da virgola:

```text
VITE_CSP_ALLOWED_ORIGINS=https://ha.example.test,https://tiles.example.test
```

Senza questa variabile, la build consente connessioni soltanto same-origin. Il server dovrebbe comunque inviare l’header seguente, perché `frame-ancestors` non è applicabile tramite `<meta>`.

## Panel Home Assistant (consigliato)

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' ws: wss:; worker-src 'self' blob:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; frame-src 'self'; manifest-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=(self), publickey-credentials-get=(self)
```

## Installazione esterna OAuth

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://HA_ORIGIN; media-src 'self' blob: https://HA_ORIGIN; connect-src 'self' https://HA_ORIGIN wss://HA_ORIGIN; worker-src 'self' blob:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src 'self'; manifest-src 'self'
```

Se vengono usati mappe, CDN o stream su origin distinti, aggiungerli singolarmente alle direttive necessarie. Non usare wildcard o `unsafe-eval`. `frame-ancestors` deve essere inviato come header HTTP: nei tag `<meta>` non è applicabile.
