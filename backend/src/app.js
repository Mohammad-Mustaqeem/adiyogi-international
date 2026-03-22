import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import adminRoutes from './routes/admin.routes.js';
import productRoutes from './routes/products.routes.js';
import collectionRoutes from './routes/collections.routes.js';
import orderRoutes from './routes/orders.routes.js';
import { getWAStatus, getQRBase64, initWhatsApp, resetSession } from './services/whatsapp.service.js';
import auth from './middleware/auth.middleware.js';
import errorHandler from './middleware/error.middleware.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors({ origin: env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images/invoices as static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/orders', orderRoutes);

// WhatsApp status & QR endpoints
app.get('/api/whatsapp/status', (_, res) => res.json(getWAStatus()));
app.get('/api/whatsapp/qr', (_, res) => {
  const qr = getQRBase64();
  if (!qr) return res.json({ qr: null, message: 'No QR available — already connected or not initialized' });
  res.json({ qr });
});

// WhatsApp manual init (auth-protected)
app.post('/api/whatsapp/init', auth, async (req, res) => {
  const status = getWAStatus();
  if (status.isReady) return res.json({ message: 'WhatsApp is already connected' });
  if (status.isInitializing) return res.json({ message: 'Initialization already in progress' });
  initWhatsApp().catch(err => console.error('WhatsApp init error:', err.message));
  res.json({ message: 'WhatsApp initialization started' });
});

// WhatsApp reset session (auth-protected) — clears saved auth, forces QR re-scan
app.post('/api/whatsapp/reset', auth, (req, res) => {
  resetSession();
  res.json({ message: 'Session cleared — initialize WhatsApp to get a new QR code' });
});

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Centralized error handler (must be last)
app.use(errorHandler);

export default app;
