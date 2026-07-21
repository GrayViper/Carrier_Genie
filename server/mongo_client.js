import dns from 'node:dns';
import { MongoClient } from 'mongodb';

let client = null;
let db = null;

export async function connectMongo(uri) {
  if (client) return db;
  // Ensure DNS SRV lookup resolves on local networks
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // ignore if DNS override is not permitted
  }
  client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  await client.connect();
  db = client.db();
  return db;
}

export function getDb() {
  if (!db) throw new Error('MongoDB not connected');
  return db;
}

export async function closeMongo() {
  if (client) {
    await client.close();
    client = null; db = null;
  }
}
