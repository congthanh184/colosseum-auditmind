# AuditMind demo

A light-themed, local **guided demo** with two separate dashboard areas.

The dashboard is built with React components in `src/demo.jsx`. `npm start` builds the browser bundle before starting the Node server. The landing page remains a static HTML page.

## Setup

1. Sign in as Guest.
2. Review a simulated GitHub repository access request.
3. Analyze three local fixture files in `fixtures/sample-repository` to understand the codebase.
4. Review the core `coinDeposit` and `transactions` table schemas.
5. Review three proposed reconciliation questions.
6. Explicitly approve the questions.
7. Generate check code and a **mock** GitHub pull request, then finish setup.

No GitHub account is accessed, no branch is pushed, and no live pull request is created in this guided flow. The mock PR has no external URL.

## Run Review

Run Review is available after setup ends. It shows 20 fictional rows in each table, including the main `DEP-1050` mismatch: **50 USDT deposited, 50 ETH credited**. It executes the exact versioned generated JavaScript check, answers the three approved questions, and shows how Poseidon hashes are produced for the flagged pair. The worker also generates and verifies a real Groth16 proof for that pair. The JavaScript check covers all 20 deposits; the ZK proof covers **one identified pair**.

The generated JavaScript check identifies the asset error across the sample rows. The Circom circuit constrains field comparisons for the selected pair and exposes a combined `mismatch` bit. A valid proof certifies that this bit and the two Poseidon row commitments were computed from the circuit's witness. It does not mean the business rule passed. The two row hash strings are commitments to row values, not a discrepancy detector or full-table Merkle roots. The pitch deck's orphan counts, reserve check, and table roots describe a proposed batch circuit; this MVP does not produce them.

Merging a real future PR would be the gate for daily scheduled runs. This prototype runs on demand and does not post to Solana.

## Run locally

Requires Node 20+ and `circom` 2.x for rebuilding the circuit.

```sh
npm ci
npm start
```

Open `http://127.0.0.1:4173`. Generated proof artifacts are included, so `npm run proof:setup` is needed only after changing the circuit. That setup uses a local prototype trusted ceremony, not a production ceremony.

`npm test` checks codebase fixture analysis, the generated rule, proof verification, and rejection of a modified public outcome.

For frontend edits, run `npm run build:watch` alongside `npm run dev`.

## Scope of evidence

The proof binds one deposit and transaction pair, the rule version, date and mismatch bit. It does not prove that a real database is complete, that all 20 comparisons were proven in ZK, or that any daily schedule ran. The sample records and repository are fictional.
