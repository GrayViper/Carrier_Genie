import fs from 'fs/promises';
import path from 'path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

function normalizeStorageFile(storageFile) {
  return storageFile || path.join(process.cwd(), 'server', 'mcp', 'background-jobs.json');
}

function createBackgroundJobStore(options = {}) {
  const storageFile = normalizeStorageFile(options.storageFile);
  const jobs = new Map();

  async function ensureStorageFile() {
    try {
      await fs.access(storageFile);
      return;
    } catch {
      await fs.mkdir(path.dirname(storageFile), { recursive: true });
      await fs.writeFile(storageFile, JSON.stringify({ jobs: [] }, null, 2));
    }
  }

  async function loadJobs() {
    await ensureStorageFile();
    const raw = await fs.readFile(storageFile, 'utf8');
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed.jobs) ? parsed.jobs : [];
    list.forEach((job) => jobs.set(job.id, job));
    return list;
  }

  async function persistJobs() {
    await ensureStorageFile();
    const serialized = JSON.stringify({ jobs: Array.from(jobs.values()) }, null, 2);
    await fs.writeFile(storageFile, serialized);
  }

  async function enqueueJob(definition, processor) {
    const job = {
      id: `bg_${Math.random().toString(36).slice(2, 10)}`,
      type: definition.type || 'generic',
      status: 'queued',
      payload: definition.payload || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    jobs.set(job.id, job);
    await persistJobs();

    if (typeof processor === 'function') {
      void processNextJob(processor).catch(() => {});
    }

    return job;
  }

  async function getJobStatus(jobId) {
    await loadJobs();
    return jobs.get(jobId) || null;
  }

  async function listJobs() {
    await loadJobs();
    return Array.from(jobs.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async function processNextJob(processor) {
    await loadJobs();
    const pending = Array.from(jobs.values()).filter((job) => job.status === 'queued').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const next = pending[0];
    if (!next) {
      return null;
    }

    next.status = 'running';
    next.updatedAt = new Date().toISOString();
    jobs.set(next.id, next);
    await persistJobs();

    try {
      const result = await processor(next);
      next.status = result?.status || 'done';
      next.result = result?.result ?? result;
      next.updatedAt = new Date().toISOString();
      jobs.set(next.id, next);
      await persistJobs();
      return next;
    } catch (error) {
      next.status = 'failed';
      next.error = error.message || 'job failed';
      next.updatedAt = new Date().toISOString();
      jobs.set(next.id, next);
      await persistJobs();
      throw error;
    }
  }

  async function getMetrics() {
    await loadJobs();
    const allJobs = Array.from(jobs.values());
    const queued = allJobs.filter((job) => job.status === 'queued').length;
    const running = allJobs.filter((job) => job.status === 'running').length;
    const done = allJobs.filter((job) => job.status === 'done').length;
    const failed = allJobs.filter((job) => job.status === 'failed').length;

    return { queued, running, done, failed, total: allJobs.length };
  }

  return { enqueueJob, getJobStatus, listJobs, processNextJob, getMetrics };
}

function createBackgroundMcpServer(options = {}) {
  const store = createBackgroundJobStore(options);
  const server = new Server(
    {
      name: 'career-genie-background-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const tools = [
    {
      name: 'enqueue_background_job',
      description: 'Queue a background job for later processing.',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          payload: { type: 'object' },
        },
        required: ['type'],
      },
    },
    {
      name: 'get_background_job_status',
      description: 'Look up the status of a queued or completed background job.',
      inputSchema: {
        type: 'object',
        properties: {
          jobId: { type: 'string' },
        },
        required: ['jobId'],
      },
    },
    {
      name: 'list_background_jobs',
      description: 'List all tracked background jobs.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_background_metrics',
      description: 'Return queue metrics for background processing.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    if (name === 'enqueue_background_job') {
      const job = await store.enqueueJob({ type: args.type, payload: args.payload || {} }, async (queuedJob) => ({
        accepted: true,
        jobId: queuedJob.id,
        type: queuedJob.type,
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify(job, null, 2) }],
      };
    }

    if (name === 'get_background_job_status') {
      const job = await store.getJobStatus(args.jobId);
      return {
        content: [{ type: 'text', text: JSON.stringify(job, null, 2) }],
      };
    }

    if (name === 'list_background_jobs') {
      const jobs = await store.listJobs();
      return {
        content: [{ type: 'text', text: JSON.stringify(jobs, null, 2) }],
      };
    }

    if (name === 'get_background_metrics') {
      const metrics = await store.getMetrics();
      return {
        content: [{ type: 'text', text: JSON.stringify(metrics, null, 2) }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  return {
    ...server,
    listTools: async () => ({ tools }),
    connect: (transport) => server.connect(transport),
  };
}

async function main() {
  const server = createBackgroundMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export { createBackgroundJobStore, createBackgroundMcpServer };
