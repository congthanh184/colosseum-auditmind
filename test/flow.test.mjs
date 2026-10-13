import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import * as snarkjs from 'snarkjs';
import { analyzeSources, generatedCode, ruleTemplate, ruleVersion, sources } from '../server/data.mjs';
import { provePair } from '../server/proof.mjs';

test('analysis joins two 20-row tables and identifies the short credit', () => {
  const result = analyzeSources();
  assert.equal(result.tables.length, 2);
  assert.deepEqual(result.tables.map(table => table.rowCount), [20, 20]);
  assert.equal(result.sharedIds, 20);
  assert.equal(result.flaggedDepositId, 'DEP-1050');
  assert.equal(result.observed.deposit, '56.00 USDC');
  assert.equal(result.observed.transaction, '51.00 USDC');
});

test('generated code checks all deposits and finds the one short credit', async () => {
  const module = await import(`data:text/javascript,${encodeURIComponent(generatedCode)}`);
  const result = module.reconcile(sources, ruleTemplate);
  assert.equal(result.checked, 20);
  assert.equal(result.passed, false);
  assert.deepEqual(result.findings.map(f => f.kind), ['amount']);
  assert.equal(result.findings[0].reference, 'DEP-1050');
});

test('pair proof verifies mismatch and rejects a changed public outcome', async () => {
  const result = await provePair(ruleVersion, 'DEP-1050');
  assert.equal(result.verified, true);
  assert.equal(result.mismatch, 1);
  assert.notEqual(result.commitments.deposit, result.commitments.transaction);
  const root = resolve(import.meta.dirname, '..');
  const key = JSON.parse(await readFile(join(root, 'artifacts/verification_key.json'), 'utf8'));
  const changed = [...result.publicSignals];
  changed[2] = '0';
  assert.equal(await snarkjs.groth16.verify(key, changed, result.proof), false);
});
