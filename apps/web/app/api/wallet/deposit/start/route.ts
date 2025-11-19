import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import walletsData from "@/data/solana-wallets.json";

type StartDepositBody = {
  userId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as StartDepositBody;
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const wallets = (walletsData as any).wallets as string[];
    if (!wallets || wallets.length === 0) {
      return NextResponse.json(
        { error: "No deposit wallets configured" },
        { status: 500 }
      );
    }

    const randomIndex = Math.floor(Math.random() * wallets.length);
    const address = wallets[randomIndex];

    const deposit = await prisma.walletDeposit.create({
      data: {
        userId,
        address,
        amountLamports: BigInt(0),
        status: "PENDING",
      },
    });

    // Only return JSON-friendly fields
    return NextResponse.json({
      depositId: deposit.id,
      address,
    });
  } catch (err) {
    console.error("[wallet/deposit/start] error", err);
    return NextResponse.json(
      { error: "Failed to start deposit" },
      { status: 500 }
    );
  }
}
