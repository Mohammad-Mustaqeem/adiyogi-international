import 'dotenv/config';

import { env } from './src/config/env.js';
import { logger } from './src/config/logger.js';
import { connectDB } from './src/config/db.js';
import { seedSystemCollections } from './src/config/seed.js';
import { initWhatsApp } from './src/services/whatsapp.service.js';
import app from './src/app.js';

// Startup diagnostics
process.on('uncaughtException', (err) => logger.fatal({ err }, 'CRASH'));
process.on('unhandledRejection', (err) => logger.fatal({ err }, 'UNHANDLED'));

connectDB()
  .then(async () => {
    await seedSystemCollections();
    app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
    });

    if (env.WHATSAPP_ENABLED) {
      logger.info('Initializing WhatsApp auto-send service...');
      initWhatsApp().catch((err) => logger.warn({ err }, 'WhatsApp init warning'));
    }
  });
