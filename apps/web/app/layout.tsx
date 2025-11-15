import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/app-header";

export const metadata: Metadata = {
  title: "SolSins – Solana-first creator platform",
  description:
    "Solana-native fans & creators. Keep 100% of your earnings, paid in SOL.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="sin-body">
        <div className="app-shell">
          {/* 🔥 New dynamic header */}
          <AppHeader />

          <div className="app-content">
            <div className="app-inner">{children}</div>
          </div>

          <footer className="app-footer">
            <div className="app-footer-inner">
              <span>
                © {new Date().getFullYear()} SolSins. Built on Solana.
              </span>
              <span>
                Creators keep 100% of earnings. No cuts. No chargebacks.
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
