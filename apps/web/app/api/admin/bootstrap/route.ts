import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcrypt";

export async function POST(req: Request) {
  const { token, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing email/password" }, { status: 400 });
  }

  // Check if any admin already exists
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });

  // If admins already exist, require a matching token
  if (adminCount > 0) {
    if (!process.env.ADMIN_SETUP_TOKEN || token !== process.env.ADMIN_SETUP_TOKEN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const hashedPassword = await hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", hashedPassword },
    create: { email, role: "ADMIN", hashedPassword }
  });

  return NextResponse.json({ ok: true, userId: user.id, role: user.role, firstAdmin: adminCount === 0 });
}
