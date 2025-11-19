import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

export const dynamic = "force-dynamic";

const RPC_URL =
  process.env.SOLANA_RPC_URL || clusterApiUrl("mainnet-beta");

// Helper to safely get lamports credited to a specific address in a parsed tx
function getLamportsForAddressFromTx(
  tx: any,
  address: string
): bigint {
  if (!tx || !tx.meta || !tx.transaction) return BigInt(0);

  const message = tx.transaction.message;
  const accountKeys = message.accountKeys || [];
  const preBalances = tx.meta.preBalances || [];
  const postBalances = tx.meta.postBalances || [];

  const idx = accountKeys.findIndex((k: any) => {
    if (typeof k === "string") return k === address;
    // Parsed account key object { pubkey, signer, writable }
    return k?.pubkey?.toBase58?.() === address;
  });

  if (idx === -1) return BigInt(0);

  const pre = BigInt(preBalances[idx] ?? 0);
  const post = BigInt(postBalances[idx] ?? 0);
  const diff = post - pre;

  return diff > BigInt(0) ? diff : BigInt(0);
}

export async function POST() {
  try {
    const connection = new Connection(RPC_URL, "confirmed");

    // All pending deposits we haven't credited yet
    const pending = await prisma.walletDeposit.findMany({
      where: {
        status: "PENDING",
      },
    });

    if (pending.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    let processed = 0;

    for (const dep of pending) {
      try {
        // Ensure the deposit.address is a valid Solana pubkey
        let pubkey: PublicKey;
        try {
          pubkey = new PublicKey(dep.address);
        } catch {
          console.warn(
            `[wallet/sync] Skipping deposit ${dep.id}: invalid Solana address ${dep.address}`
          );
          continue;
        }

        // Get latest signatures involving this address
        const signatures = await connection.getSignaturesForAddress(pubkey, {
          limit: 10,
        });

        if (!signatures.length) {
          continue; // nothing has hit this address yet
        }

        // If we've already stored a txSignature on this deposit, and the latest
        // we see is the same, skip (already processed)
        const latest = signatures[0];
        if (dep.txSignature && latest.signature === dep.txSignature) {
          continue;
        }

        // Get parsed tx for the latest signature
        const parsedTx = await connection.getParsedTransaction(
          latest.signature,
          {
            maxSupportedTransactionVersion: 0,
          }
        );

        const creditedLamports = getLamportsForAddressFromTx(
          parsedTx,
          dep.address
        );

        if (creditedLamports <= BigInt(0)) {
          continue; // no positive balance change for this address in that tx
        }

        const confirmedAt =
          latest.blockTime != null
            ? new Date(latest.blockTime * 1000)
            : new Date();

        const diff = creditedLamports;

        // Atomically update deposit + wallet balance
        await prisma.$transaction([
          prisma.walletDeposit.update({
            where: { id: dep.id },
            data: {
              amountLamports: diff,
              status: "CONFIRMED",
              txSignature: latest.signature,
              confirmedAt,
            },
          }),
          prisma.walletAccount.upsert({
            where: { userId: dep.userId },
            create: {
              userId: dep.userId,
              balanceLamports: diff,
            },
            update: {
              balanceLamports: { increment: diff },
            },
          }),
        ]);

        processed += 1;
      } catch (err) {
        console.error(
          `[wallet/sync] Error processing deposit ${dep.id}`,
          err
        );
        // keep going with other deposits
      }
    }

    return NextResponse.json({ ok: true, processed });
  } catch (err) {
    console.error("[wallet/sync] fatal error", err);
    return NextResponse.json(
      { error: "Failed to sync deposits" },
      { status: 500 }
    );
  }
}
