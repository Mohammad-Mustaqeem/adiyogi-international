import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import * as adminRepo from '../repositories/admin.repository.js';
import * as orderRepo from '../repositories/order.repository.js';
import * as productRepo from '../repositories/product.repository.js';

export async function login(username, password) {
  const admin = await adminRepo.findByUsername(username);
  if (!admin || !(await admin.comparePassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const token = jwt.sign({ id: admin._id }, env.JWT_SECRET, { expiresIn: '7d' });
  return { token, name: admin.name, whatsappNumber: admin.whatsappNumber };
}

export async function setup(data) {
  const count = await adminRepo.countAdmins();
  if (count > 0) throw new ApiError(400, 'Admin already exists');
  await adminRepo.createAdmin(data);
  return { message: 'Admin created successfully' };
}

export async function getDashboard() {
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    totalProducts,
    recentOrders,
    revenue,
  ] = await Promise.all([
    orderRepo.countOrders(),
    orderRepo.countOrders({ status: 'Pending' }),
    orderRepo.countOrders({ status: 'Confirmed' }),
    orderRepo.countOrders({ status: 'Delivered' }),
    productRepo.countActive(),
    orderRepo.findRecentOrders(10),
    orderRepo.getRevenue(),
  ]);

  return {
    totalOrders,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    totalProducts,
    totalRevenue: revenue[0]?.total || 0,
    recentOrders,
  };
}

export async function getOrders({ page = 1, limit = 20, status } = {}) {
  const filter = status ? { status } : {};
  const [orders, total] = await Promise.all([
    orderRepo.findWithPagination(filter, { page, limit }),
    orderRepo.countOrders(filter),
  ]);
  return { orders, total, pages: Math.ceil(total / limit) };
}

export async function updateOrderStatus(id, status) {
  return orderRepo.updateStatus(id, status);
}

export async function getProfile(adminId) {
  const admin = await adminRepo.findById(adminId);
  if (!admin) throw new ApiError(404, 'Admin not found');
  return { name: admin.name, username: admin.username, whatsappNumber: admin.whatsappNumber };
}

export async function updateProfile(adminId, { name, username, whatsappNumber }) {
  // Check username uniqueness if changing
  const existing = await adminRepo.findByUsername(username);
  if (existing && String(existing._id) !== String(adminId)) {
    throw new ApiError(409, 'Username is already taken');
  }
  const admin = await adminRepo.updateAdmin(adminId, { name, username, whatsappNumber });
  if (!admin) throw new ApiError(404, 'Admin not found');
  return { name: admin.name, username: admin.username, whatsappNumber: admin.whatsappNumber };
}

export async function changePassword(adminId, { currentPassword, newPassword }) {
  const admin = await adminRepo.findById(adminId);
  if (!admin) throw new ApiError(404, 'Admin not found');
  const valid = await admin.comparePassword(currentPassword);
  if (!valid) throw new ApiError(401, 'Current password is incorrect');
  admin.password = newPassword;
  await admin.save(); // triggers bcrypt pre-save hook
}

