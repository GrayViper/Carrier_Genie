import path from 'path';
import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import { app, createApp, sendApprovalEmailNotification } from './mock-server.js';
import jwt from 'jsonwebtoken';
import { createBackgroundJobStore } from './mcp/background-mcp-server.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret';

describe('server security tests', () => {
 

  it('rejects missing Authorization header', async () => {
    const res = await request(app).post('/api/jobs').send({ title: 'Test', company: 'TestCo' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('missing token');
  });

  it('rejects invalid token algorithm', async () => {
    const badToken = jwt.sign({ sub: 'usr_student', role: 'student' }, getJwtSecret(), { expiresIn: '1h', algorithm: 'HS384' });
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${badToken}`)
      .send({ title: 'Test', company: 'TestCo' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid token');
  });

  it('allows valid token to access protected route', async () => {
    const recruiterToken = jwt.sign({ sub: 'usr_recruiter', role: 'recruiter' }, getJwtSecret(), { expiresIn: '1h', algorithm: 'HS256' });
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Secure Job', company: 'SecureCo' });
    expect(res.status).toBe(201);
    expect(res.body.job).toBeDefined();
    expect(res.body.job.title).toBe('Secure Job');
  });

  it('accepts a token signed with old JWT secret during rotation', async () => {
    const previousSecret = 'old-secret-token';
    const token = jwt.sign({ sub: 'usr_recruiter', role: 'recruiter' }, previousSecret, { expiresIn: '1h', algorithm: 'HS256' });

    const originalJwtSecret = process.env.JWT_SECRET;
    const originalJwtOldSecret = process.env.JWT_OLD_SECRET;
    try {
      process.env.JWT_SECRET = 'new-secret-token';
      process.env.JWT_OLD_SECRET = previousSecret;
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Rotated Job', company: 'RotateCo' });
      expect(res.status).toBe(201);
      expect(res.body.job).toBeDefined();
      expect(res.body.job.title).toBe('Rotated Job');
    } finally {
      process.env.JWT_SECRET = originalJwtSecret;
      process.env.JWT_OLD_SECRET = originalJwtOldSecret;
    }
  });

  it('registers a new user and does not expose passwordHash', async () => {
    const email = `newuser-${Date.now()}@careergenie.test`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email, password: 'TestPass123!', role: 'student' });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.token).toBeTruthy();
  });

  it('logs in with a registered user using bcrypt password', async () => {
    const email = `loginuser-${Date.now()}@careergenie.test`;
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login User', email, password: 'StrongPass!23', role: 'student' });
    expect(register.status).toBe(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'StrongPass!23' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user).toBeDefined();
    expect(loginRes.body.user.email).toBe(email);
    expect(loginRes.body.token).toBeTruthy();
    expect(loginRes.body.user.passwordHash).toBeUndefined();
  });

  it('rejects login with wrong password', async () => {
    const email = `failuser-${Date.now()}@careergenie.test`;
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Fail User', email, password: 'GoodPass!23', role: 'student' });
    expect(register.status).toBe(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'WrongPassword' });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.error).toBe('invalid credentials');
  });

  it('sets secure response headers', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['permissions-policy']).toContain('geolocation=()');
  });

  it('reports the demo auth mode without requiring a secret key', async () => {
    const res = await request(app).get('/auth-status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('clerkConfigured');
    expect(res.body.clerkConfigured).toBe(false);
    expect(res.body).toHaveProperty('jwtConfigured');
    expect(res.body.mode).toBe('demo-jwt');
  });

  it('enforces HTTPS and sets HSTS in production mode', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalFrontendOrigin = process.env.FRONTEND_ORIGIN;
    const originalJwtSecret = process.env.JWT_SECRET;
    try {
      process.env.NODE_ENV = 'production';
      process.env.FRONTEND_ORIGIN = 'https://example.com';
      process.env.JWT_SECRET = 'prod-secret';
      const prodApp = createApp();
      const res = await request(prodApp)
        .get('/api/jobs')
        .set('X-Forwarded-Proto', 'https');
      expect(res.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains; preload');
      expect(res.status).toBe(200);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      process.env.FRONTEND_ORIGIN = originalFrontendOrigin;
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('enqueues resume analysis and returns job status updates', async () => {
    const email = `aiuser-${Date.now()}@careergenie.test`;
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'AI User', email, password: 'AiPass!23', role: 'student' });
    expect(register.status).toBe(201);
    const token = register.body.token;
    const studentId = register.body.user.id;

    const submit = await request(app)
      .post('/api/resume')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentId, fileName: 'resume_ai.pdf', contentBase64: Buffer.from('AI-driven resume content sample').toString('base64') });

    expect(submit.status).toBe(202);
    expect(submit.body.jobId).toBeTruthy();

    const start = Date.now();
    let statusResponse;
    while (Date.now() - start < 10000) {
      statusResponse = await request(app)
        .get(`/api/resume/status/${submit.body.jobId}`)
        .set('Authorization', `Bearer ${token}`);
      if (statusResponse.body.job && ['done', 'error'].includes(statusResponse.body.job.status)) break;
      await new Promise(r => setTimeout(r, 100));
    }

    expect(statusResponse.body.job).toBeDefined();
    expect(['done', 'error']).toContain(statusResponse.body.job.status);
    if (statusResponse.body.job.status === 'done') {
      expect(typeof statusResponse.body.job.score).toBe('number');
    }
  });

  it('tracks resume uploads through the background job store', async () => {
    const email = `bguser-${Date.now()}@careergenie.test`;
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Background User', email, password: 'BgPass!23', role: 'student' });
    expect(register.status).toBe(201);

    const token = register.body.token;
    const studentId = register.body.user.id;
    const submit = await request(app)
      .post('/api/resume')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentId, fileName: 'resume_background.pdf', contentBase64: Buffer.from('Background job content').toString('base64') });

    expect(submit.status).toBe(202);
    const jobStore = createBackgroundJobStore({ storageFile: path.join(process.cwd(), 'server', 'mcp', 'background-jobs.json') });
    const jobs = await jobStore.listJobs();
    expect(jobs.some((job) => job.payload?.jobId === submit.body.jobId)).toBe(true);
  });

  it('sends an applicant notification when a job is approved', async () => {
    const studentEmail = `notifyuser-${Date.now()}@careergenie.test`;
    const studentRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Notify User', email: studentEmail, password: 'NotifyPass!23', role: 'student' });
    expect(studentRegister.status).toBe(201);
    const studentToken = studentRegister.body.token;
    const studentId = studentRegister.body.user.id;

    const recruiterToken = jwt.sign({ sub: 'usr_recruiter', role: 'recruiter' }, getJwtSecret(), { expiresIn: '1h', algorithm: 'HS256' });
    const createJob = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Approved Job', company: 'NotifyCo', description: 'Needs approval' });
    expect(createJob.status).toBe(201);
    const jobId = createJob.body.job.id;

    const apply = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ studentId, studentName: 'Notify User', studentEmail, jobId, jobTitle: 'Approved Job', company: 'NotifyCo' });
    expect(apply.status).toBe(201);

    const adminToken = jwt.sign({ sub: 'usr_admin', role: 'admin' }, getJwtSecret(), { expiresIn: '1h', algorithm: 'HS256' });
    const approve = await request(app)
      .put(`/api/jobs/${jobId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });
    expect(approve.status).toBe(200);
    expect(approve.body.notifications).toBeDefined();
    expect(approve.body.notifications.length).toBeGreaterThan(0);
    expect(approve.body.notifications[0].recipientEmail).toBe(studentEmail);

    const notificationsRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(notificationsRes.status).toBe(200);
    expect(notificationsRes.body.notifications.some(n => n.type === 'job_approved')).toBe(true);
    expect(notificationsRes.body.unreadCount).toBeGreaterThan(0);
  });

  it('marks applicant notifications as read and keeps email delivery metadata', async () => {
    const studentEmail = `readnotify-${Date.now()}@careergenie.test`;
    const studentRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Read Notify User', email: studentEmail, password: 'ReadPass!23', role: 'student' });
    expect(studentRegister.status).toBe(201);
    const studentToken = studentRegister.body.token;
    const studentId = studentRegister.body.user.id;

    const recruiterToken = jwt.sign({ sub: 'usr_recruiter', role: 'recruiter' }, getJwtSecret(), { expiresIn: '1h', algorithm: 'HS256' });
    const createJob = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Read Receipt Job', company: 'NotifyCo', description: 'Needs approval' });
    expect(createJob.status).toBe(201);
    const jobId = createJob.body.job.id;

    const apply = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ studentId, studentName: 'Read Notify User', studentEmail, jobId, jobTitle: 'Read Receipt Job', company: 'NotifyCo' });
    expect(apply.status).toBe(201);

    const adminToken = jwt.sign({ sub: 'usr_admin', role: 'admin' }, getJwtSecret(), { expiresIn: '1h', algorithm: 'HS256' });
    const approve = await request(app)
      .put(`/api/jobs/${jobId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });
    expect(approve.status).toBe(200);
    expect(approve.body.notifications[0].delivery?.channel).toBe('email');

    const notificationsRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(notificationsRes.status).toBe(200);
    const notification = notificationsRes.body.notifications.find((item) => item.type === 'job_approved');
    expect(notification).toBeDefined();
    expect(notification.read).toBe(false);

    const markReadRes = await request(app)
      .put(`/api/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(markReadRes.status).toBe(200);
    expect(markReadRes.body.notification.read).toBe(true);

    const refreshed = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.notifications.find((item) => item.id === notification.id).read).toBe(true);
    expect(refreshed.body.unreadCount).toBe(0);
  });

  it('sends approval notifications through the email delivery layer when configured', async () => {
    const originalApiKey = process.env.RESEND_API_KEY;
    const originalFromEmail = process.env.RESEND_FROM_EMAIL;
    const originalFetch = global.fetch;

    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'CareerGenie <alerts@careergenie.app>';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_123' })
    });
    global.fetch = fetchMock;

    try {
      const result = await sendApprovalEmailNotification({
        recipientEmail: 'student@example.com',
        jobTitle: 'Product Designer',
        company: 'CareerGenie',
        message: 'Your application was approved.'
      });

      expect(result.status).toBe('sent');
      expect(result.provider).toBe('resend');
      expect(fetchMock).toHaveBeenCalled();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.resend.com/emails');
      expect(options.method).toBe('POST');
      expect(options.headers.Authorization).toContain('Bearer');
    } finally {
      if (originalFetch) global.fetch = originalFetch; else delete global.fetch;
      if (originalApiKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalApiKey;
      if (originalFromEmail === undefined) delete process.env.RESEND_FROM_EMAIL; else process.env.RESEND_FROM_EMAIL = originalFromEmail;
    }
  });

  it('returns 500 and error body for unexpected async errors', async () => {
    const res = await request(app).get('/api/test/error');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'test async error' });
  });
});
