import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data', 'users.json');
const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'dev_secret_please_change';
const PORT = process.env.PORT || 5178;

function readUsers() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeUsers(users) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

function sanitizeUser(u) {
  const { password, ...rest } = u;
  return {
    ...rest,
    resumeUploaded: Boolean(rest.resumeUploaded),
    resumeScore: rest.resumeScore ?? 0,
    atsScore: rest.atsScore ?? 0
  };
}

// initialise default users if none exist
function ensureDefaultUsers() {
  const users = readUsers();
  if (users.length === 0) {
    const now = new Date().toISOString();
    const defaultUsers = [
      {
        id: 'usr_student',
        name: 'Olivia Chen',
        email: 'olivia@gmail.com',
        role: 'student',
        password: bcrypt.hashSync('password123', 8),
        resumeUploaded: true,
        resumeName: 'Olivia_Chen_Resume_2026.pdf',
        resumeScore: 84,
        atsScore: 84,
        skills: ['React', 'JavaScript', 'HTML/CSS', 'UX Design', 'Figma', 'Python'],
        createdAt: now
      },
      {
        id: 'usr_recruiter',
        name: 'David Miller',
        email: 'david@stripe.com',
        role: 'recruiter',
        company: 'Stripe',
        password: bcrypt.hashSync('password123', 8),
        createdAt: now
      },
      {
        id: 'usr_admin',
        name: 'Alex Mercer',
        email: 'admin@careergenie.com',
        role: 'admin',
        password: bcrypt.hashSync('adminpass', 8),
        createdAt: now
      }
    ];
    writeUsers(defaultUsers);
    console.log('Created default users');
  }
}

ensureDefaultUsers();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// helper: authenticate token middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  const users = readUsers();
  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
  if (exists) return res.status(400).json({ error: 'User already exists' });
  const id = `usr_${Math.random().toString(36).substr(2, 9)}`;
  const hashed = bcrypt.hashSync(password, 8);
  const user = { id, name, email: email.toLowerCase(), role, password: hashed, resumeUploaded: false, resumeScore: 0, atsScore: 0, createdAt: new Date().toISOString() };
  users.push(user);
  writeUsers(users);
  const token = jwt.sign({ sub: id, role, name }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ user: sanitizeUser(user), token });
});

// login
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  const users = readUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, user.password || '');
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ user: sanitizeUser(user), token });
});

// get user profile
app.get('/api/users/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const users = readUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: sanitizeUser(user) });
});

// update user
app.put('/api/users/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const users = readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  // only allow owner or admin
  if (req.user.sub !== id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const user = users[idx];
  const allowed = ['name','company','skills','resumeUploaded','resumeName','major','graduationYear','institution'];
  allowed.forEach(k => { if (updates[k] !== undefined) user[k] = updates[k]; });
  users[idx] = user;
  writeUsers(users);
  return res.json({ user: sanitizeUser(user) });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
  app.listen(PORT, () => console.log(`Auth server listening on http://localhost:${PORT}`));
}

export { app };
