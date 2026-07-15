import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { verifyToken } from '@clerk/backend';
import { connectMongo, getDb, closeMongo } from './mongo_client.js';
import { createBackgroundJobStore } from './mcp/background-mcp-server.js';

const PORT = process.env.MOCK_PORT || 5178;
const DATA_PATH = path.join(process.cwd(), 'server', 'data.json');
const PYTHON_CMD = process.env.PYTHON_PATH || 'python';
const AI_ANALYZER_SCRIPT = path.join(process.cwd(), 'server', 'ai', 'analysis.py');

async function analyzeResumeWithPython(contentBase64, fileName) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_CMD, [AI_ANALYZER_SCRIPT], { stdio: ['pipe', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];

    child.stdout.on('data', chunk => stdout.push(chunk));
    child.stderr.on('data', chunk => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      const output = Buffer.concat(stdout).toString('utf8').trim();
      const errorOutput = Buffer.concat(stderr).toString('utf8').trim();
      if (code !== 0) {
        return reject(new Error(`Python analyzer failed (${code}): ${errorOutput}`));
      }
      try {
        return resolve(JSON.parse(output));
      } catch (err) {
        return reject(new Error(`Invalid JSON from analyzer: ${err.message} ${output}`));
      }
    });

    child.stdin.write(JSON.stringify({ contentBase64, fileName }));
    child.stdin.end();
  });
}

function simulateResumeAnalysis() {
  return {
    score: 76,
    strengths: ['Clear project descriptions with strong frontend focus.', 'Demonstrates collaboration and modern tooling awareness.'],
    weaknesses: ['Limited cloud deployment detail.', 'No explicit backend testing framework shown.'],
    suggestions: ['Add a Docker or cloud deployment example.', 'Mention testing tools or automation experience.'],
    skills: ['Git', 'Docker'],
    atsScore: 72
  };
}

async function tryAnalyzeResume(contentBase64, fileName) {
  try {
    return await analyzeResumeWithPython(contentBase64, fileName);
  } catch (err) {
    // If AI integration is not configured or fails, fall back to the existing simulated analyzer.
    // eslint-disable-next-line no-console
    console.warn('Resume analysis AI integration failed:', err.message || err);
    return simulateResumeAnalysis();
  }
}

function getInitialData() {
  return {
    users: [
      { id: 'usr_student', name: 'Olivia Chen', email: 'olivia@gmail.com', role: 'student', skills: ['React','JavaScript'], resumeUploaded: true, resumeName: 'Olivia_Chen_Resume_2026.pdf', resumeScore: 84, feedback: {}, atsScore: 84 },
      { id: 'usr_recruiter', name: 'David Miller', email: 'david@stripe.com', role: 'recruiter' },
      { id: 'usr_admin', name: 'Alex Mercer', email: 'admin@careergenie.com', role: 'admin' }
    ],
    jobs: [
      { id: 'job_1', title: 'Frontend Engineer', company: 'Acme', location: 'Remote', tags: ['React','JavaScript'], description: 'Build great UIs.', status: 'active' }
    ],
    applications: [],
    resumeResults: {},
    notifications: [],
    loginEmails: ['olivia@gmail.com', 'david@stripe.com']
  };
}

function getEnvSettings() {
  const isProduction = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET || (isProduction ? null : 'dev-secret');
  const jwtOldSecret = process.env.JWT_OLD_SECRET || null;
  // In dev mode, allow role-based login for testing different roles (admin, recruiter, student)
  // In production, always require explicit credentials
  const allowDevAuth = isProduction ? (process.env.ALLOW_DEV_AUTH === '1') : (process.env.ALLOW_DEV_AUTH !== '0');
  const frontendOrigin = process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.replace(/\/$/, '')
    : (isProduction ? null : '*');

  if (isProduction && !jwtSecret) {
    throw new Error('JWT_SECRET is required in production. Set JWT_SECRET before starting the server.');
  }
  if (isProduction && !frontendOrigin) {
    throw new Error('FRONTEND_ORIGIN is required in production. Set FRONTEND_ORIGIN to the allowed origin.');
  }

  return { isProduction, jwtSecret, jwtOldSecret, allowDevAuth, frontendOrigin };
}

