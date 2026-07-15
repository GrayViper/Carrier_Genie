#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const TODO_PATH = path.join(process.cwd(), 'TODO.md');
const LOG_PATH = path.join(process.cwd(), 'docs', 'WORKFLOW_LOG.md');

async function readTodo() {
  const raw = await fs.readFile(TODO_PATH, 'utf8');
  return raw;
}

async function writeTodo(content) {
  await fs.writeFile(TODO_PATH, content);
}

async function appendLog(entry) {
  const raw = await fs.readFile(LOG_PATH, 'utf8');
  const updated = raw + `\n${entry}\n`;
  await fs.writeFile(LOG_PATH, updated);
}


async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help')) {
    console.log('Usage: node tools/update_todo.js --complete "Exact task text"');
    return;
  }
  if (args[0] === '--complete') {
    const task = args.slice(1).join(' ');
    if (!task) { console.error('Provide the exact task text to mark complete.'); process.exit(2); }
    const todo = await readTodo();
    const lines = todo.split(/\r?\n/);
    const needle = task.toLowerCase();
    let foundIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.toLowerCase().includes(needle) && l.includes('[ ]')) { foundIndex = i; break; }
    }
    if (foundIndex === -1) { console.error('Task not found or already completed.'); process.exit(2); }
    const completedLine = lines[foundIndex].replace('[ ]', '[x]');
    // Remove from original position
    lines.splice(foundIndex, 1);
    // Find or create Completed (recent) header
    let insertAt = lines.findIndex(l => l.trim() === '## Completed (recent)');
    if (insertAt === -1) {
      // append header and the completed line
      lines.push('');
      lines.push('## Completed (recent)');
      lines.push('');
      lines.push(completedLine);
    } else {
      // insert after header and any following blank line
      insertAt += 1; // position after header
      // skip a single blank line if present
      if (lines[insertAt] && lines[insertAt].trim() === '') insertAt += 1;
      lines.splice(insertAt, 0, completedLine);
    }
    const newContent = lines.join('\n');
    await writeTodo(newContent);
    const entry = `${new Date().toISOString().split('T')[0]}: Marked TODO completed: ${task}`;
    await appendLog(`- ${entry}`);
    console.log('Marked completed and updated workflow log.');
    return;
  }
  console.error('Unknown command. Use --help.');
  process.exit(2);
}

main().catch(e => { console.error(e); process.exit(1); });
