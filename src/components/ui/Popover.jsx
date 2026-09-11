"use client";
import { useEffect, useRef, useState } from "react";
export default function Popover({ trigger, children, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = event => { if (!ref.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", dismiss); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div className={`popover-wrap ${className}`} ref={ref}>
    {trigger(open, () => setOpen(v => !v))}
    {open && <div className="popover">{typeof children === "function" ? children(() => setOpen(false)) : children}</div>}
  </div>;
}
