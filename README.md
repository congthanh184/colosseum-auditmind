# AuditMind demo

A light-themed, local prototype for **synthetic** deposit reconciliation. It begins with Guest access, shows a GitHub-style repository permission screen, compares 20 `coinDeposit` rows with 20 `transactions` rows, proposes check code, and runs an on-demand preview. The preview executes the exact generated rule file across the sample rows and creates a real Groth16 proof for the flagged deposit/transaction pair.

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

Git is initialized locally. Until a repository is connected, the access screen clearly labels its sample connection and the app provides no live PR URL. To enable real PR creation, set:

```sh
GITHUB_REPOSITORY=owner/repository
GITHUB_TOKEN=<fine-grained token with repository contents write and pull-request write permissions>
```

Optionally set `GITHUB_APP_INSTALL_URL` to show an access page in the first screen. This prototype does not itself implement GitHub OAuth or a GitHub App installation callback; providing a URL alone does not authenticate the backend. Keep tokens outside Git and do not paste them into the demo UI. When configured, the backend creates a branch, writes the approved rule JSON, generated check code and circuit, then opens a pull request. The worker preview remains in the web app.

## What the proof means

The generated JavaScript check evaluates all 20 deposits. The circuit evaluates **the one flagged deposit/transaction pair**. Its public outputs are Poseidon commitments to those rows and a mismatch bit; the rule version and window ID are public inputs. The worker verifies the Groth16 proof and checks its public signals against the flagged source rows. The downloadable evidence includes the full proof and public signals.

This does **not** prove that the source databases contain every real transaction, that all 20 comparisons were proven in ZK, or that a daily schedule ran. The current prototype only runs on demand. It does **not** post to Solana.
