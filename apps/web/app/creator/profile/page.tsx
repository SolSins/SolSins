"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LocalUser = {
  id: string;
  email: string;
  role: "FAN" | "CREATOR" | "ADMIN";
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
};

export default function CreatorProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");

  // hydrate user from localStorage
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("solsinsUser")
          : null;
      if (raw) {
        const parsed = JSON.parse(raw) as LocalUser;
        setUser(parsed);
        if (parsed.role !== "CREATOR") {
          router.replace("/"); // or /fan or /admin
        }
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, [router]);

  // fetch creator profile once we know user
  useEffect(() => {
    if (!hydrated || !user) return;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      setSaved(false);

      try {
        const res = await fetch(
          `/api/creator/profile?userId=${encodeURIComponent(user.id)}`
        );
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setError(data.error || "Failed to load creator profile");
          setLoading(false);
          return;
        }

        const c = data.creator as CreatorProfile;
        setProfile(c);
        setDisplayName(c.displayName || "");
        setBio(c.bio || "");
        setAvatarUrl(c.avatarUrl || "");
        setBannerUrl(c.bannerUrl || "");
        setDefaultCurrency(c.defaultCurrency || "USD");
      } catch (err) {
        console.error("loadProfile error", err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [hydrated, user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/creator/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          displayName,
          bio,
          avatarUrl,
          bannerUrl,
          defaultCurrency,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to save profile");
        setSaving(false);
        return;
      }

      const c = data.creator as CreatorProfile;
      setProfile(c);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("saveProfile error", err);
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated) {
    return null;
  }

  if (!user || user.role !== "CREATOR") {
    return (
      <main
        style={{
          minHeight: "calc(100vh - 72px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <div style={{ fontSize: 13, color: "var(--sin-muted)" }}>
          You must be signed in as a creator to edit your profile.
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "calc(100vh - 72px)",
        padding: "24px 16px 40px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 16 }}>
        <header>
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "var(--sin-muted)",
              marginBottom: 6,
            }}
          >
            Creator profile
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            Public page & bio
          </h1>
          {profile && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--sin-muted)",
              }}
            >
              Your public profile is live at{" "}
              <a
                href={`/${profile.handle}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#fecaca",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco",
                  textDecoration: "underline",
                }}
              >
                /{profile.handle}
              </a>
            </div>
          )}
        </header>

        <section
          style={{
            borderRadius: 24,
            border: "1px solid var(--sin-border)",
            background:
              "radial-gradient(circle at 0 0, rgba(248,113,113,0.18), #020617)",
            padding: 18,
          }}
        >
          {loading ? (
            <div style={{ fontSize: 13, color: "var(--sin-muted)" }}>
              Loading your creator profile…
            </div>
          ) : (
            <form
              onSubmit={handleSave}
              style={{ display: "grid", gap: 12, fontSize: 13 }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12 }}>Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  maxLength={60}
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.4)",
                    background: "rgba(15,23,42,0.85)",
                    padding: "8px 12px",
                    fontSize: 13,
                    outline: "none",
                    color: "var(--sin-foreground)",
                  }}
                  placeholder="LunaHex"
                />
              </div>

              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12 }}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={400}
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,0.4)",
                    background: "rgba(15,23,42,0.85)",
                    padding: "8px 12px",
                    fontSize: 13,
                    outline: "none",
                    color: "var(--sin-foreground)",
                    resize: "vertical",
                  }}
                  placeholder="Short intro, what you post, vibe, etc."
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--sin-muted)",
                  }}
                >
                  This appears on your public SolSins page above the posts grid.
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <label style={{ fontSize: 12 }}>Avatar image URL</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    style={{
                      borderRadius: 999,
                      border: "1px solid rgba(148,163,184,0.4)",
                      background: "rgba(15,23,42,0.85)",
                      padding: "8px 12px",
                      fontSize: 13,
                      outline: "none",
                      color: "var(--sin-foreground)",
                    }}
                    placeholder="https://…"
                  />
                  <span style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                    Square image, looks best at 400x400+.
                  </span>
                </div>

                <div style={{ display: "grid", gap: 4 }}>
                  <label style={{ fontSize: 12 }}>Banner image URL</label>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    style={{
                      borderRadius: 999,
                      border: "1px solid rgba(148,163,184,0.4)",
                      background: "rgba(15,23,42,0.85)",
                      padding: "8px 12px",
                      fontSize: 13,
                      outline: "none",
                      color: "var(--sin-foreground)",
                    }}
                    placeholder="https://…"
                  />
                  <span style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                    Wide image shown at the top of your page.
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gap: 4, maxWidth: 200 }}>
                <label style={{ fontSize: 12 }}>Default pricing currency</label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.4)",
                    background: "rgba(15,23,42,0.85)",
                    padding: "8px 12px",
                    fontSize: 13,
                    outline: "none",
                    color: "var(--sin-foreground)",
                  }}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="AUD">AUD</option>
                  <option value="GBP">GBP</option>
                </select>
                <span style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                  We show fans the approximate price in this currency, paid in
                  SOL.
                </span>
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

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginTop: 4,
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ paddingInline: 18 }}
                >
                  {saving ? "Saving…" : "Save profile"}
                </button>

                {saved && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--sin-muted)",
                    }}
                  >
                    Saved. Your public page is updated at{" "}
                    {profile && (
                      <a
                        href={`/${profile.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#fecaca" }}
                      >
                        /{profile.handle}
                      </a>
                    )}
                    .
                  </span>
                )}
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
