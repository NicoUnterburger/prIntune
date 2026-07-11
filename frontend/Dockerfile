# printDeploy frontend – Build der React-App, Auslieferung über nginx

# --- Build-Stage: erzeugt die statischen Dateien in dist/ ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime-Stage: nginx liefert dist/ aus und proxied /api ans Backend ---
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
