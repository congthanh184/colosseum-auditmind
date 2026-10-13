// Fictional service excerpt for the guided codebase analysis.
export async function creditBalance(deposit) {
  return database.transactions.insert({
    transactionId: createId(),
    depositId: deposit.depositId,
    accountId: deposit.accountId,
    direction: 'credit',
    asset: deposit.asset,
    amountCents: deposit.amountCents,
  });
}
