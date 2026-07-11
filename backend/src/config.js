// Zentrale Konfiguration – alles über Umgebungsvariablen überschreibbar.
// Siehe .env.example für die vollständige Liste.
import 'dotenv/config';

function int(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: int(process.env.PORT, 3001),

  // CORS: kommagetrennte Liste erlaubter Origins, oder "*" für alle.
  // Default "*" ist bequem für internen Betrieb; in Produktion einschränken.
  corsOrigin: process.env.CORS_ORIGIN ?? '*',

  // Maximale Upload-Größe der Treiber-ZIP in Megabyte.
  maxUploadMb: int(process.env.MAX_UPLOAD_MB, 200),

  // Rate-Limit: Anzahl Requests pro Fenster (Minuten) und IP.
  rateLimitWindowMin: int(process.env.RATE_LIMIT_WINDOW_MIN, 15),
  rateLimitMax: int(process.env.RATE_LIMIT_MAX, 300),

  logLevel: process.env.LOG_LEVEL ?? 'info',
};
