# Registro delle eccezioni all'audit di sicurezza

Aggiornata: 2026-07-27

Non sono presenti eccezioni attive. Il release gate fallisce per ogni
vulnerabilita `moderate`, `high` o `critical`.

## GHSA-qwww-vcr4-c8h2 - React Router RSC Mode CSRF

- Stato: **risolta e rimossa il 2026-07-27**.
- React Router aggiornato a 8.3.0.
- `react-router-dom` rimosso.
- React e React DOM aggiornati a 19.2.8.
- Runtime minimo fissato a Node 22.22.0 nel progetto e nella CI.
- Import dichiarativi migrati a `react-router`.
- Il contratto automatico continua a vietare API Data/Framework/RSC.
- La policy audit non contiene piu whitelist o scadenze speciali.
- TypeScript, test unitari, build, budget, audit ed E2E sono stati eseguiti con
  Node 22.22.0.

Riferimento: https://github.com/advisories/GHSA-qwww-vcr4-c8h2
