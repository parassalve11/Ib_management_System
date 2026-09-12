import { requireApiSession, checkOrigin, apiError } from "@/lib/auth";
import { mutateRecords } from "@/lib/storage";
import { validateRecord, recordKey } from "@/lib/records";
export async function DELETE(request, { params }) {
  try {
    await requireApiSession(); checkOrigin(request);
    const { id } = await params;
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: "Enter the exact client name to confirm deletion." }, { status: 400 }); }
    await mutateRecords(records => {
      const index = records.findIndex(record => record.id === id);
      if (index < 0) throw Object.assign(new Error("Record not found."), { status: 404 });
      if (typeof body?.clientName !== "string" || body.clientName !== records[index].clientName) {
        throw Object.assign(new Error("Client name does not match. Enter the exact name, including capitalization."), { status: 400 });
      }
      records.splice(index, 1);
    });
    return Response.json({ deleted: true });
  } catch (error) { return apiError(error); }
}
export async function PUT(request, { params }) {
  try {
    await requireApiSession(); checkOrigin(request);
    const { id } = await params;
    const result = validateRecord(await request.json());
    if (!result.valid) return Response.json({ error: "Please check the highlighted fields.", errors: result.errors }, { status: 400 });
    const record = await mutateRecords(records => {
      const index = records.findIndex(r => r.id === id);
      if (index < 0) throw Object.assign(new Error("Record not found."), { status: 404 });
      if (records.some(r => r.id !== id && recordKey(r) === recordKey(result.record))) throw Object.assign(new Error("Another record already has this country, client, channel and payout date."), { status: 409 });
      records[index] = { ...result.record, id, createdAt: records[index].createdAt, updatedAt: new Date().toISOString() };
      return records[index];
    });
    return Response.json({ record });
  } catch (error) { return apiError(error); }
}
