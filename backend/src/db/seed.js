import Collection from '../models/Collection.js';

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
      console.log('✅ "New Arrivals" collection created');
    } else if (!existing.isSystem) {
      await Collection.findByIdAndUpdate(existing._id, { isSystem: true, sortOrder: -1 });
      console.log('✅ "New Arrivals" marked as system collection');
    }
  } catch (err) {
    console.warn('Seed warning:', err.message);
  }
}
