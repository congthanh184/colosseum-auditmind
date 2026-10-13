export function generateCheckCode(rule) {
  if (rule.id !== 'deposit-credit-ledger-v1') throw new Error('Unsupported rule template');
  return `// Generated from AuditMind rule ${rule.id}.
// This is the exact code used by the preview worker and proposed for GitHub.
export function reconcile({ deposits, credits, ledger }, rule) {
  const findings = [];
  for (const deposit of deposits) {
    const matchingCredits = credits.filter(row => row.reference === deposit.reference);
    const matchingLedger = ledger.filter(row => row.reference === deposit.reference);
    if (matchingCredits.length !== 1 || matchingLedger.length !== 1) {
      findings.push({ reference: deposit.reference, kind: 'cardinality', detail: 'Expected one credit and one ledger entry.' });
      continue;
    }
    for (const [source, row] of [['Customer credit', matchingCredits[0]], ['Account ledger', matchingLedger[0]]]) {
      if (row.asset !== deposit.asset) findings.push({ reference: deposit.reference, kind: 'asset', source, expected: deposit.asset, actual: row.asset });
      if (row.amountCents !== deposit.amountCents) findings.push({ reference: deposit.reference, kind: 'amount', source, expected: deposit.amountCents, actual: row.amountCents });
    }
  }
  return { ruleId: rule.id, checked: deposits.length, passed: findings.length === 0, findings };
}
`;
}
