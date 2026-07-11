import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import multer from 'multer';
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
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`printDeploy backend listening on http://localhost:${PORT}`);
});
