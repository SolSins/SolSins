import { NextResponse } from "next/server";
import { Keypair, PublicKey } from "@solana/web3.js";
import { encodeURL } from "@solana/pay";
import { prisma } from "@/lib/db";
import { pickRandomEmptyWallet } from "@/providers/solana-wallets";
import { usdToLamports } from "@/lib/pricing";

export async function POST(req: Request) {
  const { buyerId, creatorId, kind, amountUsdCents, token, mediaId } = await req.json();
  if (!buyerId || !creatorId) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  let usdCents = amountUsdCents;
  if (mediaId) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || media.visibility !== "PAY_PER_VIEW" || !media.priceUsdCents) {
      return NextResponse.json({ error: "Invalid media" }, { status: 400 });
    }
    usdCents = media.priceUsdCents;
  }
  if (!usdCents) return NextResponse.json({ error: "amount required" }, { status: 400 });

  const reference = Keypair.generate().publicKey.toBase58();
  const destination = await pickRandomEmptyWallet();
  const lamports = await usdToLamports(usdCents);

  const order = await prisma.order.create({
    data: {
      buyerId, creatorId, mediaId: mediaId ?? null,
      kind: kind ?? (mediaId ? "PPV" : "TIP"),
      currency: token ?? "SOL",
      amountUsdCents: usdCents,
      amountLamports: lamports.toString(),
      destination, reference, status: "PENDING"
    }
  });

  const url = encodeURL({
    recipient: new PublicKey(destination),
    reference: [new PublicKey(reference)],
    label: "SolSins",
    message: `${order.kind} • ${order.creatorId}`
  });

  return NextResponse.json({ orderId: order.id, reference, destination, expectedLamports: order.amountLamports, solanaPayUrl: url.toString() });
}
