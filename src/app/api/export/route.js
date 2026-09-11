import { requireApiSession, apiError } from "@/lib/auth";
import { getRecords } from "@/lib/storage";
import { filterAndSort } from "@/lib/records";
import { createWorkbook } from "@/lib/excel";
export async function GET(request) {
  try {
    await requireApiSession();
    const params = new URL(request.url).searchParams;
    const mode = params.get("mode");
    let records = mode === "template" ? [] : await getRecords();
    if (mode === "filtered") {
      let filters, sort;
      try { filters = JSON.parse(params.get("filters") || "{}"); sort = JSON.parse(params.get("sort") || "{}"); }
      catch { return Response.json({ error: "Invalid export filters." }, { status: 400 }); }
      records = filterAndSort(records, filters, params.get("search") || "", sort);
    }
    const name = mode === "template" ? "bytefx-ib-template.xlsx" : `bytefx-ib-records-${mode === "filtered" ? "filtered-" : ""}${new Date().toISOString().slice(0,10)}.xlsx`;
    return new Response(createWorkbook(records), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
