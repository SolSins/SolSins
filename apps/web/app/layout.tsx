export const metadata = { title: "SolSins" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "ui-sans-serif, system-ui", background: "#0b0b0f", color: "#fafafa" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: 24 }}>{children}</div>
      </body>
    </html>
  );
}
