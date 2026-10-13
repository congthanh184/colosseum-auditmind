# AuditMind

AuditMind is a prototype for turning a ledger reconciliation question into a reviewable check and cryptographic evidence. This repository contains an interactive demo built around a fictional wallet ledger. It walks through repository analysis, rule approval, generated check code, and an on-demand proof of a sample discrepancy.

The app uses React for the interface, a Node.js server for the demo API, and a Circom circuit with Groth16 for the pair proof. The sample repository lives in `fixtures/`, fictional ledger records are defined in `server/data.mjs`, and proof artifacts are included in `artifacts/`.

## Run locally

Requires Node.js 20.11 or newer.

```sh
npm ci
npm run build
npm start
```

Open <http://127.0.0.1:4173>. To work on the interface, run `npm run build:watch` alongside `npm run dev`. Run `npm test` to check the sample analysis, generated rule, and proof verification.

The checked-in proof artifacts work without Circom installed. To rebuild the circuit after editing it, install Circom 2.x and run `npm run proof:setup`.

## Deploy on Railway

Deploy this repository as a Node service and generate a public domain. Railway builds with `npm run build` and starts with `npm start`. The server uses Railway's `PORT`; `railway.json` configures `/health` as the deployment health check.

The app writes generated analysis, proposals, and run evidence to local files. To retain them across deploys, attach a volume at `/data`, set `DATA_DIR=/data`, and use one replica. Without a volume, this data resets on redeploy.

The demo does not require environment secrets or a database. Its GitHub connection and pull request are simulated. The public endpoints have no authentication or rate limiting, so restrict access if the deployment is meant for a private audience.

## Prototype scope

AuditMind uses fictional records and a local sample repository. The JavaScript rule checks the sample dataset; the proof covers one selected deposit and credit pair. This prototype does not connect to a live database, create a GitHub pull request, schedule daily runs, or post to Solana. The included circuit setup uses a local prototype ceremony and is not intended for production proof generation.
