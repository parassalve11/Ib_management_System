"use client";
import { useId, useRef, useState } from "react";
import { countries, countryFor } from "@/lib/countries";
import Flag from "./Flag";
import Icon from "./Icon";
import Popover from "./Popover";
function CountryOptions({ value, onSelect }) {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const results = countries.filter(c => `${c.name} ${c.code} ${c.label}`.toLowerCase().includes(search.trim().toLowerCase()));
  const move = index => { setActive(index); document.getElementById(`${listId}-${index}`)?.scrollIntoView({block:"nearest"}); };
  return <><input autoFocus className="option-search" role="combobox" aria-label="Search countries" aria-expanded="true" aria-controls={listId} aria-activedescendant={results[active] ? `${listId}-${active}` : undefined} placeholder="Search country or code…" value={search} onChange={e => {setSearch(e.target.value);setActive(0);}} onKeyDown={e => {
    if(e.key === "ArrowDown" || e.key === "ArrowUp") {e.preventDefault();move(Math.max(0,Math.min(results.length-1,active+(e.key === "ArrowDown"?1:-1))));}
    if(e.key === "Enter") {e.preventDefault();if(results[active])onSelect(results[active].code);}
  }}/><div className="country-options" id={listId} role="listbox" aria-label="Countries">{results.map((country,index) => <button type="button" role="option" aria-label={country.name} id={`${listId}-${index}`} aria-selected={country.code === value} className={active === index ? "active" : ""} key={country.code} onClick={() => onSelect(country.code)}><Flag code={country.code} label={false}/><span>{country.name}</span>{country.code === value && <Icon name="check" size={15}/>}</button>)}{!results.length && <p className="country-empty">No countries found. Try another search.</p>}</div></>;
}
export default function CountrySelect({ id, name, value, onChange, ...props }) {
  const triggerRef = useRef(null);
  const country = countryFor(value);
  return <Popover className="country-select" trigger={(open,toggle) => <button ref={triggerRef} type="button" id={id} className={`select-button ${value ? "has-value" : ""}`} aria-haspopup="listbox" aria-expanded={open} onClick={toggle} {...props}><span>{country ? <><Flag code={country.code} label={false}/>{country.name}</> : "Select country"}</span><Icon name="chevron" size={14}/></button>}>{close => <CountryOptions value={value} onSelect={code => {onChange({target:{name,value:code}});close();triggerRef.current?.focus();}}/>}</Popover>;
}
