import { NextResponse } from "next/server";
import { pickRandomEmptyWallet } from "@/providers/solana-wallets";
import { encodeURL } from "@solana/pay";
import { PublicKey } from "@solana/web3.js";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { buyerId, creatorId, kind, amountUsdCents, token } = body;

  if (!buyerId || !creatorId || !amountUsdCents) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const destination = await pickRandomEmptyWallet();

  // create order in DB
  const reference = (await import("@solana/web3.js")).Keypair.generate().publicKey.toBase58();

  const order = await prisma.order.create({
    data: {
      buyerId,
      creatorId,
      kind: kind ?? "PPV",
      currency: token ?? "SOL",
      amountUsdCents,
      amountLamports: null,
      destination,
      reference,
      status: "PENDING"
    }
  });

  const url = encodeURL({
    recipient: new PublicKey(destination),
    reference: [], // optional, we rely on destination and amount verification
    label: "SolSins",
    message: `${kind} • ${creatorId}`
  });

  return NextResponse.json({ orderId: order.id, solanaPayUrl: url.toString(), destination, reference });
}
