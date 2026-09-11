"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "../ui/Icon";
import Flag from "../ui/Flag";
import Popover from "../ui/Popover";
import Modal from "../ui/Modal";
import FilterRail from "../filters/FilterRail";
import SocialLinksDialog from "../dialogs/SocialLinksDialog";
import { columns, numericFields, socialPlatforms, filterAndSort, money, dateLabel } from "@/lib/records";
import { countryFor } from "@/lib/countries";

export default function RecordsWorkspace({ initialRecords }) {
  const [draft,setDraft] = useState({});
  const [filters,setFilters] = useState({});
  const [search,setSearch] = useState("");
  const [sort,setSort] = useState({ key: "", direction: "asc" });
  const [page,setPage] = useState(1);
  const [pageSize,setPageSize] = useState(25);
  const [mobileFilters,setMobileFilters] = useState(false);
  const [socialRecord,setSocialRecord] = useState(null);
  const [detailRecord,setDetailRecord] = useState(null);
  const [exportError,setExportError] = useState("");
  const [exportBusy,setExportBusy] = useState(false);
  const router = useRouter();
  const results = useMemo(() => filterAndSort(initialRecords, filters, search, sort), [initialRecords, filters, search, sort]);
  const pages = Math.max(1, Math.ceil(results.length / pageSize));
  const currentPage = Math.min(page,pages);
  const start = (currentPage - 1) * pageSize;
  const visible = results.slice(start, start + pageSize);
  const clear = () => { setDraft({}); setFilters({}); setPage(1); };
  const removeFilter = (key,value) => {
    const next = { ...filters };
    if (Array.isArray(next[key])) { next[key] = next[key].filter(v => v !== value); if (!next[key].length) delete next[key]; }
    else delete next[key];
    setFilters(next); setDraft(next); setPage(1);
  };
  const chips = Object.entries(filters).flatMap(([key,value]) => {
    if (value === "" || value === undefined) return [];
    if (Array.isArray(value)) return value.map(v => ({ key, value: v, label: key === "countryCode" ? countryFor(v)?.label : key === "psmName" ? `PSM: ${v}` : key === "social" ? socialPlatforms.find(p => p.key === v)?.label : v }));
    const field = numericFields.find(k => key.startsWith(k));
    const label = field ? `${columns.find(([k]) => k === field)[1]} ${key.endsWith("Min") ? "≥" : "≤"} ${value}` : key === "dateFrom" ? `From: ${dateLabel(value)}` : key === "dateTo" ? `To: ${dateLabel(value)}` : `Client: ${value}`;
    return [{ key, value, label }];
  });
  async function exportRecords(mode) {
    setExportError(""); setExportBusy(true);
    try {
      const params = new URLSearchParams({ mode, filters: JSON.stringify(filters), search, sort: JSON.stringify(sort) });
      const response = await fetch(`/api/export?${params}`);
      if (!response.ok) throw new Error((await response.json()).error);
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a"); a.href = url; a.download = response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] || "bytefx-ib-records.xlsx"; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
    } catch (error) { setExportError(error.message || "Could not export records."); }
    finally { setExportBusy(false); }
  }
  const pageNumbers = [...new Set([1, ...Array.from({length: Math.min(5,pages)}, (_,i) => Math.max(1,Math.min(currentPage-2,pages-4))+i), pages])].filter(n => n >= 1 && n <= pages).sort((a,b) => a-b);
  return <>
    <section className="page-heading"><div><h1>IB Records</h1><p>Manage IB commissions, salaries and payout information</p></div><Link className="button primary add-button" href="/ib-records/add"><Icon name="plus" size={18}/>Add IB Data</Link></section>
    <div className="records-workspace">
      <FilterRail records={initialRecords} draft={draft} setDraft={setDraft} onApply={() => { setFilters({...draft}); setPage(1); }} onClear={clear} mobileOpen={mobileFilters} onClose={() => setMobileFilters(false)}/>
      <main className="records-main">
        <div className="records-toolbar"><button className="button mobile-filter-button" onClick={() => setMobileFilters(true)}><Icon name="filter"/>Filters</button><div className="search-input"><Icon name="search" size={17}/><input aria-label="Search records" placeholder="Search records (client, channel, PSM…)" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>{search && <button className="icon-button" aria-label="Clear search" onClick={() => setSearch("")}><Icon name="close" size={13}/></button>}</div>
          <Popover className="export-menu" trigger={(open,toggle) => <button className="button" onClick={toggle} aria-expanded={open} disabled={exportBusy}><Icon name="download"/>{exportBusy ? "Exporting…" : "Export"}<Icon name="chevron" size={13}/></button>}>{close => <><button onClick={() => { close(); exportRecords("filtered"); }}><span>Export current results<small>Includes active filters & sorting</small></span></button><button onClick={() => { close(); exportRecords("all"); }}><span>Export all records<small>Ignores current filters</small></span></button></>}</Popover>
        </div>
        <div className="applied-filters"><div className="filter-chips">{chips.map(chip => <button className="filter-chip" key={chip.key+chip.value} onClick={() => removeFilter(chip.key,chip.value)} aria-label={`Remove ${chip.label} filter`}>{chip.key === "countryCode" && <Flag code={chip.value} label={false}/>}<span>{chip.label}</span><Icon name="close" size={12}/></button>)}{chips.length > 0 && <button className="text-button clear-chips" onClick={clear}>Clear all</button>}</div><span className="record-count" aria-live="polite">{results.length.toLocaleString()} records</span></div>
        {exportError && <p className="form-error" role="alert">{exportError}</p>}
        <div className="table-scroll">
          <table className="records-table"><thead><tr>{columns.map(([key,label]) => <th key={key} aria-sort={sort.key === key ? sort.direction === "asc" ? "ascending" : "descending" : "none"}><button onClick={() => { setSort({ key, direction: sort.key === key && sort.direction === "asc" ? "desc" : "asc" }); setPage(1); }}>{label}<Icon name="sort" size={12} className={`sort-icon ${sort.key === key ? "active" : ""} ${sort.key === key && sort.direction === "desc" ? "descending" : ""}`}/></button></th>)}<th>Social Links</th><th className="actions-heading">Actions</th></tr></thead>
          <tbody>{visible.map(record => {
            const count = socialPlatforms.filter(p => record[p.key]).length;
            return <tr key={record.id}><td><Flag code={record.countryCode}/></td><td>{record.clientName}</td><td>{record.channelName}</td><td>{record.psmName}</td><td className="number">{money(record.ibCommissionPerLot)}</td><td className="number">{record.spreads.toFixed(1 + (record.spreads * 10 % 1 !== 0 ? 1 : 0))}</td><td className="number">{money(record.upfrontPaid)}</td><td className="number">{money(record.totalSalary)}</td><td className="date-cell">{dateLabel(record.payoutDate)}</td><td>{count ? <button className="text-button social-link-button" onClick={() => setSocialRecord(record)} aria-label={`View ${count} social links for ${record.channelName}`}>{count} {count === 1 ? "link" : "links"} <span>›</span></button> : <span className="muted">—</span>}</td><td className="actions-cell"><Popover className="row-menu" trigger={(open,toggle) => <button className="icon-button" onClick={toggle} aria-label={`Actions for ${record.clientName}`} aria-expanded={open}><Icon name="more" size={17}/></button>}>{close => <><button onClick={() => { close(); router.push(`/ib-records/add?edit=${record.id}`); }}>Edit record</button><button onClick={() => { close(); setDetailRecord(record); }}>View details</button></>}</Popover></td></tr>;
          })}</tbody></table>
          {!visible.length && <div className="empty-state"><h2>No records found</h2><p>Try another search or adjust your filters.</p><button className="button" onClick={() => { clear(); setSearch(""); }}>Clear search & filters</button></div>}
        </div>
        <footer className="pagination"><span>{results.length ? start + 1 : 0}–{Math.min(start + pageSize,results.length)} of {results.length.toLocaleString()} records</span><div className="pagination-controls"><button className="page-button" disabled={currentPage === 1} onClick={() => setPage(currentPage-1)} aria-label="Previous page"><Icon name="left" size={14}/></button>{pageNumbers.map((n,i) => <span className="page-number-wrap" key={n}>{i > 0 && n > pageNumbers[i-1] + 1 && <span className="page-gap">…</span>}<button className={`page-button ${currentPage === n ? "selected" : ""}`} onClick={() => setPage(n)} aria-label={`Page ${n}`} aria-current={currentPage === n ? "page" : undefined}>{n}</button></span>)}<button className="page-button" disabled={currentPage === pages} onClick={() => setPage(currentPage+1)} aria-label="Next page"><Icon name="right" size={14}/></button><select aria-label="Records per page" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>{[10,25,50,100].map(n => <option key={n} value={n}>{n} / page</option>)}</select></div></footer>
      </main>
    </div>
    {socialRecord && <SocialLinksDialog record={socialRecord} onClose={() => setSocialRecord(null)}/>}
    {detailRecord && <Modal title="IB Record Details" subtitle={detailRecord.channelName} onClose={() => setDetailRecord(null)}><div className="modal-body"><dl className="detail-list">{columns.map(([key,label]) => <div key={key}><dt>{label}</dt><dd>{key === "countryCode" ? <Flag code={detailRecord[key]}/> : key === "payoutDate" ? dateLabel(detailRecord[key]) : numericFields.includes(key) && key !== "spreads" ? money(detailRecord[key]) : detailRecord[key]}</dd></div>)}</dl><Link className="button primary" href={`/ib-records/add?edit=${detailRecord.id}`}>Edit record</Link></div></Modal>}
  </>;
}
