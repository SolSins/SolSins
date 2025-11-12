import { Connection, PublicKey } from "@solana/web3.js";
import walletsData from "@/data/solana-wallets.json";

const RPC = process.env.SOL_RPC ?? "https://api.devnet.solana.com";
const connection = new Connection(RPC, "confirmed");

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick a wallet that currently has 0 balance; if none found, fallback to random wallet
 */
export async function pickRandomEmptyWallet(): Promise<string> {
  const wallets: string[] = walletsData.wallets ?? [];
  if (!wallets.length) throw new Error("No wallets in solana-wallets.json");

  const shuffled = [...wallets].sort(() => Math.random() - 0.5);
  for (const w of shuffled) {
    try {
      const bal = await connection.getBalance(new PublicKey(w), "confirmed");
      if (bal === 0) {
        console.log("[SolSins] picked empty wallet:", w);
        return w;
      }
    } catch (err) {
      console.warn("[SolSins] invalid wallet, skipping:", w);
    }
  }
  const fallback = randomItem(wallets);
  console.warn("[SolSins] no empty wallets found — fallback:", fallback);
  return fallback;
}
