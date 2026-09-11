"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "./ui/Logo";
import Icon from "./ui/Icon";
import Popover from "./ui/Popover";
export default function Header({ demo, title, subtitle }) {
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
    <div className="header-brand"><Logo/>{title && <div className="header-page-title"><h1>{title}</h1><p>{subtitle}</p></div>}</div>
    <Popover className="account-menu" trigger={(open,toggle) => <button className="account-button" onClick={toggle} aria-expanded={open}><span className="avatar">A</span><span>Accountant{demo && <small>Local demo</small>}</span><Icon name="chevron" size={14}/></button>}>
      {close => <><div className="account-description">ByteFX Internal System{demo && <small>Sample data · local demo</small>}</div><button onClick={() => { close(); logout(); }}><Icon name="logout"/> Sign out</button>{error && <p role="alert" className="field-error">{error}</p>}</>}
    </Popover>
  </header>;
}