export function createApp() {
  const { isProduction, frontendOrigin } = getEnvSettings();
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(cors({
    origin: frontendOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

  if (isProduction) {
    app.use((req, res, next) => {
      const proto = req.protocol || (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
      if (proto === 'https' || req.secure) {
        return next();
      }
      const host = req.headers.host || `localhost:${PORT}`;
      return res.redirect(301, `https://${host}${req.url}`);
    });
  }

  app.use(express.json({ limit: '10mb' }));
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
  });

  setupRoutes(app);
  return app;
}

const app = createApp();
export { app };

const backgroundJobStore = createBackgroundJobStore({ storageFile: path.join(process.cwd(), 'server', 'mcp', 'background-jobs.json') });

// In-process job queue
const inprocQueue = [];
let inprocProcessing = 0;
const INPROC_CONCURRENCY = Number(process.env.INPROC_CONCURRENCY) || 3;

async function processInprocJob(job) {
  const { jobId, studentId, fileName, contentBase64 } = job;
  try {
    const delay = process.env.NODE_ENV === 'test'
      ? 100
      : 1500 + Math.floor(Math.random() * 2500);
    await new Promise(r => setTimeout(r, delay));
    const analysis = await tryAnalyzeResume(contentBase64, fileName);
    const score = Number.isFinite(analysis.score) ? analysis.score : 70;
    const atsScore = Number.isFinite(analysis.atsScore) ? analysis.atsScore : Math.round(score * 0.95);

    const d = await readData();
    const user = d.users.find(u => u.id === studentId);
    if (user) {
      user.resumeUploaded = true;
      user.resumeName = fileName;
      user.resumeScore = score;
      user.skills = Array.from(new Set([...(user.skills || []), ...(analysis.skills || [])]));
      user.feedback = {
        score,
        strengths: analysis.strengths || ['Clear projects'],
        weaknesses: analysis.weaknesses || ['Add Docker'],
        suggestions: analysis.suggestions || ['Add testing examples']
      };
      user.atsScore = atsScore;
    }
    d.resumeResults = d.resumeResults || {};
    d.resumeResults[jobId] = {
      status: 'done',
      studentId,
      fileName,
      score,
      atsScore,
      finishedAt: new Date().toISOString(),
      startedAt: d.resumeResults[jobId]?.startedAt || uploadedAt,
      contentBase64: d.resumeResults[jobId]?.contentBase64 || contentBase64,
      studentEmail: student?.email || null,
      studentRole: student?.role || 'student',
      uploaderId: d.resumeResults[jobId]?.uploaderId || studentId,
      uploaderRole: d.resumeResults[jobId]?.uploaderRole || 'student',
      analysis: {
        skills: analysis.skills || [],
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        suggestions: analysis.suggestions || []
      }
    };
    await writeData(d);
  } catch (err) {
    try {
      const d2 = await readData();
      d2.resumeResults = d2.resumeResults || {};
      d2.resumeResults[jobId] = { status: 'error', error: 'processing error', detail: err.message, finishedAt: new Date().toISOString() };
      await writeData(d2);
    } catch { /* swallow */ }
  } finally {
    inprocProcessing -= 1;
    // start next job if present
    if (inprocQueue.length > 0) {
      const next = inprocQueue.shift();
      inprocProcessing += 1;
      processInprocJob(next);
    }
  }
}

async function ensureData() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    const db = await connectMongo(mongoUri);
    const [usersCount, jobsCount, appsCount, resumeCount] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('jobs').countDocuments(),
      db.collection('applications').countDocuments(),
      db.collection('resumeResults').countDocuments()
    ]);
    if (usersCount + jobsCount + appsCount + resumeCount === 0) {
      const initial = getInitialData();
      await db.collection('users').insertMany(initial.users);
      await db.collection('jobs').insertMany(initial.jobs);
      await db.collection('applications').insertMany(initial.applications);
      await db.collection('resumeResults').deleteMany({});
    }
    return;
  }
  try {
    await fs.access(DATA_PATH);
  } catch {
    const initial = getInitialData();
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(initial, null, 2));
  }
}

