"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../ui/Icon";
export default function ExcelImporter() {
  const inputRef = useRef(null);
  const [file,setFile] = useState(null);
  const [preview,setPreview] = useState(null);
  const [inputs,setInputs] = useState([]);
  const [busy,setBusy] = useState(false);
  const [dragging,setDragging] = useState(false);
  const [error,setError] = useState("");
  const [mode,setMode] = useState("skip");
  const [complete,setComplete] = useState(null);
  const router = useRouter();
  async function selectFile(selected) {
    if (!selected || busy) return;
    setError(""); setPreview(null); setInputs([]); setComplete(null); setFile(selected);
    if (!/\.xlsx?$/i.test(selected.name)) { setError("Choose an .xlsx or .xls file."); return; }
    if (selected.size > 5*1024*1024) { setError("The file must be smaller than 5 MB."); return; }
    setBusy(true);
    try {
      const form = new FormData(); form.append("file",selected);
      const response = await fetch("/api/import", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPreview(data.preview); setInputs(data.inputs);
    } catch (error) { setError(error.message || "Could not read this workbook."); }
    finally { setBusy(false); }
  }
  async function importRecords() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inputs, duplicateMode: mode }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setComplete(data); setPreview(null); setInputs([]); router.refresh();
    } catch (error) { setError(error.message || "Import failed. Please try again."); }
    finally { setBusy(false); }
  }
  async function downloadTemplate() {
    setError("");
    try {
      const response = await fetch("/api/export?mode=template");
      if (!response.ok) throw new Error((await response.json()).error);
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a"); a.href = url; a.download = "bytefx-ib-template.xlsx"; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
    } catch (error) { setError(error.message || "Could not download the template."); }
  }
  const count = status => preview?.filter(r => r.status === status).length || 0;
  const importCount = preview?.filter(r => r.valid && !r.repeated && (!r.duplicate || mode === "update")).length || 0;
  return <div className="excel-importer">
    <div className="import-steps">
      <section className="import-step template-step"><span className="step-number">1</span><div><h2>Download Template</h2><p>Use our Excel template with the correct format.</p><button className="button outline-blue" onClick={downloadTemplate}>Download Template</button></div></section>
      <div className="upload-column"><section className="import-step upload-step"><span className="step-number">2</span><div className="upload-step-content"><h2>Upload Excel File</h2><p>Select your completed Excel file (.xlsx or .xls).</p>
        <div className={`drop-zone ${dragging ? "dragging" : ""}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files[0]); }}>
          <svg className="excel-icon" width="30" height="32" viewBox="0 0 32 34" aria-hidden="true"><rect x="10" y="2" width="20" height="29" rx="3" fill="#21a366"/><path d="M14 9h12M14 15h12M14 21h12M20 7v20" stroke="#9de0be" strokeWidth="1"/><rect x="2" y="9" width="18" height="19" rx="2" fill="#107c41"/><path d="m7 14 6 9m0-9-6 9" stroke="white" strokeWidth="2"/></svg>
          <strong>{busy ? "Checking workbook…" : file ? file.name : "Drop Excel file here"}</strong><span>or</span><button className="button outline-blue" onClick={() => inputRef.current.click()} disabled={busy}>Browse Files</button>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" aria-label="Upload Excel file" className="sr-only" onChange={e => { selectFile(e.target.files[0]); e.target.value = ""; }}/>
        </div><small className="upload-hint">.xlsx or .xls supported · Up to 5 MB</small>
      </div></section>
      <section className="import-step preview-step"><span className="step-number">3</span><div><h2>Preview & Import</h2><p>We’ll validate your data before importing.</p><div className="validation-features">{["Check for errors","Preview records","Detect duplicates","Import valid data"].map(label => <span key={label}><Icon name="check" size={13}/>{label}</span>)}</div></div></section></div>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {preview && <section className="import-preview"><div className="preview-heading"><div><h2>{file?.name}</h2><p>{preview.length} rows detected</p></div><div className="preview-counts"><span className="valid-count">{count("Valid")} Valid</span><span>{count("Needs attention")} Need attention</span><span className="invalid-count">{count("Invalid")} Invalid</span><span>{count("Possible duplicate")} Possible duplicates</span></div></div>
      <div className="duplicate-controls"><label htmlFor="duplicate-mode">Possible duplicates</label><select id="duplicate-mode" value={mode} onChange={e => setMode(e.target.value)}><option value="skip">Skip existing</option><option value="update">Update existing</option></select><span>Matched by country, client, channel and payout date. Repeated rows in this file are skipped.</span></div>
      <div className="preview-table-scroll"><table className="preview-table"><thead><tr><th>Row</th><th>Client Name</th><th>Channel Name</th><th>Payout Date</th><th>Status</th><th>Validation</th></tr></thead><tbody>{preview.map(row => <tr key={row.row}><td>{row.row}</td><td>{row.record.clientName || "—"}</td><td>{row.record.channelName || "—"}</td><td>{row.record.payoutDate || "—"}</td><td className={row.valid ? "" : "invalid-count"}>{row.status}</td><td>{Object.values(row.errors).join(" ") || (row.repeated ? "Repeated row in this workbook; skipped." : row.duplicate ? mode === "skip" ? "Existing record will be skipped." : "Existing record will be updated." : "Ready to import")}</td></tr>)}</tbody></table></div>
      <div className="form-actions"><button className="button" disabled={busy} onClick={() => { setPreview(null); setInputs([]); setFile(null); }}>Cancel</button><button className="button primary" disabled={busy || !importCount} onClick={importRecords}>{busy ? "Importing…" : `Import ${importCount} valid records`}</button></div>
    </section>}
    {complete && <div className="import-complete" role="status"><Icon name="check" size={20}/><div><h2>Import complete</h2><p>{complete.added} added · {complete.updated} updated · {complete.skipped} skipped</p></div><button className="button primary" onClick={() => { router.push("/ib-records"); router.refresh(); }}>Back to Records</button></div>}
  </div>;
}
