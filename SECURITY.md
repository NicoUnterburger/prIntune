# Security Policy

## Unterstützte Versionen

Es wird jeweils die neueste Version auf `main` gepflegt.

## Eine Schwachstelle melden

Bitte **keine** öffentlichen GitHub-Issues für Sicherheitsprobleme anlegen.

Melde Schwachstellen stattdessen über die
[GitHub Security Advisories](https://github.com/NicoUnterburger/prIntune/security/advisories/new)
(privat) oder per E-Mail an den Maintainer.

Bitte gib nach Möglichkeit an:

- betroffene Komponente (Backend/Frontend) und Version/Commit
- Beschreibung und Auswirkung
- Schritte zur Reproduktion (Proof of Concept)

Du bekommst zeitnah eine Rückmeldung. Bitte gib angemessene Zeit für einen Fix,
bevor Details öffentlich gemacht werden (Responsible Disclosure).

## Betriebshinweis

prIntune bringt **keine Authentifizierung** mit. Die Anwendung ist für den Betrieb in einem
vertrauenswürdigen, internen Netz bzw. hinter einem authentifizierenden Reverse-Proxy gedacht.
Das Backend sollte nicht ungeschützt aus dem Internet erreichbar sein.
