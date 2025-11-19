"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type LocalUser = {
  id: string;
  email: string;
  role: "FAN" | "CREATOR" | "ADMIN";
};

type MediaUnlockButtonProps = {
  creatorId: string;
  mediaId: string;
  priceUsdCents: number | null;
};

export function MediaUnlockButton({
  creatorId,
  mediaId,
  priceUsdCents,
}: MediaUnlockButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("Unlock with wallet");
  const [error, setError] = useState<string | null>(null);

  // Helper to read current path for redirect
  function getCurrentPath() {
    if (typeof window === "undefined") return "/";
    return window.location.pathname + window.location.search;
  }

  async function handleClick() {
    setError(null);

    if (!priceUsdCents || priceUsdCents <= 0) {
      // Free / TBD content – just send them to login / creator page for now
      router.push(getCurrentPath());
      return;
    }

    let user: LocalUser | null = null;
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("sin-session");
      if (raw) {
        try {
          user = JSON.parse(raw) as LocalUser;
        } catch {
          user = null;
        }
      }
    }

    if (!user) {
      const next = encodeURIComponent(getCurrentPath());
      router.push(`/login?next=${next}`);
      return;
    }

    try {
      setLoading(true);
      setLabel("Processing…");

      const res = await fetch("/api/media/buy-with-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          mediaId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || "Failed to purchase";
        setError(msg);

        if (msg.toLowerCase().includes("insufficient")) {
          setLabel("Deposit SOL");
          // gentle nudge to wallet page
          setTimeout(() => {
            router.push("/wallet");
          }, 600);
        } else {
          setLabel("Try again");
        }
        return;
      }

      setLabel("Unlocked ✓");
      // Optionally refresh to show unlocked state
      router.refresh();
    } catch (e) {
      console.error(e);
      setError("Something went wrong");
      setLabel("Try again");
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = loading || !priceUsdCents || priceUsdCents <= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className="btn btn-secondary"
        style={{
          fontSize: 11,
          padding: "5px 10px",
          whiteSpace: "nowrap",
          opacity: isDisabled ? 0.7 : 1,
          cursor: isDisabled ? "not-allowed" : "pointer",
        }}
      >
        {label}
      </button>
      {error && (
        <span
          style={{
            marginTop: 4,
            fontSize: 10,
            color: "#fca5a5",
            maxWidth: 180,
            textAlign: "right",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
