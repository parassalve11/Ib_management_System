import { countryFor } from "./countries.js";

export const socialPlatforms = [
  { key: "youtubeUrl", label: "YouTube", placeholder: "https://youtube.com/...", hosts: ["youtube.com", "youtu.be"] },
  { key: "telegramUrl", label: "Telegram", placeholder: "https://t.me/...", hosts: ["t.me", "telegram.me"] },
  { key: "instagramUrl", label: "Instagram", placeholder: "https://instagram.com/...", hosts: ["instagram.com"] },
  { key: "tiktokUrl", label: "TikTok", placeholder: "https://tiktok.com/...", hosts: ["tiktok.com"] },
  { key: "snapchatUrl", label: "Snapchat", placeholder: "https://snapchat.com/...", hosts: ["snapchat.com"] },
];
export const numericFields = ["ibCommissionPerLot", "spreads", "upfrontPaid", "totalSalary"];
export const columns = [
  ["countryCode", "Country"], ["clientName", "Client Name"], ["channelName", "Channel Name"], ["psmName", "PSM Name"],
  ["ibCommissionPerLot", "IB Commission / Lot"], ["spreads", "Spreads"], ["upfrontPaid", "Upfront Paid"], ["totalSalary", "Total Salary"], ["payoutDate", "Payout Date"],
];
export const excelColumns = [
  ["countryCode", "Country"], ["clientName", "Client Name"], ["channelName", "Channel Name"], ["psmName", "PSM Name"],
  ["ibCommissionPerLot", "IB Commission Per Lot"], ["spreads", "Spreads"], ["upfrontPaid", "Upfront Paid"], ["totalSalary", "Total Salary"], ["payoutDate", "Payout Date"],
  ...socialPlatforms.map(p => [p.key, `${p.label} Link`]),
];
export const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
export const dateLabel = value => new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).replace("Sept", "Sep");
export const recordKey = record => [record.countryCode, record.clientName, record.channelName, record.payoutDate].map(v => String(v ?? "").trim().toLowerCase()).join("|");
export const emptyRecord = () => Object.fromEntries(excelColumns.map(([key]) => [key, ""]));

export function validateRecord(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) input = {};
  const record = emptyRecord();
  const errors = {};
  const country = countryFor(input.countryCode);
  if (!country) errors.countryCode = "Select a valid country.";
  record.countryCode = country?.code ?? String(input.countryCode ?? "");
  record.countryName = country?.name ?? "";
  for (const key of ["clientName", "channelName", "psmName"]) {
    record[key] = String(input[key] ?? "").trim();
    if (!record[key]) errors[key] = `${columns.find(([k]) => k === key)[1]} is required.`;
    else if (record[key].length > 120) errors[key] = "Use 120 characters or fewer.";
  }
  for (const key of numericFields) {
    const raw = String(input[key] ?? "").trim();
    const number = Number(raw);
    record[key] = number;
    if (!raw || !Number.isFinite(number) || number < 0 || number > 999999999.99) errors[key] = "Enter a number from 0 to 999,999,999.99.";
    else if (Math.abs(number * 100 - Math.round(number * 100)) > 0.00001) errors[key] = "Use at most two decimal places.";
  }
  record.payoutDate = String(input.payoutDate ?? "").trim();
  const date = new Date(`${record.payoutDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.payoutDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0,10) !== record.payoutDate) errors.payoutDate = "Enter a valid payout date.";
  for (const platform of socialPlatforms) {
    const raw = String(input[platform.key] ?? "").trim();
    record[platform.key] = raw;
    if (!raw) continue;
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      if (url.protocol !== "https:" || url.username || url.password || raw.length > 2048 || !platform.hosts.some(h => host === h || host.endsWith(`.${h}`))) throw new Error();
      record[platform.key] = url.href;
    } catch { errors[platform.key] = `Enter a valid HTTPS ${platform.label} URL.`; }
  }
  return { record, errors, valid: Object.keys(errors).length === 0 };
}

export function filterAndSort(records, filters = {}, search = "", sort = { key: "", direction: "asc" }) {
  const term = search.trim().toLowerCase();
  const filtered = records.filter(record => {
    if (term && ![record.clientName, record.channelName, record.psmName].some(v => v.toLowerCase().includes(term))) return false;
    for (const key of ["countryCode", "channelName", "psmName"]) if (filters[key]?.length && !filters[key].includes(record[key])) return false;
    if (filters.clientName && !record.clientName.toLowerCase().includes(filters.clientName.toLowerCase())) return false;
    for (const key of numericFields) {
      if (filters[`${key}Min`] !== undefined && filters[`${key}Min`] !== "" && record[key] < Number(filters[`${key}Min`])) return false;
      if (filters[`${key}Max`] !== undefined && filters[`${key}Max`] !== "" && record[key] > Number(filters[`${key}Max`])) return false;
    }
    if (filters.dateFrom && record.payoutDate < filters.dateFrom) return false;
    if (filters.dateTo && record.payoutDate > filters.dateTo) return false;
    return !filters.social?.length || filters.social.every(key => Boolean(record[key]));
  });
  if (columns.some(([key]) => key === sort.key)) filtered.sort((a,b) => {
    const av = sort.key === "countryCode" ? countryFor(a.countryCode)?.label : a[sort.key];
    const bv = sort.key === "countryCode" ? countryFor(b.countryCode)?.label : b[sort.key];
    return (typeof av === "number" ? av - bv : String(av).localeCompare(String(bv))) * (sort.direction === "desc" ? -1 : 1);
  });
  return filtered;
}

export function previewRecords(inputs, existing) {
  const keys = new Set(existing.map(recordKey));
  const workbookKeys = new Set();
  return inputs.map((input, i) => {
    const result = validateRecord(input);
    const key = recordKey(result.record);
    const repeated = result.valid && workbookKeys.has(key);
    if (result.valid) workbookKeys.add(key);
    return { ...result, row: input._row ?? i + 2, duplicate: result.valid && keys.has(key), repeated, status: !result.valid ? "Invalid" : repeated ? "Needs attention" : keys.has(key) ? "Possible duplicate" : "Valid" };
  });
}
