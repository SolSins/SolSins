import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

type Role = "FAN" | "CREATOR" | "ADMIN";

interface RegisterBody {
  email: string;
  password: string;
  role?: Role;
  handle?: string;       // creator only
  displayName?: string;  // used by both (creator + fan)
}

// original helper; still used as fallback
function makeHandleFromEmail(email: string) {
  const base =
    email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase() ||
    "creator";
  const suffix = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  return `${base}${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const role: Role = body.role || "CREATOR";

    // NEW: incoming handle + displayName from signup
    const rawHandle = body.handle?.trim() ?? "";
    const rawDisplayName = body.displayName?.trim() ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Email is already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 👇 FAN DISPLAY NAME LOGIC
    // If it's a fan signup and they provided a displayName, store it on User.
    const isFan = role === "FAN";
    const fanDisplayName = isFan && rawDisplayName ? rawDisplayName : null;

    // This matches your old, working code: User has `hashedPassword`
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        role,
        ...(fanDisplayName && { displayName: fanDisplayName }), // 👈 fan only
      },
    });

    // If creator, create a basic profile
    if (role === "CREATOR") {
      // 1) Normalise requested handle (same rules as your input)
      let baseHandle = rawHandle.replace(/[^a-zA-Z0-9_.]/g, "");

      // 2) If they didn't enter a handle, fall back to email-based one
      if (!baseHandle) {
        baseHandle = makeHandleFromEmail(email);
      }

      let handle = baseHandle;
      let unique = false;

      // 3) Try to find a unique handle (keep your old logic)
      for (let i = 0; i < 5 && !unique; i++) {
        const exists = await prisma.creator.findUnique({
          where: { handle },
        });
        if (!exists) {
          unique = true;
        } else {
          // if the exact handle was taken, fall back to randomised one
          handle = makeHandleFromEmail(email);
        }
      }

      // 4) Display name: use the one from form, or fall back to the email prefix
      const displayName =
        rawDisplayName || email.split("@")[0] || "New Creator";

      await prisma.creator.create({
        data: {
          userId: user.id,
          handle,
          displayName,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
