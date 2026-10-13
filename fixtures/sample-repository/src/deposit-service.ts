// Fictional service excerpt for the guided codebase analysis.
export async function recordCoinDeposit(deposit) {
  return database.coinDeposit.insert({
    depositId: deposit.id,
    accountId: deposit.accountId,
    asset: deposit.asset,
    amountCents: deposit.amountCents,
    status: 'confirmed',
  });
}
