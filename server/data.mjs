import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { generateCheckCode } from './generate.mjs';

export const sources = {
  deposits: [{ reference: 'DEP-1042', referenceCode: 1042, asset: 'USDT', assetCode: 1, amountCents: 5000, recordedAt: '2026-10-13T01:12:03Z' }],
  credits: [{ reference: 'DEP-1042', referenceCode: 1042, asset: 'ETH', assetCode: 2, amountCents: 5000, recordedAt: '2026-10-13T01:12:05Z' }],
  ledger: [{ reference: 'DEP-1042', referenceCode: 1042, asset: 'USDT', assetCode: 1, amountCents: 5000, recordedAt: '2026-10-13T01:12:06Z' }]
};

export const ruleTemplate = {
  id: 'deposit-credit-ledger-v1',
  title: 'Deposit, credit & ledger must agree',
  description: 'For each identified deposit, find exactly one customer credit and one ledger entry with the same reference, asset and amount.',
  sources: ['deposits', 'credits', 'ledger'],
  checks: ['shared reference', 'exactly one related row in each source', 'same asset', 'same amount'],
  scope: 'One identified synthetic transaction triple in this preview',
  circuit: 'reconcile.circom'
};

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export function digest(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : canonical(value)).digest('hex');
}

export const generatedCode = generateCheckCode(ruleTemplate);
const circuit = readFileSync(join(resolve(import.meta.dirname, '..'), 'circuit/reconcile.circom'), 'utf8');
export const ruleVersion = digest({ rule: ruleTemplate, generatedCode, circuitDigest: digest(circuit) });
export const windowId = 20261013;

export function analyzeSources() {
  const tables = Object.entries(sources).map(([name, rows]) => ({ name, rowCount: rows.length, fields: Object.keys(rows[0] || {}).filter(field => !field.endsWith('Code')), sampleReference: rows[0]?.reference }));
  const d = sources.deposits[0], c = sources.credits[0], l = sources.ledger[0];
  const sharedReference = d.reference === c.reference && d.reference === l.reference;
  return {
    synthetic: true,
    tables,
    joinKey: 'reference',
    sharedReference,
    observed: { deposit: `${(d.amountCents / 100).toFixed(2)} ${d.asset}`, credit: `${(c.amountCents / 100).toFixed(2)} ${c.asset}`, ledger: `${(l.amountCents / 100).toFixed(2)} ${l.asset}` },
    candidate: 'For every deposit, find one credit and one ledger entry with the same reference, asset and amount.',
    note: 'Schema and sample analysis does not establish source completeness or authorization for a real database.'
  };
}
