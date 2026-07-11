import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import multer from 'multer';
import { config } from './config.js';
import { logger } from './logger.js';
import { isValidId } from './validation.js';
import {
  createDriverPackage,
  deleteDriverPackage,
  getDriverPackage,
  listDriverPackages,
  updateDriverPackage,
} from './drivers/storage.js';
import { generateSourcePackage } from './generate/generate.js';
import {
  getGeneratedPackage,
  getGeneratedZipPath,
  listGeneratedPackages,
  saveGeneratedPackage,
} from './generate/history.js';

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.zip')) return cb(null, true);
    cb(new Error('Only .zip files are allowed'));
  },
});

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()),
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMin * 60 * 1000,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Reject any :id that is not a valid UUID before it ever reaches a filesystem path.
app.param('id', (req, res, next, id) => {
  if (!isValidId(id)) return res.status(400).json({ error: 'Invalid id' });
  next();
});

// Liveness/readiness probe for Docker, Kubernetes, load balancers.
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.post('/api/drivers', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const metadata = createDriverPackage(req.file.buffer, req.file.originalname);
    res.status(201).json(metadata);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/drivers', (req, res) => {
  res.json(listDriverPackages());
});

app.get('/api/drivers/:id/models', (req, res) => {
  const pkg = getDriverPackage(req.params.id);
  if (!pkg) return res.status(404).json({ error: 'Driver package not found' });
  res.json(pkg.models);
});

app.patch('/api/drivers/:id', (req, res) => {
  const { name, comment } = req.body;
  const metadata = updateDriverPackage(req.params.id, { name, comment });
  if (!metadata) return res.status(404).json({ error: 'Driver package not found' });
  res.json(metadata);
});

app.delete('/api/drivers/:id', (req, res) => {
  const deleted = deleteDriverPackage(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Driver package not found' });
  res.status(204).end();
});

app.post('/api/generate', (req, res) => {
  try {
    const { zipBuffer, meta } = generateSourcePackage(req.body);
    const record = saveGeneratedPackage(zipBuffer, meta);
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/generated', (req, res) => {
  res.json(listGeneratedPackages().map(({ id, ...rest }) => ({ id, ...rest })));
});

app.get('/api/generated/:id/download', (req, res) => {
  const record = getGeneratedPackage(req.params.id);
  const zipPath = getGeneratedZipPath(req.params.id);
  if (!record || !fs.existsSync(zipPath)) {
    return res.status(404).json({ error: 'Generated package not found' });
  }
  const safeName = (record.printerName || 'printer-package').replace(/[^A-Za-z0-9_.-]/g, '_');
  const filename = `${safeName}.zip`;
  res.set('Content-Type', 'application/zip');
  res.set('Content-Disposition', `attachment; filename="${filename}"`);
  fs.createReadStream(zipPath).pipe(res);
});

// Central error handler – catches multer errors (e.g. file too large) and
// anything thrown/next()'d from the routes above.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only .zip files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  logger.error('Unhandled error', { path: req.path, error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(config.port, () => {
  logger.info('printDeploy backend listening', { port: config.port });
});

// Graceful shutdown so in-flight requests finish on stop/redeploy.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    logger.info('Shutting down', { signal });
    server.close(() => process.exit(0));
  });
}
