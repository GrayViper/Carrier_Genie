import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'users.json');
const backupFile = path.join(__dirname, 'data', 'users.json.bak');

describe('auth server resume gating', () => {
  beforeEach(() => {
    if (fs.existsSync(DATA_FILE)) {
      fs.copyFileSync(DATA_FILE, backupFile);
    }
  });

  afterEach(() => {
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, DATA_FILE);
      fs.unlinkSync(backupFile);
    }
  });

  it('returns students with resumeUploaded set to false by default', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: 'newstudent@example.com',
        password: 'password123',
        role: 'student'
      });

    expect(res.status).toBe(200);
    expect(res.body.user.resumeUploaded).toBe(false);
  });
});
