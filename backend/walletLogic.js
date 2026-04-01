export function deductWallet(wallet, amount) {
  if (wallet < amount) {
    throw new Error("Insufficient balance");
  }

  return wallet - amount;
}
