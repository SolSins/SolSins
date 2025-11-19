import { NextResponse } from "next/server";
import { getSolUsdPrice } from "@/lib/pricing";

export async function GET() {
  try {
    const price = await getSolUsdPrice();

    return NextResponse.json({
      ok: true,
      solUsd: price,
    });
  } catch (err) {
    console.error("[api/pricing/sol] error", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch SOL price" },
      { status: 500 }
    );
  }
}