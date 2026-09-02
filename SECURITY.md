# Domus UI security policy

Domus UI is in public beta. It is not a certified alarm, security, or safety system, and Home Assistant remains the final authority for identity, permissions, and commands.

## Supported versions

Security fixes are applied only to the latest public beta release. Before reporting a problem, confirm that it is still reproducible on the latest version.

## Reporting a vulnerability

Do not open a public issue for vulnerabilities, tokens, PINs, private URLs, or household data.

Use **Security -> Report a vulnerability** in this GitHub repository. Include:

- the Domus UI and Home Assistant versions;
- the installation method;
- impact and prerequisites;
- the minimum steps needed to reproduce the issue;
- a suggested fix, if available;
- logs already stripped of tokens, PINs, addresses, names, and identifiers.

We aim to acknowledge reports within 72 hours and will coordinate status, remediation, and disclosure privately. We cannot guarantee financial rewards.

## Scope

Reports are especially relevant when they involve:

- bypassing Home Assistant roles or capabilities;
- exposure of tokens, PINs, passkeys, or sensitive data;
- commands executed without confirmation or authorization;
- injection, XSS, unsafe URLs, or unvalidated panel-bridge messages;
- contamination between Demo mode and a real home;
- secrets included in backups, synchronization, or diagnostics.

Browser-local rate limits and audit records are UX safeguards, not immutable server-side controls. See [Security and privacy](docs/security-and-privacy.md) for the complete security model.
