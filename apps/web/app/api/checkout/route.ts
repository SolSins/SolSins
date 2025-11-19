import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pickRandomEmptyWallet } from "@/providers/solana-wallets";
import { usdToLamports } from "@/lib/pricing";

export async function POST(req: Request) {
  try {
    const {
      buyerId,
      creatorId,
      kind,
      amountUsdCents,
      token,
      mediaId,
    } = await req.json();

    // Basic validation
    if (!buyerId || !creatorId || !kind || !amountUsdCents || !token) {
      return NextResponse.json(
        { ok: false, error: "Missing required checkout fields" },
        { status: 400 }
      );
    }

    // For now we only support SOL
    if (token !== "SOL") {
      return NextResponse.json(
        { ok: false, error: `Unsupported currency: ${token}` },
        { status: 400 }
      );
    }

    const amountCentsNumber = Number(amountUsdCents);
    if (!Number.isFinite(amountCentsNumber) || amountCentsNumber <= 0) {
      return NextResponse.json(
        { ok: false, error: `Invalid amountUsdCents: ${amountUsdCents}` },
        { status: 400 }
      );
    }

    // Convert to lamports
    const lamports = await usdToLamports(amountCentsNumber);

    // Pick a destination SOL wallet for this checkout
    const destination = await pickRandomEmptyWallet(token);
    if (!destination) {
      return NextResponse.json(
        { ok: false, error: "No SOL wallet available for checkout" },
        { status: 500 }
      );
    }

    const reference = crypto.randomUUID();

    // Persist order in DB
    const order = await prisma.order.create({
      data: {
        buyerId,
        creatorId,
        mediaId: mediaId ?? null,
        // `kind` is stored as-is (e.g. "PPV"), since your schema
        // very likely uses `String` for this column.
        kind: String(kind),
        currency: token,
        amountUsdCents: amountCentsNumber,
        amountLamports: String(lamports),
        destination,
        reference,
        status: "PENDING",
      },
    });

    // Build a simple Solana Pay URL, e.g.:
    // solana:DESTINATION?amount=0.123&reference=...&label=SolSins&message=...
    const amountSol = lamports / 1_000_000_000;
    const params = new URLSearchParams({
      amount: amountSol.toString(),
      reference,
      label: "SolSins",
      message: "SolSins unlock",
    });
    const solanaPayUrl = `solana:${destination}?${params.toString()}`;

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        reference: order.reference,
        destination: order.destination,
        amountLamports: order.amountLamports,
        amountUsdCents: order.amountUsdCents,
        currency: order.currency,
      },
      solanaPayUrl,
    });
  } catch (err) {
    console.error("[api/checkout] error", err);
    const message =
      err instanceof Error ? err.message : "Unknown error in /api/checkout";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
