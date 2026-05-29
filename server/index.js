import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import entityRoutes from './routes/entities.js';
import uploadRoutes from './routes/upload.js';
import emailRoutes from './routes/email.js';
import { authRequired } from './middleware/auth.js';
import './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const app = express();

const sseClients = new Map();

app.locals.broadcastTransaction = (transaction) => {
  const payload = JSON.stringify({
    type: 'create',
    id: transaction.id,
    data: transaction,
  });
  for (const [userId, res] of sseClients) {
    res.write(`data: ${payload}\n\n`);
  }
};

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

const uploadsPath = path.join(__dirname, 'data', 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/email', emailRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/events/transactions', authRequired, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.set(req.user.id, res);
  req.on('close', () => sseClients.delete(req.user.id));
});

const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`Apex Bank API running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${PORT} is already in use. Either:\n` +
      `  1. Stop the other process:  netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F\n` +
      `  2. Use another port in server/.env:  PORT=3002\n`
    );
    process.exit(1);
  }
  throw err;
});
