import { prisma } from "@/lib/db";
import React from "react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface CreatorPageProps {
  params: { handle: string };
}

// Reserved paths that should NOT be treated as creator handles
const RESERVED = new Set([
  "login",
  "register",
  "signup",
  "creator",
  "creators",
  "admin",
  "api",
  "_next",
  "favicon.ico",
  "pay",
  "pricing",
  "terms",
  "privacy",
]);

export default async function CreatorPublicPage({ params }: CreatorPageProps) {
  const rawHandle = params.handle || "";
  const handle = decodeURIComponent(rawHandle).toLowerCase();

  // If path matches reserved, this route should not own it → 404
  if (RESERVED.has(handle)) {
    notFound();
  }

  const creator = await prisma.creator.findUnique({
    where: { handle },
    include: {
      user: true,
      media: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!creator) {
    notFound();
  }

  const media = creator.media;
  const totalMedia = media.length;

  return (
    <main
      style={{
        minHeight: "calc(100vh - 72px)",
        padding: "0 0 40px",
      }}
    >
      {/* Banner */}
      <section
        style={{
          height: 220,
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid var(--sin-border)",
          background: creator.bannerUrl
            ? "black"
            : "radial-gradient(circle at 0 0, #f97373, #020617)",
        }}
      >
        {creator.bannerUrl && (
          <img
            src={creator.bannerUrl}
            alt={creator.displayName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.75,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(15,23,42,0.1), rgba(15,23,42,0.95))",
          }}
        />
      </section>

      {/* Header card */}
      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 16px",
          marginTop: -64,
        }}
      >
        <div
          style={{
            borderRadius: 24,
            border: "1px solid var(--sin-border)",
            background:
              "radial-gradient(circle at 0 0, rgba(248,113,113,0.22), rgba(15,23,42,0.98))",
            padding: 18,
            display: "flex",
            gap: 16,
            position: "relative",
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "999px",
              border: "2px solid rgba(248,113,113,0.9)",
              overflow: "hidden",
              background:
                creator.avatarUrl ||
                "radial-gradient(circle at 0 0, #f97373, #020617)",
              boxShadow: "0 0 40px rgba(248,113,113,0.6)",
              marginTop: -40,
            }}
          >
            {creator.avatarUrl && (
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {creator.displayName}
              </h1>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--sin-muted)",
                }}
              >
                @{creator.handle}
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--sin-muted)",
                marginBottom: 10,
              }}
            >
              {creator.bio || "This creator hasn’t written a bio yet."}
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                fontSize: 11,
                color: "var(--sin-muted)",
              }}
            >
              <span>
                <strong style={{ color: "#fecaca" }}>{totalMedia}</strong> posts
              </span>
              <span>Instant unlocks with Solana</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <a
              href="#media"
              className="btn btn-primary"
              style={{ fontSize: 13, paddingInline: 18 }}
            >
              View posts
            </a>
            <div
              style={{
                fontSize: 11,
                color: "var(--sin-muted)",
                maxWidth: 200,
                textAlign: "right",
              }}
            >
              Pay in SOL, no chargebacks, content delivered instantly after
              confirmation.
            </div>
          </div>
        </div>
      </section>

      {/* Media grid */}
      <section
        id="media"
        style={{
          maxWidth: 1120,
          margin: "18px auto 0",
          padding: "0 16px",
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 500,
            marginBottom: 10,
          }}
        >
          Posts
        </h2>

        {media.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--sin-muted)" }}>
            No posts yet. Check back soon – their first SolSins drop is on the
            way.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {media.map((m) => {
              const usd = m.priceUsdCents ? m.priceUsdCents / 100 : null;
              const ppv =
                m.visibility === "PAY_PER_VIEW" && usd !== null
                  ? `Pay-per-view • $${usd.toFixed(2)}`
                  : m.visibility === "SUBSCRIBERS"
                  ? "Subscribers only"
                  : "Public";

              return (
                <article
                  key={m.id}
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(148,163,184,0.45)",
                    background: "rgba(15,23,42,0.98)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 160,
                  }}
                >
                  <div
                    style={{
                      height: 180,
                      position: "relative",
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
                      {ppv}
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
                        marginBottom: 8,
                      }}
                    >
                      {m.caption || "No caption."}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--sin-muted)",
                        }}
                      >
                        {usd !== null
                          ? `$${usd.toFixed(2)} • pay in SOL`
                          : "Free / TBD"}
                      </span>
                      <a
                        href={`/pay?creatorId=${creator.id}&mediaId=${
                          m.id
                        }&usd=${usd ?? ""}`}
                        className="btn btn-secondary"
                        style={{
                          fontSize: 11,
                          padding: "5px 10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Unlock via Solana
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
