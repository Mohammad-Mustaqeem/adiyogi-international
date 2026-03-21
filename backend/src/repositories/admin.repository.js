import Admin from '../models/admin.model.js';

export function findByUsername(username) {
  return Admin.findOne({ username });
}

export function countAdmins() {
  return Admin.countDocuments();
}

export function createAdmin(data) {
  const admin = new Admin(data);
  return admin.save();
}

export function findOneAdmin(filter = {}, select) {
  let q = Admin.findOne(filter);
  if (select) q = q.select(select);
  return q;
}
