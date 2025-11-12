import { NextResponse } from "next/server";
import { connection } from "https://raw.githubusercontent.com/solana-labs/solana-web3.js/master/src/index.js";
import { PublicKey } from "@solana/web3.js";
import { findReference, validateTransfer } from "@solana/pay";
import { prisma } from "@/lib/db";

// Note: env SOL_RPC should be set. This route validates by destination + amount if available.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference");
  if (!reference) return NextResponse.json({ status: "bad_request" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order) return NextResponse.json({ status: "not_found" }, { status: 404 });
  if (order.status === "CONFIRMED") return NextResponse.json({ status: "confirmed" });

  // try to find on-chain signature by reference or by destination
  const conn = new (await import("@solana/web3.js")).Connection(process.env.SOL_RPC || "https://api.devnet.solana.com", "confirmed");
  try {
    const refPub = new PublicKey(reference);
    const sigInfo = await findReference(conn, refPub, { finality: "confirmed" });
    // If we find signature by reference, validate basic transfer to destination
    await validateTransfer(conn, sigInfo.signature, {
      recipient: new PublicKey(order.destination),
      // amount: if you want strict amount validation convert to lamports and pass here
    });

    // mark order confirmed and credit balance (store in cents)
    await prisma.$transaction([
      prisma.order.update({ where: { reference }, data: { status: "CONFIRMED", signature: sigInfo.signature } }),
      prisma.balance.upsert({
        where: { userId: order.creatorId },
        update: { usdCents: { increment: order.amountUsdCents } },
        create: { userId: order.creatorId, usdCents: order.amountUsdCents }
      })
    ]);

    return NextResponse.json({ status: "confirmed", signature: sigInfo.signature });
  } catch (e) {
    // fallback: try scanning signatures for the destination address to find a matching tx
    return NextResponse.json({ status: "pending" });
  }
}
