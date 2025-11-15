// apps/web/app/api/fan/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // All orders this user has made
    const orders = await prisma.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: "desc" },
    });

    const totalUsdCents = orders.reduce(
      (sum, o) => sum + (o.amountUsdCents ?? 0),
      0
    );

    // All purchases / unlocked media
    const purchases = await prisma.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        media: {
          include: {
            creator: true,
          },
        },
      },
    });

    const uniqueCreatorIds = Array.from(
      new Set(purchases.map((p) => p.media.creatorId))
    );

    const purchasesResponse = purchases.map((p) => ({
      id: p.id,
      createdAt: p.createdAt.toISOString(),
      mediaId: p.media.id,
      mediaTitle: p.media.title,
      mediaCaption: p.media.caption,
      mediaCoverUrl: p.media.coverUrl,
      mediaVisibility: p.media.visibility,
      mediaPriceUsdCents: p.media.priceUsdCents,
      creatorHandle: p.media.creator.handle,
      creatorDisplayName: p.media.creator.displayName,
    }));

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
      stats: {
        totalUsdCents,
        orderCount: orders.length,
        purchaseCount: purchases.length,
        creatorsSupported: uniqueCreatorIds.length,
      },
      purchases: purchasesResponse,
    });
  } catch (err) {
    console.error("[api/fan/me] error", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
