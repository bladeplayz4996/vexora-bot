import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachSession } from './dashboard/api/auth_routes.js';
import apiRouter from './dashboard/api/index.js';
import * as botModule from './bot/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';

function parseCookies(req, _res, next) {
  const header = req.headers.cookie || '';
  const cookies = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  }
  req.cookies = cookies;
  next();
}

async function connectDatabase() {
  if (!MONGO_URI) {
    console.warn('[Vexora DB] No MONGODB_URI set. Running with in-memory fallback & Mongoose models ready.');
    return false;
  }
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Vexora DB] Connected to MongoDB.');
    return true;
  } catch (err) {
    console.error('[Vexora DB] Connection failed, continuing with fallback:', err.message);
    return false;
  }
}

async function bootBotForServer() {
  if (!process.env.DISCORD_TOKEN) {
    console.warn('[Vexora Bot] DISCORD_TOKEN not set; starting Dashboard API in standalone mode.');
    return null;
  }

  const starter =
    botModule.startBotClient ||
    botModule.startBot ||
    botModule.initBot ||
    (typeof botModule.default === 'function' ? botModule.default : null);

  if (typeof starter === 'function') {
    const result = await starter();
    return result?.client || result || botModule.client || botModule.default || null;
  }

  return (
    botModule.client ||
    (botModule.default && typeof botModule.default === 'object' ? botModule.default : null)
  );
}

async function main() {
  await connectDatabase();

  const app = express();
  app.use(
    cors({
      origin: process.env.DASHBOARD_FRONTEND_URL || true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(parseCookies);
  app.use(attachSession);

  // Start Discord Bot if token is provided
  const discordClient = await bootBotForServer();
  app.set('discordClient', discordClient);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      botOnline: Boolean(discordClient?.isReady?.()),
      guildsCached: discordClient?.guilds?.cache?.size ?? 0,
      dbConnected: mongoose.connection.readyState === 1,
    });
  });

  // Mount all dashboard API routes
  app.use('/api', apiRouter);

  // Serve static frontend if built
  const distDir = path.join(__dirname, 'dist');
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distDir, 'index.html'), (err) => {
      if (err) {
        res.status(200).json({
          ok: true,
          message: 'Vexora API is running. Mount dashboard_app.jsx in your Vite/React frontend.',
        });
      }
    });
  });

  // Global error handler so routes never crash the process
  app.use((err, _req, res, _next) => {
    console.error('[Vexora API Error]', err);
    res.status(err.status || 500).json({
      ok: false,
      error: err.message || 'Internal server error',
    });
  });

  app.listen(PORT, () => {
    console.log(`[Vexora Server] Listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[Fatal Boot Error]', err);
  process.exit(1);
});
