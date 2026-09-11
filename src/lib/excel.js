import * as XLSX from "xlsx";
import { excelColumns, numericFields } from "./records.js";
export const MAX_IMPORT_ROWS = 10000;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const headerKey = value => String(value ?? "").replace(/^\uFEFF/,"").trim().toLowerCase().replace(/[\s_/-]+/g,"");
const headerAliases = new Map(excelColumns.flatMap(([key,label]) => [[headerKey(label),key],[headerKey(key),key], ...(key.endsWith("Url") ? [[headerKey(label.replace(" Link"," URL")),key]] : [])]));
headerAliases.set(headerKey("IB Commission / Lot"),"ibCommissionPerLot");

export function createWorkbook(records) {
  const sheet=XLSX.utils.aoa_to_sheet([excelColumns.map(([,label])=>label),...records.map(record=>excelColumns.map(([key])=>record[key]??""))]);
  sheet["!cols"]=excelColumns.map(([key])=>({wch:key.endsWith("Url")?38:24}));
  sheet["!autofilter"]={ref:sheet["!ref"]};
  for(let row=1;row<=records.length;row++)for(const key of numericFields) {
    const cell=sheet[XLSX.utils.encode_cell({r:row,c:excelColumns.findIndex(([k])=>key===k)})];
    if(cell)cell.z=key==="spreads"?"0.00":'"$"#,##0.00';
  }
  const workbook=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook,sheet,"IB Records");
  return XLSX.write(workbook,{bookType:"xlsx",type:"buffer"});
}
function normalizeAmount(value) {
  if(typeof value!=="string")return value;
  const text=value.trim().replace(/^(?:USD\s*|\$\s*)/i,"");
  if(/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(text))return text.replaceAll(",","");
  return value.trim();
}
function normalizeDate(value,date1904) {
  if(typeof value==="number") {
    const date=XLSX.SSF.parse_date_code(value,{date1904});
    return date?`${date.y}-${String(date.m).padStart(2,"0")}-${String(date.d).padStart(2,"0")}`:"";
  }
  if(value instanceof Date&&!Number.isNaN(value.getTime()))return value.toISOString().slice(0,10);
  return String(value??"").trim();
}
export function parseWorkbookDetailed(buffer) {
  if(!buffer?.length)throw new Error("This file is empty. Upload a completed Excel workbook.");
  // Extension alone is insufficient: do not silently accept renamed CSV or HTML.
  const isZip=buffer[0]===0x50&&buffer[1]===0x4b;
  const isOle=buffer[0]===0xd0&&buffer[1]===0xcf;
  const isBiff=[0x09].includes(buffer[0])&&[0,2,4,8].includes(buffer[1]);
  if(!isZip&&!isOle&&!isBiff)throw new Error("This is not a valid Excel workbook. Save it as .xlsx or .xls and try again.");
  let book;
  try { book=XLSX.read(buffer,{type:"buffer",cellDates:false,cellFormula:true,cellHTML:false,sheetRows:MAX_IMPORT_ROWS+2}); }
  catch { throw new Error("This workbook could not be read. Check that it is not damaged or password protected."); }
  const sheetName=book.SheetNames[0];
  const sheet=book.Sheets[sheetName];
  if(!sheet||!sheet["!ref"])throw new Error("The workbook does not contain a populated worksheet.");
  const range=XLSX.utils.decode_range(sheet["!fullref"]||sheet["!ref"]);
  if(range.e.r>MAX_IMPORT_ROWS)throw new Error("Use a workbook with at most 10,000 rows.");
  if(range.e.c>=128)throw new Error("This worksheet has too many columns. Use the downloaded template.");
  const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:"",blankrows:true,range:0});
  const headers=(rows.shift()??[]).map(value=>String(value).trim());
  const mapped=headers.map(value=>headerAliases.get(headerKey(value)));
  const recognized=mapped.filter(Boolean);
  if(new Set(recognized).size!==recognized.length)throw new Error("The workbook has duplicate column headings. Keep one column for each field.");
  const missing=excelColumns.filter(([key])=>!key.endsWith("Url")&&!mapped.includes(key)).map(([,label])=>label);
  if(missing.length)throw new Error("Missing template columns: "+missing.join(", "));
  const date1904=Boolean(book.Workbook?.WBProps?.date1904);
  const inputs=rows.flatMap((row,index)=>{
    if(row.every(value=>String(value??"").trim()==="")) {
      const hasFormula=mapped.some((key,column)=>key&&sheet[XLSX.utils.encode_cell({r:index+1,c:column})]?.f);
      if(!hasFormula)return [];
    }
    const errors={};
    const record=Object.fromEntries(excelColumns.map(([key])=>{
      const column=mapped.indexOf(key);
      const cell=column>=0?sheet[XLSX.utils.encode_cell({r:index+1,c:column})]:null;
      let value=column>=0?row[column]??"":"";
      if(cell?.f)errors[key]="Formulas are not supported. Paste the calculated value instead.";
      if(cell?.t==="e")errors[key]="This cell contains an Excel error. Replace it with a valid value.";
      if(numericFields.includes(key))value=normalizeAmount(value);
      if(key==="payoutDate")value=normalizeDate(value,date1904);
      if(key.endsWith("Url")&&cell?.l?.Target)value=cell.l.Target;
      return [key,typeof value==="string"?value.trim():value];
    }));
    return [{...record,_row:index+2,...(Object.keys(errors).length?{_excelErrors:errors}:{})}];
  });
  const warnings=[];
  if(book.SheetNames.length>1)warnings.push(`Only the first worksheet, "${sheetName}", is included. ${book.SheetNames.length-1} other worksheet(s) were ignored.`);
  const missingSocial=excelColumns.filter(([key])=>key.endsWith("Url")&&!mapped.includes(key));
  if(missingSocial.length)warnings.push("Missing optional social-link columns are treated as empty.");
  const extra=headers.filter((name,index)=>name&&!mapped[index]);
  if(extra.length)warnings.push("Unused columns were ignored: "+extra.join(", ")+".");
  return {inputs,sheetName,warnings};
}
export function parseWorkbook(buffer) { return parseWorkbookDetailed(buffer).inputs; }
