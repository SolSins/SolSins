import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Missing email or password" },
        { status: 400 }
      );
    }

    // Check how many admins exist
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: "ADMIN",
        hashedPassword,
      },
      create: {
        email,
        role: "ADMIN",
        hashedPassword,
      },
    });

    return NextResponse.json({
      ok: true,
      userId: user.id,
      email: user.email,
      role: user.role,
      firstAdmin: adminCount === 0,
    });
  } catch (err: any) {
    console.error("[/api/admin/bootstrap] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
