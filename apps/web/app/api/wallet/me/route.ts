import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Body = {
  userId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // Ensure wallet exists
    let wallet = await prisma.walletAccount.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.walletAccount.create({
        data: { userId },
      });
    }

    // Only show deposits that actually have some SOL credited
    const deposits = await prisma.walletDeposit.findMany({
      where: {
        userId,
        amountLamports: { gt: BigInt(0) },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const safeDeposits = deposits.map((d) => ({
      id: d.id,
      userId: d.userId,
      address: d.address,
      txSignature: d.txSignature,
      amountLamports: d.amountLamports.toString(),
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      confirmedAt: d.confirmedAt ? d.confirmedAt.toISOString() : null,
    }));

    return NextResponse.json({
      balanceLamports: wallet.balanceLamports.toString(),
      deposits: safeDeposits,
    });
  } catch (err) {
    console.error("[wallet/me] error", err);
    return NextResponse.json(
      { error: "Failed to load wallet" },
      { status: 500 }
    );
  }
}
