// Regenerates the two smaller test workbooks in public/samples:
//   bytefx-ib-sample-50.xlsx          – 50 clean rows for a quick import run
//   bytefx-ib-validation-test.xlsx    – mixed rows that exercise every validation path
// The 5,000-row workbook is produced by generate-sample-workbook.mjs.
import { mkdir, writeFile } from "node:fs/promises";
import * as XLSX from "xlsx";
import { createWorkbook } from "../src/lib/excel.js";
import { excelColumns, numericFields, validateRecord } from "../src/lib/records.js";

const samples = new URL("../public/samples/", import.meta.url);
await mkdir(samples, { recursive: true });

/* ---------- 50 clean rows ---------- */
const countries = ["India", "UAE", "UK", "US", "SG", "AU", "DE", "FR", "BR", "ZA", "MY", "ID", "TH", "VN", "SA", "Canada", "JP", "PH", "NZ", "KE"];
const firstNames = ["Ahmed", "Rohan", "Daniel", "Lucas", "Max", "Carlos", "Amir", "Budi", "Nattawat", "Liam", "Nguyen", "Jason", "Fahad", "Priya", "Elena", "Omar", "Wei", "Sofia", "Ivan", "Grace"];
const lastNames = ["Khan", "Verma", "Clark", "Martin", "Schmidt", "Silva", "Razak", "Santoso", "Chai", "Naidoo", "Minh", "Lim", "Al-Saud", "Sharma", "Petrova", "Haddad", "Chen", "Rossi", "Novak", "Mwangi"];
const channels = ["FX Academy", "Trade Labs", "The Forex Room", "Smart Trades", "Alpha Signals", "Mercado FX", "FX Warriors", "Signal Pro", "TH FX", "Zulu Trades", "Viet FX", "Lion Trades", "Gulf Traders", "Pip Masters", "Chart Kings", "Swing Desk", "Momentum FX", "Delta Traders", "Blue Candle", "Range Rovers FX"];
const psms = ["Rahul Mehta", "Sneha Patel", "Karan Singh", "Amit Sharma", "Neha Kapoor", "Vikram Rao"];

const quick = Array.from({ length: 50 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  const handle = `${channels[i % channels.length].toLowerCase().replace(/[^a-z]+/g, "")}${n}`;
  return {
    countryCode: countries[i % countries.length],
    clientName: `${firstNames[i % firstNames.length]} ${lastNames[(i * 7) % lastNames.length]} ${n}`,
    channelName: `${channels[i % channels.length]} ${n}`,
    psmName: psms[i % psms.length],
    ibCommissionPerLot: Number((3 + (i % 13) + (i % 4) * 0.25).toFixed(2)),
    spreads: Number((0.8 + (i % 9) / 10).toFixed(1)),
    upfrontPaid: 500 + (i % 12) * 250,
    totalSalary: 1500 + (i % 20) * 300,
    payoutDate: new Date(Date.UTC(2026, i % 9, (i % 27) + 1)).toISOString().slice(0, 10),
    youtubeUrl: i % 2 === 0 ? `https://youtube.com/@${handle}` : "",
    telegramUrl: i % 3 !== 2 ? `https://t.me/${handle}` : "",
    instagramUrl: i % 4 === 0 ? `https://instagram.com/${handle}` : "",
    tiktokUrl: i % 5 === 0 ? `https://tiktok.com/@${handle}` : "",
    snapchatUrl: i % 6 === 0 ? `https://snapchat.com/add/${handle}` : "",
  };
});
if (!quick.every(record => validateRecord(record).valid)) throw new Error("Quick sample validation failed.");
await writeFile(new URL("bytefx-ib-sample-50.xlsx", samples), createWorkbook(quick));

