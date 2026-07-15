#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { MongoClient } from 'mongodb';

const DATA_PATH = path.join(process.cwd(), 'server', 'data.json');

async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw || '{}');
}

async function migrate(uri) {
  if (!uri) throw new Error('Provide MongoDB URI as first argument');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  try {
    const data = await readData();
    // Map arrays to collections
    if (Array.isArray(data.users)) {
      const usersCol = db.collection('users');
      await usersCol.deleteMany({});
      await usersCol.insertMany(data.users.map(u => ({ ...u })));
      console.log(`Imported ${data.users.length} users`);
    }
    if (Array.isArray(data.jobs)) {
      const jobsCol = db.collection('jobs');
      await jobsCol.deleteMany({});
      await jobsCol.insertMany(data.jobs.map(j => ({ ...j })));
      console.log(`Imported ${data.jobs.length} jobs`);
    }
    if (Array.isArray(data.applications)) {
      const appsCol = db.collection('applications');
      await appsCol.deleteMany({});
      await appsCol.insertMany(data.applications.map(a => ({ ...a })));
      console.log(`Imported ${data.applications.length} applications`);
    }
    if (data.resumeResults && typeof data.resumeResults === 'object') {
      const rrCol = db.collection('resumeResults');
      await rrCol.deleteMany({});
      const docs = Object.entries(data.resumeResults).map(([k, v]) => ({ jobId: k, ...v }));
      if (docs.length) await rrCol.insertMany(docs);
      console.log(`Imported ${docs.length} resumeResults`);
    }
    console.log('Migration complete. Consider creating indexes (users.email, applications.jobId).');
    // create recommended indexes for production
    await createIndexes(db);
  } finally {
    await client.close();
  }
}

async function createIndexes(db) {
  try {
    console.log('Creating indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('jobs').createIndex({ status: 1 });
    await db.collection('jobs').createIndex({ tags: 1 });
    await db.collection('applications').createIndex({ studentId: 1 });
    await db.collection('applications').createIndex({ jobId: 1 });
    await db.collection('resumeResults').createIndex({ jobId: 1 }, { unique: true, sparse: true });
    console.log('Indexes created.');
  } catch (e) {
    console.error('Index creation failed:', e.message || e);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help')) {
    console.log('Usage: node server/mongo_adapter.js <mongodb-uri>');
    return;
  }
  if (args[0] === '--create-indexes') {
    const uri = args[1] || process.env.MONGODB_URI;
    if (!uri) { console.error('Provide a MongoDB URI as the second argument or set MONGODB_URI'); process.exit(2); }
    const client = new MongoClient(uri);
    try {
      await client.connect();
      const db = client.db();
      await createIndexes(db);
    } catch (e) {
      console.error('Index creation failed:', e.message || e);
      process.exit(1);
    } finally {
      await client.close();
    }
    return;
  }

  const uri = args[0] || process.env.MONGODB_URI;
  if (!uri) { console.error('Provide MongoDB URI (argument or MONGODB_URI)'); process.exit(2); }
  try {
    await migrate(uri);
  } catch (e) {
    console.error('Migration failed:', e.message || e);
    process.exit(1);
  }
}

if (import.meta.url.startsWith('file:')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
