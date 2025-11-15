"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SolSinsUser = {
  id: string;
  email: string;
  role: "FAN" | "CREATOR" | "ADMIN";
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<SolSinsUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("solsinsUser");
      if (!raw) {
        setChecked(true);
        return;
      }
      const parsed = JSON.parse(raw) as SolSinsUser;
      setUser(parsed);
    } catch {
      // ignore
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!user || user.role !== "ADMIN") {
      router.replace("/login");
    }
  }, [checked, user, router]);

  if (!checked || !user || user.role !== "ADMIN") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-white/60 text-sm">Checking admin access…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">SolSins Admin</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-2 py-1 rounded-full border border-green-500/40 text-green-300/90 text-xs">
            ADMIN
          </span>
          <span className="font-mono text-white/70">{user.email}</span>
          <button
            className="ml-4 text-red-400 text-xs underline underline-offset-4"
            onClick={() => {
              localStorage.removeItem("solsinsUser");
              router.push("/login");
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="border border-white/10 rounded-2xl p-4 bg-white/5">
          <h2 className="text-sm font-semibold mb-1">Creators</h2>
          <p className="text-xs text-white/60 mb-3">
            Later we’ll list creators, verify them, and feature accounts here.
          </p>
          <p className="text-2xl font-mono">0</p>
        </div>

        <div className="border border-white/10 rounded-2xl p-4 bg-white/5">
          <h2 className="text-sm font-semibold mb-1">Total SOL Volume</h2>
          <p className="text-xs text-white/60 mb-3">
            Sum of all completed Solana payments.
          </p>
          <p className="text-2xl font-mono">0.00 SOL</p>
        </div>

        <div className="border border-white/10 rounded-2xl p-4 bg-white/5">
          <h2 className="text-sm font-semibold mb-1">Platform Earnings</h2>
          <p className="text-xs text-white/60 mb-3">
            Since creators keep 100%, this will be from featured tiers etc.
          </p>
          <p className="text-2xl font-mono">$0.00</p>
        </div>
      </section>

      <section className="mt-10 border border-dashed border-white/20 rounded-2xl p-6 text-sm text-white/70">
        <h2 className="text-base font-semibold mb-2">Next steps</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Creator registration & verification</li>
          <li>Media upload (image/video) and pay-per-view links</li>
          <li>Solana checkout per media item with on-chain validation</li>
          <li>Creator balances & withdrawals (min $5 in SOL)</li>
        </ul>
      </section>
    </main>
  );
}
