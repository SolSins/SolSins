import { NextResponse } from "next/server";
import { Keypair, PublicKey } from "@solana/web3.js";
import { encodeURL } from "@solana/pay";
import { prisma } from "@/lib/db";
import { pickRandomEmptyWallet } from "@/providers/solana-wallets";

export async function POST(req: Request) {
  const { buyerId, creatorId, kind, amountUsdCents, token } = await req.json();

  if (!buyerId || !creatorId || !amountUsdCents) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // create a unique reference for Solana Pay (wallets will include it in tx)
  const reference = Keypair.generate().publicKey.toBase58();

  const destination = await pickRandomEmptyWallet();

  const order = await prisma.order.create({
    data: {
      buyerId,
      creatorId,
      kind: kind ?? "PPV",
      currency: token ?? "SOL",
      amountUsdCents,
      destination,
      reference,
      status: "PENDING"
    }
  });

  const url = encodeURL({
    recipient: new PublicKey(destination),
    reference: [new PublicKey(reference)],
    label: "SolSins",
    message: `${order.kind} • ${order.creatorId}`
  });

  return NextResponse.json({
    orderId: order.id,
    reference,
    destination,
    solanaPayUrl: url.toString()
  });
}
