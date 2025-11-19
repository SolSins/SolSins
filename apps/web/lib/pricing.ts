// Simple helper: convert USD cents → lamports using a static SOL price.
// You can replace this with live pricing later.

export async function usdToLamports(amountUsdCents: number): Promise<number> {
  if (!Number.isFinite(amountUsdCents) || amountUsdCents <= 0) {
    throw new Error(`Invalid amountUsdCents: ${amountUsdCents}`);
  }

  // Convert cents → dollars
  const usd = amountUsdCents / 100;

  // TEMP: static price – change later to live price if you want
  const pricePerSolUsd = 140;

  const solAmount = usd / pricePerSolUsd;
  const lamports = Math.floor(solAmount * 1_000_000_000);

  if (!Number.isFinite(lamports) || lamports <= 0) {
    throw new Error(`Failed to convert USD to lamports (usd=${usd})`);
  }

  return lamports;
}
