import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcrypt";

export async function POST(req: Request) {
  const { email, password, role, handle } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Missing" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email in use" }, { status: 400 });

  const hashedPassword = await hash(password, 10);
  const user = await prisma.user.create({ data: { email, hashedPassword, role } });

  if (role === "CREATOR") {
    if (!handle) return NextResponse.json({ error: "Handle required" }, { status: 400 });
    await prisma.creator.create({
      data: { userId: user.id, handle, displayName: handle }
    });
  }
  return NextResponse.json({ ok: true });
}
