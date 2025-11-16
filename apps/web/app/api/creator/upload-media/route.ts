// apps/web/app/api/creator/upload-media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL, R2_ENDPOINT } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Buffer } from "buffer";

export const runtime = "nodejs";

type MediaVisibility = "PUBLIC" | "PAY_PER_VIEW" | "SUBSCRIBERS";
type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "FILE";

export async function POST(req: NextRequest) {
  try {
    // Quick env sanity check
    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "R2 credentials not configured on server",
          details:
            "Check R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in apps/web/.env.local and restart dev server.",
        },
        { status: 500 }
      );
    }
    if (!process.env.R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_PUBLIC_BASE_URL) {
      return NextResponse.json(
        {
          ok: false,
          error: "R2 bucket / account not configured",
          details:
            "Ensure R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL are set in apps/web/.env.local.",
        },
        { status: 500 }
      );
    }

    const form = await req.formData();

    const userId = form.get("userId") as string | null;
    const title = form.get("title") as string | null;
    const caption = (form.get("caption") as string | null) ?? "";
    const type = form.get("type") as MediaType | null;
    const visibility =
      (form.get("visibility") as MediaVisibility | null) ?? "PAY_PER_VIEW";
    const priceUsdCentsRaw = form.get("priceUsdCents") as string | null;
    const coverUrl = (form.get("coverUrl") as string | null) ?? "";
    const file = form.get("file");

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    if (!title || !type) {
      return NextResponse.json(
        { ok: false, error: "Missing title or type" },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Missing file" },
        { status: 400 }
      );
    }

    // Ensure this user has a creator profile
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

    let priceUsdCents: number | null = null;
    if (visibility !== "PUBLIC" && priceUsdCentsRaw) {
      const parsed = parseInt(priceUsdCentsRaw, 10);
      if (!isNaN(parsed) && parsed > 0) {
        priceUsdCents = parsed;
      }
    }

    // Build R2 object key
    const ext =
      file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      "bin";
    const now = Date.now();
    const random = Math.random().toString(36).slice(2);
    const key = `media/${creator.id}/${now}-${random}.${ext}`;

    // Read file into a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    // Upload to R2 from the server
    try {
      const putCommand = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: file.type || "application/octet-stream",
      } as any);

      console.log("[upload-media] putting object", {
        bucket: R2_BUCKET_NAME,
        endpoint: R2_ENDPOINT,
        key,
        size: body.length,
      });

      await r2Client.send(putCommand);
    } catch (uploadErr: any) {
      console.error("[upload-media] R2 upload error", uploadErr);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to upload to R2",
          details: `bucket=${R2_BUCKET_NAME}, endpoint=${R2_ENDPOINT}, message=${
            uploadErr?.message ?? uploadErr?.toString() ?? "Unknown R2 error"
          }`,
        },
        { status: 500 }
      );
    }

    const publicUrl = `${R2_PUBLIC_BASE_URL}/${key}`;

    // Create media record in DB
    let media;
    try {
      media = await prisma.media.create({
        data: {
          creatorId: creator.id,
          title: title.trim(),
          caption: caption ?? "",
          type,
          visibility,
          priceUsdCents,
          fileUrl: publicUrl,
          coverUrl: coverUrl.trim(),
        },
      });
    } catch (dbErr: any) {
      console.error("[upload-media] Prisma error", dbErr);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to save media record",
          details:
            dbErr?.message ??
            dbErr?.toString() ??
            "Unknown Prisma error, check server logs",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, media });
  } catch (err: any) {
    console.error("[api/creator/upload-media] error", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
        details:
          err?.message ??
          err?.toString() ??
          "Unknown error, see server logs for stack trace",
      },
      { status: 500 }
    );
  }
}
