import * as XLSX from "xlsx";
import { excelColumns, numericFields } from "./records.js";
export function createWorkbook(records) {
  const sheet = XLSX.utils.aoa_to_sheet([excelColumns.map(([,label]) => label), ...records.map(record => excelColumns.map(([key]) => record[key] ?? ""))]);
  sheet["!cols"] = excelColumns.map(([key]) => ({ wch: key.endsWith("Url") ? 38 : 24 }));
  sheet["!autofilter"] = { ref: sheet["!ref"] };
  for (let row = 1; row <= records.length; row++) for (const key of numericFields) {
    const cell = sheet[XLSX.utils.encode_cell({ r: row, c: excelColumns.findIndex(([k]) => key === k) })];
    if (cell) cell.z = key === "spreads" ? "0.00" : '"$"#,##0.00';
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "IB Records");
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}
export function parseWorkbook(buffer) {
  const book = XLSX.read(buffer, { type: "buffer", cellDates: true, cellFormula: true, sheetRows: 10002 });
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet) throw new Error("The workbook does not contain a worksheet.");
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: true });
  if (rows.length > 10001) throw new Error("Use a workbook with at most 10,000 rows.");
  const headers = (rows.shift() ?? []).map(value => String(value).trim());
  const missing = excelColumns.filter(([,label]) => !headers.includes(label)).map(([,label]) => label);
  if (missing.length) throw new Error("Missing template columns: " + missing.join(", "));
  if (new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length) throw new Error("The workbook has duplicate column headings.");
  return rows.flatMap((row, index) => {
    if (row.every(value => value === "")) return [];
    const record = Object.fromEntries(excelColumns.map(([key, label]) => {
      const column = headers.indexOf(label);
      let value = row[column] ?? "";
      const cell = sheet[XLSX.utils.encode_cell({ r: index + 1, c: column })];
      if (cell?.f) throw new Error(`Row ${index + 2}: formulas are not supported. Paste values instead.`);
      if (key === "payoutDate") {
        if (value instanceof Date && !Number.isNaN(value.getTime())) value = value.toISOString().slice(0,10);
        else if (typeof value === "number") {
          const date = XLSX.SSF.parse_date_code(value);
          value = date ? `${date.y}-${String(date.m).padStart(2,"0")}-${String(date.d).padStart(2,"0")}` : "";
        }
      }
      return [key, value];
    }));
    return [{ ...record, _row: index + 2 }];
  });
}