async function readData() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    await ensureData();
    const db = getDb();
    const users = await db.collection('users').find().toArray();
    const jobs = await db.collection('jobs').find().toArray();
    const applications = await db.collection('applications').find().toArray();
    const notifications = await db.collection('notifications').find().toArray();
    const rrDocs = await db.collection('resumeResults').find().toArray();
    const resumeResults = {};
    for (const d of rrDocs) { const { jobId, _id, ...rest } = d; if (jobId) resumeResults[jobId] = rest; }
    return { users: users || [], jobs: jobs || [], applications: applications || [], notifications: notifications || [], resumeResults };
  }
  await ensureData();
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      notifications: parsed.notifications || [],
      resumeResults: parsed.resumeResults || {}
    };
  } catch {
    // recover from corrupted or empty file by reinitializing
    const initial = getInitialData();
    await writeData(initial);
    return initial;
  }
}

async function writeData(data) {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    await ensureData();
    const db = getDb();
    // Replace collections atomically by clearing and inserting
    if (Array.isArray(data.users)) {
      const col = db.collection('users');
      await col.deleteMany({});
      if (data.users.length) await col.insertMany(data.users.map(u => ({ ...u })));
    }
    if (Array.isArray(data.jobs)) {
      const col = db.collection('jobs');
      await col.deleteMany({});
      if (data.jobs.length) await col.insertMany(data.jobs.map(j => ({ ...j })));
    }
    if (Array.isArray(data.applications)) {
      const col = db.collection('applications');
      await col.deleteMany({});
      if (data.applications.length) await col.insertMany(data.applications.map(a => ({ ...a })));
    }
    if (Array.isArray(data.notifications)) {
      const col = db.collection('notifications');
      await col.deleteMany({});
      if (data.notifications.length) await col.insertMany(data.notifications.map(n => ({ ...n })));
    }
    if (data.resumeResults && typeof data.resumeResults === 'object') {
      const col = db.collection('resumeResults');
      await col.deleteMany({});
      const docs = Object.entries(data.resumeResults).map(([k, v]) => ({ jobId: k, ...v }));
      if (docs.length) await col.insertMany(docs);
    }
    return;
  }
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

function generateId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2,9)}`;
}

async function sendApprovalEmailNotification({ recipientEmail, jobTitle, company, message }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'CareerGenie <alerts@careergenie.app>';

  if (!apiKey) {
    return { status: 'queued', provider: 'mock', message: 'Email delivery skipped because RESEND_API_KEY is not configured.' };
  }

  const payload = {
    from: fromEmail,
    to: [recipientEmail],
    subject: `Your application for ${jobTitle} has been approved`,
    html: `<p>${message}</p><p>Company: ${company}</p>`,
    text: `${message}\nCompany: ${company}`
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Resend delivery failed: ${response.status} ${errorText}`.trim());
  }

  const data = await response.json().catch(() => ({}));
  return { status: 'sent', provider: 'resend', messageId: data.id || null };
}

