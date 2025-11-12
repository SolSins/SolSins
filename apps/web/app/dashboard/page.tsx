import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getServerSession();
  if (!session?.user?.email) return <div>Please login</div>;
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { creatorProfile: true, balance: true }});
  if (!user) return <div>Not found</div>;

  if (user.role === "CREATOR") {
    return (
      <main>
        <h1>Creator Dashboard</h1>
        <p>Balance: ${(user.balance?.usdCents ?? 0)/100}</p>
        <p><Link href="/dashboard/upload">Upload Media</Link></p>
        <p><Link href={`/creator/${user.creatorProfile?.handle}`}>Your public page</Link></p>
      </main>
    );
  }

  return (
    <main>
      <h1>Fan Dashboard</h1>
      <p>Your purchases will appear here.</p>
    </main>
  );
}
