import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { seedRecords } from "./seed.js";
import { recordKey } from "./records.js";

export const isDemo = () => process.env.DEMO_MODE === "true";
const dataDir = path.join(process.cwd(), ".data", process.env.BYTEFX_DATA_NAMESPACE || "demo");
const dataFile = path.join(dataDir, "records.json");

async function demoRead() {
  await mkdir(dataDir, { recursive: true });
  try { return JSON.parse(await readFile(dataFile, "utf8")); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    const records = seedRecords();
    await writeFile(dataFile, JSON.stringify(records, null, 2), { flag: "wx" }).catch(error => { if (error.code !== "EEXIST") throw error; });
    return JSON.parse(await readFile(dataFile, "utf8"));
  }
}
async function pool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  if (!globalThis.bytefxPool) {
    const mysql = await import("mysql2/promise");
    globalThis.bytefxPool = mysql.createPool(process.env.DATABASE_URL);
  }
  return globalThis.bytefxPool;
}
export async function getRecords() {
  if (isDemo()) return demoRead();
  const [rows] = await (await pool()).query("SELECT payload FROM ib_records ORDER BY created_at, id");
  return rows.map(row => typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload);
}
async function mutate(fn) {
  if (isDemo()) {
    const records = await demoRead();
    const result = await fn(records);
    const temp = path.join(dataDir, `records-${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify(records, null, 2));
    await rename(temp, dataFile);
    return result;
  }
  const connection = await (await pool()).getConnection();
  try {
    const [[lock]] = await connection.query("SELECT GET_LOCK('bytefx_ib_records', 15) AS acquired");
    if (!lock.acquired) throw new Error("Records are busy. Try again.");
    await connection.beginTransaction();
    const [rows] = await connection.query("SELECT payload FROM ib_records ORDER BY created_at, id FOR UPDATE");
    const records = rows.map(row => typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload);
    const previous = new Map(records.map(r => [r.id, JSON.stringify(r)]));
    const result = await fn(records);
    for (const record of records) {
      const json = JSON.stringify(record);
      if (previous.get(record.id) === json) continue;
      const key = createHash("sha256").update(recordKey(record)).digest("hex");
      await connection.execute("INSERT INTO ib_records (id, record_key, payload) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE record_key = VALUES(record_key), payload = VALUES(payload)", [record.id, key, json]);
    }
    await connection.commit();
    return result;
  } catch (error) { await connection.rollback(); throw error; }
  finally { await connection.query("SELECT RELEASE_LOCK('bytefx_ib_records')"); connection.release(); }
}
export function mutateRecords(fn) {
  const pending = (globalThis.bytefxWriteQueue ?? Promise.resolve()).then(() => mutate(fn));
  globalThis.bytefxWriteQueue = pending.catch(() => {});
  return pending;
}
