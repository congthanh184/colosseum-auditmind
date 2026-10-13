import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fixtureRoot = join(root, 'fixtures/sample-repository');
const paths = ['db/schema.sql', 'src/deposit-service.ts', 'src/balance-service.ts'];

export const matchQuestions = [
  { id: 'one-credit', title: 'Did every confirmed coin deposit create exactly one credit transaction?', fields: ['coinDeposit.depositId', 'transactions.depositId', 'transactions.direction'] },
  { id: 'same-owner-asset', title: 'Was the credit applied to the same account and asset?', fields: ['accountId', 'asset'] },
  { id: 'same-amount', title: 'Was the credited amount equal to the deposited amount?', fields: ['amountCents'] }
];

export async function analyzeCodebase() {
  const files = await Promise.all(paths.map(async path => ({ path, text: await readFile(join(fixtureRoot, path), 'utf8') })));
  const schema = files[0].text;
  const tables = [...schema.matchAll(/CREATE TABLE\s+(\w+)\s*\(([^;]+)\);/g)].map(([, name, definition]) => ({
    name,
    fields: definition.split('\n').map(line => line.trim().replace(/,$/, '')).filter(line => line && !line.startsWith('--')).map(line => line.split(/\s+/)[0])
  }));
  const names = new Set(tables.map(table => table.name));
  if (!names.has('coinDeposit') || !names.has('transactions')) throw new Error('Sample schema is missing the expected tables');
  for (const [name, required] of [['coinDeposit', ['depositId', 'accountId', 'asset', 'amountCents', 'status']], ['transactions', ['depositId', 'accountId', 'direction', 'asset', 'amountCents']]]) {
    const fields = new Set(tables.find(table => table.name === name).fields);
    if (required.some(field => !fields.has(field))) throw new Error(`Sample schema is missing fields in ${name}`);
  }
  if (!files[1].text.includes('database.coinDeposit.insert') || !files[2].text.includes('database.transactions.insert')) throw new Error('Sample service paths do not match the schema');
  return {
    mode: 'sample-codebase',
    repository: 'sample/wallet-ledger',
    files: files.map(({ path }) => ({ path, kind: path.endsWith('.sql') ? 'SQL schema' : 'Service code' })),
    tables,
    relationship: { from: 'coinDeposit.depositId', to: 'transactions.depositId', filter: "transactions.direction = 'credit'" },
    questions: matchQuestions,
    note: 'This is a guided scan of three local fixture files. No GitHub repository or live database was accessed.'
  };
}
