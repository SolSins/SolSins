"use client";
import { useState } from "react";

export default function Upload() {
  const [file,setFile]=useState<File|null>(null);
  const [title,setTitle]=useState(""); const [price,setPrice]=useState("9.99");
  const [visibility,setVisibility]=useState<"PAY_PER_VIEW"|"PUBLIC">("PAY_PER_VIEW");

  async function doUpload() {
    if (!file) return;
    // 1) get signed URL
    const up = await fetch("/api/private/upload",{method:"POST",headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ filename:file.name, contentType:file.type })}).then(r=>r.json());
    // 2) PUT file to S3
    await fetch(up.uploadUrl,{ method:"PUT", headers:{ "Content-Type": file.type }, body:file });
    // 3) create Media row
    const r = await fetch("/api/private/media",{ method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        title, priceUsdCents: Math.round(Number(price)*100) || null,
        fileUrl: up.fileUrl, visibility
      })
    });
    alert(await r.text());
  }

  return (
    <main>
      <h1>Upload media</h1>
      <div style={{display:"grid",gap:8,maxWidth:420}}>
        <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <select value={visibility} onChange={e=>setVisibility(e.target.value as any)}>
          <option value="PAY_PER_VIEW">Pay-per-view</option>
          <option value="PUBLIC">Public</option>
        </select>
        {visibility==="PAY_PER_VIEW" && <input placeholder="Price USD" value={price} onChange={e=>setPrice(e.target.value)} />}
        <input type="file" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
        <button onClick={doUpload}>Upload</button>
      </div>
    </main>
  );
}
