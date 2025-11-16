// apps/web/app/api/upload-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL } from "@/lib/r2";
import { prisma } from "@/lib/db";

type Intent = "avatar" | "banner" | "media";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      intent,
      mimeType,
      extension,
    } = body as {
      userId?: string;
      intent?: Intent;
      mimeType?: string;
      extension?: string;
    };

    if (!userId || !intent || !mimeType) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Confirm this user is a creator
    const creator = await prisma.creator.findUnique({
      where: { userId },
      select: { id: true, handle: true },
    });

    if (!creator) {
      return NextResponse.json(
        { ok: false, error: "Creator profile not found" },
        { status: 404 }
      );
    }

    const safeExt =
      (extension || "").toLowerCase().replace(/[^a-z0-9.]/g, "") || "bin";
    const now = Date.now();
    const random = Math.random().toString(36).slice(2);

    let key: string;
    if (intent === "avatar") {
      key = `avatars/${creator.id}/avatar-${now}.${safeExt}`;
    } else if (intent === "banner") {
      key = `banners/${creator.id}/banner-${now}.${safeExt}`;
    } else {
      key = `media/${creator.id}/${now}-${random}.${safeExt}`;
    }

    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
      // No ACL needed – bucket is public via custom domain
    } as any);

    const uploadUrl = await getSignedUrl(r2Client, putCommand, {
      expiresIn: 60 * 5, // 5 minutes
    });

    const publicUrl = `${R2_PUBLIC_BASE_URL}/${key}`;

    return NextResponse.json({
      ok: true,
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (err) {
    console.error("[api/upload-url] error", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
