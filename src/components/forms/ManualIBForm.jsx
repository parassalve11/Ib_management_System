"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DateInput from "../ui/DateInput";
import { countries } from "@/lib/countries";
import { emptyRecord, validateRecord, socialPlatforms } from "@/lib/records";
function Field({ label, name, value, onChange, error, type = "text", placeholder, required = false, children, className = "" }) {
  return <div className={`form-field ${className}`}><label htmlFor={name}>{label}</label>{children || (type === "date" ? <DateInput id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? name+"-error" : undefined}/> : <input id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? name+"-error" : undefined} {...(type === "number" ? { min: "0", max: "999999999.99", step: "0.01" } : {})}/>)} {error && <span id={name+"-error"} className="field-error">{error}</span>}</div>;
}
export default function ManualIBForm({ record }) {
  const [values,setValues] = useState(record || emptyRecord());
  const [errors,setErrors] = useState({});
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const router = useRouter();
  const update = e => { const {name,value} = e.target; setValues(old => ({...old,[name]:value})); setErrors(old => ({...old,[name]:undefined})); };
  const field = (name,label,placeholder,type="text") => <Field key={name} name={name} label={label} placeholder={placeholder} type={type} value={values[name]} onChange={update} error={errors[name]}/>;
  async function submit(event) {
    event.preventDefault(); setError("");
    const result = validateRecord(values);
    setErrors(result.errors);
    if (!result.valid) { document.getElementById(Object.keys(result.errors)[0])?.focus(); return; }
    setBusy(true);
    try {
      const response = await fetch(record ? `/api/ib-records/${record.id}` : "/api/ib-records", { method: record ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result.record) });
      const data = await response.json();
      if (!response.ok) { if (data.errors) setErrors(data.errors); throw new Error(data.error); }
      router.push("/ib-records"); router.refresh();
    } catch (error) { setError(error.message || "Could not save the record."); setBusy(false); }
  }
  return <form className="manual-form" onSubmit={submit} noValidate>
    <div className="manual-sections">
      <section className="form-section basic-information"><h2>Basic Information</h2><div className="form-grid">
        <Field name="countryCode" label="Country" error={errors.countryCode}><select id="countryCode" name="countryCode" value={values.countryCode} onChange={update} aria-invalid={Boolean(errors.countryCode)} aria-describedby={errors.countryCode ? "countryCode-error" : undefined}><option value="">Select country</option>{countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></Field>
        {field("clientName","Client Name","Enter client name")}{field("channelName","Channel Name","Enter channel name")}{field("psmName","PSM Name","Enter PSM name")}
      </div></section>
      <section className="form-section commercial-details"><h2>Commercial Details</h2><div className="commercial-top">{field("ibCommissionPerLot","IB Commission / Lot","0.00","number")}{field("spreads","Spreads","0.00","number")}{field("upfrontPaid","Upfront Paid","0.00","number")}</div><div className="form-grid">{field("totalSalary","Total Salary","0.00","number")}{field("payoutDate","Payout Date","Select date","date")}</div></section>
      <section className="form-section social-links-form"><h2>Social Links</h2><div className="form-grid">{socialPlatforms.map(p => field(p.key,p.label+" URL",p.placeholder,"url"))}</div></section>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><Link className="button" href="/ib-records">Cancel</Link><button className="button primary" disabled={busy}>{busy ? "Saving…" : record ? "Save Changes" : "Save IB Record"}</button></div>
  </form>;
}
