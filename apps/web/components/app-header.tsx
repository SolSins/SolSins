"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

type Role = "FAN" | "CREATOR" | "ADMIN";

type LocalUser = {
  id: string;
  email: string;
  role: Role;
};

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<LocalUser | null>(null);

  // Load session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("solsinsUser");
      if (!raw) {
        setUser(null);
        return;
      }
      const parsed = JSON.parse(raw) as LocalUser;
      setUser(parsed);
    } catch {
      setUser(null);
    }
  }, [pathname]); // re-check on route change

  const isLoggedIn = !!user;
  const isCreator = user?.role === "CREATOR";
  const isFan = user?.role === "FAN";
  const isAdmin = user?.role === "ADMIN";

  function handleLogout() {
    localStorage.removeItem("solsinsUser");
    setUser(null);
    router.push("/");
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Brand */}
        <Link href="/" className="brand">
          <div className="brand-mark">S</div>
          <div>
            <div className="brand-text-main">SolSins</div>
            <div className="brand-text-sub">Solana-native only content</div>
          </div>
        </Link>

        {/* Nav + auth / account */}
        <nav className="app-nav">

          {/* Right side: buttons / account menu */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {!isLoggedIn && (
              <>
                <a href="/login">
                  <button className="btn btn-ghost" type="button">
                    Log in
                  </button>
                </a>
                <a href="/signup/creator">
                  <button className="btn btn-primary" type="button">
                    Become a creator
                  </button>
                </a>
              </>
            )}

            {isLoggedIn && (
              <>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--sin-muted)",
                    maxWidth: 200,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Logged in as{" "}
                  <span className="font-mono text-red-300">
                    {user?.email}
                  </span>{" "}
                  
                </div>

                {/* Role-specific shortcuts */}
                {(isFan || isCreator) && (
                  <a href="/fan">
                    <button className="btn btn-ghost" type="button">
                      Fan dashboard
                    </button>
                  </a>
                )}

                {isCreator && (
                  <a href="/creator">
                    <button className="btn btn-primary" type="button">
                      Creator dashboard
                    </button>
                  </a>
                )}

                {isAdmin && (
                  <a href="/admin">
                    <button className="btn btn-ghost" type="button">
                      Admin
                    </button>
                  </a>
                )}

                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
