import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { compare } from "bcrypt";

const auth = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!user?.hashedPassword) return null;
        const ok = await compare(creds.password as string, user.hashedPassword);
        return ok ? user : null;
      }
    })
  ],
  pages: { signIn: "/login" }
});

const handlers = { GET: auth.handlers.GET, POST: auth.handlers.POST };
export { handlers as GET, handlers as POST };
export const { auth: authMiddleware } = auth;