async function createNotificationRecord({ recipientId, recipientEmail, jobId, jobTitle, company, message, type = 'job_approved', subject, deliveryChannel = 'email' }) {
  const now = new Date().toISOString();
  const deliveryResult = deliveryChannel === 'email'
    ? await sendApprovalEmailNotification({ recipientEmail, jobTitle, company, message })
    : { status: 'queued', provider: 'local', message: 'Notification stored locally.' };

  return {
    id: generateId('notif'),
    type,
    recipientId,
    recipientEmail,
    jobId,
    jobTitle,
    company,
    message,
    subject: subject || (type === 'application_status_update'
      ? `Update on your application for ${jobTitle}`
      : `Your application for ${jobTitle} has been approved`),
    delivery: {
      channel: deliveryChannel,
      status: deliveryResult.status,
      provider: deliveryResult.provider,
      sentAt: now,
      to: recipientEmail || recipientId,
      messageId: deliveryResult.messageId || null
    },
    createdAt: now,
    read: false
  };
}

export { sendApprovalEmailNotification };

function signToken(user) {
  const { jwtSecret } = getEnvSettings();
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '7d', algorithm: 'HS256' });
}

async function authMiddleware(req, res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ error: 'missing token' });

  const token = m[1];
  const { jwtSecret, jwtOldSecret, allowDevAuth, isProduction, frontendOrigin } = getEnvSettings();

  const clerkOptions = {};
  if (process.env.CLERK_SECRET_KEY) clerkOptions.secretKey = process.env.CLERK_SECRET_KEY;
  if (process.env.CLERK_JWT_KEY) clerkOptions.jwtKey = process.env.CLERK_JWT_KEY;
  if (frontendOrigin && frontendOrigin !== '*') {
    clerkOptions.authorizedParties = [frontendOrigin];
  }

  const clerkConfigured = Boolean(clerkOptions.secretKey || clerkOptions.jwtKey);
  if (clerkConfigured) {
    try {
      const verification = await verifyToken(token, clerkOptions);
      if (verification && verification.data) {
        req.user = verification.data;
        return next();
      }
    } catch {
      // fall through to legacy verification and dev fallback
    }
  }

  const secrets = [jwtSecret, jwtOldSecret].filter(Boolean);
  for (const secret of secrets) {
    try {
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
      req.user = payload;
      return next();
    } catch {
      // try next secret if present
    }
  }

  if (!isProduction && allowDevAuth) {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      if (decoded && decoded.sub && decoded.role) {
        req.user = decoded;
        return next();
      }
    } catch {
      // not a dev fallback token
    }
  }

  return res.status(401).json({ error: 'invalid token' });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function setupRoutes(app) {
  // Auth: register
  app.post('/api/auth/register', asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });
    const data = await readData();
    if (data.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: 'email exists' });
    let user = { id: generateId('usr'), name, email, role: role || 'student' };
    if (password) {
      const pwHash = await bcrypt.hash(password, 12);
      user.passwordHash = pwHash;
    }
    data.users.unshift(user);
    await writeData(data);
    const token = signToken(user);
    const safe = { ...user }; delete safe.passwordHash;
    return res.status(201).json({ user: safe, token });
  }));

  // Auth: login
  app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const { email, password, role } = req.body || {};
    if (!email && !role) return res.status(400).json({ error: 'email or role required' });
    const data = await readData();
    const emailValue = (email || '').toLowerCase();
    let user = data.users.find(u => u.email && u.email.toLowerCase() === emailValue);

    const { isProduction, allowDevAuth } = getEnvSettings();

    if (user && user.passwordHash && password) {
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    } else if (user && !user.passwordHash && password) {
      // User exists but has no password set (seed/demo user) — reject with helpful message
      return res.status(401).json({ error: 'invalid credentials' });
    } else if (!isProduction && allowDevAuth && role) {
      user = data.users.find(u => u.role === role);
      if (!user) return res.status(401).json({ error: 'invalid credentials' });
    } else if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    if (emailValue && !data.loginEmails) data.loginEmails = [];
    if (emailValue && !data.loginEmails.includes(emailValue)) {
      data.loginEmails.push(emailValue);
      await writeData(data);
    }

    const token = signToken(user);
    const safe = { ...user }; delete safe.passwordHash;
    return res.json({ user: safe, token });
  }));

  // Jobs list
  app.get('/api/jobs', asyncHandler(async (req, res) => {
    const data = await readData();
    res.json({ jobs: data.jobs });
  }));

  // Create job (recruiter)
  app.post('/api/jobs', authMiddleware, asyncHandler(async (req, res) => {
    const body = req.body || {};
    const data = await readData();
    // only recruiters or admins can create jobs
    if (!req.user || (req.user.role !== 'recruiter' && req.user.role !== 'admin')) return res.status(403).json({ error: 'forbidden' });
    if (!body.title || !body.company) return res.status(400).json({ error: 'title and company required' });
    const job = {
      id: generateId('job'),
      title: body.title,
      company: body.company,
      location: body.location || 'Remote',
      type: body.type || 'Full-time',
      tags: body.tags || [],
      description: body.description || '',
      salary: body.salary || 'Competitive',
      deadline: body.deadline || 'TBD',
      posterId: body.posterId || null,
      posterName: body.posterName || null,
      logo: (body.company && body.company[0]) || 'J',
      logoBg: body.logoBg || 'bg-slate-600',
      status: body.status || 'pending_approval'
    };
    data.jobs.unshift(job);
    await writeData(data);
    res.status(201).json({ job });
  }));

  app.put('/api/jobs/:jobId/status', authMiddleware, asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const { status } = req.body || {};
    if (!req.user || (req.user.role !== 'admin')) return res.status(403).json({ error: 'forbidden' });
    if (!status) return res.status(400).json({ error: 'status required' });

    const data = await readData();
    const job = data.jobs.find(j => j.id === jobId);
    if (!job) return res.status(404).json({ error: 'job not found' });

    job.status = status;
    data.jobs = data.jobs.map(j => j.id === jobId ? job : j);

    const applicantNotifications = [];
    const applications = (data.applications || []).filter(app => app.jobId === jobId);
    for (const application of applications) {
      const notification = await createNotificationRecord({
        recipientId: application.studentId,
        recipientEmail: application.studentEmail,
        jobId,
        jobTitle: job.title,
        company: job.company,
        message: `Your application for ${job.title} at ${job.company} has been approved.`
      });
      applicantNotifications.push(notification);
    }

    data.notifications = [...(data.notifications || []), ...applicantNotifications];
    await writeData(data);

    res.json({ job, notifications: applicantNotifications });
  }));

  app.get('/api/notifications', authMiddleware, asyncHandler(async (req, res) => {
    const data = await readData();
    const notifications = (data.notifications || [])
      .filter(n => n.recipientId === req.user.sub || n.recipientEmail === req.user.email)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ notifications, unreadCount: notifications.filter(n => !n.read).length });
  }));

  app.put('/api/notifications/:notificationId/read', authMiddleware, asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const data = await readData();
    const notification = (data.notifications || []).find(n => n.id === notificationId);
    if (!notification) return res.status(404).json({ error: 'notification not found' });
    if (notification.recipientId !== req.user.sub && notification.recipientEmail !== req.user.email) {
      return res.status(403).json({ error: 'forbidden' });
    }

    notification.read = true;
    data.notifications = (data.notifications || []).map(n => n.id === notificationId ? notification : n);
    await writeData(data);
    return res.json({ notification });
  }));

  // Applications
  app.get('/api/applications', authMiddleware, asyncHandler(async (req, res) => {
    const data = await readData();
    if (req.user.role === 'student') {
      const apps = data.applications.filter(a => a.studentId === req.user.sub);
      return res.json({ applications: apps });
    }
    return res.json({ applications: data.applications });
  }));

  app.post('/api/applications', authMiddleware, asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (!body.studentId || !body.jobId) return res.status(400).json({ error: 'studentId and jobId required' });
    if (req.user.role !== 'student' && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const data = await readData();
    const appObj = {
      id: generateId('app'),
      studentId: body.studentId,
      studentName: body.studentName,
      studentEmail: body.studentEmail,
      studentSkills: body.studentSkills || [],
      jobId: body.jobId,
      jobTitle: body.jobTitle || 'Unknown',
      company: body.company || 'Unknown',
      logo: body.logo || (body.company ? body.company[0] : 'J'),
      logoBg: body.logoBg || 'bg-slate-600',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Applied',
      matchScore: body.matchScore || 0,
      history: [{ status: 'Applied', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), comment: 'Application submitted.' }]
    };
    data.applications.unshift(appObj);
    await writeData(data);
    res.status(201).json({ application: appObj });
  }));

  app.put('/api/applications/:applicationId/status', authMiddleware, asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { status, comment } = req.body || {};
    if (!req.user || (req.user.role !== 'recruiter' && req.user.role !== 'admin')) return res.status(403).json({ error: 'forbidden' });
    if (!status) return res.status(400).json({ error: 'status required' });

    const data = await readData();
    const application = data.applications.find((item) => item.id === applicationId);
    if (!application) return res.status(404).json({ error: 'application not found' });

    const updatedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    application.status = status;
    application.history = [
      ...(application.history || []),
      {
        status,
        date: updatedAt,
        comment: comment || `Status updated to ${status}.`
      }
    ];

    data.applications = data.applications.map((item) => (item.id === applicationId ? application : item));
    const notificationMessage = `Your application for ${application.jobTitle} at ${application.company} is now ${String(status).toLowerCase()}. ${comment || ''}`.trim();
    const notification = await createNotificationRecord({
      recipientId: application.studentId,
      recipientEmail: application.studentEmail,
      jobId: application.jobId,
      jobTitle: application.jobTitle,
      company: application.company,
      message: notificationMessage,
      type: 'application_status_update',
      subject: `Update on your application for ${application.jobTitle}`,
      deliveryChannel: 'in-app'
    });
    data.notifications = [...(data.notifications || []), notification];
    await writeData(data);

    res.json({ application, notification });
  }));

  // Resume upload
  app.post('/api/resume', authMiddleware, asyncHandler(async (req, res) => {
    const { studentId, fileName, contentBase64 } = req.body || {};
    if (!studentId || !fileName || !contentBase64) return res.status(400).json({ error: 'studentId, fileName and contentBase64 required' });
    if (req.user.role !== 'admin' && req.user.role !== 'recruiter' && req.user.sub !== studentId) return res.status(403).json({ error: 'forbidden' });

    const jobId = generateId('scan');
    const data = await readData();
    const student = data.users.find(u => u.id === studentId);
    const uploadedAt = new Date().toISOString();

    data.resumeResults = data.resumeResults || {};
    data.resumeResults[jobId] = {
      status: 'pending',
      studentId,
      fileName,
      startedAt: uploadedAt,
      studentEmail: student?.email || null,
      studentRole: student?.role || 'student',
      uploaderId: req.user.sub,
      uploaderRole: req.user.role,
      contentBase64
    };
    await writeData(data);
    const job = { jobId, studentId, fileName, contentBase64 };
    await backgroundJobStore.enqueueJob({ type: 'resume-analysis', payload: { jobId, studentId, fileName } }, async (queuedJob) => {
      const backgroundJob = {
        jobId: queuedJob.payload.jobId,
        studentId: queuedJob.payload.studentId,
        fileName: queuedJob.payload.fileName,
        contentBase64,
      };

      if (inprocProcessing < INPROC_CONCURRENCY) {
        inprocProcessing += 1;
        processInprocJob(backgroundJob);
      } else {
        inprocQueue.push(backgroundJob);
      }

      return { status: 'queued', jobId: queuedJob.payload.jobId };
    });

    return res.status(202).json({ jobId, status: 'pending' });
  }));

  app.get('/api/resume/status/:jobId', authMiddleware, asyncHandler(async (req, res) => {
    const jobId = req.params.jobId;
    const data = await readData();
    const results = data.resumeResults || {};
    const job = results[jobId];
    if (!job) return res.status(404).json({ error: 'job not found' });
    return res.json({ job });
  }));

  app.get('/api/admin/resumes', authMiddleware, asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const data = await readData();
    const resumes = Object.entries(data.resumeResults || {}).map(([jobId, entry]) => {
      const student = data.users.find(u => u.id === entry.studentId);
      return {
        jobId,
        fileName: entry.fileName,
        status: entry.status,
        uploadedAt: entry.startedAt,
        finishedAt: entry.finishedAt || null,
        studentId: entry.studentId,
        studentName: student?.name || 'Unknown',
        studentEmail: student?.email || entry.studentEmail || null,
        studentRole: student?.role || entry.studentRole || 'student',
        uploaderRole: entry.uploaderRole || 'student',
        aiScore: entry.aiScore || entry.score || 0,
        atsScore: entry.atsScore || 0,
        score: entry.score || 0,
        analysis: entry.analysis || {},
        downloadAvailable: Boolean(entry.contentBase64)
      };
    });
    const avgAiScore = resumes.length ? Math.round(resumes.reduce((sum, item) => sum + (item.aiScore || 0), 0) / resumes.length) : 0;
    const totalResumes = resumes.length;
    const pendingResumes = resumes.filter((item) => item.status === 'pending').length;
    return res.json({ resumes, total: totalResumes, avgAiScore, pendingResumes });
  }));

  app.get('/api/admin/analytics', authMiddleware, asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const data = await readData();
    const loginEmails = Array.isArray(data.loginEmails) ? data.loginEmails : [];
    const totalUsers = Array.isArray(data.users)
      ? data.users.filter((user) => ['student', 'recruiter'].includes(user.role) && user.email && loginEmails.includes(user.email.toLowerCase())).length
      : 0;
    const totalJobs = Array.isArray(data.jobs) ? data.jobs.length : 0;
    const resumeEntries = Object.values(data.resumeResults || {});
    const resumeUploads = resumeEntries.length;
    const avgResumeScore = resumeUploads ? Math.round(resumeEntries.reduce((sum, entry) => sum + (entry.score || 0), 0) / resumeUploads) : 0;
    const avgAtsScore = resumeUploads ? Math.round(resumeEntries.reduce((sum, entry) => sum + (entry.atsScore || 0), 0) / resumeUploads) : 0;
    const pendingJobs = Array.isArray(data.jobs) ? data.jobs.filter((job) => job.status === 'pending_approval').length : 0;

    return res.json({ totalUsers, totalJobs, resumeUploads, avgResumeScore, avgAtsScore, pendingJobs, loginEmails, systemPerformance: 'Healthy', apiResponseMs: 120 });
  }));

  app.get('/api/admin/resumes/:jobId/download', authMiddleware, asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const jobId = req.params.jobId;
    const data = await readData();
    const entry = (data.resumeResults || {})[jobId];
    if (!entry || !entry.contentBase64) return res.status(404).json({ error: 'resume not found' });
    const buffer = Buffer.from(entry.contentBase64, 'base64');
    res.setHeader('Content-Disposition', `attachment; filename="${entry.fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(buffer);
  }));

  app.get('/api/users/:id', async (req, res) => {
    const id = req.params.id;
    const data = await readData();
    const user = data.users.find(u => u.id === id);
    if (user) { const safe = { ...user }; delete safe.passwordHash; return res.json({ user: safe }); }
    return res.status(404).json({ error: 'user not found' });
  });

  // Health and readiness endpoints
  app.get('/health', (req, res) => {
    return res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  app.get('/auth-status', (req, res) => {
    const clerkConfigured = Boolean(process.env.CLERK_SECRET_KEY || process.env.CLERK_JWT_KEY);
    const jwtConfigured = Boolean(getEnvSettings().jwtSecret);
    let mode = 'demo-jwt';
    if (clerkConfigured) mode = 'clerk';
    else if (jwtConfigured) mode = 'demo-jwt';

    res.json({
      clerkConfigured,
      jwtConfigured,
      allowDevAuth: getEnvSettings().allowDevAuth,
      frontendOrigin: process.env.FRONTEND_ORIGIN || null,
      mode
    });
  });

  app.get('/ready', async (req, res) => {
    try {
      if (process.env.MONGODB_URI) {
        try {
          const db = getDb();
          await db.command({ ping: 1 });
        } catch {
          return res.status(503).json({ ready: false, error: 'MongoDB not connected' });
        }
      } else {
        await ensureData();
      }
      const backlog = inprocQueue.length;
      const processing = inprocProcessing;
      const ready = backlog < 100;
      return res.json({ ready, backlog, processing, timestamp: new Date().toISOString() });
    } catch {
      return res.status(500).json({ ready: false, error: 'readiness check failed' });
    }
  });

  // Simple Prometheus-style metrics (text/plain)
  app.get('/metrics', async (req, res) => {
    try {
      const d = await readData();
      const lines = [];
      lines.push(`# HELP career_genie_process_uptime_seconds Process uptime in seconds`);
      lines.push(`# TYPE career_genie_process_uptime_seconds gauge`);
      lines.push(`career_genie_process_uptime_seconds ${process.uptime()}`);
      lines.push(`# HELP career_genie_resume_queue_length Number of queued resume jobs`);
      lines.push(`# TYPE career_genie_resume_queue_length gauge`);
      lines.push(`career_genie_resume_queue_length ${inprocQueue.length}`);
      lines.push(`# HELP career_genie_resume_processing Number of currently processing jobs`);
      lines.push(`# TYPE career_genie_resume_processing gauge`);
      lines.push(`career_genie_resume_processing ${inprocProcessing}`);
      lines.push(`# HELP career_genie_users_total Total users`);
      lines.push(`# TYPE career_genie_users_total gauge`);
      lines.push(`career_genie_users_total ${Array.isArray(d.users) ? d.users.length : 0}`);
      lines.push(`# HELP career_genie_jobs_total Total jobs`);
      lines.push(`# TYPE career_genie_jobs_total gauge`);
      lines.push(`career_genie_jobs_total ${Array.isArray(d.jobs) ? d.jobs.length : 0}`);
      res.setHeader('Content-Type', 'text/plain; version=0.0.4');
      return res.send(lines.join('\n'));
    } catch {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(500).send(`# error\n# metrics error`);
    }
  });

  app.put('/api/users/:id', authMiddleware, asyncHandler(async (req, res) => {
    const id = req.params.id; const body = req.body || {};
    if (req.user.role !== 'admin' && req.user.sub !== id) return res.status(403).json({ error: 'forbidden' });
    const data = await readData();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      data.users[idx] = { ...data.users[idx], ...body };
      await writeData(data);
      const safe = { ...data.users[idx] }; delete safe.passwordHash;
      return res.json({ user: safe });
    }
    const created = { id, ...body };
    data.users.unshift(created);
    await writeData(data);
    return res.json({ user: created });
  }));

  if (process.env.NODE_ENV === 'test') {
    app.get('/api/test/error', asyncHandler(async () => {
      throw new Error('test async error');
    }));
  }

  app.use((req, res) => res.status(404).json({ error: 'not found' }));

  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error('Mock server error', err);
    if (res.headersSent) return next(err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'internal server error' });
  });
}

if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    // Connect to MongoDB at startup if URI is provided
    if (process.env.MONGODB_URI) {
      try {
        await connectMongo(process.env.MONGODB_URI);
        // eslint-disable-next-line no-console
        console.log('MongoDB connected successfully');
        await ensureData();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
      }
    } else {
      await ensureData();
    }

    const server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on http://localhost:${PORT}`);
    });

    const shutdown = async () => {
      await closeMongo();
      server.close(() => {
        // eslint-disable-next-line no-console
        console.log('Server shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  };

  startServer();
}
