// apps/web/app/api/creator/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type MediaVisibility = "PUBLIC" | "PAY_PER_VIEW" | "SUBSCRIBERS";
type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "FILE";

/* ----------------------------------------------------------
   GET /api/creator/media?userId=...
   Returns: all media created by a specific creator
----------------------------------------------------------- */
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

    // Ensure this user IS a creator
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

    // Fetch creator media
    const media = await prisma.media.findMany({
      where: { creatorId: creator.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, media });
  } catch (err) {
    console.error("[api/creator/media GET] error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ----------------------------------------------------------
   POST /api/creator/media
   Body schema:
   {
     userId: string,
     title: string,
     caption?: string,
     type: MediaType,
     visibility?: MediaVisibility,
     priceUsdCents?: number | null,
     fileUrl: string,
     coverUrl?: string
   }
----------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      title,
      caption,
      type,
      visibility,
      priceUsdCents,
      fileUrl,
      coverUrl,
    } = body as {
      userId?: string;
      title?: string;
      caption?: string;
      type?: MediaType;
      visibility?: MediaVisibility;
      priceUsdCents?: number | null;
      fileUrl?: string;
      coverUrl?: string;
    };

    // Validate
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    if (!title || !fileUrl || !type) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find creator record
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

    // Save the media record
    const media = await prisma.media.create({
      data: {
        creatorId: creator.id,
        title: title.trim(),
        caption: caption ?? "",
        type,
        visibility: visibility ?? "PAY_PER_VIEW",
        priceUsdCents: priceUsdCents ?? null,
        fileUrl: fileUrl.trim(),
        coverUrl: (coverUrl ?? "").trim(),
      },
    });

    return NextResponse.json({ ok: true, media });
  } catch (err) {
    console.error("[api/creator/media POST] error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
