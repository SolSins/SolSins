"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
export default function Login() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  return (
    <main>
      <h1>Login</h1>
      <div style={{display:"grid",gap:8,maxWidth:360}}>
        <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={()=>signIn("credentials",{ email, password, callbackUrl:"/dashboard"})}>Login</button>
      </div>
    </main>
  );
}
