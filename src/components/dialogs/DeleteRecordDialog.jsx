"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "../ui/Modal";
import { useFeedback } from "../ui/FeedbackProvider";
import { dateLabel } from "@/lib/records";
export default function DeleteRecordDialog({ record, onClose }) {
  const [name,setName] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const router = useRouter();
  const notify = useFeedback();
  async function remove(event) {
    event.preventDefault(); event.stopPropagation();
    if (busy || name !== record.clientName) return;
    setBusy(true);setError("");
    try {
      const response = await fetch(`/api/ib-records/${record.id}`, {method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientName:name})});
      const data = await response.json();
      if(!response.ok)throw new Error(data.error);
      notify(`Deleted the IB record for ${record.clientName}.`);
      onClose();router.push("/ib-records");router.refresh();
    } catch(error) {setError(error.message || "Could not delete this record. Please try again.");setBusy(false);}
  }
  return <Modal dismissible={!busy} title="Delete IB record?" subtitle="This action cannot be undone." onClose={() => {if(!busy)onClose();}} className="delete-dialog"><form className="modal-body" onSubmit={remove}>
    <div className="delete-record-summary"><strong>{record.clientName}</strong><span>{record.channelName} · Payout {dateLabel(record.payoutDate)}</span></div>
    <p>This permanently removes this IB record and its commercial details and social links.</p>
    <label htmlFor="confirm-client-name">To confirm, type <strong>{record.clientName}</strong> below.</label>
    <input autoFocus id="confirm-client-name" autoComplete="off" placeholder="Enter exact client name" value={name} onChange={e => setName(e.target.value)} disabled={busy} aria-describedby="delete-name-hint"/>
    <small id="delete-name-hint">The name must match exactly, including capitalization.</small>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><button type="button" className="button" disabled={busy} onClick={onClose}>Cancel</button><button className="button danger" disabled={busy || name !== record.clientName}>{busy ? "Deleting…" : "Permanently delete record"}</button></div>
  </form></Modal>;
}
