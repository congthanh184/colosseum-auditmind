import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import * as snarkjs from 'snarkjs';
import { analyzeSources, generatedCode, ruleTemplate, ruleVersion, sources } from '../server/data.mjs';
import { proveTriple } from '../server/proof.mjs';

test('source analysis finds the shared reference and wrong asset', () => {
  const result = analyzeSources();
  assert.equal(result.tables.length, 3);
  assert.equal(result.sharedReference, true);
  assert.equal(result.observed.deposit, '50.00 USDT');
  assert.equal(result.observed.credit, '50.00 ETH');
});

test('generated code detects the wrong asset when executed', async () => {
  const module = await import(`data:text/javascript,${encodeURIComponent(generatedCode)}`);
  const result = module.reconcile(sources, ruleTemplate);
  assert.equal(result.passed, false);
  assert.deepEqual(result.findings.map(f => f.kind), ['asset']);
  assert.equal(result.findings[0].source, 'Customer credit');
});

test('proof verifies the failed check and rejects a changed public outcome', async () => {
  const result = await proveTriple(ruleVersion);
  assert.equal(result.verified, true);
  assert.equal(result.mismatch, 1);
  assert.notEqual(result.commitments.deposit, result.commitments.credit);
  assert.equal(result.commitments.deposit, result.commitments.ledger);
  const root = resolve(import.meta.dirname, '..');
  const key = JSON.parse(await readFile(join(root, 'artifacts/verification_key.json'), 'utf8'));
  const changed = [...result.publicSignals];
  changed[3] = '0';
  assert.equal(await snarkjs.groth16.verify(key, changed, result.proof), false);
});
