import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { generateCheckCode } from './generate.mjs';

const amounts = [5000, 12500, 8750, 4200, 19900, 7500, 6150, 32000, 9400, 5000, 11750, 8300, 26600, 7100, 15400, 4800, 10300, 22500, 6700, 13800];
const reference = index => `DEP-${String(1041 + index).padStart(4, '0')}`;
export const sources = {
  coinDeposit: amounts.map((amountCents, index) => ({ depositId: reference(index), referenceCode: 1041 + index, accountId: `ACC-${String(201 + index).padStart(3, '0')}`, accountCode: 201 + index, asset: 'USDT', assetCode: 1, amountCents, status: 'confirmed', recordedAt: `2026-10-13T01:${String(index).padStart(2, '0')}:03Z` })),
  transactions: amounts.map((amountCents, index) => ({ transactionId: `TX-${String(501 + index).padStart(4, '0')}`, depositId: reference(index), referenceCode: 1041 + index, accountId: `ACC-${String(201 + index).padStart(3, '0')}`, accountCode: 201 + index, direction: 'credit', directionCode: 1, asset: index === 9 ? 'ETH' : 'USDT', assetCode: index === 9 ? 2 : 1, amountCents, recordedAt: `2026-10-13T01:${String(index).padStart(2, '0')}:08Z` }))
};
export const ruleTemplate = {
  id: 'coin-deposit-transaction-v1',
  title: 'Every coin deposit receives one matching balance credit',
  description: 'For each confirmed coinDeposit row, find exactly one credit in transactions with the same deposit ID, account, asset and amount.',
  sources: ['coinDeposit', 'transactions'],
  checks: ['same deposit ID', 'exactly one credit transaction', 'same account and asset', 'same amount'],
  scope: 'Twenty synthetic deposits and transactions; the proof covers the flagged pair',
  circuit: 'reconcile.circom'
};
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function digest(value) { return createHash('sha256').update(typeof value === 'string' ? value : canonical(value)).digest('hex'); }
export const generatedCode = generateCheckCode(ruleTemplate);
export const circuitSource = readFileSync(join(resolve(import.meta.dirname, '..'), 'circuit/reconcile.circom'), 'utf8');
export const ruleVersion = digest({ rule: ruleTemplate, generatedCode, circuitDigest: digest(circuitSource) });
export const windowId = 20261013;
export function analyzeSources() {
  const tables = Object.entries(sources).map(([name, rows]) => ({ name, rowCount: rows.length, fields: Object.keys(rows[0] || {}).filter(field => !field.endsWith('Code')), sampleReference: rows[0]?.depositId }));
  const depositIds = new Set(sources.coinDeposit.map(row => row.depositId));
  const sharedIds = sources.transactions.filter(row => depositIds.has(row.depositId)).length;
  const flagged = sources.coinDeposit[9];
  const credit = sources.transactions.find(row => row.depositId === flagged.depositId);
  return { synthetic: true, tables, joinKey: 'depositId', sharedIds, observed: { deposit: `${(flagged.amountCents / 100).toFixed(2)} ${flagged.asset}`, transaction: `${(credit.amountCents / 100).toFixed(2)} ${credit.asset}` }, flaggedDepositId: flagged.depositId, candidate: 'For every coinDeposit, find exactly one credit in transactions with the same deposit ID, account, asset and amount.', note: 'This analysis uses synthetic rows. A sample alone cannot establish completeness of a real database.' };
}
