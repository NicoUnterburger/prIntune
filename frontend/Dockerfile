# printDeploy frontend – Build der React-App, Auslieferung über nginx

# --- Build-Stage: erzeugt die statischen Dateien in dist/ ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime-Stage: nginx liefert dist/ aus und proxied /api ans Backend ---
FROM nginx:1.31-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# 127.0.0.1 statt localhost: nginx lauscht nur auf IPv4, localhost löst im
# Container zu ::1 auf und würde fehlschlagen.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
