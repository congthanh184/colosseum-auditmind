const screen = document.querySelector('#screen');
const progress = [...document.querySelectorAll('#progress li')];
const state = { step: 0, bootstrap: null, analysis: null, proposal: null, run: null, runId: null };

function h(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function short(value, length = 16) { return value ? `${String(value).slice(0, length)}…` : '—'; }
async function api(path, options) { const response = await fetch(path, options); const value = await response.json(); if (!response.ok) throw new Error(value.error || 'Request failed'); return value; }
function post(path, value = {}) { return api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }); }
function panel(label, title, lead, inner, action = '') { return `<section class="panel"><div class="panel-head"><span class="eyebrow">${label}</span><span class="panel-counter">${state.step + 1} / 6</span></div><h2>${title}</h2><p class="panel-lead">${lead}</p>${inner}${action}</section>`; }
function footer(button, note = 'Synthetic data · no production access') { return `<div class="flow-footer"><div class="footer-left">${state.step > 0 && state.step < 4 ? '<button class="back-button" id="back-step" type="button">Back</button>' : ''}<span>${note}</span></div>${button}</div>`; }
function go(step) { state.step = step; progress.forEach((item, i) => item.className = i === step ? 'active' : i < step ? 'done' : ''); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function error(message) { const box = document.querySelector('#action-error'); if (box) box.textContent = message; }

function renderAccess() {
  const connected = state.bootstrap.githubConfigured;
  const accessLink = state.bootstrap.githubAccessUrl;
  const status = connected ? '<span class="status-line status-good">GitHub repository configured</span>' : '<span class="status-line">No GitHub repository connected</span>';
  screen.innerHTML = panel('Repository access', 'First, ask to work in the repository.', 'AuditMind needs repository access so it can propose the check as a pull request. The data preview below uses fictional records and can be explored locally.', `<div class="permission-sheet"><div><strong>What AuditMind would need</strong><ul><li>Read repository metadata and existing files</li><li>Create a branch containing the generated check</li><li>Open a pull request for your review</li></ul></div><div class="permission-status">${status}<p>${connected ? 'Pull requests can be created from this demo.' : 'You said you will set up the GitHub repository later. The local flow continues without claiming a PR was opened.'}</p></div></div>${accessLink && !connected ? `<p><a class="report-link" href="${h(accessLink)}" target="_blank" rel="noopener noreferrer">Open GitHub access page</a></p>` : ''}`, footer(`<button class="button primary" id="continue">${connected ? 'Continue with GitHub' : 'Continue in local demo'}</button>`, 'No credentials are requested inside this demo.'));
  document.querySelector('#continue').onclick = () => go(1);
}
function sourceRow(title, row, highlight = false) { return `<div class="data-row"><span class="data-source">${title}</span><span class="mono">${h(row.reference)}</span><strong class="${highlight ? 'issue' : ''}">${h(row.asset)}</strong><span>${(row.amountCents / 100).toFixed(2)}</span></div>`; }
function renderSources() {
  const s = state.bootstrap.sources;
  screen.innerHTML = panel('Source inspection', 'Three systems describe one deposit.', 'These are synthetic database extracts. AuditMind reads their schemas and sample rows before suggesting a check.', `<div class="data-table"><div class="data-row data-header"><span>Source</span><span>Reference</span><span>Asset</span><span>Amount</span></div>${sourceRow('Deposit events', s.deposits[0])}${sourceRow('Customer credits', s.credits[0], true)}${sourceRow('Account ledger', s.ledger[0])}</div><p class="table-caption">All three rows share reference DEP-1042. The credit uses a different asset.</p><p id="action-error" class="error-text" role="alert"></p>`, footer('<button class="button primary" id="analyze">Analyze the sources</button>'));
  document.querySelector('#analyze').onclick = async event => { event.currentTarget.disabled = true; event.currentTarget.textContent = 'Analyzing…'; try { state.analysis = await post('/api/analyze'); go(2); } catch (e) { event.currentTarget.disabled = false; event.currentTarget.textContent = 'Analyze the sources'; error(e.message); } };
}
function renderAnalysis() {
  const a = state.analysis;
  screen.innerHTML = panel('Source analysis', 'AuditMind found a join and a disagreement.', 'The analysis reads the actual synthetic rows shown in the previous step. It proposes a check; you decide whether that check is right.', `<div class="analysis-grid"><div class="analysis-item"><span>Likely join key</span><strong class="mono">${h(a.joinKey)}</strong><small>${a.sharedReference ? 'Present in all three sources' : 'Not shared across all sources'}</small></div><div class="analysis-item"><span>Sources inspected</span><strong>${a.tables.length} tables</strong><small>${a.tables.map(t => `${t.rowCount} row in ${t.name}`).join(' · ')}</small></div></div><div class="analysis-finding"><span class="finding-mark">!</span><div><strong>Asset disagreement in DEP-1042</strong><p>Deposit ${h(a.observed.deposit)} · Credit ${h(a.observed.credit)} · Ledger ${h(a.observed.ledger)}</p></div></div><div class="rule-statement"><span>Suggested assertion</span><p>${h(a.candidate)}</p></div><p class="fine-print">${h(a.note)}</p>`, footer('<button class="button primary" id="review">Review the check to generate</button>'));
  document.querySelector('#review').onclick = () => go(3);
}
function renderCode() {
  const p = state.proposal, r = state.bootstrap.rule, github = p?.github || {};
  const intro = `<div class="rule-statement"><span>Approved check</span><p>${h(r.description)}</p></div><ul class="condition-list">${r.checks.map(item => `<li>${h(item)}</li>`).join('')}</ul>`;
  if (!p) {
    screen.innerHTML = panel('Generate check code', 'Review it before it becomes a PR.', 'The generated file will check the shared reference, cardinality, asset and amount. The preview worker will execute this exact file.', `${intro}<p class="fine-print">The first version uses a fixed rule template for this synthetic scenario; it does not generate arbitrary checks for any database.</p><p id="action-error" class="error-text" role="alert"></p>`, footer('<button class="button primary" id="produce">Approve and produce code</button>'));
    document.querySelector('#produce').onclick = async event => { event.currentTarget.disabled = true; event.currentTarget.textContent = 'Producing code…'; try { state.proposal = await post('/api/proposal', { version: state.bootstrap.ruleVersion }); renderCode(); } catch (e) { error(e.message); event.currentTarget.disabled = false; event.currentTarget.textContent = 'Try again'; } };
    return;
  }
  const prStatus = github.status === 'open' ? `<a class="report-link" href="${h(github.url)}" target="_blank" rel="noopener noreferrer">Pull request #${h(github.number)} on GitHub</a>` : github.status === 'failed' ? `<span class="status-line status-error">GitHub PR failed: ${h(github.reason)}</span>` : '<span class="status-line">Local proposal only · GitHub not connected</span>';
  screen.innerHTML = panel('Generated check code', 'The proposed code is ready.', 'The worker preview uses the same versioned code shown here. You can inspect it without leaving AuditMind.', `<div class="code-meta"><span>Rule version</span><code>${h(short(p.version, 24))}</code></div><div class="code-frame"><div class="code-frame-head"><span>rules/check.mjs</span><span>Generated from approved rule</span></div><pre><code>${h(p.code)}</code></pre></div><div class="proposal-line">${prStatus}</div>${state.bootstrap.githubConfigured && github.status !== 'open' ? '<p><button class="button secondary" id="publish">Create pull request now</button></p>' : ''}<p id="action-error" class="error-text" role="alert"></p><p class="fine-print">Opening a PR needs a configured GitHub repository. Merging it would be the gate for a later daily schedule; this prototype runs previews on demand.</p>`, footer('<button class="button primary" id="run">Run preview of this code</button>', github.status === 'open' ? `PR #${h(github.number)} is available for review` : 'No PR URL exists yet'));
  const publish = document.querySelector('#publish');
  if (publish) publish.onclick = async () => { publish.disabled = true; publish.textContent = 'Creating PR…'; try { state.proposal = await post('/api/proposal', { version: p.version }); renderCode(); } catch (e) { error(e.message); publish.disabled = false; publish.textContent = 'Try creating PR again'; } };
  document.querySelector('#run').onclick = async event => { event.currentTarget.disabled = true; event.currentTarget.textContent = 'Starting preview…'; try { const result = await post('/api/run-preview', { version: p.version }); state.runId = result.id; go(4); poll(); } catch (e) { error(e.message); event.currentTarget.disabled = false; event.currentTarget.textContent = 'Run preview of this code'; } };
}
const stages = [['snapshot', 'Read the three source rows'], ['reconcile', 'Execute the generated check'], ['proving', 'Generate a computation proof'], ['verified', 'Verify proof and row hashes']];
function renderPreview() {
  const current = state.run?.stage || 'queued';
  const completed = current === 'complete' ? stages.length : stages.findIndex(([key]) => key === current);
  const rows = stages.map(([key, label], i) => `<li class="${i < completed ? 'complete' : i === completed ? 'current' : ''}"><span class="worker-icon">${i < completed ? '✓' : String(i + 1).padStart(2, '0')}</span><div><strong>${label}</strong>${state.run?.events?.find(e => e.stage === key) ? `<small>${h(state.run.events.find(e => e.stage === key).message)}</small>` : ''}</div></li>`).join('');
  screen.innerHTML = panel('On-demand preview', 'Now run the proposed code.', 'Proof generation comes after the check has evaluated the three source rows. The status below follows the worker’s actual events.', `<ol class="worker-list">${rows}</ol>${current === 'failed' ? `<p class="error-text">${h(state.run.error)}</p>` : `<p class="worker-wait"><span class="spinner"></span>${h(state.run?.events?.at(-1)?.message || 'Starting the worker…')}</p>`}`, current === 'failed' ? footer('<button class="button secondary" id="back">Return to code</button>') : '');
  if (current === 'failed') document.querySelector('#back').onclick = () => go(3);
}
function renderReport() {
  const run = state.run;
  const github = run.pr?.status === 'open' ? `<a class="report-link" href="${h(run.pr.url)}" target="_blank" rel="noopener noreferrer">PR #${h(run.pr.number)}</a>` : 'Local proposal';
  const finding = run.result.findings[0];
  screen.innerHTML = panel('Preview report', 'The proof verifies a failed check.', 'The computation was verified. The business records still disagree—those are separate statements.', `<div class="report-summary"><div><span>Reconciliation</span><strong>${run.result.findings.length} mismatch</strong><p>${h(finding?.source || 'Record')} · expected ${h(finding?.expected)} · found ${h(finding?.actual)}</p></div><div><span>Computation proof</span><strong class="verified">${run.zk?.verified ? 'Verified' : 'Not verified'}</strong><p>Groth16 · one identified transaction triple</p></div></div><div class="evidence-list"><div><span>Proposed code</span><strong>${github}</strong></div><div><span>Rule version</span><code>${h(short(run.version, 22))}</code></div><div><span>Deposit row hash</span><code>${h(short(run.zk.commitments.deposit, 25))}</code></div><div><span>Credit row hash</span><code>${h(short(run.zk.commitments.credit, 25))}</code></div><div><span>Ledger row hash</span><code>${h(short(run.zk.commitments.ledger, 25))}</code></div><div><span>Proof digest</span><code>${h(short(run.proofDigest, 25))}</code></div></div><details class="details"><summary>Inspect public proof signals</summary><pre>${h(JSON.stringify(run.zk.publicSignals, null, 2))}</pre></details><p class="fine-print">This proof binds the identified rows, rule version, window and mismatch outcome. It does not prove completeness of a database or that these synthetic rows came from a real business.</p>`, footer(`<a class="button primary" href="/api/runs/${encodeURIComponent(run.id)}/evidence" download>Download complete evidence</a>`, `Run ${h(short(run.id, 8))}`));
}
function render() { [renderAccess, renderSources, renderAnalysis, renderCode, renderPreview, renderReport][state.step](); }
async function poll() {
  if (!state.runId) return;
  try { state.run = await api(`/api/runs/${encodeURIComponent(state.runId)}`); if (state.run.stage === 'complete') { go(5); return; } if (state.step === 4) renderPreview(); if (state.run.stage !== 'failed') setTimeout(poll, 850); }
  catch (e) { screen.innerHTML = `<div class="panel"><p class="error-text">${h(e.message)}</p></div>`; }
}
screen.addEventListener('click', event => { if (event.target?.id === 'back-step') go(state.step - 1); });
try { state.bootstrap = await api('/api/bootstrap'); state.analysis = state.bootstrap.analysis; state.proposal = state.bootstrap.proposal; render(); }
catch (e) { screen.innerHTML = `<div class="panel"><p class="error-text">Could not load demo: ${h(e.message)}</p></div>`; }
