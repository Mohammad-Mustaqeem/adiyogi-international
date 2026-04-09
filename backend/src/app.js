import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import adminRoutes from './routes/admin.routes.js';
import productRoutes from './routes/products.routes.js';
import collectionRoutes from './routes/collections.routes.js';
import orderRoutes from './routes/orders.routes.js';
import { getWAStatus, getQRBase64, initWhatsApp, resetSession, sendWhatsAppMessage } from './services/whatsapp.service.js';
import Admin from './models/admin.model.js';
import auth from './middleware/auth.middleware.js';
import errorHandler from './middleware/error.middleware.js';

const app = express();

// Trust the reverse proxy (nginx) so req.ip reflects the real client IP
// Required for rate limiting to work correctly behind nginx/Coolify proxy
app.set('trust proxy', true);

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { error: 'Too many requests, please try again later.' },
});
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { error: 'Too many orders submitted, please wait before trying again.' },
});

// Middleware
app.use(cors({ origin: env.CLIENT_URL || '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', generalLimiter);

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/orders', orderLimiter, orderRoutes);

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

// Send a test message to the admin's own registered WhatsApp number (auth-protected)
app.post('/api/whatsapp/test', auth, async (req, res) => {
  const status = getWAStatus();
  if (!status.isReady) {
    return res.status(400).json({ message: 'WhatsApp is not connected. Scan the QR code first.' });
  }
  const admin = await Admin.findById(req.admin.id).select('whatsappNumber name');
  if (!admin) return res.status(404).json({ message: 'Admin not found' });

  const message =
    `✅ *Adiyogi Admin — WhatsApp Test*\n\n` +
    `Hey ${admin.name}! This is a test message to confirm WhatsApp notifications are working correctly.\n\n` +
    `Your registered number: *${admin.whatsappNumber}*`;

  console.log(`📤 Sending WhatsApp test message to: ${admin.whatsappNumber}`);
  const sent = await sendWhatsAppMessage(admin.whatsappNumber, message);
  if (sent) {
    res.json({ message: `Test message sent to ${admin.whatsappNumber}` });
  } else {
    res.status(500).json({ message: 'Failed to send — WhatsApp may have disconnected. Try resetting the session.' });
  }
});

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Centralized error handler (must be last)
app.use(errorHandler);

export default app;
