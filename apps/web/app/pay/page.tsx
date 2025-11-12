"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Seed = { buyerId: string; creatorId: string; handle: string };

export default function PayPage() {
  const [seed, setSeed] = useState<Seed | null>(null);
  const [qr, setQr] = useState<string>("");
  const [ref, setRef] = useState<string>("");
  const [status, setStatus] = useState<string>("idle");
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    (async () => {
      // ensure we have dev users
      const s = await fetch("/dev/seed").then(r => r.json());
      setSeed(s);

      // create a $9.99 PPV order to the dev creator
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: s.buyerId,
          creatorId: s.creatorId,
          kind: "PPV",
          amountUsdCents: 999,
          token: "SOL"
        })
      });
      const data = await res.json();
      setRef(data.reference);
      setUrl(data.solanaPayUrl);
      const code = await QRCode.toDataURL(data.solanaPayUrl);
      setQr(code);
      setStatus("pending");
    })();
  }, []);

  useEffect(() => {
    if (!ref) return;
    const id = setInterval(async () => {
      const r = await fetch(`/api/confirm?reference=${ref}`).then(x => x.json());
      if (r.status === "confirmed") {
        setStatus("confirmed");
        clearInterval(id);
      }
    }, 2500);
    return () => clearInterval(id);
  }, [ref]);

  return (
    <main>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Pay with Solana</h2>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Scan the QR in Phantom/Solflare (Devnet RPC in env by default).
      </p>

      {qr ? <img src={qr} alt="QR" style={{ width: 280, borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,.4)" }} /> :
        <div style={{ width: 280, height: 280, background: "#18181b", borderRadius: 12 }} />}

      {url && (
        <p style={{ wordBreak: "break-all", marginTop: 12 }}>
          <a href={url}>Open in wallet</a>
        </p>
      )}

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #2a2a34", borderRadius: 12 }}>
        <div>Status: <b>{status}</b></div>
        <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>Reference: {ref || "…"}</div>
        {seed && <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>Creator: {seed.handle}</div>}
      </div>
    </main>
  );
}
