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
      recipient: new PublicKey(order.destination)
      // amount: optional strict amount check (lamports) – add later if desired
      // splToken: set if you're validating USDC SPL
    });

    await prisma.$transaction([
      prisma.order.update({ where: { reference }, data: { status: "CONFIRMED", signature: sigInfo.signature } }),
      prisma.balance.upsert({
        where: { userId: order.creatorId },
        update: { usdCents: { increment: order.amountUsdCents } },
        create: { userId: order.creatorId, usdCents: order.amountUsdCents }
      })
    ]);

    return NextResponse.json({ status: "confirmed", signature: sigInfo.signature });
  } catch {
    return NextResponse.json({ status: "pending" });
  }
}
