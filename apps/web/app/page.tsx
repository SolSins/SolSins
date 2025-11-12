import Link from "next/link";
export default function Home() {
  return (
    <main>
      <h1>SolSins</h1>
      <p>Creator-owned, Solana-powered fan platform.</p>
      <div style={{display:"flex",gap:10,marginTop:12}}>
        <Link href="/register">Create account</Link>
        <Link href="/login">Login</Link>
        <Link href="/dashboard">Dashboard</Link>
      </div>
    </main>
  );
}