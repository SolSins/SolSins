// apps/web/app/fan/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LocalUser = {
  id: string;
  email: string;
  role: "FAN" | "CREATOR" | "ADMIN";
};

type FanStats = {
  totalUsdCents: number;
  orderCount: number;
  purchaseCount: number;
  creatorsSupported: number;
};

type FanPurchase = {
  id: string;
  createdAt: string;
  mediaId: string;
  mediaTitle: string;
  mediaCaption: string;
  mediaCoverUrl: string;
  mediaVisibility: string;
  mediaPriceUsdCents: number | null;
  creatorHandle: string;
  creatorDisplayName: string;
};

type FanProfile = {
  id: string;
  email: string;
  role: "FAN" | "CREATOR" | "ADMIN";
  displayName?: string | null;
};

export default function FanDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [profile, setProfile] = useState<FanProfile | null>(null);
  const [stats, setStats] = useState<FanStats | null>(null);
  const [purchases, setPurchases] = useState<FanPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load local user from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("solsinsUser");
      if (!raw) {
        router.push("/login");
        return;
      }
      const parsed = JSON.parse(raw) as LocalUser;

      // Let CREATORs also view this page as fans if needed:
      if (parsed.role !== "FAN" && parsed.role !== "CREATOR") {
        router.push("/login");
        return;
      }

      setUser(parsed);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Fetch fan data when we know the user
  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/fan/me?userId=${user.id}`);
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setError(data.error || "Failed to load fan dashboard");
          setLoading(false);
          return;
        }

        setProfile(data.user as FanProfile);
        setStats(data.stats);
        setPurchases(data.purchases);
      } catch (err: any) {
        console.error("[fan dashboard] fetch error:", err);
        setError("Something went wrong loading your dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) return null;

  const hasPurchases = !loading && purchases.length > 0;

  const displayName = profile?.displayName?.trim() || "Anonymous Fan";
  const email = profile?.email ?? user.email;
  const avatarInitial =
    (profile?.displayName?.[0] ??
      user.email[0] ??
      "F"
    ).toUpperCase();

  const isAlsoCreator = profile?.role === "CREATOR";

  return (
    <main
      className="text-white"
      style={{
        minHeight: "calc(100vh - 72px)",
        padding: "32px 16px 48px",
        maxWidth: 1120,
        margin: "0 auto",
      }}
    >
      {/* Top row: fan profile + stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Fan card */}
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
                  "radial-gradient(circle at 0 0, #f97373, #020617)",
                border: "1px solid rgba(248,113,113,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {avatarInitial}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "var(--sin-muted)",
                  marginBottom: 4,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                Fan dashboard
                {isAlsoCreator && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(248,113,113,0.5)",
                      background: "rgba(15,23,42,0.8)",
                      color: "#fecaca",
                    }}
                  >
                    Creator account
                  </span>
                )}
              </div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Welcome back, {displayName}
              </h1>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--sin-muted)",
                  marginTop: 4,
                }}
              >
                Signed in as{" "}
                <span className="font-mono text-red-300">{email}</span>.  
                Your email stays private from creators — they’ll only see your
                display name (or “Anonymous Fan”).
              </p>
            </div>
          </div>

          {stats && (
            <div
              style={{
                fontSize: 11,
                color: "var(--sin-muted)",
                borderRadius: 999,
                border: "1px dashed rgba(148,163,184,0.4)",
                padding: "6px 10px",
              }}
            >
              You’ve unlocked{" "}
              <span className="text-red-300 font-semibold">
                {stats.purchaseCount}
              </span>{" "}
              drops from{" "}
              <span className="text-red-300 font-semibold">
                {stats.creatorsSupported}
              </span>{" "}
              creator
              {stats.creatorsSupported === 1 ? "" : "s"}.
            </div>
          )}
        </section>

        {/* Stats card */}
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
            Spend overview
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
          ) : stats ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
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
                  Total spent
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  $
                  {((stats.totalUsdCents ?? 0) / 100).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                  All-time PPV, subs & tips.
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
                  Orders
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {stats.orderCount}
                </div>
                <div style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                  Completed Solana payments.
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
                  Creators supported
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {stats.creatorsSupported}
                </div>
                <div style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                  Sinful artists you’ve tipped.
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {/* Purchases / unlocked media */}
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
              Your unlocks
            </div>
            <div style={{ fontSize: 12, color: "var(--sin-muted)" }}>
              Recently unlocked media across all creators you support.
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ fontSize: 13, color: "var(--sin-muted)" }}>
            Loading your unlocks…
          </div>
        )}

        {!loading && !hasPurchases && (
          <div
            style={{
              fontSize: 13,
              color: "var(--sin-muted)",
              padding: "12px 0",
            }}
          >
            You haven&rsquo;t unlocked anything yet. Explore SolSins creators,
            tip in{" "}
            <span className="text-red-300 font-semibold">SOL</span> and your
            purchases will show up here.
          </div>
        )}

        {!loading && hasPurchases && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 14,
              marginTop: 4,
            }}
          >
            {purchases.map((p) => (
              <article
                key={p.id}
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
                    height: 140,
                    background: p.mediaCoverUrl
                      ? "black"
                      : "radial-gradient(circle at 0 0, #f97373, #020617)",
                  }}
                >
                  {p.mediaCoverUrl && (
                    <img
                      src={p.mediaCoverUrl}
                      alt={p.mediaTitle}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <a
                    href={`/${p.creatorHandle}`}
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 8,
                      padding: "4px 9px",
                      fontSize: 11,
                      borderRadius: 999,
                      border: "1px solid rgba(15,23,42,0.7)",
                      background: "rgba(15,23,42,0.8)",
                      textDecoration: "none",
                      color: "#e5e7eb",
                    }}
                  >
                    @{p.creatorHandle}
                  </a>
                </div>
                <div style={{ padding: "8px 10px 10px" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 2,
                    }}
                  >
                    {p.mediaTitle}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--sin-muted)",
                      marginBottom: 6,
                    }}
                  >
                    {p.mediaCaption || "No caption."}
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
                      {p.mediaPriceUsdCents
                        ? `$${(p.mediaPriceUsdCents / 100).toFixed(2)} paid`
                        : "Free unlock"}
                    </span>
                    <span>
                      {new Date(p.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
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
