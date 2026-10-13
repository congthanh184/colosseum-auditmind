import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import * as snarkjs from 'snarkjs';
import { analyzeSources, generatedCode, ruleTemplate, ruleVersion, sources } from '../server/data.mjs';
import { analyzeCodebase } from '../server/codebase.mjs';
import { provePair } from '../server/proof.mjs';

test('sample rows contain a 50 USDT deposit credited as 50 ETH', () => {
  const result = analyzeSources();
  assert.equal(result.tables.length, 2);
  assert.deepEqual(result.tables.map(table => table.rowCount), [20, 20]);
  assert.equal(result.sharedIds, 20);
  assert.equal(result.flaggedDepositId, 'DEP-1050');
  assert.equal(result.observed.deposit, '50.00 USDT');
  assert.equal(result.observed.transaction, '50.00 ETH');
});

test('sample codebase scan finds the two tables and approved question candidates', async () => {
  const result = await analyzeCodebase();
  assert.deepEqual(result.tables.map(table => table.name), ['coinDeposit', 'transactions']);
  assert.equal(result.files.length, 3);
  assert.equal(result.relationship.from, 'coinDeposit.depositId');
  assert.equal(result.relationship.to, 'transactions.depositId');
  assert.deepEqual(result.questions.map(question => question.id), ['one-credit', 'same-owner-asset', 'same-amount']);
});

test('generated code checks all deposits and finds the one asset mismatch', async () => {
  const module = await import(`data:text/javascript,${encodeURIComponent(generatedCode)}`);
  const result = module.reconcile(sources, ruleTemplate);
  assert.equal(result.checked, 20);
  assert.equal(result.passed, false);
  assert.deepEqual(result.findings.map(f => f.kind), ['asset']);
  assert.equal(result.findings[0].reference, 'DEP-1050');
  const withPending = { ...sources, coinDeposit: [...sources.coinDeposit, { ...sources.coinDeposit[0], depositId: 'DEP-PENDING', status: 'pending' }] };
  assert.equal(module.reconcile(withPending, ruleTemplate).checked, 20);
});

test('pair circuit proves both a mismatch and a match, and rejects a changed public outcome', async () => {
  const result = await provePair(ruleVersion, 'DEP-1050');
  assert.equal(result.verified, true);
  assert.equal(result.mismatch, 1);
  assert.equal(result.publicSignals[0], result.commitments.deposit);
  assert.equal(result.publicSignals[1], result.commitments.transaction);
  const matched = await provePair(ruleVersion, 'DEP-1041');
  assert.equal(matched.verified, true);
  assert.equal(matched.mismatch, 0);
  const root = resolve(import.meta.dirname, '..');
  const key = JSON.parse(await readFile(join(root, 'artifacts/verification_key.json'), 'utf8'));
  const changed = [...result.publicSignals];
  changed[2] = '0';
  assert.equal(await snarkjs.groth16.verify(key, changed, result.proof), false);
});
