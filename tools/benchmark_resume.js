// Simple benchmark script for resume analysis endpoint
// Usage: node tools/benchmark_resume.js

const fetch = globalThis.fetch || require('node-fetch');

const API = process.env.VITE_API_BASE || 'http://localhost:5178';
const CONCURRENCY = Number(process.env.BENCH_CONCURRENCY) || 5;
const REQUESTS = Number(process.env.BENCH_REQUESTS) || 10;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function start() {
  console.log(`Benchmarking ${REQUESTS} resume uploads against ${API} with concurrency ${CONCURRENCY}`);
  const times = [];

  // obtain a dev token via role-based login (mock server supports role fallback)
  let devToken = 'bench';
  try {
    const tokenResp = await fetch(`${API}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'student' })
    });
    const tokenJson = await tokenResp.json();
    if (tokenJson && tokenJson.token) devToken = tokenJson.token;
    // use returned user id as base student id so uploads are authorized
    var baseStudentId = tokenJson && tokenJson.user && tokenJson.user.id ? tokenJson.user.id : 'usr_student';
  } catch {
    console.warn('Could not get dev token, falling back to bench header');
    var baseStudentId = 'usr_student';
  }
  console.log('Using dev token:', devToken);

  for (let i = 0; i < REQUESTS; i += CONCURRENCY) {
    const batch = [];
    for (let j = 0; j < CONCURRENCY && i + j < REQUESTS; j++) {
    const idx = i + j;
    const studentId = baseStudentId; // use same logged-in student id for authorization
      const fileName = `resume_${idx}.pdf`;
      const startAt = Date.now();
      batch.push((async () => {
        // create or ensure user via auth register fallback (dev server allows role login)
        // call resume endpoint
        const resp = await fetch(`${API}/api/resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${devToken}` },
          body: JSON.stringify({ studentId, fileName })
        });
        const j = await resp.json();
        if (!j.jobId) {
          console.warn(`Request ${idx} did not return jobId. status=${resp.status}`, j);
          return null;
        }
        if (!j.jobId) return null;
        // poll status
        let status = null;
        const t0 = Date.now();
        while (true) {
          await sleep(300);
          const s = await fetch(`${API}/api/resume/status/${j.jobId}`, { headers: { Authorization: `Bearer ${devToken}` } });
          if (s.status === 404) { status = { error: 'not found' }; break; }
          const body = await s.json();
          // debug
          // console.log('poll', j.jobId, body);
          if (body.job && (body.job.status === 'done' || body.job.status === 'error')) { status = body.job; break; }
          if (Date.now() - t0 > 30000) { status = { error: 'timeout' }; break; }
        }
        const took = Date.now() - startAt;
        console.log(`Request ${idx} completed in ${took}ms, status=${status.status||status.error}`);
        return took;
      })());
    }
    const results = await Promise.all(batch);
    for (const r of results) if (typeof r === 'number') times.push(r);
  }

  if (times.length) {
    const sum = times.reduce((a,b)=>a+b,0);
    console.log(`Completed ${times.length} requests. Avg=${Math.round(sum/times.length)}ms, min=${Math.min(...times)}, max=${Math.max(...times)}`);
  } else {
    console.log('No timings recorded.');
  }
}

start().catch(err => { console.error(err); process.exit(1); });
