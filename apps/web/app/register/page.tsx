"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function FanSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [stayAnonymous, setStayAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const finalDisplayName = stayAnonymous ? "" : displayName.trim();

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: "FAN",
          displayName: finalDisplayName, // 👈 this goes into body.displayName
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      localStorage.setItem(
        "solsinsUser",
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
        })
      );

      router.push("/fan");
    } catch (err: any) {
      console.error("[fan signup] error", err);
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
          maxWidth: 420,
          borderRadius: 24,
          border: "1px solid var(--sin-border)",
          background:
            "radial-gradient(circle at 0 0, rgba(248,113,113,0.18), #020617)",
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
            Fan signup
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
            Join <span style={{ color: "#fecaca" }}>SolSins</span> as a fan
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--sin-muted)",
              marginTop: 8,
            }}
          >
            Unlock spicy drops and support creators privately in SOL.
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

          {/* Optional display name */}
          <div
            style={{
              display: "grid",
              gap: 4,
              opacity: stayAnonymous ? 0.4 : 1,
              pointerEvents: stayAnonymous ? "none" : "auto",
            }}
          >
            <label style={{ fontSize: 12 }}>Display name (optional)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What creators see, e.g. SinLurker"
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

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              marginTop: 2,
              color: "var(--sin-muted)",
            }}
          >
            <input
              type="checkbox"
              checked={stayAnonymous}
              onChange={(e) => setStayAnonymous(e.target.checked)}
            />
            Stay anonymous (creators won’t see your email)
          </label>

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
            {loading ? "Creating your fan account…" : "Create fan account"}
          </button>
        </form>
      </div>
    </main>
  );
}
