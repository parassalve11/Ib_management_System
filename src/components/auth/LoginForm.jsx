"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../ui/Logo";
import Icon from "../ui/Icon";
import Modal from "../ui/Modal";
export default function LoginForm({ demo }) {
  const [showPassword, setShowPassword] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [forgot,setForgot] = useState(false);
  const router = useRouter();
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fields.get("email"), password: fields.get("password"), remember: fields.get("remember") === "on" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.replace("/ib-records"); router.refresh();
    } catch (error) { setError(error.message || "Unable to sign in. Please try again."); setBusy(false); }
  }
  return <main className="login-page"><div className="login-stack">
    <Logo large linked={false}/>
    <h1>IB Expense Manager</h1><p className="login-subtitle">Sign in to access the internal system</p>
    <form className="login-card" onSubmit={submit}>
      <label htmlFor="email">Email</label><input id="email" name="email" type="email" placeholder="name@bytefx.com" autoComplete="username" required defaultValue={demo ? "name@bytefx.com" : ""}/>
      <label htmlFor="password">Password</label><div className="password-input"><input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••••••" autoComplete="current-password" required defaultValue={demo ? "ByteFX2026!" : ""}/><button type="button" className="icon-button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(v => !v)}><Icon name={showPassword ? "hidden" : "eye"} size={18}/></button></div>
      <div className="login-options"><label className="checkbox-label"><input name="remember" type="checkbox" defaultChecked/>Remember me</label><button type="button" className="text-button" onClick={() => setForgot(true)}>Forgot password?</button></div>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="button primary login-submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
    <p className="login-footer">ByteFX Internal System</p>
    {demo && <p className="demo-credentials">Local demo · Sample data<br/>name@bytefx.com <span> / </span> ByteFX2026!</p>}
  </div>{forgot && <Modal title="Forgot password?" onClose={() => setForgot(false)}><div className="modal-body"><p>{demo ? "This is the local demo. Sign in with the credentials shown below the form." : "Contact your system administrator to reset your internal account password."}</p><button className="button primary" onClick={() => setForgot(false)}>Back to sign in</button></div></Modal>}</main>;
}
