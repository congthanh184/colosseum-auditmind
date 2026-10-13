const loginRoot = document.querySelector('#login-root');
const dashboard = document.querySelector('#dashboard');
const screen = document.querySelector('#screen');
const setupButtons = [...document.querySelectorAll('.side-step')];
const reviewNav = document.querySelector('#review-nav');
const labels = ['', 'GitHub access', 'Analyze codebase', 'Core tables', 'Questions', 'Approval', 'Code & mock PR', 'Done'];
const state = { guest: sessionStorage.getItem('auditmind-guest') === '1', step: 1, maxStep: 1, view: 'setup', bootstrap: null, analysis: null, proposal: null, reviewSources: null, run: null, runId: null, selectedId: 'DEP-1050' };
const githubIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" width="28" height="28" fill="currentColor"><path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.73 1.16 1.73 1.16 1 .1.37 2.08 2.64 1.46.1-.72.4-1.2.73-1.48-2.5-.28-5.13-1.25-5.13-5.57 0-1.23.44-2.23 1.15-3.02-.12-.28-.5-1.43.11-2.98 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.55.23 2.7.11 2.98.72.79 1.15 1.79 1.15 3.02 0 4.33-2.64 5.28-5.15 5.56.41.35.78 1.02.78 2.06v3.06c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z"/></svg>';
function h(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function short(value, length = 18) { return value ? `${String(value).slice(0, length)}…` : '—'; }
async function api(path, options) { const response = await fetch(path, options); const value = await response.json(); if (!response.ok) throw new Error(value.error || 'Request failed'); return value; }
function post(path, value = {}) { return api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }); }
function title(name, description, badge = '') { return `<div class="work-heading"><div><h1>${name}</h1><p>${description}</p></div>${badge ? `<span class="heading-badge">${badge}</span>` : ''}</div>`; }
function actionRow(button, note = '') { return `<div class="work-actions"><span>${note}</span>${button}</div>`; }
function showError(message) { const element = document.querySelector('#action-error'); if (element) element.textContent = message; }
function renderShell() {
  loginRoot.hidden = state.guest;
  dashboard.hidden = !state.guest;
  if (!state.guest) return renderLogin();
  setupButtons.forEach(button => {
    const step = Number(button.dataset.step);
    button.disabled = step > state.maxStep;
    button.classList.toggle('active', state.view === 'setup' && step === state.step);
    button.classList.toggle('complete', step < state.maxStep);
  });
  reviewNav.disabled = state.maxStep < 7;
  reviewNav.classList.toggle('active', state.view === 'review');
  document.querySelector('#breadcrumb').textContent = state.view === 'review' ? 'Run Review / Sample run' : `Setup / ${labels[state.step]}`;
  if (state.view === 'review') renderReview();
  else [null, renderAccess, renderAnalysis, renderTables, renderQuestions, renderApproval, renderProposal, renderDone][state.step]();
}
function advance(step) { state.view = 'setup'; state.step = step; state.maxStep = Math.max(state.maxStep, step); renderShell(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function renderLogin() {
  loginRoot.innerHTML = `<div class="login-intro"><img src="/brand/icon-mark-transparent.png" alt=""><span>AuditMind workspace</span></div><section class="login-card"><h1>Sign in to the demo</h1><p>Explore the setup flow and a separate reconciliation run using a fictional project.</p><div class="guest-identity"><strong>Guest workspace</strong><span>No account or password is needed.</span></div><button type="button" class="button primary" id="guest-login">Continue as Guest</button><small>This guest session does not connect to GitHub or a real database.</small></section>`;
  document.querySelector('#guest-login').onclick = () => { sessionStorage.setItem('auditmind-guest', '1'); state.guest = true; renderShell(); };
}
function renderAccess() {
  screen.innerHTML = title('Connect a repository', 'AuditMind would request the following access before analyzing a project.', 'Sample connection') + `<div class="work-split"><section class="work-card permission-card"><div class="connection-brand"><span>${githubIcon}</span><strong>GitHub</strong><span class="connection-chevron" aria-hidden="true">→</span><img src="/brand/icon-mark-transparent.png" alt="AuditMind"></div><h2>Repository permissions</h2><div class="permission-row"><strong>Read code and schema files</strong><span>Find database models and balance logic.</span></div><div class="permission-row"><strong>Create a branch</strong><span>Keep the proposed rule separate from the default branch.</span></div><div class="permission-row"><strong>Open a pull request</strong><span>Present generated code for review.</span></div></section><aside class="context-note"><strong>In this guided demo</strong><p>The connection is simulated. The next step scans three fixture files from <code>${h(state.bootstrap.sampleRepository)}</code>. No GitHub account is authorized.</p></aside></div>` + actionRow('<button class="button primary" id="sample-access">Continue with sample access</button>', 'No live repository permissions are changed.');
  document.querySelector('#sample-access').onclick = () => advance(2);
}
function renderAnalysis() {
  const a = state.analysis;
  screen.innerHTML = title('Analyze the codebase', 'Inspect the sample schema and service files to locate the deposit and credit paths.', 'Sample codebase') + `<section class="work-card"><div class="section-line"><strong>${h(state.bootstrap.sampleRepository)}</strong><span>3 fixture files</span></div><div class="file-list"><div><span class="file-type">SQL</span><code>db/schema.sql</code><span>Database tables</span></div><div><span class="file-type">TS</span><code>src/deposit-service.ts</code><span>Deposit write path</span></div><div><span class="file-type">TS</span><code>src/balance-service.ts</code><span>Credit write path</span></div></div>${a ? `<div class="scan-result"><strong>Scan complete</strong><p>Found ${a.tables.length} core tables. The services write deposits to <code>coinDeposit</code> and balance credits to <code>transactions</code>.</p></div>` : '<p class="work-hint">Run the scan to see what the sample codebase reveals.</p>'}<p id="action-error" class="error-text" role="alert"></p></section>` + actionRow(a ? '<button class="button primary" id="next-tables">View core tables</button>' : '<button class="button primary" id="scan-codebase">Analyze sample codebase</button>', a ? 'The scan read local fixture files.' : 'No live codebase is accessed.');
  if (a) document.querySelector('#next-tables').onclick = () => advance(3);
  else document.querySelector('#scan-codebase').onclick = async event => { event.currentTarget.disabled = true; event.currentTarget.textContent = 'Analyzing…'; try { state.analysis = await post('/api/analyze-codebase'); renderAnalysis(); } catch (err) { event.currentTarget.disabled = false; event.currentTarget.textContent = 'Try analysis again'; showError(err.message); } };
}
function renderTables() {
  const a = state.analysis;
  const card = table => `<section class="schema-card"><div class="schema-card-head"><strong>${h(table.name)}</strong><span>${table.fields.length} fields</span></div><ul>${table.fields.map(field => `<li><code>${h(field)}</code></li>`).join('')}</ul></section>`;
  screen.innerHTML = title('Core tables to match', 'The codebase points to two records that should agree after a deposit is confirmed.', '2 tables') + `<div class="schema-grid">${a.tables.map(card).join('')}</div><div class="join-note"><span>Join candidate</span><strong><code>${h(a.relationship.from)}</code> = <code>${h(a.relationship.to)}</code></strong><p>Only <code>${h(a.relationship.filter)}</code> rows count as balance increases.</p></div>` + actionRow('<button class="button primary" id="next-questions">See reconciliation questions</button>', 'Schema understanding comes before row comparison.');
  document.querySelector('#next-questions').onclick = () => advance(4);
}
function questionList() { return `<ol class="question-list">${state.bootstrap.questions.map((question, i) => `<li><span>Q${i + 1}</span><div><strong>${h(question.title)}</strong><small>${question.fields.map(h).join(' · ')}</small></div></li>`).join('')}</ol>`; }
function renderQuestions() {
  screen.innerHTML = title('Questions AuditMind can answer', 'These checks come from the relationship between the two tables. Review them before approving a rule.', '3 questions') + `<section class="work-card">${questionList()}<p class="work-hint">The next screen asks for explicit approval. Nothing is generated yet.</p></section>` + actionRow('<button class="button primary" id="next-approval">Review for approval</button>', 'Proposed questions · awaiting approval');
  document.querySelector('#next-approval').onclick = () => advance(5);
}
function renderApproval() {
  screen.innerHTML = title('Approve the reconciliation rule', 'Confirm that these are the questions the generated check should answer.', 'Approval required') + `<section class="work-card">${questionList()}<label class="approval-check"><input type="checkbox" id="approve-check"><span>I approve these three questions for the sample rule.</span></label><p id="action-error" class="error-text" role="alert"></p></section>` + actionRow('<button class="button primary" id="approve-generate" disabled>Approve and generate code</button>', 'The mock pull request is created only after approval.');
  const checkbox = document.querySelector('#approve-check'), button = document.querySelector('#approve-generate');
  checkbox.onchange = () => { button.disabled = !checkbox.checked; };
  button.onclick = async () => {
    button.disabled = true; button.textContent = 'Generating…';
    try { state.proposal = await post('/api/proposal', { version: state.bootstrap.ruleVersion, approved: true, questionIds: state.bootstrap.questions.map(question => question.id) }); advance(6); }
    catch (err) { button.disabled = false; button.textContent = 'Approve and generate code'; showError(err.message); }
  };
}
function renderProposal() {
  const p = state.proposal;
  screen.innerHTML = title('Code and pull request prepared', 'AuditMind generated the approved check and placed it in a clearly simulated GitHub pull request.', 'Mock PR') + `<section class="mock-pr"><div class="mock-pr-top"><span class="mock-pr-mark">${githubIcon}</span><div><small>${h(p.github.repository)} · mock pull request #${h(p.github.number)}</small><h2>${h(p.github.title)}</h2></div><span class="mock-status">Mock · open</span></div><div class="mock-pr-body"><div><span>Files in proposal</span><strong>${p.github.files.length}</strong></div><div><span>Rule version</span><code>${h(short(p.version, 22))}</code></div><div><span>Approved questions</span><strong>${p.approvedQuestions.length}</strong></div></div><p class="mock-warning">This PR exists only inside the demo. No branch or pull request was created on GitHub.</p></section><details class="details generated-detail"><summary>Inspect generated check code</summary><div class="code-frame"><div class="code-frame-head"><span>rules/check.mjs</span><span>Exact version used by Run Review</span></div><pre><code>${h(p.code)}</code></pre></div></details>` + actionRow('<button class="button primary" id="finish-setup">Finish setup</button>', 'Run Review is a separate dashboard area.');
  document.querySelector('#finish-setup').onclick = () => advance(7);
}
function renderDone() {
  screen.innerHTML = title('Setup complete', 'The approved rule and mock pull request are ready. The next part is a separate review of one sample run.', 'Ready for review') + `<section class="done-card"><div class="done-check">✓</div><div><h2>Rule prepared for review</h2><p><strong>Mock PR #1</strong> contains the generated check. A preview can run this proposed version now. A real merged PR would be required before daily scheduled runs could be enabled.</p><div class="done-steps"><span>Codebase scanned</span><span>Questions approved</span><span>Mock PR prepared</span></div></div></section>` + actionRow('<button class="button primary" id="open-review">Open Run Review</button>', 'Setup ends here. The sample run has not started.');
  document.querySelector('#open-review').onclick = openReview;
}
function sourceTable(titleText, rows, type) {
  const body = rows.map(row => `<tr data-id="${h(row.depositId)}"><td class="mono">${h(row.depositId)}</td><td class="mono">${h(row.accountId)}</td><td>${type === 'transactions' ? 'Credit' : 'Deposit'}</td><td class="numeric">${(row.amountCents / 100).toFixed(2)} ${h(row.asset)}</td></tr>`).join('');
  return `<section class="source-sheet"><div class="sheet-top"><div><h3>${titleText}</h3><span>20 fictional rows</span></div></div><div class="table-scroll"><table><thead><tr><th>Deposit ID</th><th>Account</th><th>Type</th><th class="numeric">Amount</th></tr></thead><tbody>${body}</tbody></table></div></section>`;
}
function focusPair(id) {
  state.selectedId = id;
  for (const sheet of document.querySelectorAll('.source-sheet')) {
    for (const row of sheet.querySelectorAll('tbody tr')) row.classList.toggle('selected-pair', row.dataset.id === id);
    const target = [...sheet.querySelectorAll('tbody tr')].find(row => row.dataset.id === id);
    if (target) sheet.querySelector('.table-scroll').scrollTop = target.offsetTop - 160;
  }
}
function reviewAnswers() {
  if (!state.run || state.run.stage !== 'complete') return '<p class="review-empty">Run the proposed check to answer the approved questions.</p>';
  const findings = state.run.result.findings;
  const cardinality = findings.filter(finding => finding.kind === 'cardinality');
  const ownerAsset = findings.filter(finding => finding.kind === 'account' || finding.kind === 'asset');
  const amounts = findings.filter(finding => finding.kind === 'amount');
  const answers = [
    { result: cardinality.length ? 'Needs attention' : 'Yes', detail: cardinality.length ? `${cardinality.length} deposits have missing or repeated credits.` : 'All 20 deposits have exactly one credit transaction.' },
    { result: ownerAsset.length ? 'No' : 'Yes', detail: ownerAsset.length ? `${ownerAsset[0].reference}: expected ${ownerAsset[0].expected}, found ${ownerAsset[0].actual} in the credit.` : 'The account and asset match for all 20 pairs.' },
    { result: amounts.length ? 'No' : 'Yes', detail: amounts.length ? `${amounts[0].reference}: deposited ${amounts[0].expected}, credited ${amounts[0].actual}.` : 'The numeric amount matches for all 20 pairs. Asset is checked separately.' }
  ];
  return `<div class="answer-list">${state.bootstrap.questions.map((question, i) => `<article><span>Q${i + 1}</span><div><strong>${h(question.title)}</strong><p>${h(answers[i].detail)}</p></div><b class="${answers[i].result === 'Yes' ? 'answer-yes' : 'answer-no'}">${answers[i].result}</b></article>`).join('')}</div>`;
}
function reviewHashes() {
  if (!state.run || state.run.stage !== 'complete') return '<p class="review-empty">Row hashes and proof verification appear after the run completes.</p>';
  const deposit = state.reviewSources.coinDeposit.find(row => row.depositId === 'DEP-1050');
  const transaction = state.reviewSources.transactions.find(row => row.depositId === 'DEP-1050');
  const signals = state.run.zk.publicSignals;
  const fieldVersion = signals[3];
  const encoded = row => `[${fieldVersion}, ${state.bootstrap.windowId}, ${row.referenceCode}, ${row.accountCode}, ${row.assetCode}, ${row.amountCents}]`;
  return `<p class="hash-explain">For the flagged pair, the worker encodes the rule version, run date, deposit ID, account, asset and amount as field values, then computes a Poseidon hash for each row. USDT is encoded as 1; ETH as 2.</p><div class="hash-grid"><div><span>coinDeposit · 50.00 USDT</span><small>Poseidon${h(encoded(deposit))}</small><code>${h(state.run.zk.commitments.deposit)}</code></div><div><span>transactions · 50.00 ETH</span><small>Poseidon${h(encoded(transaction))}</small><code>${h(state.run.zk.commitments.transaction)}</code></div></div><div class="hash-footer"><span>Pair proof</span><strong>${state.run.zk.verified ? 'Verified' : 'Not verified'}</strong><span>Groth16 proof digest</span><code>${h(short(state.run.proofDigest, 28))}</code></div><p class="fine-print">The proof covers this flagged pair. The JavaScript worker checks all 20 pairs; it does not prove the completeness of a real database.</p>`;
}
function renderReview() {
  if (!state.reviewSources) { screen.innerHTML = title('Run Review', 'Loading fictional tables…'); return; }
  const rows = state.reviewSources;
  const options = rows.coinDeposit.map(row => `<option value="${h(row.depositId)}"${row.depositId === state.selectedId ? ' selected' : ''}>${h(row.depositId)}</option>`).join('');
  const running = state.runId && state.run?.stage !== 'complete' && state.run?.stage !== 'failed';
  const status = state.run?.stage === 'complete' ? `20 deposits checked · ${state.run.result.findings.length} mismatch found` : state.run?.stage === 'failed' ? `Run failed: ${h(state.run.error)}` : running ? h(state.run?.events?.at(-1)?.message || 'Starting worker…') : 'No run yet';
  screen.innerHTML = title('Run Review', 'A separate sample run of the approved rule against fictional deposit and credit rows.', 'On-demand preview') + `<div class="review-command"><div><strong>Proposed rule version</strong><code>${h(short(state.proposal.version, 23))}</code><span id="review-status" aria-live="polite">${status}</span></div><button class="button primary" id="run-review" ${running ? 'disabled' : ''}>${running ? 'Running…' : state.run?.stage === 'complete' ? 'Run again' : 'Run sample review'}</button></div><nav class="review-subnav" aria-label="Run Review sections"><a href="#sample-tables">Sample tables</a><a href="#review-answers">Questions answered</a><a href="#review-hashes">Row hashes</a></nav><section class="review-section" id="sample-tables"><div class="review-section-head"><span>01</span><div><h2>Sample tables</h2><p>Select a deposit ID to compare its two rows. The run checks all 20 pairs.</p></div></div><div class="source-toolbar"><label for="trace-id">Trace deposit ID <select id="trace-id">${options}</select></label></div><div class="source-pair">${sourceTable('coinDeposit', rows.coinDeposit, 'coinDeposit')}${sourceTable('transactions', rows.transactions, 'transactions')}</div></section><section class="review-section" id="review-answers"><div class="review-section-head"><span>02</span><div><h2>Questions answered</h2><p>The approved questions are evaluated by the generated check code.</p></div></div>${reviewAnswers()}</section><section class="review-section" id="review-hashes"><div class="review-section-head"><span>03</span><div><h2>How row hashes are produced</h2><p>Inspect the exact input tuple and the resulting hash for the flagged pair.</p></div></div>${reviewHashes()}</section>${state.run?.stage === 'complete' ? `<a class="button secondary evidence-download" href="/api/runs/${encodeURIComponent(state.run.id)}/evidence" download>Download full run evidence</a>` : ''}`;
  document.querySelector('#trace-id').onchange = event => focusPair(event.target.value);
  requestAnimationFrame(() => focusPair(state.selectedId));
  document.querySelector('#run-review').onclick = async event => {
    event.currentTarget.disabled = true; event.currentTarget.textContent = 'Starting…';
    try { const response = await post('/api/run-preview', { version: state.proposal.version }); state.runId = response.id; state.run = { stage: 'queued', events: [] }; renderReview(); pollRun(); }
    catch (err) { state.runId = null; state.run = { stage: 'failed', error: err.message }; renderReview(); }
  };
}
async function pollRun() {
  try {
    state.run = await api(`/api/runs/${encodeURIComponent(state.runId)}`);
    const finished = state.run.stage === 'complete' || state.run.stage === 'failed';
    if (state.view === 'review') {
      const status = document.querySelector('#review-status');
      if (status) status.textContent = finished ? state.run.stage === 'complete' ? `20 deposits checked · ${state.run.result.findings.length} mismatch found` : `Run failed: ${state.run.error}` : state.run.events.at(-1)?.message || 'Running…';
      if (finished) renderReview();
    }
    if (!finished) setTimeout(pollRun, 850);
  } catch (err) { state.run = { stage: 'failed', error: err.message }; if (state.view === 'review') renderReview(); }
}
async function openReview() {
  if (state.maxStep < 7) return;
  state.view = 'review';
  renderShell();
  if (!state.reviewSources) {
    try { state.reviewSources = (await api('/api/review-sources')).sources; renderShell(); }
    catch (err) { screen.innerHTML = title('Run Review', 'Could not load the sample tables.') + `<p class="error-text">${h(err.message)}</p>`; }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
setupButtons.forEach(button => button.onclick = () => { const step = Number(button.dataset.step); if (step <= state.maxStep) { state.view = 'setup'; state.step = step; renderShell(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
reviewNav.onclick = openReview;
try { state.bootstrap = await api('/api/bootstrap'); renderShell(); }
catch (err) { loginRoot.innerHTML = `<p class="error-text">Could not load demo: ${h(err.message)}</p>`; }
