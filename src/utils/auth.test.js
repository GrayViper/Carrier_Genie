import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, createToken, decodeToken } from './auth.js';

describe('auth utilities', () => {
  it('hashPassword and verifyPassword work for the same password', async () => {
    const password = 'SecurePass123!';
    const hashed = await hashPassword(password);
    expect(typeof hashed).toBe('string');
    expect(hashed.length).toBeGreaterThan(20);
    const isValid = await verifyPassword(password, hashed);
    expect(isValid).toBe(true);
  });

  it('createToken and decodeToken round-trip a payload', async () => {
    const token = await createToken({ sub: 'user-1', role: 'student' }, 'demo-secret');
    const payload = await decodeToken(token, 'demo-secret');
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('student');
  });
});
