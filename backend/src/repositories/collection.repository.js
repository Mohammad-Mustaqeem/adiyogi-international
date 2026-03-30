import Collection from '../models/collection.model.js';

export function findActive() {
  return Collection.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
}

export function findById(id) {
  return Collection.findById(id);
}

export function create(data) {
  const collection = new Collection(data);
  return collection.save();
}

export function update(id, data) {
  return Collection.findByIdAndUpdate(id, data, { new: true });
}

export function softDelete(id) {
  return Collection.findByIdAndUpdate(id, { isActive: false });
}

export function findBySlug(slug) {
  return Collection.findOne({ slug });
}
