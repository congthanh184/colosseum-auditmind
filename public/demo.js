const screen = document.querySelector('#screen');
const progress = [...document.querySelectorAll('#progress li')];
const state = { step: sessionStorage.getItem('auditmind-guest') ? 1 : 0, bootstrap: null, analysis: null, proposal: null, run: null, runId: null };
const githubIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" width="26" height="26" fill="currentColor"><path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.73 1.16 1.73 1.16 1 .1.37 2.08 2.64 1.46.1-.72.4-1.2.73-1.48-2.5-.28-5.13-1.25-5.13-5.57 0-1.23.44-2.23 1.15-3.02-.12-.28-.5-1.43.11-2.98 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.55.23 2.7.11 2.98.72.79 1.15 1.79 1.15 3.02 0 4.33-2.64 5.28-5.15 5.56.41.35.78 1.02.78 2.06v3.06c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z"/></svg>';
function h(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function short(value, length = 16) { return value ? `${String(value).slice(0, length)}…` : '—'; }
async function api(path, options) { const response = await fetch(path, options); const value = await response.json(); if (!response.ok) throw new Error(value.error || 'Request failed'); return value; }
function post(path, value = {}) { return api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }); }
function panel(label, title, lead, inner, action = '', cls = '') { return `<section class="panel ${cls}"><div class="panel-head"><span class="eyebrow">${label}</span><span class="panel-counter">${state.step + 1} / 7</span></div><h2>${title}</h2><p class="panel-lead">${lead}</p>${inner}${action}</section>`; }
function footer(button, note = 'Synthetic data · no production access') { return `<div class="flow-footer"><div class="footer-left">${state.step > 0 && state.step < 5 ? '<button class="back-button" id="back-step" type="button">Back</button>' : ''}<span>${note}</span></div>${button}</div>`; }
function go(step) { state.step = step; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function error(message) { const box = document.querySelector('#action-error'); if (box) box.textContent = message; }
function renderLogin() {
  screen.innerHTML = panel('Guest access', 'Enter the workbench.', 'Take a guided look at the reconciliation flow. No account or password is needed for this sample.', `<div class="guest-identity"><img src="/brand/icon-mark-transparent.png" alt=""><div><strong>AuditMind guest workspace</strong><span>Sample data only · no account created</span></div></div><p class="fine-print">Your guest session stays in this browser tab. It does not grant access to GitHub or any database.</p>`, footer('<button class="button primary" id="guest-login">Continue as Guest</button>', 'No password required'), 'login-panel');
  document.querySelector('#guest-login').onclick = () => { sessionStorage.setItem('auditmind-guest', '1'); go(1); };
}
function renderAccess() {
  const connected = state.bootstrap.githubConfigured;
  const repo = state.bootstrap.githubRepository;
  const accessUrl = state.bootstrap.githubAccessUrl;
  const identity = connected ? h(repo) : 'Sample repository';
  const connection = connected ? `<div class="connection-state connected"><span class="state-dot"></span>Repository connected: <strong>${identity}</strong></div>` : '<div class="connection-state"><span class="state-dot"></span>Demo connection · no GitHub account accessed</div>';
  const action = connected ? '<button class="button primary" id="continue">Continue with connected repository</button>' : '<button class="button primary" id="continue">Continue with sample repository</button>';
  screen.innerHTML = panel('Connect your repository', 'Give AuditMind access to your code.', 'Choose where the proposed reconciliation check would live. Review the requested access before continuing.', `<div class="access-service"><span class="github-badge">${githubIcon}</span><div class="service-path"><strong>GitHub</strong><span>Repository connection</span></div><span class="service-arrow" aria-hidden="true">→</span><img src="/brand/icon-mark-transparent.png" alt="AuditMind" class="service-mark"></div><div class="permission-list"><p>AuditMind requests permission to</p><div><strong>Read repository contents</strong><span>Inspect the project and choose a place for the rule.</span></div><div><strong>Write a branch</strong><span>Add the generated check without changing the default branch.</span></div><div><strong>Create pull requests</strong><span>Send the proposed check for your review.</span></div></div>${connection}${accessUrl && !connected ? `<p class="access-option"><a class="report-link" href="${h(accessUrl)}" target="_blank" rel="noopener noreferrer">Open GitHub authorization page</a></p>` : ''}<p class="fine-print">The sample connection previews this product flow. It does not authorize GitHub or create a live pull request.</p>`, footer(action, connected ? 'GitHub connection is available' : 'Preview connection'), 'access-panel');
  document.querySelector('#continue').onclick = () => go(2);
}
function sourceTable(title, rows, type) {
  const body = rows.map(row => `<tr data-id="${h(row.depositId)}"><td class="mono">${h(row.depositId)}</td><td class="mono">${h(row.accountId)}</td><td>${type === 'transactions' ? 'Credit' : 'Deposit'}</td><td class="numeric">${(row.amountCents / 100).toFixed(2)} ${h(row.asset)}</td></tr>`).join('');
  return `<section class="source-sheet"><div class="sheet-top"><div><h3>${title}</h3><span>20 rows · synthetic</span></div><span class="sheet-icon" aria-hidden="true">▦</span></div><div class="table-scroll"><table><thead><tr><th>Deposit ID</th><th>Account</th><th>Type</th><th class="numeric">Amount</th></tr></thead><tbody>${body}</tbody></table></div></section>`;
}
function renderSources() {
  const s = state.bootstrap.sources;
  const options = s.coinDeposit.map(row => `<option value="${h(row.depositId)}"${row.depositId === 'DEP-1050' ? ' selected' : ''}>${h(row.depositId)}</option>`).join('');
  screen.innerHTML = panel('Inspect the data', 'Two tables. One balance story.', 'Each coin deposit should create one credit transaction for the same account, asset and amount. Select a deposit ID to trace its pair.', `<div class="source-toolbar"><label for="trace-id">Trace deposit ID <select id="trace-id">${options}</select></label><button class="button primary" id="analyze">Analyze both tables</button></div><div class="source-pair">${sourceTable('coinDeposit', s.coinDeposit, 'coinDeposit')}${sourceTable('transactions', s.transactions, 'transactions')}</div><p class="table-caption">The rows are fictional. The matching deposit ID links each pair.</p><p id="action-error" class="error-text" role="alert"></p>`, '', 'wide-panel');
  const focusPair = id => { for (const sheet of document.querySelectorAll('.source-sheet')) { for (const row of sheet.querySelectorAll('tbody tr')) row.classList.toggle('selected-pair', row.dataset.id === id); const target = [...sheet.querySelectorAll('tbody tr')].find(row => row.dataset.id === id); if (target) sheet.querySelector('.table-scroll').scrollTop = target.offsetTop - 160; } };
  document.querySelector('#trace-id').onchange = event => focusPair(event.target.value);
  requestAnimationFrame(() => focusPair('DEP-1050'));
  document.querySelector('#analyze').onclick = async event => { event.currentTarget.disabled = true; event.currentTarget.textContent = 'Analyzing…'; try { state.analysis = await post('/api/analyze'); go(3); } catch (e) { event.currentTarget.disabled = false; event.currentTarget.textContent = 'Analyze both tables'; error(e.message); } };
}
function renderAnalysis() {
  const a = state.analysis;
  screen.innerHTML = panel('Source analysis', 'A credit is short by 5.00 USDC.', 'AuditMind matched the deposit IDs and compared the credit transactions. It proposes a check for you to approve.', `<div class="analysis-grid"><div class="analysis-item"><span>Join field</span><strong class="mono">${h(a.joinKey)}</strong><small>${a.sharedIds} IDs appear in both tables</small></div><div class="analysis-item"><span>Rows inspected</span><strong>20 + 20</strong><small>coinDeposit and transactions</small></div></div><div class="analysis-finding"><span class="finding-mark">!</span><div><strong>${h(a.flaggedDepositId)} · amount mismatch</strong><p>Deposit ${h(a.observed.deposit)} · credit transaction ${h(a.observed.transaction)}</p></div></div><div class="rule-statement"><span>Suggested assertion</span><p>${h(a.candidate)}</p></div><p class="fine-print">${h(a.note)}</p>`, footer('<button class="button primary" id="review">Review proposed check</button>'));
  document.querySelector('#review').onclick = () => go(4);
}
function renderCode() {
  const p = state.proposal, r = state.bootstrap.rule, github = p?.github || {};
  const intro = `<div class="rule-statement"><span>Proposed check</span><p>${h(r.description)}</p></div><ul class="condition-list">${r.checks.map(item => `<li>${h(item)}</li>`).join('')}</ul>`;
  if (!p) {
    screen.innerHTML = panel('Produce check code', 'Review the rule before it becomes code.', 'The preview will execute the exact generated file. A connected repository can receive it in a pull request.', `${intro}<p class="fine-print">This prototype generates a fixed check for the synthetic two-table scenario.</p><p id="action-error" class="error-text" role="alert"></p>`, footer('<button class="button primary" id="produce">Approve and produce code</button>'));
    document.querySelector('#produce').onclick = async event => { event.currentTarget.disabled = true; event.currentTarget.textContent = 'Producing code…'; try { state.proposal = await post('/api/proposal', { version: state.bootstrap.ruleVersion }); renderCode(); } catch (e) { error(e.message); event.currentTarget.disabled = false; event.currentTarget.textContent = 'Try again'; } };
    return;
  }
  const prStatus = github.status === 'open' ? `<a class="report-link" href="${h(github.url)}" target="_blank" rel="noopener noreferrer">Pull request #${h(github.number)} on GitHub</a>` : github.status === 'failed' ? `<span class="status-line status-error">GitHub PR failed: ${h(github.reason)}</span>` : '<span class="status-line">Proposed locally · no live PR URL</span>';
  screen.innerHTML = panel('Generated check code', 'The proposed code is ready.', 'Review the versioned file here. The preview worker will run this same version against all 20 deposits.', `<div class="code-summary"><strong>The check</strong><span>For every coin deposit, find one credit with the same deposit ID, account, asset and amount.</span></div><div class="code-meta"><span>Rule version</span><code>${h(short(p.version, 24))}</code></div><div class="proposal-line">${prStatus}</div><details class="details code-details"><summary>Inspect generated code</summary><div class="code-frame"><div class="code-frame-head"><span>rules/check.mjs</span><span>Generated from approved rule</span></div><pre><code>${h(p.code)}</code></pre></div></details>${state.bootstrap.githubConfigured && github.status !== 'open' ? '<p><button class="button secondary" id="publish">Create pull request</button></p>' : ''}<p id="action-error" class="error-text" role="alert"></p><p class="fine-print">Merging the PR would enable a later daily schedule. This prototype runs previews on demand.</p>`, footer('<button class="button primary" id="run">Run preview</button>', github.status === 'open' ? `PR #${h(github.number)} available for review` : 'Local code proposal'));
  const publish = document.querySelector('#publish');
  if (publish) publish.onclick = async () => { publish.disabled = true; publish.textContent = 'Creating PR…'; try { state.proposal = await post('/api/proposal', { version: p.version }); renderCode(); } catch (e) { error(e.message); publish.disabled = false; publish.textContent = 'Try creating PR again'; } };
  document.querySelector('#run').onclick = async event => { event.currentTarget.disabled = true; event.currentTarget.textContent = 'Starting preview…'; try { const result = await post('/api/run-preview', { version: p.version }); state.runId = result.id; go(5); poll(); } catch (e) { error(e.message); event.currentTarget.disabled = false; event.currentTarget.textContent = 'Run preview'; } };
}
const stages = [['snapshot', 'Read 20 rows from each table'], ['reconcile', 'Execute the generated check'], ['proving', 'Prove the flagged pair'], ['verified', 'Verify proof and row hashes']];
function renderPreview() {
  const current = state.run?.stage || 'queued';
  const completed = current === 'complete' ? stages.length : stages.findIndex(([key]) => key === current);
  const rows = stages.map(([key, label], i) => `<li class="${i < completed ? 'complete' : i === completed ? 'current' : ''}"><span class="worker-icon">${i < completed ? '✓' : String(i + 1).padStart(2, '0')}</span><div><strong>${label}</strong>${state.run?.events?.find(e => e.stage === key) ? `<small>${h(state.run.events.find(e => e.stage === key).message)}</small>` : ''}</div></li>`).join('');
  screen.innerHTML = panel('On-demand preview', 'Run the proposed code.', 'The worker checks all 20 deposits. It then proves the one flagged pair and verifies that proof.', `<ol class="worker-list">${rows}</ol>${current === 'failed' ? `<p class="error-text">${h(state.run.error)}</p>` : `<p class="worker-wait"><span class="spinner"></span>${h(state.run?.events?.at(-1)?.message || 'Starting the worker…')}</p>`}`, current === 'failed' ? footer('<button class="button secondary" id="back">Return to code</button>') : '');
  if (current === 'failed') document.querySelector('#back').onclick = () => go(4);
}
function renderReport() {
  const run = state.run;
  const github = run.pr?.status === 'open' ? `<a class="report-link" href="${h(run.pr.url)}" target="_blank" rel="noopener noreferrer">PR #${h(run.pr.number)}</a>` : 'Local code proposal';
  const finding = run.result.findings[0];
  screen.innerHTML = panel('Preview report', 'One discrepancy in 20 deposits.', 'The generated check found a short credit. The proof verifies the computation for that flagged pair.', `<div class="report-summary"><div><span>Reconciliation</span><strong>${run.result.findings.length} mismatch</strong><p>${h(finding?.reference)} · expected ${h(finding?.expected)} · found ${h(finding?.actual)}</p></div><div><span>Pair proof</span><strong class="verified">${run.zk?.verified ? 'Verified' : 'Not verified'}</strong><p>Groth16 · flagged deposit and credit only</p></div></div><div class="evidence-list"><div><span>Rows checked</span><strong>${h(run.result.checked)} deposits + 20 transactions</strong></div><div><span>Proposed code</span><strong>${github}</strong></div><div><span>Rule version</span><code>${h(short(run.version, 22))}</code></div><div><span>Deposit row hash</span><code>${h(short(run.zk.commitments.deposit, 25))}</code></div><div><span>Transaction row hash</span><code>${h(short(run.zk.commitments.transaction, 25))}</code></div><div><span>Proof digest</span><code>${h(short(run.proofDigest, 25))}</code></div></div><details class="details"><summary>Inspect public proof signals</summary><pre>${h(JSON.stringify(run.zk.publicSignals, null, 2))}</pre></details><p class="fine-print">The proof binds the flagged pair, rule version, date and mismatch result. It does not prove that every database row was supplied or that all 20 comparisons were proven in ZK.</p>`, footer(`<a class="button primary" href="/api/runs/${encodeURIComponent(run.id)}/evidence" download>Download full evidence</a>`, `Run ${h(short(run.id, 8))}`));
}
function render() {
  [renderLogin, renderAccess, renderSources, renderAnalysis, renderCode, renderPreview, renderReport][state.step]();
  progress.forEach((item, i) => item.className = i === state.step ? 'active' : i < state.step ? (i === 1 && !state.bootstrap.githubConfigured ? 'sampled' : 'done') : '');
  document.querySelector('#mobile-progress').textContent = `Step ${state.step + 1} of 7 · ${progress[state.step].textContent}`;
  document.querySelector('#case-strip').hidden = state.step < 2;
  screen.classList.toggle('wide-flow', state.step === 2);
}
async function poll() {
  if (!state.runId) return;
  try { state.run = await api(`/api/runs/${encodeURIComponent(state.runId)}`); if (state.run.stage === 'complete') { go(6); return; } if (state.step === 5) renderPreview(); if (state.run.stage !== 'failed') setTimeout(poll, 850); }
  catch (e) { screen.innerHTML = `<div class="panel"><p class="error-text">${h(e.message)}</p></div>`; }
}
screen.addEventListener('click', event => { if (event.target?.id === 'back-step') go(state.step - 1); });
try { state.bootstrap = await api('/api/bootstrap'); state.analysis = null; state.proposal = null; render(); }
catch (e) { screen.innerHTML = `<div class="panel"><p class="error-text">Could not load demo: ${h(e.message)}</p></div>`; }
