"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
const iso = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const parse = value => {const date = new Date(`${value}T12:00:00`);return !Number.isNaN(date.getTime()) && iso(date) === value ? date : new Date();};
const months = Array.from({length:12},(_,month)=>new Date(2026,month,1).toLocaleDateString("en",{month:"long"}));
function Calendar({ value, onSelect, onClose, anchor, label, min, max, calendarId }) {
  const [cursor,setCursor] = useState(() => parse(value));
  const [position,setPosition] = useState({top:0,left:0});
  const panel = useRef(null);
  const gridFocus = useRef(true);
  const year=cursor.getFullYear(), month=cursor.getMonth();
  const today=iso(new Date());
  const allowed = date => (!min || date >= min) && (!max || date <= max);
  useLayoutEffect(() => {
    const place = () => {
      const rect=anchor.current.getBoundingClientRect();
      const height=panel.current?.offsetHeight || 360;
      setPosition({left:Math.max(8,Math.min(rect.left,window.innerWidth-300)),top:Math.max(8,rect.bottom+height+8>window.innerHeight ? rect.top-height-8 : rect.bottom+8)});
    };
    place();window.addEventListener("resize",place);window.addEventListener("scroll",place,true);
    return ()=>{window.removeEventListener("resize",place);window.removeEventListener("scroll",place,true);};
  },[anchor]);
  useEffect(() => {
    if(gridFocus.current)panel.current?.querySelector(`[data-date="${iso(cursor)}"]`)?.focus();
  },[cursor]);
  useEffect(() => {
    const dismiss=e=>{if(!panel.current?.contains(e.target) && !anchor.current?.contains(e.target))onClose(false);};
    const escape=e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();onClose(true);}};
    document.addEventListener("pointerdown",dismiss);document.addEventListener("keydown",escape);
    return ()=>{document.removeEventListener("pointerdown",dismiss);document.removeEventListener("keydown",escape);};
  },[anchor,onClose]);
  function navigate(e) {
    let next=new Date(cursor);
    if(e.key==="ArrowLeft")next.setDate(next.getDate()-1);
    else if(e.key==="ArrowRight")next.setDate(next.getDate()+1);
    else if(e.key==="ArrowUp")next.setDate(next.getDate()-7);
    else if(e.key==="ArrowDown")next.setDate(next.getDate()+7);
    else if(e.key==="Home")next.setDate(next.getDate()-next.getDay());
    else if(e.key==="End")next.setDate(next.getDate()+6-next.getDay());
    else if(e.key==="PageUp" || e.key==="PageDown")next=new Date(year,month+(e.key==="PageUp"?-1:1),1);
    else return;
    e.preventDefault();gridFocus.current=true;setCursor(next);
  }
  const first=new Date(year,month,1).getDay();
  const days=new Date(year,month+1,0).getDate();
  const changeMonth=(y,m)=>{gridFocus.current=false;setCursor(new Date(y,m,1));};
  return createPortal(<div ref={panel} id={calendarId} role="dialog" aria-label={`${label} calendar`} className="calendar-panel" style={position} onBlur={e=>{if(e.relatedTarget && !e.currentTarget.contains(e.relatedTarget) && !anchor.current.contains(e.relatedTarget))onClose(false);}}>
    <div className="calendar-heading"><button type="button" className="icon-button" aria-label="Previous month" onClick={()=>changeMonth(year,month-1)}><Icon name="left"/></button><div><select aria-label="Calendar month" value={month} onChange={e=>changeMonth(year,Number(e.target.value))}>{months.map((name,i)=><option key={name} value={i}>{name}</option>)}</select><select aria-label="Calendar year" value={year} onChange={e=>changeMonth(Number(e.target.value),month)}>{Array.from({length:Math.max(2100,year)-Math.min(1900,year)+1},(_,i)=>Math.min(1900,year)+i).map(y=><option key={y}>{y}</option>)}</select></div><button type="button" className="icon-button" aria-label="Next month" onClick={()=>changeMonth(year,month+1)}><Icon name="right"/></button></div>
    <span className="sr-only" aria-live="polite">{months[month]} {year}</span>
    <div className="calendar-weekdays" aria-hidden="true">{["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><span key={d}>{d}</span>)}</div>
    <div className="calendar-days" role="group" aria-label="Choose a day" onKeyDown={navigate}>{Array.from({length:first},(_,i)=><span key={`blank-${i}`}/>)}{Array.from({length:days},(_,i)=>{
      const date=new Date(year,month,i+1),dateValue=iso(date);
      return <button type="button" key={dateValue} data-date={dateValue} tabIndex={iso(cursor)===dateValue?0:-1} aria-label={date.toLocaleDateString("en",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} aria-pressed={value===dateValue} aria-current={today===dateValue?"date":undefined} aria-disabled={!allowed(dateValue)} className={`calendar-day ${value===dateValue?"selected":""} ${today===dateValue?"today":""}`} onClick={()=>{if(allowed(dateValue))onSelect(dateValue);}}>{i+1}</button>;
    })}</div><div className="calendar-footer"><button type="button" className="text-button" onClick={()=>onSelect("")}>Clear</button><button type="button" className="button small" disabled={!allowed(today)} onClick={()=>onSelect(today)}>Today</button></div>
  </div>,document.body);
}
export default function DateInput({ id, name, value, onChange, placeholder="Select date", compact=false, min, max, ...props }) {
  const [open,setOpen]=useState(false);
  const anchor=useRef(null);
  const trigger=useRef(null);
  const calendarId=useId();
  const label=props["aria-label"] || (name === "payoutDate" ? "Payout date" : "Date");
  const close=restore=>{setOpen(false);if(restore)trigger.current?.focus();};
  return <div ref={anchor} className={`date-control ${compact?"compact-date":""}`}>
    <input id={id} name={name} type="text" value={value} onChange={onChange} placeholder={placeholder} maxLength={10} title="Choose a date or type YYYY-MM-DD" autoComplete="off" {...props} onKeyDown={e=>{if(e.key==="ArrowDown"){e.preventDefault();setOpen(true);}}}/>
    <button ref={trigger} type="button" className="date-trigger icon-button" aria-label={`Choose ${label.toLowerCase()}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?calendarId:undefined} onClick={()=>setOpen(v=>!v)} disabled={props.disabled}><Icon name="calendar" size={15}/></button>
    {open && <Calendar value={value} min={min} max={max} calendarId={calendarId} label={label} anchor={anchor} onClose={close} onSelect={date=>{onChange({target:{name,value:date}});close(true);}}/>}
  </div>;
}
