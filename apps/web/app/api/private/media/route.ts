import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { creatorProfile: true }});
  if (!user || user.role !== "CREATOR" || !user.creatorProfile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, priceUsdCents, fileUrl, visibility = "PAY_PER_VIEW" } = await req.json();
  if (!title || !fileUrl) return NextResponse.json({ error: "Missing" }, { status: 400 });
  if (visibility === "PAY_PER_VIEW" && !priceUsdCents) return NextResponse.json({ error: "Price required" }, { status: 400 });

  await prisma.media.create({
    data: {
      creatorId: user.creatorProfile.id,
      type: "IMAGE",
      title,
      fileUrl,
      visibility,
      priceUsdCents: priceUsdCents ?? null
    }
  });

  return NextResponse.json({ ok: true });
}
