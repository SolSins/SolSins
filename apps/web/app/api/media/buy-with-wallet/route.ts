import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Body = {
  userId: string;   // fan
  mediaId: string;  // PPV post
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const { userId, mediaId } = body;

    if (!userId || !mediaId) {
      return NextResponse.json(
        { error: "Missing userId or mediaId" },
        { status: 400 }
      );
    }

    // Load media + price (in cents or lamports; here I assume USD cents then convert)
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media || media.priceUsdCents === null) {
      return NextResponse.json(
        { error: "Media not purchasable" },
        { status: 400 }
      );
    }

    // You probably already have a SOL price fetcher. For now, assume you pass
    // price directly in lamports or use a helper here.
    // Example: 1 USD = X lamports (via /api/pricing/sol). For simplicity:
    const usdCents = media.priceUsdCents;
    // TODO: replace stub with real conversion
    const lamportsPerUsd = 1_000_000_000n; // placeholder, fix later
    const priceLamports = lamportsPerUsd * BigInt(usdCents) / 100n;

    const wallet = await prisma.walletAccount.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balanceLamports < priceLamports) {
      return NextResponse.json(
        { error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // Atomic: deduct balance + create purchase
    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.walletAccount.update({
        where: { userId },
        data: {
          balanceLamports: wallet.balanceLamports - priceLamports,
        },
      });

      const purchase = await tx.mediaPurchase.create({
        data: {
          userId,
          mediaId,
          amountLamports: priceLamports,
          // other fields like creatorId, usdCents, etc.
        },
      });

      return { updatedWallet, purchase };
    });

    return NextResponse.json({
      ok: true,
      newBalanceLamports: result.updatedWallet.balanceLamports.toString(),
      purchaseId: result.purchase.id,
    });
  } catch (err) {
    console.error("buy-with-wallet error", err);
    return NextResponse.json(
      { error: "Failed to buy with wallet" },
      { status: 500 }
    );
  }
}
