import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@dev.local" },
    update: {},
    create: { email: "buyer@dev.local", role: "FAN" }
  });

  const creatorUser = await prisma.user.upsert({
    where: { email: "creator@dev.local" },
    update: {},
    create: { email: "creator@dev.local", role: "CREATOR" }
  });

  await prisma.creator.upsert({
    where: { userId: creatorUser.id },
    update: { handle: "devcreator", displayName: "Dev Creator" },
    create: { userId: creatorUser.id, handle: "devcreator", displayName: "Dev Creator" }
  });

  return NextResponse.json({ buyerId: buyer.id, creatorId: creatorUser.id, handle: "devcreator" });
}
