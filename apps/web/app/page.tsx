"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LocalUser = {
  id: string;
  email: string;
  role: "FAN" | "CREATOR" | "ADMIN";
};



export default function HomePage() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined"
        ? localStorage.getItem("solsinsUser")
        : null;
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch {
      // ignore parse errors
    } finally {
      setHydrated(true);
    }
  }, []);

  // If logged in, hard-redirect to appropriate dashboard
  useEffect(() => {
    if (!hydrated || !user) return;

    if (user.role === "CREATOR") {
      router.replace("/creator");
    } else if (user.role === "FAN") {
      router.replace("/fan");
    } else if (user.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [hydrated, user, router]);

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("solsinsUser");
    }
    router.push("/");
  }

  // While redirecting, don't render the homepage at all
  if (hydrated && user) {
    return null;
  }

  return (
    <main>
      {/* If you ever want a tiny top bar for anonymous state, add it here */}

      <section className="hero">
        {/* Left: copy / positioning */}
        <div>
          <div className="hero-badges">
            <span className="hero-badge">Solana-native · Adult friendly</span>
          </div>

          <h1 className="hero-title">
            Keep <span className="highlight">100% of your sins.</span>
            <br />
            Paid in pure SOL.
          </h1>

          <p className="hero-subtitle">
            SolSins is a Solana-powered creator platform where fans pay you
            directly in crypto. No 30-day hold, no chargebacks, no platform cut.
          </p>

          {/* CTAs for new visitors only */}
          <div className="hero-cta">
            <a href="/register?role=CREATOR">
              <button className="btn btn-primary" type="button">
                I&apos;m a creator
              </button>
            </a>
            <a href="/login">
              <button className="btn btn-ghost" type="button">
                I&apos;m a fan
              </button>
            </a>

            <span className="hero-cta-note">
              Minimum <span>$5 USD</span> withdrawals in SOL.
            </span>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">0%</span>
              <span className="hero-stat-label">Platform cut</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">Solana</span>
              <span className="hero-stat-label">Only payments</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">PPV · Subs · Tips</span>
              <span className="hero-stat-label">All in SOL</span>
            </div>
          </div>
        </div>

        {/* Right: fake preview of a creator card */}
        <div>
          <div className="hero-card">
            <div className="hero-card-header">
              <div className="hero-card-creator">
                <div className="hero-card-avatar" />
                <div>
                  <div className="hero-card-name">LunaHex</div>
                  <div className="hero-card-handle">@luna.sin</div>
                </div>
              </div>
              <div className="hero-card-tag">Featured creator</div>
            </div>

            <div className="hero-card-body">
              <div className="hero-card-media">
                <div className="hero-card-media-overlay">
                  <div>
                    <div className="hero-card-media-text">
                      Private Solana-only drop
                    </div>
                    <div className="hero-card-media-chip">
                      Pay-per-view · SOL
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-card-footer">
                <div className="hero-card-price">
                  <span className="hero-card-price-main">0.15 SOL · PPV</span>
                  <span className="hero-card-price-sub">
                    (~$9.99 in creator’s chosen currency)
                  </span>
                </div>
                <div className="hero-card-pill">
                  No rebills · No chargebacks
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ marginTop: 56, fontSize: 13 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>How SolSins works</h2>
        <p style={{ color: "var(--sin-muted)", maxWidth: 640 }}>
          Creators set prices in their preferred currency. We show the live SOL
          equivalent and generate a unique Solana address per order from your
          wallet pool. Once payment is detected on-chain, access is unlocked and
          your balance updates instantly.
        </p>
      </section>

      {/* For creators */}
      <section
        id="creators"
        style={{ marginTop: 40, fontSize: 13, display: "grid", gap: 16 }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>For creators</h2>
        <ul
          style={{
            listStyle: "disc",
            paddingLeft: 18,
            color: "var(--sin-muted)",
            maxWidth: 640,
          }}
        >
          <li>Keep 100% of earnings – we don&apos;t skim your subs or tips.</li>
          <li>Withdraw to your own Solana wallet with a $5 USD minimum.</li>
          <li>Price content in USD, EUR, AUD etc – fans pay in SOL.</li>
          <li>Pay-per-view, subscriptions and one-off tips supported.</li>
        </ul>
      </section>

      {/* For fans */}
      <section
        id="fans"
        style={{ marginTop: 40, fontSize: 13, marginBottom: 32 }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>For fans</h2>
        <p style={{ color: "var(--sin-muted)", maxWidth: 640 }}>
          Connect with creators using pure crypto. No card statements, no
          chargebacks, no surprise rebills. Just direct support, on-chain.
        </p>
      </section>
    </main>
  );
}
