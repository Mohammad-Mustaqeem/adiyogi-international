import Collection from '../models/collection.model.js';
import { logger } from './logger.js';

export async function seedSystemCollections() {
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
      logger.info('"New Arrivals" collection created');
    } else if (!existing.isSystem) {
      await Collection.findByIdAndUpdate(existing._id, { isSystem: true, sortOrder: -1 });
      logger.info('"New Arrivals" marked as system collection');
    }
  } catch (err) {
    logger.warn({ err }, 'Seed warning');
  }
}
