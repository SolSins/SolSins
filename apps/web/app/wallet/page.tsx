"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

type LocalUser = {
  id: string;
  email: string;
  role: "FAN" | "CREATOR" | "ADMIN";
};

type Deposit = {
  id: string;
  address: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  amountLamports: string | number;
  createdAt: string;
  confirmedAt?: string | null;
  txSignature?: string | null;
};

export default function WalletPage() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [balanceSol, setBalanceSol] = useState<number | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentDepositAddr, setCurrentDepositAddr] = useState<string | null>(
    null
  );
  const [currentDepositQr, setCurrentDepositQr] = useState<string | null>(null);
  const [startingDeposit, setStartingDeposit] = useState(false);
  const [hasStartedInitialDeposit, setHasStartedInitialDeposit] =
    useState(false);
  const [copyLabel, setCopyLabel] = useState<"Copy" | "Copied!">("Copy");

  // Load local user from solsinsUser
  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem("solsinsUser")
        : null;
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as LocalUser;
      setUser(parsed);
    } catch (e) {
      console.error("Failed to parse solsinsUser", e);
    }
  }, []);

  // Load wallet balance + recent deposits
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/wallet/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");

        const lamports = BigInt(data.balanceLamports ?? "0");
        const sol = Number(lamports) / 1_000_000_000; // 1 SOL = 1e9 lamports
        setBalanceSol(sol);

        const mappedDeposits: Deposit[] = (data.deposits || []).map(
          (d: any) => ({
            id: d.id,
            address: d.address,
            status: d.status,
            amountLamports: d.amountLamports?.toString() ?? "0",
            createdAt: d.createdAt,
            confirmedAt: d.confirmedAt,
            txSignature: d.txSignature,
          })
        );

        setDeposits(mappedDeposits);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Start a deposit (get a random SolSins deposit address + QR)
  async function handleStartDeposit() {
    if (!user) return;
    setStartingDeposit(true);
    setCopyLabel("Copy");
    try {
      const res = await fetch("/api/wallet/deposit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(data.error || "Failed to start deposit");
        return;
      }

      const addr = data.address as string;
      setCurrentDepositAddr(addr);

      try {
        const uri = `solana:${addr}`;
        const qrDataUrl = await QRCode.toDataURL(uri);
        setCurrentDepositQr(qrDataUrl);
      } catch (e) {
        console.error("Failed to generate QR", e);
      }
    } catch (e) {
      console.error("start deposit error", e);
    } finally {
      setStartingDeposit(false);
    }
  }

  // Automatically start a deposit when the wallet page is opened
  useEffect(() => {
    if (!user) return;
    if (hasStartedInitialDeposit) return;
    setHasStartedInitialDeposit(true);
    void handleStartDeposit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasStartedInitialDeposit]);

  async function handleCopyAddress() {
    if (!currentDepositAddr) return;
    try {
      await navigator.clipboard.writeText(currentDepositAddr);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy"), 1500);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  }

  if (!user) {
    // brief placeholder while we read localStorage
    return null;
  }

  return (
    <main
      style={{
        minHeight: "calc(100vh - 72px)",
        padding: "32px 16px 48px",
        maxWidth: 1120,
        margin: "0 auto",
      }}
    >
      {/* Top wallet header card – similar vibe to creator header */}
      <section
        style={{
          borderRadius: 24,
          border: "1px solid var(--sin-border)",
          background:
            "radial-gradient(circle at 0 0, rgba(248,113,113,0.22), rgba(15,23,42,0.98))",
          padding: 20,
          marginBottom: 20,
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          gap: 18,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "var(--sin-muted)",
              marginBottom: 6,
            }}
          >
            SolSins wallet
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              marginBottom: 4,
            }}
          >
            Your on-platform SOL balance
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--sin-muted)",
              margin: 0,
            }}
          >
            Deposit SOL into your SolSins wallet, then unlock PPV posts and
            subscriptions from any creator using those funds.
          </p>
        </div>

        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(148,163,184,0.5)",
            background:
              "radial-gradient(circle at 100% 0, rgba(248,113,113,0.16), rgba(15,23,42,1))",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "var(--sin-muted)",
            }}
          >
            Available balance
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {balanceSol !== null ? balanceSol.toFixed(4) : "0.0000"}{" "}
            <span
              style={{
                fontSize: 13,
                color: "var(--sin-muted)",
              }}
            >
              SOL
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--sin-muted)",
            }}
          >
            This is your in-app wallet, separate from your own Phantom/Solana
            wallet.
          </div>
        </div>
      </section>

      {/* Main content row: deposit card + recent deposits */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        {/* Deposit card – SolSins Web3 theme */}
        <section
          style={{
            borderRadius: 24,
            border: "1px solid var(--sin-border)",
            background:
              "radial-gradient(circle at 0 100%, rgba(248,113,113,0.16), rgba(15,23,42,0.98))",
            padding: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 10,
              alignItems: "center",
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
                Deposit SOL
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--sin-muted)",
                }}
              >
                Send SOL to your unique SolSins deposit address. We&#39;ll
                credit your balance after on-chain confirmation.
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartDeposit}
              disabled={startingDeposit}
              className="btn btn-secondary"
              style={{
                fontSize: 11,
                whiteSpace: "nowrap",
                padding: "6px 12px",
              }}
            >
              {startingDeposit ? "Refreshing…" : "New address"}
            </button>
          </div>

          {!currentDepositAddr && (
            <div
              style={{
                fontSize: 13,
                color: "var(--sin-muted)",
                padding: "10px 0",
              }}
            >
              Generating your deposit address…
            </div>
          )}

          {currentDepositAddr && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto minmax(0, 1fr)",
                gap: 14,
                alignItems: "center",
              }}
            >
              {currentDepositQr && (
                <div
                  style={{
                    borderRadius: 18,
                    padding: 10,
                    background: "rgba(15,23,42,0.95)",
                    border: "1px solid rgba(148,163,184,0.5)",
                  }}
                >
                  <img
                    src={currentDepositQr}
                    alt="Deposit QR"
                    style={{
                      width: 140,
                      height: 140,
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--sin-muted)",
                      textAlign: "center",
                      marginTop: 6,
                    }}
                  >
                    Scan with any Solana wallet
                  </div>
                </div>
              )}

              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--sin-muted)",
                    marginBottom: 4,
                  }}
                >
                  Deposit SOL to this address
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "ui-monospace",
                      background: "rgba(15,23,42,0.95)",
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,0.5)",
                      padding: "8px 10px",
                      wordBreak: "break-all",
                      flex: 1,
                    }}
                  >
                    {currentDepositAddr}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="btn btn-primary"
                    style={{
                      fontSize: 11,
                      padding: "6px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {copyLabel}
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--sin-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  Send only{" "}
                  <span style={{ color: "#fecaca", fontWeight: 500 }}>
                    SOL
                  </span>{" "}
                  on{" "}
                  <span style={{ color: "#fecaca", fontWeight: 500 }}>
                    Solana mainnet
                  </span>
                  . Sending other tokens or from another network may result in
                  permanent loss.
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Recent deposits – themed like a stats card */}
        <section
          style={{
            borderRadius: 24,
            border: "1px solid var(--sin-border)",
            background:
              "radial-gradient(circle at 100% 0, rgba(248,113,113,0.14), rgba(15,23,42,0.98))",
            padding: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
              alignItems: "center",
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
                Recent deposits
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--sin-muted)",
                }}
              >
                Latest SOL top-ups into your SolSins wallet.
              </div>
            </div>
          </div>

          {deposits.length === 0 && (
            <div
              style={{
                fontSize: 13,
                color: "var(--sin-muted)",
                padding: "8px 0",
              }}
            >
              No deposits yet. Once you send SOL to your deposit address, they
              will appear here.
            </div>
          )}

          {deposits.length > 0 && (
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(148,163,184,0.5)",
                overflow: "hidden",
                background: "rgba(15,23,42,0.98)",
              }}
            >
              {deposits.map((d, idx) => {
                const sol =
                  Number(BigInt(d.amountLamports ?? "0")) / 1_000_000_000;
                const isLast = idx === deposits.length - 1;
                let statusColor = "rgba(252,211,77,1)"; // amber
                if (d.status === "CONFIRMED") statusColor = "rgba(52,211,153,1)";
                if (d.status === "CANCELLED") statusColor = "rgba(248,113,113,1)";

                return (
                  <div
                    key={d.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderBottom: isLast
                        ? "none"
                        : "1px solid rgba(30,41,59,1)",
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        {sol.toFixed(4)} SOL
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--sin-muted)",
                        }}
                      >
                        {new Date(d.createdAt).toLocaleString()}
                      </div>
                      {d.txSignature && (
                        <a
                          href={`https://solscan.io/tx/${d.txSignature}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 11,
                            color: "#38bdf8",
                            textDecoration: "underline",
                            display: "inline-block",
                            marginTop: 2,
                          }}
                        >
                          View on Solscan
                        </a>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: statusColor,
                        alignSelf: "center",
                      }}
                    >
                      {d.status}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
