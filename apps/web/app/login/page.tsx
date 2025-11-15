"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserRole = "FAN" | "CREATOR" | "ADMIN";

type LocalUser = {
  id: string;
  email: string;
  role: UserRole;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [existingUser, setExistingUser] = useState<LocalUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate local user if already logged in
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("solsinsUser")
          : null;
      if (raw) {
        setExistingUser(JSON.parse(raw));
      }
    } catch {
      // ignore parse errors
    } finally {
      setHydrated(true);
    }
  }, []);

  // Redirect logged-in users away from /login
  useEffect(() => {
    if (!hydrated || !existingUser) return;

    if (existingUser.role === "CREATOR") {
      router.replace("/creator");
    } else if (existingUser.role === "FAN") {
      router.replace("/fan");
    } else if (existingUser.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [hydrated, existingUser, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      const user = data.user as {
        id: string;
        email: string;
        role: UserRole;
      };

      // Store basic user data for client-side UI
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "solsinsUser",
          JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role,
          })
        );
      }

      // Route based on role
      let dest = "/fan";
      if (user.role === "ADMIN") dest = "/admin";
      else if (user.role === "CREATOR") dest = "/creator";
      else if (user.role === "FAN") dest = "/fan";

      router.push(dest);
    } catch (err: any) {
      console.error("login error", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // While redirecting an already-signed-in user, show a tiny message instead of full form
  if (hydrated && existingUser) {
    const roleLabel =
      existingUser.role === "CREATOR"
        ? "creator"
        : existingUser.role === "FAN"
        ? "fan"
        : "admin";

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
              "radial-gradient(circle at 0 0, rgba(248,113,113,0.22), #020617)",
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.9), 0 0 40px rgba(248,113,113,0.25)",
            padding: 24,
            fontSize: 13,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "var(--sin-muted)",
                marginBottom: 6,
              }}
            >
              Already signed in
            </div>
            <div style={{ color: "#fecaca" }}>
              You&apos;re logged in as{" "}
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco",
                }}
              >
                {existingUser.email}
              </span>
              .
            </div>
          </div>
          <div style={{ color: "var(--sin-muted)", marginBottom: 10 }}>
            Redirecting you to your {roleLabel} dashboard…
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--sin-muted)",
              opacity: 0.8,
            }}
          >
            If nothing happens,{" "}
            <button
              type="button"
              onClick={() => {
                if (existingUser.role === "CREATOR") router.push("/creator");
                else if (existingUser.role === "FAN") router.push("/fan");
                else router.push("/admin");
              }}
              style={{
                padding: 0,
                margin: 0,
                border: "none",
                background: "none",
                color: "#fecaca",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              tap here to continue
            </button>
            .
          </div>
        </div>
      </main>
    );
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
            Welcome back
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
            Sign in to <span style={{ color: "#fecaca" }}>SolSins</span>
          </h1>
          
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
              autoComplete="current-password"
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

              <div
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "var(--sin-muted)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span>New to SolSins?</span>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <a href="/signup/creator" style={{ color: "#fecaca" }}>
              Become a creator →
            </a>

            <a href="/register?role=FAN" style={{ color: "var(--sin-muted)" }}>
              Sign up as a fan →
            </a>
          </div>
        </div>
</div>
    </main>
  );
}
