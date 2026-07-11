# printDeploy – Backend

Node.js/Express-API, die Treiberpakete entgegennimmt, die enthaltene INF parst und daraus den
fertigen Quellordner (ZIP) für `IntuneWinAppUtil.exe` generiert. Zustand liegt komplett als
Dateien unter `data/` — es gibt keine Datenbank.

## Tech-Stack

- **Node.js** (ES-Module, `"type": "module"`, Node ≥ 20)
- **Express** – HTTP-/REST-API
- **multer** – Multipart-Upload der Treiber-ZIP (in-memory, mit Größen-/Typ-Limit)
- **adm-zip** – ZIP entpacken (Upload, mit Zip-Slip-Schutz) und packen (generiertes Paket)
- **uuid** – IDs für Treiber- und generierte Pakete
- **cors** – konfigurierbarer Zugriff des Frontends
- **helmet** – sichere HTTP-Header
- **express-rate-limit** – Rate-Limiting pro IP
- **dotenv** – Konfiguration aus `.env`

## Bestandteile

```text
src/
  server.js              Express-App: Routen, Middleware (helmet/cors/rate-limit), Error-Handler
  config.js              Konfiguration aus Umgebungsvariablen (siehe .env.example)
  logger.js              Minimaler strukturierter JSON-Logger
  validation.js          Eingabe-Validierung (UUID-Check gegen Path-Traversal)
  drivers/
    infParser.js         Parst die Windows-Drucker-INF → Liste der Druckermodelle
    storage.js           Upload speichern, INF wählen/parsen, Treiberpakete lesen/aktualisieren/löschen
  generate/
    generate.js          Baut den ZIP-Quellordner (Treiberdateien + gerenderte PS1-Skripte)
    history.js           Persistiert generierte Pakete und liefert sie für Download/Verlauf
  templates/
    Install-Printer.ps1.tpl   Vorlage: Treiber stagen, Port + Drucker anlegen
    Remove-Printer.ps1.tpl    Vorlage: Drucker, Port und Treiber entfernen
    render.js                 Ersetzt {{TOKEN}} in den Vorlagen durch die Eingaben
test/                    Unit-Tests (Node-Test-Runner): infParser, validation
data/
  drivers/               Persistierte Treiberpakete (pro Upload ein <uuid>-Ordner)
  generated/             Persistierte generierte Pakete (Verlauf, inkl. package.zip)
```

### `server.js`

Bindet die Module zusammen und stellt die API bereit. Läuft auf `PORT` (Default **3001**).

### `drivers/infParser.js`

Reiner Parser ohne Dateizugriff. Versteht die generische Windows-Drucker-INF-Struktur:

```ini
[Manufacturer]
%Vendor% = ModelsSection, NTamd64, ...
[ModelsSection.NTamd64]
"Anzeigename" = InstallSection, HardwareID1, HardwareID2
```

- erkennt UTF-16-/UTF-8-BOM und dekodiert entsprechend
- löst `%Token%`-Referenzen gegen die `[Strings]`-Sektion auf
- respektiert Anführungszeichen beim Splitten an Kommas
- gibt eine deduplizierte, alphabetisch sortierte Modell-Liste zurück
  (`displayName`, `installSection`, `hardwareIds`)

### `drivers/storage.js`

Persistenz der Treiberpakete unter `data/drivers/<uuid>/`:

- entpackt die hochgeladene ZIP nach `files/`
- sucht rekursiv alle `.inf` und wählt eine aus — bevorzugt Sprachordner
  (Deutsch → English), sonst die größte INF (meist die vollständigste)
- parst die gewählte INF und schreibt `metadata.json`
  (`id`, `name`, `comment`, `originalName`, `uploadedAt`, `infFileName`, `models`)
- `updateDriverPackage` erlaubt späteres Umbenennen/Kommentieren
- liest Altpakete ohne `name`/`comment`-Felder abwärtskompatibel

### `generate/generate.js`

Kern der Paket-Erzeugung. Nimmt `driverPackageId`, `modelId`, `printerName`, `ipAddress`,
optional `portName` (Default `IP_<ip>`):

1. rendert `Install-Printer.ps1` und `Remove-Printer.ps1` mit den Eingaben
   (INF-Pfad wird von POSIX- auf Windows-Backslashes umgeschrieben)
2. kopiert die Treiberdateien in ein Temp-Verzeichnis, legt die beiden Skripte dazu
3. packt alles zu einer ZIP zusammen
4. liefert zusätzlich die Copy-Paste-Metadaten für Intune zurück
   (Install-/Uninstall-Befehl, `IntuneWinAppUtil`-Aufruf, Registry-Detection-Rule)

### `generate/history.js`

Speichert jedes generierte Paket unter `data/generated/<uuid>/` (`package.zip` +
`metadata.json`), listet den Verlauf (neueste zuerst) und liefert den ZIP-Pfad für den Download.

### `templates/`

Textvorlagen mit `{{TOKEN}}`-Platzhaltern. `render.js` ersetzt die Tokens
(`DRIVER_NAME`, `INF_FILENAME`, `PORT_NAME`, `IP_ADDRESS`, `PRINTER_NAME`) — bewusst
simpel, kein Template-Framework. Das Install-Skript stagt den Treiber via `pnputil`,
startet den Spooler neu und legt Port + Drucker über die `Add-Printer*`-Cmdlets an.

## API

| Methode | Pfad                          | Zweck                                                    |
| ------- | ----------------------------- | -------------------------------------------------------- |
| `GET`   | `/healthz`                    | Health-Check (Liveness/Readiness)                        |
| `POST`  | `/api/drivers`                | Treiber-ZIP hochladen (multipart, Feld `file`)           |
| `GET`   | `/api/drivers`                | Alle Treiberpakete auflisten                             |
| `GET`   | `/api/drivers/:id/models`     | Modelle eines Treiberpakets                              |
| `PATCH` | `/api/drivers/:id`            | `name` / `comment` eines Treiberpakets ändern            |
| `DELETE`| `/api/drivers/:id`            | Treiberpaket samt Dateien löschen                        |
| `POST`  | `/api/generate`               | Paket generieren → speichert es und gibt Metadaten zurück|
| `GET`   | `/api/generated`              | Verlauf der generierten Pakete                           |
| `GET`   | `/api/generated/:id/download` | Generierte ZIP herunterladen                             |

## Entwicklung

```bash
npm install
npm run dev      # node --watch, Port 3001
# oder
npm start        # ohne Watch

npm test         # Unit-Tests (Node-Test-Runner)
npm run lint     # ESLint
```

Konfiguration über Umgebungsvariablen bzw. `.env` — alle Optionen mit Defaults in
[.env.example](.env.example). Die Daten unter `data/` sind Server-State und stehen in
`.gitignore` (nur `.gitkeep` bleibt versioniert).
