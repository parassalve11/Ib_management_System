import { randomUUID } from "node:crypto";
import { requireApiSession, checkOrigin, apiError } from "@/lib/auth";
import { getRecords, mutateRecords } from "@/lib/storage";
import { validateRecord, recordKey } from "@/lib/records";
export async function GET() {
  try { await requireApiSession(); return Response.json({ records: await getRecords() }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return apiError(error); }
}
export async function POST(request) {
  try {
    await requireApiSession(); checkOrigin(request);
    const result = validateRecord(await request.json());
    if (!result.valid) return Response.json({ error: "Please check the highlighted fields.", errors: result.errors }, { status: 400 });
    const record = await mutateRecords(records => {
      if (records.some(r => recordKey(r) === recordKey(result.record))) throw Object.assign(new Error("A record already exists for this country, client, channel and payout date."), { status: 409 });
      const now = new Date().toISOString();
      const record = { ...result.record, id: randomUUID(), createdAt: now, updatedAt: now };
      records.unshift(record);
      return record;
    });
    return Response.json({ record }, { status: 201 });
  } catch (error) { return apiError(error); }
}
