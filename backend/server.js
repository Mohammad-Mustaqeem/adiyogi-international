import 'dotenv/config';
// ── Startup diagnostics ──────────────────────────────────────────────────
process.on('uncaughtException',  err => console.error('💥 CRASH:', err.message, err.stack));
process.on('unhandledRejection', err => console.error('💥 UNHANDLED:', err));
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import adminRoutes from './routes/admin.js';
import productRoutes from './routes/products.js';
import collectionRoutes from './routes/collections.js';
import orderRoutes from './routes/orders.js';
import { initWhatsApp, getWAStatus, getQRBase64 } from './services/whatsapp.js';
import Collection from './models/Collection.js';

async function seedSystemCollections() {
  try {
    const existing = await Collection.findOne({ slug: 'new-arrivals' });
    if (!existing) {
      await Collection.create({
        name: 'New Arrivals',
        slug: 'new-arrivals',
        description: 'Latest products added to our catalogue',
        sortOrder: -1,
        isSystem: true,
        isActive: true,
      });
      console.log('✅ "New Arrivals" collection created');
    } else if (!existing.isSystem) {
      await Collection.findByIdAndUpdate(existing._id, { isSystem: true, sortOrder: -1 });
      console.log('✅ "New Arrivals" marked as system collection');
    }
  } catch (err) {
    console.warn('Seed warning:', err.message);
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images/invoices as static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/orders', orderRoutes);

// WhatsApp status & QR endpoints (no auth needed for QR scan)
app.get('/api/whatsapp/status', (_, res) => res.json(getWAStatus()));
app.get('/api/whatsapp/qr', (_, res) => {
  const qr = getQRBase64();
  if (!qr) return res.json({ qr: null, message: 'No QR available — already connected or not initialized' });
  res.json({ qr });
});

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'OK', timestamp: new Date() }));

// MongoDB connection + server start
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedSystemCollections();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🖼️  Static files: http://localhost:${PORT}/uploads`);
    });

    // Initialize WhatsApp auto-send service (non-blocking)
    if (process.env.WHATSAPP_ENABLED !== 'false') {
      console.log('📱 Initializing WhatsApp auto-send service...');
      initWhatsApp().catch(err => console.warn('WhatsApp init warning:', err.message));
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
