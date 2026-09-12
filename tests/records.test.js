import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { seedRecords } from "../src/lib/seed.js";
import { validateRecord, filterAndSort, previewRecords, excelColumns, recordKey } from "../src/lib/records.js";
import { createWorkbook, parseWorkbook, parseWorkbookDetailed } from "../src/lib/excel.js";
const records = seedRecords();
test("normalizes countries and accepts the reference data", () => {
  const result = validateRecord({ ...records[0], countryCode: "United Arab Emirates" });
  assert.equal(result.valid,true); assert.equal(result.record.countryCode,"AE");
  assert.equal(new Set(records.map(recordKey)).size,324);
});
test("rejects invalid financial values, impossible dates and misleading social hosts", () => {
  const {errors} = validateRecord({ ...records[0], ibCommissionPerLot: "", spreads: -1, totalSalary: 0.001, payoutDate: "2026-02-30", youtubeUrl: "https://youtube.com.evil.test/user", telegramUrl: "javascript:alert(1)" });
  for (const key of ["ibCommissionPerLot","spreads","totalSalary","payoutDate","youtubeUrl","telegramUrl"]) assert.ok(errors[key]);
  assert.equal(validateRecord({...records[0],totalSalary:0}).valid,true);
});
test("combines text, multi-select, ranges, dates and social filters", () => {
  const filters = { countryCode: ["AE","IN"], psmName: ["Rahul Mehta"], ibCommissionPerLotMin: "10", totalSalaryMax: "6000", dateFrom: "2026-09-01", dateTo: "2026-09-30", social: ["snapchatUrl"] };
  assert.equal(filterAndSort(records,filters,"academy").length,1);
  assert.equal(filterAndSort(records,{totalSalaryMax:"0"}).length,0);
  assert.equal(filterAndSort(records,{},"SNEHA").length,70);
});
test("sorts every matching record without mutating the original order", () => {
  const results = filterAndSort(records,{}, "", {key:"totalSalary",direction:"desc"});
  assert.equal(results.length,324);
  assert.equal(results[0].totalSalary,6800);
  assert.equal(records[0].clientName,"Ahmed Khan");
});
test("identifies existing records, repeated workbook rows and invalid rows independently", () => {
  const rows = previewRecords([records[0],{...records[0],clientName:" ahmed KHAN "},{...records[0],payoutDate:"bad"},{...records[0],clientName:"New client"}],records);
  assert.deepEqual(rows.map(r=>r.status),["Possible duplicate","Needs attention","Invalid","Valid"]);
});
test("Excel round trips all fields and supports legacy XLS files", () => {
  const buffer = createWorkbook(records.slice(0,2));
  const parsed = parseWorkbook(buffer);
  assert.equal(parsed[0].clientName,records[0].clientName);
  assert.equal(parsed[0].totalSalary,records[0].totalSalary);
  assert.equal(parsed[0].snapchatUrl,records[0].snapchatUrl);
  const book = XLSX.read(buffer,{type:"buffer"});
  const legacy = XLSX.write(book,{type:"buffer",bookType:"biff8"});
  assert.equal(parseWorkbook(legacy).length,2);
});
test("rejects formula cells and missing template columns", () => {
  const book = XLSX.read(createWorkbook([records[0]]),{type:"buffer"});
  book.Sheets["IB Records"].B2 = {t:"s",v:"Ahmed",f:'HYPERLINK("https://example.com","Ahmed")'};
  const inputs = parseWorkbook(XLSX.write(book,{type:"buffer",bookType:"xlsx"}));
  const preview = previewRecords(inputs,[]);
  assert.equal(preview[0].valid,false);
  assert.match(preview[0].errors.clientName,/Formulas are not supported/);
  book.Sheets["IB Records"].A1.v = "Wrong header";
  assert.throws(()=>parseWorkbook(XLSX.write(book,{type:"buffer",bookType:"xlsx"})),/Missing template columns/);
});
test("template has the complete agreed column order and no sample rows", () => {
  const book = XLSX.read(createWorkbook([]),{type:"buffer"});
  const rows = XLSX.utils.sheet_to_json(book.Sheets["IB Records"],{header:1});
  assert.deepEqual(rows,[excelColumns.map(([,label])=>label)]);
});

test("normalizes currency, serial dates and hyperlink cells, and reports ignored sheets", () => {
  const book=XLSX.read(createWorkbook([records[0]]),{type:"buffer"});
  const sheet=book.Sheets["IB Records"];
  sheet.E2={t:"s",v:"USD 1,234.50"};
  sheet.I2={t:"n",v:46266};
  sheet.J2={t:"s",v:"YouTube",l:{Target:"https://youtube.com/@sample"}};
  XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([["Notes"]]),"Notes");
  const result=parseWorkbookDetailed(XLSX.write(book,{type:"buffer",bookType:"xlsx"}));
  assert.equal(result.inputs[0].ibCommissionPerLot,"1234.50");
  assert.match(result.inputs[0].payoutDate,/^2026-/);
  assert.equal(result.inputs[0].youtubeUrl,"https://youtube.com/@sample");
  assert.equal(previewRecords(result.inputs,[])[0].valid,true);
  assert.match(result.warnings[0],/Only the first worksheet/);
});

test("rejects corrupt and renamed files and duplicate headings", () => {
  assert.throws(()=>parseWorkbook(Buffer.from("Client,Country\nTest,IN")),/not a valid Excel/);
  assert.throws(()=>parseWorkbook(Buffer.from([])),/empty/);
  assert.throws(()=>parseWorkbook(Buffer.from([0x50,0x4b,0,0])),/could not be read|populated worksheet/);
  const book=XLSX.read(createWorkbook([records[0]]),{type:"buffer"});
  book.Sheets["IB Records"].B1.v="Country";
  assert.throws(()=>parseWorkbook(XLSX.write(book,{type:"buffer",bookType:"xlsx"})),/duplicate column/);
});

test("commit skips formula rows and repeated rows, and updates matching records", async () => {
  const {commitImport}=await import("../src/lib/import.js");
  const existing=[{...records[0]}];
  const fresh={...records[1],clientName:"Import Test"};
  const formula={...records[2],_excelErrors:{totalSalary:"Formulas are not supported."}};
  assert.deepEqual(commitImport([fresh,fresh,formula,records[0]],existing,"skip"),{added:1,updated:0,skipped:3});
  assert.deepEqual(commitImport([{...fresh,totalSalary:1234}],existing,"update"),{added:0,updated:1,skipped:0});
  assert.equal(existing.find(r=>r.clientName==="Import Test").totalSalary,1234);
});

test("provided sample workbook contains 5,000 valid distinct importable records under the upload limit", async () => {
  const {readFile}=await import("node:fs/promises");
  const buffer=await readFile("public/samples/bytefx-ib-sample.xlsx");
  assert.ok(buffer.length < 5 * 1024 * 1024);
  const rows=previewRecords(parseWorkbook(buffer),records);
  assert.equal(rows.length,5000);
  assert.ok(rows.every(row=>row.valid && !row.duplicate && !row.repeated));
});
