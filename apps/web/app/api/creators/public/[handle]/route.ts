// apps/web/app/api/creators/public/[handle]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteParams = {
  params: {
    handle: string;
  };
};

export async function GET(_req: Request, { params }: RouteParams) {
  const handle = params.handle;

  if (!handle) {
    return NextResponse.json(
      { ok: false, error: "Missing handle" },
      { status: 400 }
    );
  }

  const creator = await prisma.creator.findUnique({
    where: { handle },
    select: {
      id: true,
      handle: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      bannerUrl: true,
      defaultCurrency: true,
      createdAt: true,
      _count: {
        select: { media: true },
      },
      media: {
        where: { visibility: "PUBLIC" }, // adjust if your enum is different
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          caption: true,
          coverUrl: true,
          createdAt: true,
          priceUsdCents: true,
          visibility: true,
        },
      },
    },
  });

  if (!creator) {
    return NextResponse.json(
      { ok: false, error: "Creator not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, creator });
}
