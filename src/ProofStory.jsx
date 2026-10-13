import React from 'react';

export default function ProofStory({ bootstrap, proposal, run }) {
  const complete = run?.stage === 'complete';
  const mismatchLine = bootstrap.circuitSource.split('\n').find(line => line.trim().startsWith('mismatch <=='))?.trim();
  const assetFinding = run?.result?.findings?.find(finding => finding.kind === 'asset');

  return <>
    <div className="proof-path" aria-label="From question to constrained outputs and proof">
      <span>Business questions</span><i aria-hidden="true">→</i>
      <span>Generated worker check</span><i aria-hidden="true">→</i>
      <span>Pair circuit</span><i aria-hidden="true">→</i>
      <span>Mismatch bit + row commitments</span><i aria-hidden="true">→</i>
      <span>Proof verification</span>
    </div>
    <div className="proof-roles">
      <div>
        <span className="role-label">Generated code · 20 rows</span>
        <strong>{complete ? `${run.result.checked} deposits checked` : 'Awaiting run'}</strong>
        <p>The proposed JavaScript rule joins confirmed deposits to credits. It reports the specific field that failed.</p>
        <details><summary>Inspect the exact generated check</summary><pre><code>{proposal.code}</code></pre></details>
      </div>
      <div>
        <span className="role-label">Actual Circom source · one pair</span>
        <strong>{complete ? `mismatch = ${run.zk.mismatch}` : 'Awaiting proof'}</strong>
        <p>The circuit constrains equality of reference, account, asset, and amount. Its public result is one combined mismatch bit.</p>
        <code className="circuit-line">{mismatchLine}</code>
        <details><summary>Inspect the actual circuit source</summary><pre><code>{bootstrap.circuitSource}</code></pre></details>
      </div>
    </div>
    {complete && <div className="proof-verdict">
      <div><span>Groth16 verification</span><strong>{run.zk.verified ? 'Valid proof' : 'Not verified'}</strong></div>
      <p>A valid proof means this pair’s public mismatch result and row commitments were computed from one witness according to the circuit. It does <strong>not</strong> mean the business check passed. {assetFinding && <>The worker identifies the specific issue as <strong>{assetFinding.expected} deposited → {assetFinding.actual} credited</strong>; this circuit exposes only the combined mismatch bit.</>}</p>
    </div>}
    <p className="proof-scope-note">Current scope: one identified pair is proven. The JavaScript worker checks all 20 pairs. Batch orphan counts, reserve checks, and table Merkle roots in the pitch are proposed features and are not produced here.</p>
  </>;
}
