import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/creator/profile?userId=...
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
      select: {
        id: true,
        handle: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        defaultCurrency: true,
        createdAt: true,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { ok: false, error: "Creator profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, creator });
  } catch (err) {
    console.error("[api/creator/profile GET] error", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

// PUT /api/creator/profile
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      displayName,
      bio,
      avatarUrl,
      bannerUrl,
      defaultCurrency,
    } = body as {
      userId?: string;
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
      bannerUrl?: string;
      defaultCurrency?: string;
    };

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    const creator = await prisma.creator.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!creator) {
      return NextResponse.json(
        { ok: false, error: "Creator profile not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.creator.update({
      where: { userId },
      data: {
        displayName: displayName?.trim() || undefined,
        bio: bio ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        bannerUrl: bannerUrl ?? undefined,
        defaultCurrency: defaultCurrency ?? undefined,
      },
      select: {
        id: true,
        handle: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        defaultCurrency: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, creator: updated });
  } catch (err) {
    console.error("[api/creator/profile PUT] error", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
