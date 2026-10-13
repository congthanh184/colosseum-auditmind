import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sources, ruleTemplate, ruleVersion, windowId, digest, generatedCode, analyzeSources } from './data.mjs';
import { proveTriple } from './proof.mjs';
import { createPullRequest, githubConfigured } from './github.mjs';

const root = resolve(import.meta.dirname, '..');
const publicDir = join(root, 'public');
const proposalDir = join(root, 'proposals');
const runDir = join(root, 'runs');
const analysisFile = join(root, 'analysis.json');
await Promise.all([mkdir(proposalDir, { recursive: true }), mkdir(runDir, { recursive: true })]);
const runs = new Map();
const type = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

function json(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
}
async function body(request) {
  let data = '';
  for await (const chunk of request) {
    data += chunk;
    if (data.length > 100_000) throw new Error('Request too large');
  }
  return data ? JSON.parse(data) : {};
}
async function proposal() {
  try { return JSON.parse(await readFile(join(proposalDir, `${ruleVersion}.json`), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function analysis() {
  try { return JSON.parse(await readFile(analysisFile, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function saveProposal(value) {
  await writeFile(join(proposalDir, `${value.version}.json`), JSON.stringify(value, null, 2));
  await writeFile(join(proposalDir, `${value.version}.mjs`), value.code);
}
async function saveRun(value) { runs.set(value.id, value); await writeFile(join(runDir, `${value.id}.json`), JSON.stringify(value, null, 2)); }
async function update(run, stage, message) {
  run.stage = stage;
  run.events.push({ at: new Date().toISOString(), stage, message });
  await saveRun(run);
}

async function executeRun(run) {
  try {
    await update(run, 'snapshot', 'Loaded one identified row from each synthetic source.');
    const { reconcile } = await import(pathToFileURL(join(proposalDir, `${run.version}.mjs`)).href);
    const result = reconcile(sources, ruleTemplate);
    run.result = result;
    await update(run, 'reconcile', `${result.checked} deposit checked; ${result.findings.length} exception found.`);
    await update(run, 'proving', 'Generating Groth16 proof for the identified transaction triple.');
    const zk = await proveTriple(run.version);
    if (zk.mismatch !== Number(!result.passed)) throw new Error('Circuit result disagrees with rule code');
    run.zk = zk;
    await update(run, 'verified', 'Groth16 proof verified; source row hashes and public outcome match the snapshot.');
    const proofDigest = digest(zk.proof);
    run.commitment = digest({ version: run.version, windowId, publicSignals: zk.publicSignals, proofDigest, result: result.passed ? 'pass' : 'fail' });
    run.proofDigest = proofDigest;
    await update(run, 'complete', 'Preview complete. Proof and row hashes are ready to inspect.');
  } catch (error) {
    run.error = error.message;
    await update(run, 'failed', error.message);
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
      return json(response, 200, { sources, rule: ruleTemplate, ruleVersion, windowId, proposal: await proposal(), analysis: await analysis(), githubConfigured: githubConfigured(), githubAccessUrl: process.env.GITHUB_APP_INSTALL_URL || null });
    }
    if (request.method === 'POST' && url.pathname === '/api/analyze') {
      const result = analyzeSources();
      await writeFile(analysisFile, JSON.stringify(result, null, 2));
      return json(response, 200, result);
    }
    if (request.method === 'POST' && url.pathname === '/api/proposal') {
      const input = await body(request);
      if (input.version !== ruleVersion) return json(response, 400, { error: 'Rule version changed; reload first.' });
      if (!await analysis()) return json(response, 400, { error: 'Analyze the sources before preparing code.' });
      let value = await proposal();
      if (!value) {
        value = { version: ruleVersion, rule: ruleTemplate, code: generatedCode, createdAt: new Date().toISOString(), github: { status: 'not_configured' } };
        await saveProposal(value);
      }
      if (githubConfigured() && value.github.status !== 'open') {
        try { value.github = await createPullRequest(value); }
        catch (error) { value.github = { status: 'failed', reason: error.message }; }
        await saveProposal(value);
      }
      return json(response, 200, value);
    }
    if (request.method === 'POST' && url.pathname === '/api/run-preview') {
      const input = await body(request);
      const proposed = await proposal();
      if (!proposed || input.version !== proposed.version) return json(response, 400, { error: 'Prepare this rule proposal before running a preview.' });
      const run = { id: randomUUID(), version: proposed.version, pr: proposed.github, createdAt: new Date().toISOString(), stage: 'queued', events: [], synthetic: true, scope: ruleTemplate.scope };
      await saveRun(run);
      setImmediate(() => executeRun(run));
      return json(response, 202, { id: run.id });
    }
    const runMatch = url.pathname.match(/^\/api\/runs\/([0-9a-f-]+)(\/evidence)?$/);
    if (request.method === 'GET' && runMatch) {
      const run = runs.get(runMatch[1]) || JSON.parse(await readFile(join(runDir, `${runMatch[1]}.json`), 'utf8'));
      if (runMatch[2]) {
        response.setHeader('Content-Disposition', `attachment; filename="auditmind-run-${run.id}.json"`);
        return json(response, 200, { ...run, sources, rule: ruleTemplate });
      }
      const { zk, ...summary } = run;
      return json(response, 200, { ...summary, zk: zk && { system: zk.system, verified: zk.verified, publicSignals: zk.publicSignals, commitments: zk.commitments, mismatch: zk.mismatch } });
    }
    if (request.method !== 'GET') return json(response, 405, { error: 'Method not allowed' });
    const path = url.pathname === '/' ? '/index.html' : url.pathname === '/demo' ? '/demo.html' : url.pathname;
    const file = resolve(publicDir, `.${path}`);
    if (!file.startsWith(publicDir + '/')) return json(response, 403, { error: 'Forbidden' });
    const contents = await readFile(file);
    response.writeHead(200, { 'Content-Type': type[extname(file)] || 'application/octet-stream' });
    response.end(contents);
  } catch (error) {
    json(response, error.code === 'ENOENT' ? 404 : 500, { error: error.code === 'ENOENT' ? 'Not found' : error.message });
  }
});
server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log(`AuditMind listening at http://127.0.0.1:${process.env.PORT || 4173}`));
