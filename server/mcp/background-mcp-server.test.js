import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { createBackgroundJobStore, createBackgroundMcpServer } from './background-mcp-server.js';

const tempFiles = [];

async function makeTempStoragePath() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'career-genie-mcp-'));
  const filePath = path.join(dir, 'jobs.json');
  tempFiles.push(filePath);
  return filePath;
}

afterEach(async () => {
  await Promise.all(tempFiles.splice(0).map((filePath) => fs.rm(filePath, { force: true }).catch(() => {})));
});

describe('background MCP server', () => {
  it('exposes queue management tools', async () => {
    const server = createBackgroundMcpServer({ storageFile: await makeTempStoragePath() });
    const tools = await server.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining(['enqueue_background_job', 'get_background_job_status', 'list_background_jobs', 'get_background_metrics'])
    );
  });

  it('enqueues and reports background job progress', async () => {
    const store = createBackgroundJobStore({ storageFile: await makeTempStoragePath() });
    const job = await store.enqueueJob({ type: 'resume-analysis', payload: { studentId: 's1' } }, async () => ({ status: 'done', result: { score: 91 } }));

    expect(job.id).toBeDefined();
    expect(job.status).toBe('queued');

    const updated = await store.processNextJob(async () => ({ status: 'done', result: { score: 91 } }));
    expect(updated?.status).toBe('done');
    expect(updated?.result.score).toBe(91);
  });
});
