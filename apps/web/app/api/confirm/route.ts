import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { findReference, validateTransfer } from "@solana/pay";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference");
  if (!reference) return NextResponse.json({ status: "bad_request" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order) return NextResponse.json({ status: "not_found" }, { status: 404 });
  if (order.status === "CONFIRMED") return NextResponse.json({ status: "confirmed" });

  const conn = new Connection(process.env.SOL_RPC || "https://api.devnet.solana.com", "confirmed");

  try {
    const refPub = new PublicKey(reference);
    const sigInfo = await findReference(conn, refPub, { finality: "confirmed" });

    await validateTransfer(conn, sigInfo.signature, {
  recipient: new PublicKey(order.destination),
  amount: BigInt(order.amountLamports || "0"), // ← REQUIRED by @solana/pay@0.2.6
  // splToken: ... (only if using USDC SPL)
});

       const tx = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({ where: { reference }, data: { status: "CONFIRMED", signature: sigInfo.signature } });
      if (updated.mediaId) {
        await tx.purchase.create({ data: { userId: updated.buyerId, mediaId: updated.mediaId, orderId: updated.id } });
      }
      await tx.balance.upsert({
        where: { userId: updated.creatorId },
        update: { usdCents: { increment: updated.amountUsdCents } },
        create: { userId: updated.creatorId, usdCents: updated.amountUsdCents }
      });
      return updated;
    });

    return NextResponse.json({ status: "confirmed", signature: sigInfo.signature });
  } catch {
    return NextResponse.json({ status: "pending" });
  }
}
