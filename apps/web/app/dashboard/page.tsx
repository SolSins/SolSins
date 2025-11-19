"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LocalUser = {
  id: string;
  email: string;
  role: "FAN" | "CREATOR" | "ADMIN";
};

type CreatorStats = {
  mediaCount: number;
  totalPurchases: number;
  orderCount: number;
  totalUsdCents: number;
};

type CreatorMedia = {
  id: string;
  title: string;
  caption: string;
  createdAt: string;
  visibility: string;
  priceUsdCents: number | null;
  fileUrl: string;
  coverUrl: string;
  purchaseCount: number;
};

type CreatorProfile = {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  defaultCurrency: string;
  createdAt: string;
  email: string;
};

export default function CreatorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [media, setMedia] = useState<CreatorMedia[]>([]);
  const [walletSol, setWalletSol] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load local user (from login) – KEEPING YOUR OLD LOGIC
  useEffect(() => {
    try {
      const raw = localStorage.getItem("solsinsUser");
      if (!raw) {
        router.push("/login");
        return;
      }
      const parsed = JSON.parse(raw) as LocalUser;

      // Allow CREATOR and ADMIN to view this dashboard
      if (parsed.role !== "CREATOR" && parsed.role !== "ADMIN") {
        router.push("/login");
        return;
      }

      setUser(parsed);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Fetch creator profile once we have the user
  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/creator/me?userId=${user.id}`);
        const data = await res.json();

        if (!res.ok || !data.ok) {
          // If the API returns a specific error that creator profile doesn't exist yet
          if (data.error === "creator_not_found") {
            setError(
              "No creator profile found yet. You’ll be able to set up your creator handle and profile here."
            );
          } else {
            setError(data.error || "Failed to load creator data");
          }
          setLoading(false);
          return;
        }

        setProfile(data.creator);
        setStats(data.stats);
        setMedia(data.media);

        // Fetch wallet balance (SOL)
        try {
          const wRes = await fetch("/api/wallet/me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });
          const wData = await wRes.json();
          if (wRes.ok && !wData.error) {
            const lamports = BigInt(wData.balanceLamports ?? "0");
            const sol = Number(lamports) / 1_000_000_000; // 1 SOL = 1e9 lamports
            setWalletSol(sol);
          }
        } catch (walletErr) {
          console.error("[creator dashboard] wallet error:", walletErr);
        }
      } catch (err: any) {
        console.error("[creator dashboard] fetch error:", err);
        setError("Something went wrong loading your dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) {
    // brief placeholder while we check localStorage
    return null;
  }

  const publicHandle = profile?.handle ?? "your.handle";
  const earningsUsd =
    ((stats?.totalUsdCents ?? 0) / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const walletDisplay =
    walletSol !== null ? walletSol.toFixed(4) : "0.0000";

  return (
    <main
      style={{
        minHeight: "calc(100vh - 72px)",
        padding: "32px 16px 48px",
        maxWidth: 1120,
        margin: "0 auto",
      }}
    >
      {/* Top row: profile + stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Profile card */}
        <section
          style={{
            borderRadius: 24,
            border: "1px solid var(--sin-border)",
            background:
              "radial-gradient(circle at 0 0, rgba(248,113,113,0.22), rgba(15,23,42,0.95))",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "999px",
                background:
                  profile?.avatarUrl ||
                  "radial-gradient(circle at 0 0, #f97373, #020617)",
                overflow: "hidden",
                border: "1px solid rgba(248,113,113,0.6)",
              }}
            >
              {profile?.avatarUrl && (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "var(--sin-muted)",
                  marginBottom: 4,
                }}
              >
                Creator dashboard
              </div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {profile?.displayName || user.email}
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(248,113,113,0.45)",
                    background: "rgba(15,23,42,0.8)",
                    color: "#fecaca",
                  }}
                >
                  @{publicHandle}
                </span>
              </h1>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--sin-muted)",
                  marginTop: 4,
                }}
              >
                {profile?.bio ||
                  "Upload photos and videos, set pay-per-view prices in USD, and let fans unlock everything with SOL."}
              </p>
            </div>
          </div>

          <div
            style={{
              fontSize: 11,
              color: "var(--sin-muted)",
              borderRadius: 999,
              border: "1px dashed rgba(148,163,184,0.4)",
              padding: "6px 10px",
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span>
              Your public profile is live at{" "}
              <span style={{ fontFamily: "ui-monospace", color: "#fecaca" }}>
                /{publicHandle}
              </span>
            </span>
            <button
              type="button"
              onClick={() => router.push(`/creator/${publicHandle}`)}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.6)",
                background: "rgba(15,23,42,0.9)",
                cursor: "pointer",
              }}
            >
              View public page
            </button>
          </div>
        </section>

        {/* Stats + wallet card */}
        <section
          style={{
            borderRadius: 24,
            border: "1px solid var(--sin-border)",
            background:
              "radial-gradient(circle at 100% 0, rgba(248,113,113,0.2), rgba(15,23,42,0.95))",
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "var(--sin-muted)",
              marginBottom: 12,
            }}
          >
            Earnings & wallet
          </div>

          {loading ? (
            <div style={{ fontSize: 13, color: "var(--sin-muted)" }}>
              Loading your stats…
            </div>
          ) : error ? (
            <div
              style={{
                fontSize: 12,
                color: "#fecaca",
                background: "rgba(127,29,29,0.4)",
                borderRadius: 12,
                border: "1px solid rgba(248,113,113,0.6)",
                padding: "8px 10px",
              }}
            >
              {error}
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,0.4)",
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--sin-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Total earnings
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    ${earningsUsd}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                    100% to you. Paid in SOL.
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,0.4)",
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--sin-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Paid orders
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {stats?.orderCount ?? 0}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                    PPV, subs & tips
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,0.4)",
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--sin-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Media items
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {stats?.mediaCount ?? 0}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                    {stats && stats.mediaCount === 0
                      ? "Upload your first piece"
                      : "Visible on your profile"}
                  </div>
                </div>
              </div>

              {/* Wallet summary */}
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(148,163,184,0.4)",
                  padding: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--sin-muted)",
                      marginBottom: 4,
                    }}
                  >
                    SolSins wallet
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    {walletDisplay}{" "}
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--sin-muted)",
                      }}
                    >
                      SOL
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                    Use this balance to support other creators. Deposits live on
                    the Wallet page.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/wallet")}
                  style={{
                    fontSize: 12,
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(248,113,113,0.6)",
                    background:
                      "radial-gradient(circle at 0 0, rgba(248,113,113,0.3), rgba(15,23,42,0.95))",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Open wallet
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Media list */}
      <section
        style={{
          borderRadius: 24,
          border: "1px solid var(--sin-border)",
          background:
            "radial-gradient(circle at 0 100%, rgba(248,113,113,0.12), rgba(15,23,42,0.95))",
          padding: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            gap: 8,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 2,
              }}
            >
              Your recent drops
            </div>
            <div style={{ fontSize: 12, color: "var(--sin-muted)" }}>
              These appear on your public SolSins page. Each one is unlockable
              with SOL based on the USD price you set.
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ whiteSpace: "nowrap" }}
            type="button"
            onClick={() => router.push("/dashboard/upload")}
          >
            + Upload media
          </button>
        </div>

        {loading && (
          <div style={{ fontSize: 13, color: "var(--sin-muted)" }}>
            Loading media…
          </div>
        )}

        {!loading && media.length === 0 && !error && (
          <div
            style={{
              fontSize: 13,
              color: "var(--sin-muted)",
              padding: "12px 0",
            }}
          >
            No media yet. Upload your first photos or videos and start earning
            in SOL.
          </div>
        )}

        {!loading && media.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 14,
              marginTop: 4,
            }}
          >
            {media.map((m) => (
              <article
                key={m.id}
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(148,163,184,0.45)",
                  background: "rgba(15,23,42,0.95)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 160,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    height: 120,
                    background: m.coverUrl
                      ? "black"
                      : "radial-gradient(circle at 0 0, #f97373, #020617)",
                  }}
                >
                  {m.coverUrl && (
                    <img
                      src={m.coverUrl}
                      alt={m.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      fontSize: 10,
                      padding: "3px 7px",
                      borderRadius: 999,
                      border: "1px solid rgba(15,23,42,0.7)",
                      background: "rgba(15,23,42,0.8)",
                    }}
                  >
                    {m.visibility === "PUBLIC"
                      ? "Public"
                      : m.visibility === "SUBSCRIBERS"
                      ? "Subscribers"
                      : "Pay-per-view"}
                  </div>
                </div>
                <div style={{ padding: "8px 10px 10px" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 2,
                    }}
                  >
                    {m.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--sin-muted)",
                      marginBottom: 6,
                    }}
                  >
                    {m.caption || "No caption yet."}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      color: "var(--sin-muted)",
                    }}
                  >
                    <span>
                      {m.priceUsdCents
                        ? `$${(m.priceUsdCents / 100).toFixed(2)} PPV`
                        : "No price set"}
                    </span>
                    <span>{m.purchaseCount} unlocks</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
