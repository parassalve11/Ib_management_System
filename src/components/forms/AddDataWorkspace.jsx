"use client";
import { useState } from "react";
import Link from "next/link";
import Icon from "../ui/Icon";
import ManualIBForm from "./ManualIBForm";
import ExcelImporter from "./ExcelImporter";
export default function AddDataWorkspace({ record }) {
  const [tab,setTab] = useState("manual");
  return <main className="add-data-main"><div className="add-tabs-row"><div className="tabs" role="tablist" aria-label="Add IB data method"><button id="manual-tab" role="tab" aria-selected={tab === "manual"} aria-controls="manual-panel" className={tab === "manual" ? "active" : ""} onClick={() => setTab("manual")}>{record ? "Edit Record" : "Add Manually"}</button>{!record && <button id="import-tab" role="tab" aria-selected={tab === "import"} aria-controls="import-panel" className={tab === "import" ? "active" : ""} onClick={() => setTab("import")}>Import Excel</button>}</div><Link className="button back-to-records" href="/ib-records"><Icon name="back" size={15}/>Back to Records</Link></div>
    <div role="tabpanel" id="manual-panel" aria-labelledby="manual-tab" hidden={tab !== "manual"}><ManualIBForm record={record}/></div>
    {!record && <div role="tabpanel" id="import-panel" aria-labelledby="import-tab" hidden={tab !== "import"}><div className="import-title"><h1>Import Excel</h1></div><ExcelImporter/></div>}
  </main>;
}
