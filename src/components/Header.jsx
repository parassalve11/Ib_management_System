"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "./ui/Logo";
import Icon from "./ui/Icon";
import Popover from "./ui/Popover";
export default function Header({ demo, title, subtitle, email }) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function logout() {
    try {
      const response = await fetch("/api/auth", { method: "DELETE" });
      if (!response.ok) throw new Error();
      router.replace("/login"); router.refresh();
    } catch { setError("Could not sign out. Please try again."); }
  }
  return <header className="top-header">
    <div className="header-brand"><Logo/>{!title && <span className="header-product-name">IB Expense<br/><strong>Management System</strong></span>}{title && <div className="header-page-title"><h1>{title}</h1><p>{subtitle}</p></div>}</div>
    {error && <span role="alert" className="field-error">{error}</span>}<Popover className="account-menu" trigger={(open,toggle) => <button className="account-button" onClick={toggle} aria-label="Accountant account menu" aria-expanded={open}><span className="avatar">A<span className="account-status"/></span><span className="account-identity"><strong>Accountant</strong><small>{demo ? "Demo workspace" : "IB expense workspace"}</small></span><Icon name="chevron" size={14}/></button>}>
      {close => <><div className="account-description"><strong>Signed in as Accountant</strong><small>{email}</small>{demo && <small>Sample data · local demo</small>}</div><button onClick={() => { close(); logout(); }}><Icon name="logout"/> Sign out</button></>}
    </Popover>
  </header>;
}
