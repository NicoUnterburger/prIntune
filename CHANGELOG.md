# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
die Versionierung an [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Added

- Docker-Setup: `docker-compose.yml`, Dockerfiles für Frontend/Backend, Doku (`DOCKER.md`).
- READMEs für Backend und Frontend mit Beschreibung der Bestandteile.
- Löschen von Treiberpaketen über das Frontend (`DELETE /api/drivers/:id`).
- Footer mit Copyright und GitHub-Link.
- Health-Check-Endpoint `GET /healthz` inkl. Docker-Healthchecks.
- Konfiguration über Umgebungsvariablen (`.env.example`): Port, CORS, Upload-Limit,
  Rate-Limit, Log-Level.
- Strukturiertes JSON-Logging und zentraler Express-Error-Handler.
- Unit-Tests für den INF-Parser und die ID-Validierung (Node-Test-Runner).
- CI-Workflow (Lint, Test, Build, Docker-Build).
- Linting/Formatierung mit ESLint und Prettier.
- Community-Dateien: `LICENSE` (MIT), `CONTRIBUTING.md`, `SECURITY.md`, Issue-/PR-Templates,
  Dependabot.

### Security

- Schutz vor Path-Traversal: `:id`-Parameter werden als UUID validiert.
- Schutz vor Zip-Slip beim Entpacken hochgeladener Treiberpakete.
- Upload-Größenlimit, Dateityp-Filter (`.zip`), Rate-Limiting und `helmet`-Header.
- Container laufen als non-root.

## [1.0.0]

### Added

- Erste Version: Treiberpaket-Upload, INF-Parsing, Paket-Generierung inkl. Install-/Remove-
  Skripten und Intune-Metadaten, Verlauf mit Download.
