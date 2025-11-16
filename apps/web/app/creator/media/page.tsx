// apps/web/app/creator/media/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LocalUser = {
  id: string;
  email: string;
  role: "FAN" | "CREATOR" | "ADMIN";
};

type MediaVisibility = "PUBLIC" | "PAY_PER_VIEW" | "SUBSCRIBERS";
type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "FILE";

type CreatorMedia = {
  id: string;
  title: string;
  caption: string;
  type: MediaType;
  visibility: MediaVisibility;
  priceUsdCents: number | null;
  fileUrl: string;
  coverUrl: string;
  createdAt: string;
};

export default function CreatorMediaPage() {
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [media, setMedia] = useState<CreatorMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // post form state
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [type, setType] = useState<MediaType>("IMAGE");
  const [visibility, setVisibility] = useState<MediaVisibility>("PAY_PER_VIEW");
  const [priceUsd, setPriceUsd] = useState<string>("9.99");
  const [coverUrl, setCoverUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

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
          router.replace("/");
        }
      }
    } catch {
      // swallow
    } finally {
      setHydrated(true);
    }
  }, [router]);

  // load existing media
  useEffect(() => {
    if (!hydrated || !user) return;

    const userId = user.id; // <- non-null here

    async function loadMedia() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/creator/media?userId=${encodeURIComponent(userId)}`
        );
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setError(data.error || "Failed to load posts");
          setLoading(false);
          return;
        }

        const items = (data.media as any[]).map((m) => ({
          ...m,
          createdAt: new Date(m.createdAt).toISOString(),
        })) as CreatorMedia[];

        setMedia(items);
      } catch (err) {
        console.error("loadMedia error", err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadMedia();
  }, [hydrated, user?.id]); // depend on user?.id instead of whole user

 async function handleCreate(e: React.FormEvent) {
  e.preventDefault();

  const currentUser = user;
  if (!currentUser) {
    setError("You must be signed in as a creator to upload.");
    return;
  }

  setCreating(true);
  setError(null);
  setSuccessMsg(null);

  if (!file) {
    setError("Please select a content file to upload.");
    setCreating(false);
    return;
  }

  let priceUsdCents: number | null = null;
  if (visibility !== "PUBLIC" && priceUsd.trim() !== "") {
    const parsed = parseFloat(priceUsd);
    if (!isNaN(parsed) && parsed > 0) {
      priceUsdCents = Math.round(parsed * 100);
    }
  }

  try {
    setUploadingFile(true);

    const formData = new FormData();
    formData.append("userId", currentUser.id);
    formData.append("title", title);
    formData.append("caption", caption);
    formData.append("type", type);
    formData.append("visibility", visibility);
    if (priceUsdCents !== null) {
      formData.append("priceUsdCents", String(priceUsdCents));
    }
    formData.append("coverUrl", coverUrl);
    formData.append("file", file);

    const res = await fetch("/api/creator/upload-media", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      setError(data.error || "Failed to create post");
      setCreating(false);
      setUploadingFile(false);
      return;
    }

    const created = data.media as CreatorMedia;
    setMedia((prev) => [
      { ...created, createdAt: new Date(created.createdAt).toISOString() },
      ...prev,
    ]);

    // reset form
    setTitle("");
    setCaption("");
    setFile(null);
    setCoverUrl("");
    if (visibility !== "PUBLIC") setPriceUsd("9.99");

    setSuccessMsg("Post created. It’s now live on your public page.");
    setTimeout(() => setSuccessMsg(null), 2500);
  } catch (err) {
    console.error("create media error", err);
    setError("Something went wrong");
  } finally {
    setCreating(false);
    setUploadingFile(false);
  }
}


  if (!hydrated) return null;

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
          You must be signed in as a creator to manage posts.
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
      <div style={{ width: "100%", maxWidth: 960, display: "grid", gap: 18 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "var(--sin-muted)",
                marginBottom: 6,
              }}
            >
              Creator posts
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
              Upload content
            </h1>
            <p
              style={{
                fontSize: 12,
                color: "var(--sin-muted)",
                marginTop: 4,
                maxWidth: 420,
              }}
            >
              Add images, videos or files you want to sell or share on your
              SolSins page. These posts will appear on your public profile.
            </p>
          </div>
          <a
            href="/creator/profile"
            style={{ fontSize: 12, color: "#fecaca", textDecoration: "none" }}
          >
            Edit profile & bio →
          </a>
        </header>

        {/* New post form */}
        <section
          style={{
            borderRadius: 24,
            border: "1px solid var(--sin-border)",
            background:
              "radial-gradient(circle at 0 0, rgba(248,113,113,0.18), #020617)",
            padding: 18,
          }}
        >
          <form
            onSubmit={handleCreate}
            style={{ display: "grid", gap: 12, fontSize: 13 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <label style={{ fontSize: 12 }}>Title</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Private Solana-only drop"
                    style={{
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
                  <label style={{ fontSize: 12 }}>Caption</label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Short description, what they’re unlocking, etc."
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
                  />
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <label style={{ fontSize: 12 }}>Content type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as MediaType)}
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
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="AUDIO">Audio</option>
                    <option value="FILE">File</option>
                  </select>
                </div>

                <div style={{ display: "grid", gap: 4 }}>
                  <label style={{ fontSize: 12 }}>Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) =>
                      setVisibility(e.target.value as MediaVisibility)
                    }
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
                    <option value="PAY_PER_VIEW">Pay-per-view</option>
                    <option value="SUBSCRIBERS">Subscribers only</option>
                    <option value="PUBLIC">Public (free)</option>
                  </select>
                  <span style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                    Pay-per-view and subscriber content will be locked behind
                    SOL payments.
                  </span>
                </div>

                {visibility !== "PUBLIC" && (
                  <div style={{ display: "grid", gap: 4 }}>
                    <label style={{ fontSize: 12 }}>Price (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(e.target.value)}
                      style={{
                        borderRadius: 999,
                        border: "1px solid rgba(148,163,184,0.4)",
                        background: "rgba(15,23,42,0.85)",
                        padding: "8px 12px",
                        fontSize: 13,
                        outline: "none",
                        color: "var(--sin-foreground)",
                      }}
                    />
                    <span style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                      Fans see the approximate price in your default currency
                      and pay in SOL.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* File + cover */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12 }}>Content file</label>
                <input
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setFile(f);
                  }}
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.4)",
                    background: "rgba(15,23,42,0.85)",
                    padding: "6px 8px",
                    fontSize: 12,
                    color: "var(--sin-muted)",
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                  Choose the main file for this post. We’ll upload it to SolSins
                  storage.
                </span>
              </div>

              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12 }}>
                  Cover image URL (optional)
                </label>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://…"
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.4)",
                    background: "rgba(15,23,42,0.85)",
                    padding: "8px 12px",
                    fontSize: 13,
                    outline: "none",
                    color: "var(--sin-foreground)",
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                  Used for the preview card on your public page. If empty,
                  we’ll fall back to the main file or a gradient.
                </span>
              </div>
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
                disabled={creating || uploadingFile}
                style={{ paddingInline: 18 }}
              >
                {creating
                  ? uploadingFile
                    ? "Uploading & publishing…"
                    : "Publishing…"
                  : "Publish post"}
              </button>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 2,
                }}
              >
                {uploadingFile && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--sin-muted)",
                    }}
                  >
                    Uploading file to SolSins storage…
                  </span>
                )}
                {successMsg && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--sin-muted)",
                    }}
                  >
                    {successMsg}
                  </span>
                )}
              </div>
            </div>
          </form>
        </section>

        {/* Existing posts */}
        <section
          style={{
            borderRadius: 24,
            border: "1px solid var(--sin-border)",
            background: "rgba(15,23,42,0.95)",
            padding: 18,
            fontSize: 13,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 500,
                margin: 0,
              }}
            >
              Your recent posts
            </h2>
            {loading && (
              <span style={{ fontSize: 11, color: "var(--sin-muted)" }}>
                Loading…
              </span>
            )}
          </div>

          {!loading && media.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--sin-muted)" }}>
              You haven&apos;t posted anything yet. Your first upload will show
              here and on your public page.
            </p>
          )}

          {media.length > 0 && (
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {media.map((m) => {
                const usd =
                  m.priceUsdCents != null ? m.priceUsdCents / 100 : null;

                return (
                  <div
                    key={m.id}
                    style={{
                      borderRadius: 16,
                      border: "1px solid rgba(148,163,184,0.4)",
                      background: "rgba(15,23,42,0.98)",
                      display: "flex",
                      gap: 10,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 12,
                        overflow: "hidden",
                        flexShrink: 0,
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
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          alignItems: "baseline",
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
                            {m.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--sin-muted)",
                              maxHeight: 32,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {m.caption}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--sin-muted)",
                            textAlign: "right",
                          }}
                        >
                          <div>{m.visibility}</div>
                          {usd !== null && (
                            <div>{`$${usd.toFixed(2)} USD`}</div>
                          )}
                        </div>
                      </div>
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
