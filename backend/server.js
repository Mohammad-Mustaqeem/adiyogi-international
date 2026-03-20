import 'dotenv/config';

// Startup diagnostics
process.on('uncaughtException',  err => console.error('💥 CRASH:', err.message, err.stack));
process.on('unhandledRejection', err => console.error('💥 UNHANDLED:', err));

import app from './src/app.js';
import { connectDB } from './src/db/db-connection.js';
import { seedSystemCollections } from './src/db/seed.js';
import { initWhatsApp } from './src/services/whatsapp.js';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await seedSystemCollections();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🖼️  Static files: http://localhost:${PORT}/uploads`);
    });

    if (process.env.WHATSAPP_ENABLED !== 'false') {
      console.log('📱 Initializing WhatsApp auto-send service...');
      initWhatsApp().catch(err => console.warn('WhatsApp init warning:', err.message));
    }
  });
