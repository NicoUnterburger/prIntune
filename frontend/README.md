# printDeploy – Frontend

React-Single-Page-App (Vite + Tailwind), die als UI für die Backend-API dient: Treiberpakete
hochladen und verwalten, Druckerpakete generieren und den Verlauf durchsuchen. In der App heißt
das Ganze **prIntune**.

## Tech-Stack

- **React 18** – UI
- **Vite 5** – Dev-Server (Port **5173**) + Build
- **Tailwind CSS 3** – Styling (Utility-Klassen, dunkles Theme)
- **PostCSS / Autoprefixer** – Tailwind-Pipeline

Es gibt keine Router-Library — die Navigation zwischen den drei Ansichten läuft über
lokalen State (Tabs). Kein State-Management-Framework; jede Seite hält ihren eigenen Zustand.

## Bestandteile

```text
index.html               Einstiegspunkt, lädt src/main.jsx
src/
  main.jsx               React-Root, rendert <App>
  index.css              Tailwind-Direktiven
  App.jsx                Rahmen + Tab-Navigation (Generieren / Verlauf / Treiber)
  api.js                 Zentraler API-Client (fetch gegen /api)
  GeneratePage.jsx       Paket generieren
  HistoryPage.jsx        Verlauf der generierten Pakete
  DriversPage.jsx        Treiberpakete hochladen & auflisten
  DriverPackageCard.jsx  Einzelnes Treiberpaket: Name/Kommentar, Modell-Liste
  PackageInfo.jsx        Copy-Paste-Block: IntuneWinAppUtil-, Install-/Uninstall-Befehl, Detection Rule
```

### `App.jsx`

Definiert die drei Tabs und schaltet über `useState` zwischen ihnen um. Header mit
Titel „prIntune", darunter die aktive Seite.

### `api.js`

Kapselt alle HTTP-Aufrufe gegen das Backend. Basis-Pfad ist `/api` (relativ) — im Dev von
Vite auf `http://localhost:3001` proxied, in Produktion vom Reverse-Proxy weitergeleitet.
Zentrales `handle()` wirft bei Fehlern die Server-Fehlermeldung. `downloadGeneratedUrl(id)`
liefert nur die URL (Download läuft über einen normalen `<a href>`).

### `GeneratePage.jsx`

Das eigentliche Arbeitsformular:

- lädt beim Mount die Treiberpakete und wählt das erste vor
- Modell-Auswahl mit Live-Suchfeld (Filter über `useMemo`)
- Eingaben: Druckername, IP/Hostname, optionaler Portname
- schickt `POST /api/generate`, zeigt danach Download-Button + `PackageInfo`

### `HistoryPage.jsx`

Listet alle bereits generierten Pakete (neueste zuerst). Pro Eintrag: Druckername, IP,
Treiber, Zeitpunkt, Download-Button und ausklappbare Details (`PackageInfo`).

### `DriversPage.jsx`

Upload eines Treiberpakets (ZIP, `<input type="file" accept=".zip">`) und Liste der
vorhandenen Pakete als `DriverPackageCard`.

### `DriverPackageCard.jsx`

Zeigt ein Treiberpaket. Inline editierbar (Name + Kommentar via `PATCH`), Vorschau der ersten
Modelle, aufklappbare vollständige Modell-Liste mit Suchfeld (ab >10 Modellen).

### `PackageInfo.jsx`

Reine Anzeige der Intune-relevanten Schritte aus den Backend-Metadaten: `IntuneWinAppUtil`-
Aufruf, Install-/Uninstall-Befehl und die Registry-Detection-Rule — zum Kopieren in den
Intune-Win32-App-Wizard.

## API-Anbindung

Alle Requests gehen an `/api/*`. Damit das ohne CORS-/Host-Konfiguration funktioniert:

- **Dev:** `vite.config.js` proxied `/api` → `http://localhost:3001` (Backend muss laufen).
- **Produktion:** Der Build (`npm run build` → `dist/`) wird statisch ausgeliefert; ein
  Reverse-Proxy (nginx, siehe Docker-Setup) leitet `/api` an das Backend weiter.

## Entwicklung

```bash
npm install
npm run dev        # Vite-Dev-Server auf http://localhost:5173
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ansehen
npm run lint       # ESLint
```
