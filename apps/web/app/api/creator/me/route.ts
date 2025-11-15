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

    const creator = await prisma.creator.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { ok: false, error: "creator_not_found" },
        { status: 404 }
      );
    }

    const [media, orders, purchases] = await Promise.all([
      prisma.media.findMany({
        where: { creatorId: creator.id },
        orderBy: { createdAt: "desc" },
        include: { purchases: true },
      }),
      prisma.order.findMany({
        where: { creatorId: creator.id },
      }),
      prisma.purchase.findMany({
        where: { media: { creatorId: creator.id } },
      }),
    ]);

    const totalUsdCents = orders.reduce(
      (sum, o) => sum + (o.amountUsdCents ?? 0),
      0
    );

    const mediaCount = media.length;
    const orderCount = orders.length;
    const totalPurchases = purchases.length;

    const mediaResponse = media.map((m) => ({
      id: m.id,
      title: m.title,
      caption: m.caption,
      createdAt: m.createdAt.toISOString(),
      visibility: m.visibility,
      priceUsdCents: m.priceUsdCents,
      fileUrl: m.fileUrl,
      coverUrl: m.coverUrl,
      purchaseCount: m.purchases.length,
    }));

    const creatorResponse = {
      id: creator.id,
      handle: creator.handle,
      displayName: creator.displayName,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      bannerUrl: creator.bannerUrl,
      defaultCurrency: creator.defaultCurrency,
      createdAt: creator.createdAt.toISOString(),
      email: creator.user.email,
    };

    return NextResponse.json({
      ok: true,
      creator: creatorResponse,
      stats: {
        mediaCount,
        totalPurchases,
        orderCount,
        totalUsdCents,
      },
      media: mediaResponse,
    });
  } catch (err) {
    console.error("[api/creator/me] error", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
