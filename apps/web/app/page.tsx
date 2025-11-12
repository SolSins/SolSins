import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>SolSins — Dev</h1>
      <p style={{ opacity: 0.8 }}>Solana self-checkout skeleton.</p>
      <ul style={{ marginTop: 16, lineHeight: 1.8 }}>
        <li>1) Seed dev users → <Link href="/dev/seed">/dev/seed</Link></li>
        <li>2) Test checkout → <Link href="/pay">/pay</Link></li>
      </ul>
    </main>
  );
}
