import { randomUUID } from "node:crypto";
import { requireApiSession, checkOrigin, apiError } from "@/lib/auth";
import { getRecords, mutateRecords } from "@/lib/storage";
import { previewRecords, recordKey } from "@/lib/records";
import { parseWorkbook } from "@/lib/excel";
export async function POST(request) {
  try {
    await requireApiSession(); checkOrigin(request);
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!file || typeof file.arrayBuffer !== "function" || !/\.xlsx?$/i.test(file.name)) return Response.json({ error: "Choose an .xlsx or .xls file." }, { status: 400 });
      if (file.size > 5 * 1024 * 1024) return Response.json({ error: "The file must be smaller than 5 MB." }, { status: 400 });
      let inputs;
      try { inputs = parseWorkbook(Buffer.from(await file.arrayBuffer())); } catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
      if (!inputs.length) return Response.json({ error: "The workbook has no records. Complete the template and upload it again." }, { status: 400 });
      return Response.json({ preview: previewRecords(inputs, await getRecords()), inputs });
    }
    const { inputs, duplicateMode } = await request.json();
    if (!Array.isArray(inputs) || inputs.length > 10000 || !inputs.length || !["skip", "update"].includes(duplicateMode) || inputs.some(r => !r || typeof r !== "object" || Array.isArray(r))) return Response.json({ error: "Invalid import request." }, { status: 400 });
    const result = await mutateRecords(records => {
      const preview = previewRecords(inputs, records);
      let added = 0, updated = 0, skipped = 0;
      for (const row of preview) {
        if (!row.valid || row.repeated) { skipped++; continue; }
        const index = records.findIndex(r => recordKey(r) === recordKey(row.record));
        const now = new Date().toISOString();
        if (index >= 0) {
          if (duplicateMode === "skip") { skipped++; continue; }
          records[index] = { ...row.record, id: records[index].id, createdAt: records[index].createdAt, updatedAt: now }; updated++;
        } else { records.unshift({ ...row.record, id: randomUUID(), createdAt: now, updatedAt: now }); added++; }
      }
      return { added, updated, skipped };
    });
    return Response.json(result);
  } catch (error) { return apiError(error); }
}
