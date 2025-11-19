"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

type Seed = { buyerId: string; creatorId: string; handle: string };

type PayPageProps = {
  searchParams: {
    creatorId?: string;
    mediaId?: string;
    usd?: string;
  };
};

// Small helper to show "~ X.XXX SOL" from live CoinGecko pricing via /api/pricing/sol
function PaySolEstimate({ usd }: { usd: number }) {
  const [solEstimate, setSolEstimate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usd || usd <= 0) {
      setSolEstimate(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        const res = await fetch("/api/pricing/sol", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok || !data.ok || !data.solUsd) {
          throw new Error(data.error || "Failed to fetch SOL price");
        }

        const solUsd = Number(data.solUsd);
        if (!Number.isFinite(solUsd) || solUsd <= 0) return;

        const solAmount = usd / solUsd; // USD → SOL
        if (!cancelled) {
          setSolEstimate(solAmount.toFixed(3)); // show e.g. 0.067
        }
      } catch (err) {
        console.error("[PaySolEstimate] price error", err);
        if (!cancelled) {
          setSolEstimate(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [usd]);

  if (!usd || usd <= 0) return null;

  return (
    <span
      style={{
        fontSize: 12,
        color: "var(--sin-muted)",
        marginLeft: 8,
        whiteSpace: "nowrap",
      }}
    >
      {loading && !solEstimate
        ? "…"
        : solEstimate
        ? `≈ ${solEstimate} SOL`
        : ""}
    </span>
  );
}

export default function PayPage({ searchParams }: PayPageProps) {
  const [seed, setSeed] = useState<Seed | null>(null);
  const [qr, setQr] = useState<string>("");
  const [ref, setRef] = useState<string>("");
  const [status, setStatus] = useState<string>("idle");
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // From URL: /pay?creatorId=...&mediaId=...&usd=9.99
  const creatorIdFromUrl = searchParams.creatorId || null;
  const mediaIdFromUrl = searchParams.mediaId || null;
  const usdAmount = (() => {
    const raw = searchParams.usd;
    const n = raw ? Number(raw) : 9.99;
    return Number.isFinite(n) && n > 0 ? n : 9.99;
  })();
  const amountUsdCents = Math.round(usdAmount * 100);

  // 1) Init: get dev seed (buyerId) + create checkout order
  useEffect(() => {
    (async () => {
      try {
        setError(null);
        setStatus("initializing");

        // DEV ONLY: seeding a fan + creator and returning buyerId, creatorId, handle
        // In production you’ll use the logged-in fan from localStorage instead.
        const seedRes = await fetch("/dev/seed", { cache: "no-store" });
        if (!seedRes.ok) {
          const txt = await seedRes.text().catch(() => "");
          throw new Error(`Seed failed: ${seedRes.status} ${txt}`);
        }
        const s = (await seedRes.json()) as Seed;
        setSeed(s);

        const buyerId = s.buyerId;
        const creatorId = creatorIdFromUrl || s.creatorId;

        const checkoutRes = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buyerId,
            creatorId,
            kind: "PPV",
            amountUsdCents,
            token: "SOL",
            mediaId: mediaIdFromUrl ?? null,
          }),
        });

        const text = await checkoutRes.text();
        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch {
          // non-JSON
        }

        if (!checkoutRes.ok || !data.ok) {
          throw new Error(
            data.error || `Checkout failed: ${checkoutRes.status} ${text}`
          );
        }

        // EXPECTED SHAPE FROM /api/checkout:
        // {
        //   ok: true,
        //   order: {
        //     reference,
        //     destination,
        //     amountLamports,
        //     amountUsdCents,
        //     currency
        //   },
        //   solanaPayUrl: "solana:..."
        // }
        const order = data.order;
        const solanaPayUrl: string = data.solanaPayUrl;

        if (!order?.reference || !solanaPayUrl) {
          throw new Error("Checkout response missing reference or solanaPayUrl");
        }

        setRef(order.reference);
        setUrl(solanaPayUrl);

        const code = await QRCode.toDataURL(solanaPayUrl);
        setQr(code);
        setStatus("pending");
      } catch (e: any) {
        console.error("[/pay] init error:", e);
        setStatus("error");
        setError(e?.message ?? String(e));
      }
    })();
  }, [amountUsdCents, creatorIdFromUrl, mediaIdFromUrl]);

  // 2) Poll for confirmation using reference
  useEffect(() => {
    if (!ref) return;

    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/confirm?reference=${encodeURIComponent(ref)}`, {
          cache: "no-store",
        }).then((x) => x.json());

        if (r.status === "confirmed") {
          setStatus("confirmed");
          clearInterval(id);
        }
      } catch (err) {
        console.error("[/pay] confirm poll error", err);
      }
    }, 2500);

    return () => clearInterval(id);
  }, [ref]);

  return (
    <main
      style={{
        minHeight: "calc(100vh - 72px)",
        padding: "24px 16px 40px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          display: "grid",
          gap: 18,
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
        }}
      >
        {/* Left: payment instructions + QR */}
        <section
          style={{
            borderRadius: 24,
            border: "1px solid var(--sin-border)",
            background:
              "radial-gradient(circle at 0 0, rgba(248,113,113,0.18), #020617)",
            padding: 18,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Pay with Solana
          </h2>
          <p
            style={{
              fontSize: 12,
              color: "var(--sin-muted)",
              marginBottom: 12,
            }}
          >
            Scan this QR in Phantom, Solflare or another SOL wallet. Your unlock
            will trigger as soon as the transaction is confirmed on-chain.
          </p>

          {/* Price summary */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              ${usdAmount.toFixed(2)} USD
            </span>
            <PaySolEstimate usd={usdAmount} />
          </div>

          {/* QR */}
          {qr ? (
            <img
              src={qr}
              alt="Solana Pay QR"
              style={{
                width: 260,
                height: 260,
                borderRadius: 16,
                boxShadow: "0 16px 40px rgba(0,0,0,0.65)",
                border: "1px solid rgba(15,23,42,0.9)",
                background: "#020617",
              }}
            />
          ) : (
            <div
              style={{
                width: 260,
                height: 260,
                borderRadius: 16,
                background:
                  "repeating-linear-gradient(45deg, #020617, #020617 10px, #0f172a 10px, #0f172a 20px)",
                border: "1px solid rgba(31,41,55,0.8)",
              }}
            />
          )}

          {url && (
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
              }}
            >
              Prefer mobile?{" "}
              <a
                href={url}
                style={{ color: "#fecaca", textDecoration: "none" }}
              >
                Open directly in wallet →
              </a>
            </p>
          )}
        </section>

        {/* Right: status + metadata */}
        <section
          style={{
            borderRadius: 24,
            border: "1px solid var(--sin-border)",
            background: "rgba(15,23,42,0.98)",
            padding: 18,
            fontSize: 13,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 500,
              marginTop: 0,
              marginBottom: 8,
            }}
          >
            Payment status
          </h3>

          <div
            style={{
              padding: 10,
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.5)",
              background:
                status === "confirmed"
                  ? "rgba(21,128,61,0.12)"
                  : "rgba(15,23,42,0.9)",
            }}
          >
            <div style={{ fontSize: 13 }}>
              Status:{" "}
              <b>
                {status === "initializing" && "Preparing checkout…"}
                {status === "pending" && "Waiting for payment…"}
                {status === "confirmed" && "Confirmed – unlocking content"}
                {status === "error" && "Error"}
                {status === "idle" && "Idle"}
              </b>
            </div>
            <div
              style={{
                opacity: 0.7,
                fontSize: 11,
                marginTop: 6,
                wordBreak: "break-all",
              }}
            >
              Reference:{" "}
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco",
                }}
              >
                {ref || "…"}
              </span>
            </div>
            {seed && (
              <div
                style={{
                  opacity: 0.7,
                  fontSize: 11,
                  marginTop: 6,
                }}
              >
                Creator:{" "}
                <span
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco",
                  }}
                >
                  @{seed.handle}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                marginTop: 10,
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
          )}

          <div
            style={{
              marginTop: 14,
              fontSize: 11,
              color: "var(--sin-muted)",
              lineHeight: 1.5,
            }}
          >
            Once your transaction confirms, we&apos;ll mark this purchase as
            unlocked and redirect you back to the creator&apos;s content. If
            you close this page, you can always return later with the same
            wallet / reference.
          </div>
        </section>
      </div>
    </main>
  );
}
