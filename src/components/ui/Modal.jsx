"use client";
import { useCallback, useEffect, useRef } from "react";
import Icon from "./Icon";
export default function Modal({ title, subtitle, onClose, children, className = "" }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const close = useCallback(() => {
    if (timer.current) return;
    const dialog = ref.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onClose(); return; }
    dialog.dataset.closing = "true";
    timer.current = setTimeout(onClose,140);
  },[onClose]);
  useEffect(() => { const dialog=ref.current; dialog.showModal(); return () => { clearTimeout(timer.current); dialog.close(); }; },[]);
  return <dialog ref={ref} className={`modal ${className}`} aria-labelledby="modal-title" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget)close();}}>
    <div className="modal-content"><div className="modal-heading"><div><h2 id="modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={close} aria-label="Close dialog"><Icon name="close"/></button></div>{children}</div>
  </dialog>;
}
