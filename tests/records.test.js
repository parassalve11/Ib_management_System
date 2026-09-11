import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { seedRecords } from "../src/lib/seed.js";
import { validateRecord, filterAndSort, previewRecords, excelColumns, recordKey } from "../src/lib/records.js";
import { createWorkbook, parseWorkbook } from "../src/lib/excel.js";
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
  assert.throws(()=>parseWorkbook(XLSX.write(book,{type:"buffer",bookType:"xlsx"})),/formulas are not supported/);
  book.Sheets["IB Records"].A1.v = "Wrong header";
  assert.throws(()=>parseWorkbook(XLSX.write(book,{type:"buffer",bookType:"xlsx"})),/Missing template columns/);
});
test("template has the complete agreed column order and no sample rows", () => {
  const book = XLSX.read(createWorkbook([]),{type:"buffer"});
  const rows = XLSX.utils.sheet_to_json(book.Sheets["IB Records"],{header:1});
  assert.deepEqual(rows,[excelColumns.map(([,label])=>label)]);
});
