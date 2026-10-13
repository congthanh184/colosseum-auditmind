import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ProofStory from './ProofStory.jsx';

const steps = ['GitHub access', 'Analyze codebase', 'Core tables', 'Questions', 'Approval', 'Code & mock PR', 'Done'];
const setupLoadingLabels = [null, null, 'Opening the sample codebase…', 'Preparing core tables…', 'Preparing reconciliation questions…', 'Opening approval…', 'Preparing the mock pull request…', 'Finishing setup…'];
const demoPause = () => new Promise(resolve => setTimeout(resolve, 950));
const sampleFiles = [
  ['SQL', 'db/schema.sql', 'Database tables'],
  ['TS', 'src/deposit-service.ts', 'Deposit write path'],
  ['TS', 'src/balance-service.ts', 'Credit write path'],
];
const formatAmount = row => `${(row.amountCents / 100).toFixed(2)} ${row.asset}`;
const short = (value, length = 23) => value ? `${String(value).slice(0, length)}…` : '—';
async function api(path, options) {
  const response = await fetch(path, options);
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Request failed');
  return value;
}
const post = (path, value = {}) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });

function GithubMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" width="28" height="28" fill="currentColor"><path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.73 1.16 1.73 1.16 1 .1.37 2.08 2.64 1.46.1-.72.4-1.2.73-1.48-2.5-.28-5.13-1.25-5.13-5.57 0-1.23.44-2.23 1.15-3.02-.12-.28-.5-1.43.11-2.98 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.55.23 2.7.11 2.98.72.79 1.15 1.79 1.15 3.02 0 4.33-2.64 5.28-5.15 5.56.41.35.78 1.02.78 2.06v3.06c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z"/></svg>;
}
function Busy({ children }) { return <><span className="button-spinner" aria-hidden="true" />{children}</>; }
function SetupLoading({ next }) {
  return <section className="setup-loading" role="status" aria-live="polite"><span className="setup-loading-count">Setup {String(next).padStart(2, '0')} / 07</span><span className="setup-loading-spinner" aria-hidden="true" /><h1>{setupLoadingLabels[next]}</h1><p>Loading the next stage of the guided demo</p></section>;
}
function Heading({ name, description, badge }) {
  return <div className="work-heading"><div><h1>{name}</h1><p>{description}</p></div>{badge && <span className="heading-badge">{badge}</span>}</div>;
}
function Actions({ note, children }) { return <div className="work-actions"><span>{note}</span>{children}</div>; }
function ErrorMessage({ error }) { return error && <p className="error-text action-error" role="alert">{error}</p>; }
function Questions({ questions }) {
  return <ol className="question-list">{questions.map((question, index) => <li key={question.id}><span>Q{index + 1}</span><div><strong>{question.title}</strong><small>{question.fields.join(' · ')}</small></div></li>)}</ol>;
}
function Login({ onGuest }) {
  return <main className="login-root"><div className="login-intro"><img src="/brand/icon-mark-transparent.png" alt="" /><span>AuditMind workspace</span></div><section className="login-card"><h1>Sign in to the demo</h1><p>Explore the setup flow and a separate reconciliation run using a fictional project.</p><div className="guest-identity"><strong>Guest workspace</strong><span>No account or password is needed.</span></div><button type="button" className="button primary" onClick={onGuest}>Continue as Guest</button><small>This guest session does not connect to GitHub or a real database.</small></section></main>;
}
function Access({ bootstrap, next }) {
  return <><Heading name="Connect a repository" description="AuditMind would request the following access before analyzing a project." badge="Sample connection" /><div className="work-split"><section className="work-card permission-card"><div className="connection-brand"><span><GithubMark /></span><strong>GitHub</strong><span className="connection-chevron" aria-hidden="true">→</span><img src="/brand/icon-mark-transparent.png" alt="AuditMind" /></div><h2>Repository permissions</h2><div className="permission-row"><strong>Read code and schema files</strong><span>Find database models and balance logic.</span></div><div className="permission-row"><strong>Create a branch</strong><span>Keep the proposed rule separate from the default branch.</span></div><div className="permission-row"><strong>Open a pull request</strong><span>Present generated code for review.</span></div></section><aside className="context-note"><strong>In this guided demo</strong><p>The connection is simulated. The next step scans three fixture files from <code>{bootstrap.sampleRepository}</code>. No GitHub account is authorized.</p></aside></div><Actions note="No live repository permissions are changed."><button className="button primary" onClick={next}>Continue with sample access</button></Actions></>;
}
function Analysis({ bootstrap, analysis, onScan, next }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function scan() { setBusy(true); setError(''); try { await Promise.all([onScan(), demoPause()]); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <><Heading name="Analyze the codebase" description="Inspect the sample schema and service files to locate the deposit and credit paths." badge="Sample codebase" /><section className="work-card"><div className="section-line"><strong>{bootstrap.sampleRepository}</strong><span>3 fixture files</span></div><div className={`file-list ${busy ? 'is-scanning' : ''}`}>{sampleFiles.map(([type, path, description]) => <div key={path}><span className="file-type">{type}</span><code>{path}</code><span>{description}</span>{analysis && !busy && <span className="file-done" aria-label="Read">✓</span>}</div>)}</div>{busy && <div className="scan-activity" role="status"><span className="activity-track"><span /></span><strong>Reading schema and service files…</strong></div>}{analysis && !busy ? <div className="scan-result"><strong>Scan complete</strong><p>Found {analysis.tables.length} core tables. The services write deposits to <code>coinDeposit</code> and balance credits to <code>transactions</code>.</p></div> : !busy && <p className="work-hint">Run the scan to see what the sample codebase reveals.</p>}<ErrorMessage error={error} /></section><Actions note={analysis ? 'The scan read local fixture files.' : 'No live codebase is accessed.'}>{analysis && !busy ? <button className="button primary" onClick={next}>View core tables</button> : <button className="button primary" onClick={scan} disabled={busy}>{busy ? <Busy>Analyzing codebase</Busy> : 'Analyze sample codebase'}</button>}</Actions></>;
}
function Tables({ analysis, next }) {
  return <><Heading name="Core tables to match" description="The codebase points to two records that should agree after a deposit is confirmed." badge="2 tables" /><div className="schema-grid">{analysis.tables.map(table => <section className="schema-card" key={table.name}><div className="schema-card-head"><strong>{table.name}</strong><span>{table.fields.length} fields</span></div><ul>{table.fields.map(field => <li key={field}><code>{field}</code></li>)}</ul></section>)}</div><div className="join-note"><span>Join candidate</span><strong><code>{analysis.relationship.from}</code> = <code>{analysis.relationship.to}</code></strong><p>Only <code>{analysis.relationship.filter}</code> rows count as balance increases.</p></div><Actions note="Schema understanding comes before row comparison."><button className="button primary" onClick={next}>See reconciliation questions</button></Actions></>;
}
function QuestionStep({ questions, next }) {
  return <><Heading name="Questions AuditMind can answer" description="These checks come from the relationship between the two tables. Review them before approving a rule." badge="3 questions" /><section className="work-card"><Questions questions={questions} /><p className="work-hint">The next screen asks for explicit approval. Nothing is generated yet.</p></section><Actions note="Proposed questions · awaiting approval"><button className="button primary" onClick={next}>Review for approval</button></Actions></>;
}
function Approval({ bootstrap, onApprove }) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function approve() { setBusy(true); setError(''); try { await onApprove(); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <><Heading name="Approve the reconciliation rule" description="Confirm that these are the questions the generated check should answer." badge="Approval required" /><section className="work-card"><Questions questions={bootstrap.questions} /><label className="approval-check"><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} /><span>I approve these three questions for the sample rule.</span></label><ErrorMessage error={error} /></section><Actions note="The mock pull request is created only after approval."><button className="button primary" disabled={!checked || busy} onClick={approve}>{busy ? <Busy>Generating check</Busy> : 'Approve and generate code'}</button></Actions></>;
}
function Proposal({ proposal, next }) {
  return <><Heading name="Code and pull request prepared" description="AuditMind generated the approved check and placed it in a clearly simulated GitHub pull request." badge="Mock PR" /><section className="mock-pr"><div className="mock-pr-top"><span className="mock-pr-mark"><GithubMark /></span><div><small>{proposal.github.repository} · mock pull request #{proposal.github.number}</small><h2>{proposal.github.title}</h2></div><span className="mock-status">Mock · open</span></div><div className="mock-pr-body"><div><span>Files in proposal</span><strong>{proposal.github.files.length}</strong></div><div><span>Rule version</span><code>{short(proposal.version, 22)}</code></div><div><span>Approved questions</span><strong>{proposal.approvedQuestions.length}</strong></div></div><p className="mock-warning">This PR exists only inside the demo. No branch or pull request was created on GitHub.</p></section><details className="details generated-detail"><summary>Inspect generated check code</summary><div className="code-frame"><div className="code-frame-head"><span>rules/check.mjs</span><span>Exact version used by Run Review</span></div><pre><code>{proposal.code}</code></pre></div></details><Actions note="Run Review is a separate dashboard area."><button className="button primary" onClick={next}>Finish setup</button></Actions></>;
}
function Done({ openReview }) {
  return <><Heading name="Setup complete" description="The approved rule and mock pull request are ready. The next part is a separate review of one sample run." badge="Ready for review" /><section className="done-card"><div className="done-check">✓</div><div><h2>Rule prepared for review</h2><p><strong>Mock PR #1</strong> contains the generated check. A preview can run this proposed version now. A real merged PR would be required before daily scheduled runs could be enabled.</p><div className="done-steps"><span>Codebase scanned</span><span>Questions approved</span><span>Mock PR prepared</span></div></div></section><Actions note="Setup ends here. The sample run has not started."><button className="button primary" onClick={openReview}>Open Run Review</button></Actions></>;
}
function SourceSheet({ title, rows, selectedId, onSelect }) {
  return <section className="source-sheet"><div className="sheet-top"><div><h3>{title}</h3><span>{rows.length} fictional rows</span></div></div><div className="table-scroll"><table><thead><tr><th>Deposit ID</th><th>Account</th><th>Type</th><th className="numeric">Amount</th></tr></thead><tbody>{rows.map(row => <tr key={row.depositId} className={row.depositId === selectedId ? 'selected-pair' : ''} onClick={() => onSelect(row.depositId)} tabIndex="0" onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row.depositId); } }} aria-selected={row.depositId === selectedId}><td className="mono">{row.depositId}</td><td className="mono">{row.accountId}</td><td>{title === 'transactions' ? 'Credit' : 'Deposit'}</td><td className="numeric">{formatAmount(row)}</td></tr>)}</tbody></table></div></section>;
}
function AnswerList({ questions, run, total }) {
  if (run?.stage !== 'complete') return <p className="review-empty">Run the proposed check to answer the approved questions.</p>;
  const findings = run.result.findings;
  const cardinality = findings.filter(f => f.kind === 'cardinality');
  const ownerAsset = findings.filter(f => f.kind === 'account' || f.kind === 'asset');
  const amounts = findings.filter(f => f.kind === 'amount');
  const answers = [
    { result: cardinality.length ? 'Needs attention' : 'Yes', detail: cardinality.length ? `${cardinality.length} deposits have missing or repeated credits.` : `All ${total} deposits have exactly one credit transaction.` },
    { result: ownerAsset.length ? 'No' : 'Yes', detail: ownerAsset.length ? `${ownerAsset[0].reference}: expected ${ownerAsset[0].expected}, found ${ownerAsset[0].actual} in the credit.` : `The account and asset match for all ${total} pairs.` },
    { result: amounts.length ? 'No' : 'Yes', detail: amounts.length ? `${amounts[0].reference}: deposited ${amounts[0].expected}, credited ${amounts[0].actual}.` : `The numeric amount matches for all ${total} pairs. Asset is checked separately.` },
  ];
  return <div className="answer-list">{questions.map((question, index) => <article key={question.id}><span>Q{index + 1}</span><div><strong>{question.title}</strong><p>{answers[index].detail}</p></div><b className={answers[index].result === 'Yes' ? 'answer-yes' : 'answer-no'}>{answers[index].result}</b></article>)}</div>;
}
function HashRow({ label, encoded, hash }) {
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(hash); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } }
  return <div><span>{label}</span><small>Poseidon{encoded}</small><code>{hash}</code><button type="button" className="copy-hash" onClick={copy} aria-label={`Copy ${label} hash`}>{copied ? 'Copied' : 'Copy hash'}</button></div>;
}
function Hashes({ bootstrap, sources, run }) {
  if (run?.stage !== 'complete') return <p className="review-empty">Record commitments appear after the pair proof completes.</p>;
  const deposit = sources.coinDeposit.find(row => row.depositId === 'DEP-1050');
  const transaction = sources.transactions.find(row => row.depositId === 'DEP-1050');
  const fieldVersion = run.zk.publicSignals[3];
  const encoded = row => `[${fieldVersion}, ${bootstrap.windowId}, ${row.referenceCode}, ${row.accountCode}, ${row.assetCode}, ${row.amountCents}]`;
  return <><p className="hash-explain">The circuit also computes a Poseidon commitment for each row from the rule version, run date, deposit ID, account, asset, and amount. USDT is encoded as 1; ETH as 2. These hashes record the two row values used by the pair proof.</p><div className="hash-grid"><HashRow label="coinDeposit · 50.00 USDT" encoded={encoded(deposit)} hash={run.zk.commitments.deposit} /><HashRow label="transactions · 50.00 ETH" encoded={encoded(transaction)} hash={run.zk.commitments.transaction} /></div><p className="hash-caution"><strong>The hash difference is not the discrepancy test.</strong> The circuit compares the encoded fields directly. A hash binds each row to the proof; comparing the two hash strings does not establish that a deposit was correctly credited.</p><div className="hash-footer"><span>Proof file digest</span><code>{short(run.proofDigest, 28)}</code></div><p className="fine-print">These are row commitments, not Merkle roots for either full table. This demo does not prove the completeness of a real database.</p></>;
}
function RunReview({ bootstrap, proposal, sources, run, onRun }) {
  const [selectedId, setSelectedId] = useState('DEP-1050');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    document.querySelectorAll('.source-sheet').forEach(sheet => {
      const target = [...sheet.querySelectorAll('tbody tr')].find(row => row.textContent.includes(selectedId));
      if (target) sheet.querySelector('.table-scroll').scrollTop = target.offsetTop - 160;
    });
  }, [selectedId, sources]);
  async function start() { setStarting(true); setError(''); try { await onRun(); } catch (err) { setError(err.message); } finally { setStarting(false); } }
  if (!sources) return <><Heading name="Run Review" description="Loading fictional tables…" badge="On-demand preview" /><div className="loading-sheet" role="status"><Busy>Loading sample rows</Busy></div></>;
  const running = starting || (run && !['complete', 'failed'].includes(run.stage));
  const findingCount = run?.result?.findings?.length || 0;
  const status = run?.stage === 'complete' ? `${sources.coinDeposit.length} deposits checked · ${findingCount} mismatch found` : run?.stage === 'failed' ? `Run failed: ${run.error}` : running ? run?.events?.at(-1)?.message || 'Starting worker…' : 'No run yet';
  const selectedDeposit = sources.coinDeposit.find(row => row.depositId === selectedId);
  const selectedTransaction = sources.transactions.find(row => row.depositId === selectedId);
  const mismatch = selectedDeposit.asset !== selectedTransaction.asset || selectedDeposit.amountCents !== selectedTransaction.amountCents || selectedDeposit.accountId !== selectedTransaction.accountId;
  return <>
    <Heading name="Run Review" description="See how the approved questions become a check, a one-pair circuit result, and record commitments." badge="On-demand preview" />
    <div className="review-command"><div><strong>Proposed rule version</strong><code>{short(proposal.version)}</code><span id="review-status" aria-live="polite">{status}</span></div><button className="button primary" onClick={start} disabled={running}>{running ? <Busy>Running review</Busy> : run?.stage === 'complete' ? 'Run again' : 'Run sample review'}</button></div>
    <ErrorMessage error={error} />
    {run?.events?.length > 0 && <div className="run-activity" aria-label="Worker activity"><div className="run-activity-title"><span className={running ? 'live-pulse' : 'activity-finished'} />Worker activity</div><ol>{run.events.map((event, index) => <li key={`${event.stage}-${index}`} className={index === run.events.length - 1 ? 'latest' : ''}><span>{event.stage}</span>{event.message}</li>)}</ol></div>}
    <nav className="review-subnav" aria-label="Run Review sections"><a href="#sample-tables">Sample tables</a><a href="#review-answers">Questions</a><a href="#review-proof">Circuit & proof</a><a href="#review-hashes">Commitments</a></nav>
    <section className="review-section" id="sample-tables"><div className="review-section-head"><span>01</span><div><h2>Sample tables</h2><p>Select a deposit ID to compare its two rows. The worker checks all 20 pairs.</p></div></div><div className="source-toolbar"><label htmlFor="trace-id">Trace deposit ID <select id="trace-id" value={selectedId} onChange={event => setSelectedId(event.target.value)}>{sources.coinDeposit.map(row => <option key={row.depositId} value={row.depositId}>{row.depositId}</option>)}</select></label></div><div className={`pair-summary ${mismatch ? 'has-mismatch' : ''}`}><div><small>coinDeposit</small><strong>{formatAmount(selectedDeposit)}</strong></div><span className="pair-connector" aria-hidden="true">→</span><div><small>transactions</small><strong>{formatAmount(selectedTransaction)}</strong></div><span className="pair-verdict">{mismatch ? 'Asset mismatch' : 'Matched'}</span></div><div className="source-pair"><SourceSheet title="coinDeposit" rows={sources.coinDeposit} selectedId={selectedId} onSelect={setSelectedId} /><SourceSheet title="transactions" rows={sources.transactions} selectedId={selectedId} onSelect={setSelectedId} /></div></section>
    <section className="review-section" id="review-answers"><div className="review-section-head"><span>02</span><div><h2>Business questions → generated check</h2><p>The proposed JavaScript rule evaluates all 20 synthetic deposit and credit pairs.</p></div></div><AnswerList questions={bootstrap.questions} run={run} total={sources.coinDeposit.length} /></section>
    <section className="review-section" id="review-proof"><div className="review-section-head"><span>03</span><div><h2>Circuit result and proof</h2><p>The actual Circom source constrains one identified pair and publishes a mismatch bit.</p></div></div><ProofStory bootstrap={bootstrap} proposal={proposal} run={run} /></section>
    <section className="review-section" id="review-hashes"><div className="review-section-head"><span>04</span><div><h2>Poseidon row commitments</h2><p>These record the proven pair’s row values; they are separate from the discrepancy result.</p></div></div><Hashes bootstrap={bootstrap} sources={sources} run={run} /></section>
    {run?.stage === 'complete' && <a className="button secondary evidence-download" href={`/api/runs/${encodeURIComponent(run.id)}/evidence`} download>Download full run evidence</a>}
  </>;
}
function App() {
  const [bootstrap, setBootstrap] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [guest, setGuest] = useState(sessionStorage.getItem('auditmind-guest') === '1');
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [view, setView] = useState('setup');
  const [transition, setTransition] = useState(null);
  const transitionLock = useRef(false);
  const [analysis, setAnalysis] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [sources, setSources] = useState(null);
  const [reviewError, setReviewError] = useState('');
  const [run, setRun] = useState(null);
  const [runId, setRunId] = useState(null);
  useEffect(() => { api('/api/bootstrap').then(setBootstrap).catch(error => setLoadError(error.message)); }, []);
  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    let timer;
    async function poll() {
      try {
        const next = await api(`/api/runs/${encodeURIComponent(runId)}`);
        if (cancelled) return;
        setRun(next);
        if (!['complete', 'failed'].includes(next.stage)) timer = setTimeout(poll, 650);
      } catch (error) { if (!cancelled) setRun({ stage: 'failed', error: error.message }); }
    }
    poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [runId]);
  async function advance(next) {
    if (transitionLock.current) return;
    transitionLock.current = true;
    setTransition(next);
    await demoPause();
    setView('setup');
    setStep(next);
    setMaxStep(current => Math.max(current, next));
    setTransition(null);
    transitionLock.current = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function openReview() {
    if (maxStep < 7) return;
    setView('review');
    setReviewError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!sources) {
      try { setSources((await api('/api/review-sources')).sources); }
      catch (error) { setReviewError(error.message); }
    }
  }
  async function startRun() { const response = await post('/api/run-preview', { version: proposal.version }); setRun({ stage: 'queued', events: [] }); setRunId(response.id); }
  let content;
  if (view === 'review') content = reviewError ? <><Heading name="Run Review" description="The sample tables could not be loaded." badge="On-demand preview" /><p className="error-text" role="alert">{reviewError}</p><button className="button secondary" onClick={openReview}>Try loading again</button></> : <RunReview bootstrap={bootstrap} proposal={proposal} sources={sources} run={run} onRun={startRun} />;
  else content = transition ? <SetupLoading next={transition} /> : [null,
    <Access bootstrap={bootstrap} next={() => advance(2)} />,
    <Analysis bootstrap={bootstrap} analysis={analysis} onScan={async () => setAnalysis(await post('/api/analyze-codebase'))} next={() => advance(3)} />,
    analysis && <Tables analysis={analysis} next={() => advance(4)} />,
    <QuestionStep questions={bootstrap?.questions || []} next={() => advance(5)} />,
    <Approval bootstrap={bootstrap} onApprove={async () => { const value = await post('/api/proposal', { version: bootstrap.ruleVersion, approved: true, questionIds: bootstrap.questions.map(question => question.id) }); setProposal(value); await advance(6); }} />,
    proposal && <Proposal proposal={proposal} next={() => advance(7)} />,
    <Done openReview={openReview} />,
  ][step];
  return <><header className="dash-global"><a className="brand" href="/"><img src="/brand/icon-mark-transparent.png" alt="" /><span>AuditMind</span></a><div className="dash-global-right"><span>Guided product demo</span><span className="guest-pill">Guest</span></div></header>{loadError ? <main className="login-root"><p className="error-text" role="alert">Could not load the demo: {loadError}. Refresh to try again.</p></main> : !bootstrap ? <main className="login-root"><div className="loading-sheet" role="status"><Busy>Opening workspace</Busy></div></main> : !guest ? <Login onGuest={() => { sessionStorage.setItem('auditmind-guest', '1'); setGuest(true); }} /> : <div className="dashboard-shell"><aside className="dashboard-sidebar"><div className="sidebar-project"><span>Sample project</span><strong>Wallet ledger</strong><small>Fictional repository and data</small></div><nav aria-label="Demo sections"><p>Setup</p>{steps.map((label, index) => <button type="button" key={label} className={`side-step ${view === 'setup' && step === index + 1 ? 'active' : ''} ${index + 1 < maxStep ? 'complete' : ''}`} disabled={index + 1 > maxStep || Boolean(transition)} onClick={() => { setView('setup'); setStep(index + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><span>{String(index + 1).padStart(2, '0')}</span>{label}</button>)}<p className="sidebar-separator">After setup</p><button type="button" className={`review-nav ${view === 'review' ? 'active' : ''}`} disabled={maxStep < 7 || Boolean(transition)} onClick={openReview}>Run Review <span>↗</span></button></nav><div className="sidebar-bottom">Guest workspace<br />Local guided demo</div></aside><div className="dashboard-content"><div className="dashboard-toolbar"><span>{view === 'review' ? 'Run Review / Sample run' : `Setup / ${steps[transition ? transition - 1 : step - 1]}`}</span><span className="toolbar-tag">Sample environment</span></div><main id="screen" key={`${view}-${step}-${transition || ''}`} className="work-enter">{content}</main></div></div>}</>;
}

createRoot(document.getElementById('root')).render(<App />);
