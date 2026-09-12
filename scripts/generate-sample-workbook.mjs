import { mkdir, writeFile } from "node:fs/promises";
import { createWorkbook, MAX_IMPORT_BYTES } from "../src/lib/excel.js";
import { validateRecord } from "../src/lib/records.js";

const countryCodes = ["IN","AE","GB","US","SG","AU","DE","FR","BR","ZA","MY","ID","TH","VN","SA","CA","JP","NZ","PH","KE"];
const records = Array.from({ length: 5000 }, (_, index) => {
  const number = String(index + 1).padStart(5, "0");
  return {
    countryCode: countryCodes[index % countryCodes.length],
    clientName: `Test IB Client ${number}`,
    channelName: `Test Trading Channel ${number}`,
    psmName: `Test Account Manager ${String(index % 12 + 1).padStart(2, "0")}`,
    ibCommissionPerLot: (index % 100 + 1) / 4,
    spreads: (index % 25 + 1) / 10,
    upfrontPaid: (index % 61) * 125,
    totalSalary: 500 + (index % 101) * 75,
    payoutDate: new Date(Date.UTC(2026, index % 12, index % 28 + 1)).toISOString().slice(0, 10),
    youtubeUrl: index % 2 === 0 ? `https://youtube.com/@bytefx_test_${number}` : "",
    telegramUrl: index % 3 === 0 ? `https://t.me/bytefx_test_${number}` : "",
    instagramUrl: index % 4 === 0 ? `https://instagram.com/bytefx_test_${number}` : "",
    tiktokUrl: index % 5 === 0 ? `https://tiktok.com/@bytefx_test_${number}` : "",
    snapchatUrl: index % 6 === 0 ? `https://snapchat.com/add/bytefx_test_${number}` : "",
  };
});
if (!records.every(record => validateRecord(record).valid)) throw new Error("Sample validation failed.");
const workbook = createWorkbook(records);
if (workbook.length > MAX_IMPORT_BYTES) throw new Error("Sample exceeds the upload limit.");
await mkdir(new URL("../public/samples/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/samples/bytefx-ib-sample.xlsx", import.meta.url), workbook);
console.log(`Created ${records.length.toLocaleString()} fictional records (${(workbook.length / 1024 / 1024).toFixed(2)} MB).`);
