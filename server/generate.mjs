export function generateCheckCode(rule) {
  if (rule.id !== 'coin-deposit-transaction-v1') throw new Error('Unsupported rule template');
  return `// Generated from AuditMind rule ${rule.id}.
// The preview worker executes this exact proposed file.
export function reconcile({ coinDeposit, transactions }, rule) {
  const findings = [];
  for (const deposit of coinDeposit) {
    const related = transactions.filter(row => row.depositId === deposit.depositId && row.direction === 'credit');
    if (related.length !== 1) {
      findings.push({ reference: deposit.depositId, kind: 'cardinality', source: 'transactions', expected: 'one credit', actual: String(related.length) });
      continue;
    }
    const credit = related[0];
    if (credit.accountId !== deposit.accountId) findings.push({ reference: deposit.depositId, kind: 'account', source: 'transactions', expected: deposit.accountId, actual: credit.accountId });
    if (credit.asset !== deposit.asset) findings.push({ reference: deposit.depositId, kind: 'asset', source: 'transactions', expected: deposit.asset, actual: credit.asset });
    if (credit.amountCents !== deposit.amountCents) findings.push({ reference: deposit.depositId, kind: 'amount', source: 'transactions', expected: (deposit.amountCents / 100).toFixed(2) + ' ' + deposit.asset, actual: (credit.amountCents / 100).toFixed(2) + ' ' + credit.asset });
  }
  return { ruleId: rule.id, checked: coinDeposit.length, passed: findings.length === 0, findings };
}
`;
}
