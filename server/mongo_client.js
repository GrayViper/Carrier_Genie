import { MongoClient } from 'mongodb';

let client = null;
let db = null;

export async function connectMongo(uri) {
  if (client) return db;
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
