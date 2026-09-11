"use client";
import { useState } from "react";
import { countries } from "@/lib/countries";
import { numericFields, columns, socialPlatforms } from "@/lib/records";
import Icon from "../ui/Icon";
import Flag from "../ui/Flag";
import DateInput from "../ui/DateInput";
import Popover from "../ui/Popover";
function MultiSelect({ label, placeholder, options, value = [], onChange, country = false }) {
  const [search,setSearch] = useState("");
  return <div className="filter-field"><label>{label}</label><Popover className="filter-select" trigger={(open,toggle) => <button type="button" className={`select-button ${value.length ? "has-value" : ""}`} onClick={toggle} aria-expanded={open} aria-label={label}><span>{value.length ? value.length === 1 ? options.find(o => o.value === value[0])?.label : `${value.length} selected` : placeholder}</span><Icon name="chevron" size={14}/></button>}>
    <input aria-label={`Search ${label.toLowerCase()} options`} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="option-search"/>
    <div className="select-options">{options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())).map(option => <label key={option.value} className="checkbox-label"><input type="checkbox" checked={value.includes(option.value)} onChange={() => onChange(value.includes(option.value) ? value.filter(v => v !== option.value) : [...value,option.value])}/>{country ? <Flag code={option.value}/> : option.label}</label>)}</div>
  </Popover></div>;
}
export default function FilterRail({ records, draft, setDraft, onApply, onClear, mobileOpen, onClose }) {
  const [error, setError] = useState("");
  const update = (key,value) => setDraft(old => ({ ...old, [key]: value }));
  const apply = event => {
    event.preventDefault();
    for (const key of numericFields) if (draft[key+"Min"] !== undefined && draft[key+"Min"] !== "" && draft[key+"Max"] !== undefined && draft[key+"Max"] !== "" && Number(draft[key+"Min"]) > Number(draft[key+"Max"])) { setError("Minimum values must not exceed maximum values."); return; }
    if (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo) { setError("From date must be before the to date."); return; }
    setError(""); onApply(); onClose();
  };
  return <>{mobileOpen && <button className="drawer-backdrop" aria-label="Close filters" onClick={onClose}/>}<aside className={`filter-rail ${mobileOpen ? "drawer-open" : ""}`} aria-label="Record filters">
    <div className="filter-heading"><h2>Filters</h2><button className="text-button" type="button" onClick={() => { setError(""); onClear(); }}>Clear all</button><button className="icon-button mobile-close" aria-label="Close filters" onClick={onClose}><Icon name="close"/></button></div>
    <form onSubmit={apply}>
      <MultiSelect label="Country" placeholder="Search country…" options={countries.map(c => ({ value: c.code, label: c.name }))} value={draft.countryCode} onChange={v => update("countryCode",v)} country/>
      <div className="filter-field"><label htmlFor="filter-client">Client Name</label><input id="filter-client" placeholder="Search client…" value={draft.clientName || ""} onChange={e => update("clientName",e.target.value)}/></div>
      {["channelName","psmName"].map(key => <MultiSelect key={key} label={key === "channelName" ? "Channel Name" : "PSM Name"} placeholder={key === "channelName" ? "Search channel…" : "Search PSM…"} options={[...new Set(records.map(r => r[key]))].sort().map(value => ({ value, label: value }))} value={draft[key]} onChange={v => update(key,v)}/>)}
      {numericFields.map(key => <fieldset className="filter-field" key={key}><legend>{columns.find(([k]) => k === key)[1]}</legend><div className="range-fields"><input type="number" min="0" step="0.01" placeholder="Min" aria-label={`Minimum ${columns.find(([k]) => k === key)[1]}`} value={draft[key+"Min"] ?? ""} onChange={e => update(key+"Min",e.target.value)}/><span>-</span><input type="number" min="0" step="0.01" placeholder="Max" aria-label={`Maximum ${columns.find(([k]) => k === key)[1]}`} value={draft[key+"Max"] ?? ""} onChange={e => update(key+"Max",e.target.value)}/></div></fieldset>)}
      <fieldset className="filter-field"><legend>Payout Date</legend><div className="range-fields dates"><DateInput compact placeholder="From date" aria-label="Payout from date" value={draft.dateFrom || ""} onChange={e => update("dateFrom",e.target.value)}/><DateInput compact placeholder="To date" aria-label="Payout to date" value={draft.dateTo || ""} onChange={e => update("dateTo",e.target.value)}/></div></fieldset>
      <fieldset className="filter-field social-filter"><legend>Social Presence</legend><div>{socialPlatforms.map(p => <label className="checkbox-label" key={p.key}><input type="checkbox" checked={Boolean(draft.social?.includes(p.key))} onChange={() => update("social",draft.social?.includes(p.key) ? draft.social.filter(v => v !== p.key) : [...(draft.social || []),p.key])}/>{p.label}</label>)}</div></fieldset>
      {error && <p className="field-error" role="alert">{error}</p>}<button className="button primary apply-filters">Apply Filters</button>
    </form>
  </aside></>;
}
