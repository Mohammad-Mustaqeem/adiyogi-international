/**
 * Unit tests for: AdminRepository
 * Module path:    src/repositories/admin.repository.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Admin model ───────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  findOne: vi.fn(),
  countDocuments: vi.fn(),
  select: vi.fn(),
}));

vi.mock('../../../src/models/admin.model.js', () => {
  const Admin = vi.fn().mockImplementation(() => ({ save: mocks.save }));
  Admin.findOne = mocks.findOne;
  Admin.countDocuments = mocks.countDocuments;
  return { default: Admin };
});

import Admin from '../../../src/models/admin.model.js';
import {
  findByUsername,
  countAdmins,
  createAdmin,
  findOneAdmin,
} from '../../../src/repositories/admin.repository.js';

describe('admin.repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── findByUsername ─────────────────────────────────────────────────────────
  describe('findByUsername', () => {
    it('should call Admin.findOne with the given username', () => {
      const mockAdmin = { _id: 'id-1', username: 'admin' };
      mocks.findOne.mockResolvedValue(mockAdmin);

      findByUsername('admin');

      expect(mocks.findOne).toHaveBeenCalledWith({ username: 'admin' });
    });

    it('should return the result from Admin.findOne', async () => {
      const mockAdmin = { _id: 'id-1', username: 'admin' };
      mocks.findOne.mockResolvedValue(mockAdmin);

      const result = await findByUsername('admin');

      expect(result).toEqual(mockAdmin);
    });

    it('should return null when admin is not found', async () => {
      mocks.findOne.mockResolvedValue(null);

      const result = await findByUsername('nobody');

      expect(result).toBeNull();
    });
  });

  // ── countAdmins ────────────────────────────────────────────────────────────
  describe('countAdmins', () => {
    it('should call Admin.countDocuments without a filter', () => {
      mocks.countDocuments.mockResolvedValue(1);

      countAdmins();

      expect(mocks.countDocuments).toHaveBeenCalledWith();
    });

    it('should return the document count', async () => {
      mocks.countDocuments.mockResolvedValue(3);

      const result = await countAdmins();

      expect(result).toBe(3);
    });

    it('should return 0 when no admins exist', async () => {
      mocks.countDocuments.mockResolvedValue(0);

      const result = await countAdmins();

      expect(result).toBe(0);
    });
  });

  // ── createAdmin ────────────────────────────────────────────────────────────
  describe('createAdmin', () => {
    it('should construct a new Admin with the provided data', () => {
      const data = { username: 'admin', password: 'hashed', whatsappNumber: '91999' };
      mocks.save.mockResolvedValue({ _id: 'new-id', ...data });

      createAdmin(data);

      expect(Admin).toHaveBeenCalledWith(data);
    });

    it('should call save() on the new Admin instance', () => {
      mocks.save.mockResolvedValue({});

      createAdmin({ username: 'admin', password: 'pass', whatsappNumber: '91999' });

      expect(mocks.save).toHaveBeenCalledTimes(1);
    });

    it('should return the saved admin document', async () => {
      const saved = { _id: 'new-id', username: 'admin' };
      mocks.save.mockResolvedValue(saved);

      const result = await createAdmin({ username: 'admin', password: 'pass', whatsappNumber: '91999' });

      expect(result).toEqual(saved);
    });
  });

  // ── findOneAdmin ───────────────────────────────────────────────────────────
  describe('findOneAdmin', () => {
    it('should call Admin.findOne with the given filter', () => {
      const mockQuery = { select: vi.fn().mockResolvedValue(null) };
      mocks.findOne.mockReturnValue(mockQuery);

      findOneAdmin({ _id: 'some-id' });

      expect(mocks.findOne).toHaveBeenCalledWith({ _id: 'some-id' });
    });

    it('should chain .select() when a select string is provided', () => {
      const mockSelect = vi.fn().mockResolvedValue({ whatsappNumber: '91999' });
      mocks.findOne.mockReturnValue({ select: mockSelect });

      findOneAdmin({}, 'whatsappNumber');

      expect(mockSelect).toHaveBeenCalledWith('whatsappNumber');
    });

    it('should NOT call .select() when no select string is provided', () => {
      const mockQuery = { select: vi.fn() };
      mocks.findOne.mockReturnValue(mockQuery);

      findOneAdmin({});

      expect(mockQuery.select).not.toHaveBeenCalled();
    });

    it('should use an empty filter by default', () => {
      const mockQuery = { select: vi.fn() };
      mocks.findOne.mockReturnValue(mockQuery);

      findOneAdmin();

      expect(mocks.findOne).toHaveBeenCalledWith({});
    });
  });
});
