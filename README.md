# AuditMind demo

A light-themed, local prototype for one **synthetic** deposit reconciliation. It walks through repository access, source inspection, schema/sample analysis, generated check code, a pull-request proposal, and an on-demand preview. The preview runs the exact generated rule file and creates a real Groth16 proof of the identified three-row check.

## Run locally

Requires Node 20+ and `circom` 2.x.

```sh
npm ci
npm run proof:setup
npm start
```

Open `http://127.0.0.1:4173`. The demo uses no production database credentials. Proof setup creates a **local prototype ceremony**, not a production trusted setup. The generated `.wasm`, proving key and verification key are included in this repository so the preview can run after `npm ci`; rerun setup if you change the circuit.

`npm test` checks source analysis, the generated rule, proof verification, and rejection of a modified public outcome.

## GitHub connection

Git is initialized locally. The user will create/connect the GitHub repository later. Until then the UI displays **Local proposal only** and no PR URL. To enable real PR creation, set:

```sh
GITHUB_REPOSITORY=owner/repository
GITHUB_TOKEN=<fine-grained token with repository contents write and pull-request write permissions>
```

Optionally set `GITHUB_APP_INSTALL_URL` to show an access page in the first screen. This prototype does not itself implement GitHub OAuth or a GitHub App installation callback; providing a URL alone does not authenticate the backend. Keep tokens outside Git and do not paste them into the demo UI. When configured, the backend creates a branch, writes the approved rule JSON, generated check code and circuit, then opens a pull request. The worker preview remains in the web app.

## What the proof means

The circuit evaluates **one identified deposit/credit/ledger triple**. Its public outputs are Poseidon commitments to each row and a mismatch bit; the rule version and window ID are public inputs. The worker independently checks that the generated JavaScript result agrees with the circuit and verifies the Groth16 proof. The downloadable evidence includes the full proof and public signals.

This does **not** prove that the source databases contain every real transaction, that an operator gave accurate source rows, or that a daily schedule ran. The current prototype only runs on demand. It does **not** post to Solana.
