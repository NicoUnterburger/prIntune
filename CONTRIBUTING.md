# Contributing to prIntune

Danke, dass du beitragen möchtest! Ein paar kurze Hinweise.

## Entwicklungsumgebung

Voraussetzungen: **Node.js ≥ 20** und npm. Für den Container-Weg: Docker mit Compose v2.

```bash
# Backend (Port 3001)
cd backend && npm install && npm run dev

# Frontend (Port 5173, proxied auf das Backend)
cd frontend && npm install && npm run dev
```

## Vor einem Pull Request

Bitte lokal grün bekommen, was auch die CI prüft:

```bash
# Backend
cd backend && npm run lint && npm test

# Frontend
cd frontend && npm run lint && npm run build
```

## Konventionen

- **Sprache im Code/Kommentar:** Deutsch für UI-Texte, ansonsten wie im umgebenden Code.
- **Commits:** kurze, aussagekräftige Messages im Imperativ.
- **Scope klein halten:** ein Thema pro PR.
- Neue Backend-Logik möglichst mit Test (`backend/test/`, Node-Test-Runner).

## Branch- & PR-Ablauf

1. Feature-Branch von `main` erstellen.
2. Änderungen committen, lokal Lint/Tests/Build laufen lassen.
3. PR gegen `main` öffnen; das PR-Template ausfüllen.
4. CI muss grün sein.

## Sicherheitslücken

Keine öffentlichen Issues für Sicherheitsprobleme — siehe [SECURITY.md](SECURITY.md).
