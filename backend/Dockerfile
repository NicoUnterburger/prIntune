# printDeploy backend – Node.js/Express API
FROM node:20-alpine

WORKDIR /app

# Nur die Manifeste zuerst kopieren, damit npm ci gecacht wird,
# solange sich die Abhängigkeiten nicht ändern.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# data/ wird zur Laufzeit über ein Volume gemountet (persistenter Server-State).
# Dem non-root User "node" (im Base-Image vorhanden) gehören, damit Schreibzugriff klappt.
RUN mkdir -p data/drivers data/generated && chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Nicht als root laufen.
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+ (process.env.PORT||3001) +'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
