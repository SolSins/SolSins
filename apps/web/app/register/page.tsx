"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [role, setRole] = useState<"FAN"|"CREATOR">("CREATOR");
  const [handle, setHandle] = useState("");

  return (
    <main>
      <h1>Create account</h1>
      <div style={{display:"grid",gap:8,maxWidth:360}}>
        <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <select value={role} onChange={e=>setRole(e.target.value as any)}>
          <option value="CREATOR">Creator</option><option value="FAN">Fan</option>
        </select>
        {role==="CREATOR" && <input placeholder="handle (unique)" value={handle} onChange={e=>setHandle(e.target.value)} />}
        <button onClick={async ()=>{
          const r = await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ email, password, role, handle })});
          alert(await r.text());
        }}>Register</button>
      </div>
    </main>
  );
}
