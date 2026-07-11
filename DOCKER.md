# printDeploy per Docker bereitstellen

Schnellstart des kompletten Stacks (Backend-API + Frontend) mit einem Befehl. Es wird nur
Docker mit dem Compose-Plugin benötigt — kein lokales Node/npm.

## Voraussetzungen

- Docker Engine mit `docker compose` (Compose v2)

## Start

Im Ordner `printDeploy/`:

```bash
docker compose up -d --build
```

Danach im Browser: **http://localhost:8080**

Der erste Lauf baut beide Images (Backend + Frontend-Build), das dauert einen Moment.
Spätere Starts ohne `--build` sind sofort da.

## Architektur des Setups

```
Browser ──▶ frontend (nginx, Port 8080)
                 │  statisches React-Build (dist/)
                 └─ /api/*  ──▶ backend (Express, Port 3001, nur intern)
                                     └─ Volume: printdeploy-data → /app/data
```

- **frontend** – Multi-Stage-Image: baut die React-App und liefert sie über **nginx** aus.
  nginx dient gleichzeitig als Reverse-Proxy und leitet alle `/api/*`-Anfragen an den
  Backend-Container weiter (siehe `frontend/nginx.conf`). Nur dieser Container ist nach außen
  (Port `8080`) erreichbar.
- **backend** – Node/Express-API. Läuft nur im internen Compose-Netz (kein Host-Port),
  erreichbar für das Frontend unter dem Service-Namen `backend:3001`.
- **printdeploy-data** – benanntes Volume. Persistiert hochgeladene Treiberpakete
  (`/app/data/drivers`) und generierte Pakete (`/app/data/generated`), sodass sie
  Container-Neustarts und -Rebuilds überleben.

## Verwaltung

```bash
# Logs verfolgen
docker compose logs -f

# nur Backend/Frontend
docker compose logs -f backend
docker compose logs -f frontend

# Status
docker compose ps

# Stoppen (Daten bleiben im Volume erhalten)
docker compose down

# Stoppen UND persistierte Daten löschen
docker compose down -v

# Nach Code-Änderungen neu bauen und starten
docker compose up -d --build
```

## Konfiguration

### Host-Port ändern

In `docker-compose.yml` beim Service `frontend`:

```yaml
ports:
  - "8080:80"   # links: Host-Port ändern, z.B. "80:80" oder "3000:80"
```

### Upload-Größe

Treiberpakete können groß sein. nginx ist auf **200 MB** pro Upload eingestellt
(`client_max_body_size` in `frontend/nginx.conf`). Bei größeren Paketen dort anpassen.

### Daten sichern / migrieren

Der gesamte Zustand liegt im Volume `printdeploy-data`. Backup z.B.:

```bash
docker run --rm -v printdeploy_printdeploy-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/printdeploy-data.tar.gz -C /data .
```

> Hinweis: Der Volume-Name wird von Compose mit dem Projektnamen (Ordnername) präfixt,
> hier `printdeploy_printdeploy-data`. Exakten Namen mit `docker volume ls` prüfen.

## Produktion / TLS

Das Setup liefert HTTP auf dem gewählten Port. Für den Betrieb hinter HTTPS den
Frontend-Container üblicherweise hinter einen bestehenden Reverse-Proxy / Ingress
(Traefik, Caddy, nginx, …) hängen, der TLS terminiert und auf den Host-Port weiterleitet.
Das Backend nach außen bewusst geschlossen lassen — es kennt keine Authentifizierung
(siehe Einschränkungen in der Haupt-[README](README.md)).
