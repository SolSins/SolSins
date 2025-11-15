"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatorSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          handle,
          displayName,
          role: "CREATOR",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      // Log them in right away (dev flow)
      localStorage.setItem(
        "solsinsUser",
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
        })
      );

      router.push("/"); // later: creator dashboard
    } catch (err: any) {
      console.error("signup error", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 24,
          border: "1px solid var(--sin-border)",
          background:
            "radial-gradient(circle at 0 0, rgba(248,113,113,0.22), #020617)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.9), 0 0 40px rgba(248,113,113,0.25)",
          padding: 24,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "var(--sin-muted)",
              marginBottom: 8,
            }}
          >
            Creator signup
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
            Become a <span style={{ color: "#fecaca" }}>SolSins creator</span>
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--sin-muted)",
              marginTop: 8,
            }}
          >
            Keep 100% of your PPV, subs and tips. Paid directly in SOL.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <label style={{ fontSize: 12 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              style={{
                width: "100%",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.4)",
                background: "rgba(15,23,42,0.85)",
                padding: "8px 12px",
                fontSize: 13,
                outline: "none",
                color: "var(--sin-foreground)",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <label style={{ fontSize: 12 }}>Creator handle</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--sin-muted)",
                  padding: "7px 9px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: "rgba(15,23,42,0.85)",
                }}
              >
                @
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) =>
                  setHandle(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ""))
                }
                placeholder="your.handle"
                required
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: "rgba(15,23,42,0.85)",
                  padding: "8px 12px",
                  fontSize: 13,
                  outline: "none",
                  color: "var(--sin-foreground)",
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: "var(--sin-muted)" }}>
              Letters, numbers, underscores and dots only.
            </span>
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <label style={{ fontSize: 12 }}>Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What fans see"
              required
              style={{
                width: "100%",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.4)",
                background: "rgba(15,23,42,0.85)",
                padding: "8px 12px",
                fontSize: 13,
                outline: "none",
                color: "var(--sin-foreground)",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <label style={{ fontSize: 12 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              style={{
                width: "100%",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.4)",
                background: "rgba(15,23,42,0.85)",
                padding: "8px 12px",
                fontSize: 13,
                outline: "none",
                color: "var(--sin-foreground)",
              }}
            />
            
          </div>

          {error && (
            <div
              style={{
                fontSize: 12,
                color: "#fecaca",
                background: "rgba(127,29,29,0.4)",
                borderRadius: 12,
                border: "1px solid rgba(248,113,113,0.6)",
                padding: "8px 10px",
                marginTop: 4,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
          >
            {loading ? "Creating your account…" : "Create creator account"}
          </button>
        </form>

        <div
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "var(--sin-muted)",
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span>Already have an account?</span>
          <a href="/login" style={{ color: "#fecaca" }}>
            Sign in →
          </a>
        </div>
      </div>
    </main>
  );
}
