#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'server', 'data.json');
const BACKUP_DIR = path.join(process.cwd(), 'server', 'backups');

async function ensureBackupDir() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

function timestamp() {
  const d = new Date();
  return d.toISOString().replace(/[:.]/g, '-');
}

async function createBackup() {
  await ensureBackupDir();
  const name = `data-${timestamp()}.json`;
  const dest = path.join(BACKUP_DIR, name);
  await fs.copyFile(DATA_PATH, dest);
  console.log(`Backup created: ${path.relative(process.cwd(), dest)}`);
}

async function listBackups() {
  try {
    await ensureBackupDir();
    const files = await fs.readdir(BACKUP_DIR);
    files.sort().reverse();
    if (files.length === 0) {
      console.log('No backups found');
      return;
    }
    for (const f of files) console.log(f);
  } catch (e) {
    console.error('Error listing backups:', e.message || e);
    process.exit(2);
  }
}

async function restoreBackup(fileName) {
  if (!fileName) {
    console.error('Please provide a backup filename to restore.');
    process.exit(2);
  }
  const src = path.join(BACKUP_DIR, fileName);
  try {
    await fs.access(src);
    await fs.copyFile(src, DATA_PATH);
    console.log(`Restored backup ${fileName} -> server/data.json`);
  } catch (e) {
    console.error('Restore failed:', e.message || e);
    process.exit(2);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node server/backup.js --create | --list | --restore <filename>');
    return;
  }
  if (args.includes('--create')) return createBackup();
  if (args.includes('--list')) return listBackups();
  const rIdx = args.indexOf('--restore');
  if (rIdx !== -1) return restoreBackup(args[rIdx + 1]);
  console.error('Unknown arguments. Use --help for usage.');
  process.exit(2);
}

// Run main when invoked directly
main().catch(e => { console.error(e); process.exit(1); });
