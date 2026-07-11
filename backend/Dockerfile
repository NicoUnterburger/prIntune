# printDeploy backend – Node.js/Express API
FROM node:20-alpine

WORKDIR /app

# Nur die Manifeste zuerst kopieren, damit npm ci gecacht wird,
# solange sich die Abhängigkeiten nicht ändern.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# data/ wird zur Laufzeit über ein Volume gemountet (persistenter Server-State).
RUN mkdir -p data/drivers data/generated

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "src/server.js"]
