import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');

export function githubConfigured() {
  return Boolean(process.env.GITHUB_TOKEN && /^[^/]+\/[^/]+$/.test(process.env.GITHUB_REPOSITORY || ''));
}

async function api(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${body.message || 'request failed'}`);
  return body;
}

export async function createPullRequest(proposal) {
  if (!githubConfigured()) throw new Error('GitHub repository and token are not configured');
  const repo = process.env.GITHUB_REPOSITORY;
  const info = await api(`/repos/${repo}`);
  const base = info.default_branch;
  const branch = `auditmind/rule-${proposal.version.slice(0, 12)}`;
  const ref = await api(`/repos/${repo}/git/ref/heads/${encodeURIComponent(base)}`);
  try {
    await api(`/repos/${repo}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: ref.object.sha }) });
  } catch (error) {
    if (!String(error.message).includes('422')) throw error;
  }
  const ruleFile = `rules/${proposal.rule.id}.json`;
  const codeFile = `rules/check.mjs`;
  const contents = [
    [ruleFile, JSON.stringify({ ...proposal.rule, version: proposal.version }, null, 2) + '\n'],
    [codeFile, proposal.code],
    ['circuit/reconcile.circom', await readFile(join(root, 'circuit/reconcile.circom'), 'utf8')]
  ];
  for (const [path, content] of contents) {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    let sha;
    try { sha = (await api(`/repos/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`)).sha; } catch (error) {
      if (!String(error.message).includes('404')) throw error;
    }
    await api(`/repos/${repo}/contents/${encodedPath}`, {
      method: 'PUT',
      body: JSON.stringify({ message: `Add AuditMind reconciliation rule ${proposal.version.slice(0, 12)}`, content: Buffer.from(content).toString('base64'), branch, ...(sha ? { sha } : {}) })
    });
  }
  let pull;
  try {
    pull = await api(`/repos/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Add daily deposit reconciliation rule', head: branch, base, body: `Proposed AuditMind rule version: \`${proposal.version}\`.\n\nChecks a deposit, customer credit and ledger entry for a shared reference, asset and amount. The sample sources are synthetic. Preview this rule version in AuditMind before merging.` })
    });
  } catch (error) {
    if (!String(error.message).includes('422')) throw error;
    const existing = await api(`/repos/${repo}/pulls?state=open&head=${encodeURIComponent(repo.split('/')[0] + ':' + branch)}`);
    pull = existing[0];
    if (!pull) throw error;
  }
  return { status: 'open', number: pull.number, url: pull.html_url, branch, commit: pull.head.sha, repository: repo };
}