/* ---------- validation test workbook ---------- */
const base = (over = {}) => ({
  countryCode: "IN", clientName: "Valid Client", channelName: "Valid Channel", psmName: "Rahul Mehta",
  ibCommissionPerLot: 12, spreads: 1.4, upfrontPaid: 1800, totalSalary: 5200, payoutDate: "2026-04-15",
  youtubeUrl: "", telegramUrl: "", instagramUrl: "", tiktokUrl: "", snapchatUrl: "", ...over,
});
const rows = [
  base({ clientName: "Clean Row One", channelName: "Alpha Signals", youtubeUrl: "https://youtube.com/@alphasignals" }),
  base({ countryCode: "United Kingdom", clientName: "Country By Full Name", channelName: "The Forex Room" }),
  base({ countryCode: "uae", clientName: "Country By Alias", channelName: "Gulf Traders", telegramUrl: "https://t.me/gulftraders" }),
  base({ clientName: "Currency Formatted Amounts", channelName: "Money Text", ibCommissionPerLot: "$14.50", upfrontPaid: "2,500.00", totalSalary: "$6,000.00" }),
  base({ clientName: "Serial Date Row", channelName: "Date Serial" }),
  base({ clientName: "", channelName: "Missing Client Name" }),
  base({ countryCode: "Wakanda", clientName: "Bad Country", channelName: "Unknown Land" }),
  base({ clientName: "Negative Amount", channelName: "Below Zero", ibCommissionPerLot: -5 }),
  base({ clientName: "Too Many Decimals", channelName: "Three Places", totalSalary: 1234.567 }),
  base({ clientName: "Impossible Date", channelName: "Feb 31", payoutDate: "2026-02-31" }),
  base({ clientName: "Insecure Link", channelName: "Http Only", youtubeUrl: "http://youtube.com/@insecure" }),
  base({ clientName: "Wrong Host Link", channelName: "Not Telegram", telegramUrl: "https://facebook.com/notreal" }),
  base({ clientName: "Formula Cell", channelName: "Sum Formula" }),
  base({ clientName: "Error Cell", channelName: "Ref Error" }),
  base({ clientName: "Repeated Row", channelName: "Duplicate Inside File", payoutDate: "2026-05-20" }),
  base({ clientName: "Repeated Row", channelName: "Duplicate Inside File", payoutDate: "2026-05-20" }),
  null,
  base({ clientName: "Row After Blank", channelName: "Still Imported" }),
];
const aoa = [[...excelColumns.map(([, label]) => label), "Internal Note"]];
for (const row of rows) aoa.push(row ? [...excelColumns.map(([key]) => row[key] ?? ""), "ignored extra column"] : []);

const sheet = XLSX.utils.aoa_to_sheet(aoa);
const colOf = key => excelColumns.findIndex(([k]) => k === key);
const rowOf = clientName => rows.findIndex(row => row?.clientName === clientName) + 1;
sheet[XLSX.utils.encode_cell({ r: rowOf("Serial Date Row"), c: colOf("payoutDate") })] = { t: "n", v: 46183, z: "yyyy-mm-dd" };
sheet[XLSX.utils.encode_cell({ r: rowOf("Formula Cell"), c: colOf("totalSalary") })] = { t: "n", v: 5200, f: "1200+4000" };
sheet[XLSX.utils.encode_cell({ r: rowOf("Error Cell"), c: colOf("upfrontPaid") })] = { t: "e", v: 0x17 };
sheet["!cols"] = [...excelColumns.map(([key]) => ({ wch: key.endsWith("Url") ? 36 : 24 })), { wch: 22 }];
for (let r = 1; r < aoa.length; r++) for (const key of numericFields) {
  const cell = sheet[XLSX.utils.encode_cell({ r, c: colOf(key) })];
  if (cell && cell.t === "n" && !cell.z) cell.z = key === "spreads" ? "0.00" : '"$"#,##0.00';
}
const book = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(book, sheet, "IB Records");
XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["This second sheet is ignored on import."]]), "Notes");
await writeFile(new URL("bytefx-ib-validation-test.xlsx", samples), XLSX.write(book, { bookType: "xlsx", type: "buffer" }));

console.log("Wrote bytefx-ib-sample-50.xlsx and bytefx-ib-validation-test.xlsx to public/samples.");
