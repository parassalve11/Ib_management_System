"use client";
import { useEffect, useRef } from "react";
import Icon from "./Icon";
export default function Modal({ title, subtitle, onClose, children, className = "" }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className={`modal ${className}`} aria-labelledby="modal-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-content">
      <div className="modal-heading"><div><h2 id="modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close"/></button></div>
      {children}
    </div>
  </dialog>;
}
