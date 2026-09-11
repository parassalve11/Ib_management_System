"use client";
import Icon from "./Icon";
export default function DateInput({ id, name, value, onChange, placeholder = "Select date", compact = false, ...props }) {
  return <div className={`date-control ${compact ? "compact-date" : ""}`} data-empty={!value}>
    <input id={id} name={name} type="date" value={value} onChange={onChange} onClick={event => { try { event.currentTarget.showPicker?.(); } catch {} }} {...props}/>
    {!value && <span className="date-placeholder"><span>{placeholder}</span><Icon name="calendar" size={14}/></span>}
  </div>;
}
