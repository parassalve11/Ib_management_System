import { requireApiSession, checkOrigin, apiError } from "@/lib/auth";
import { getRecords, mutateRecords } from "@/lib/storage";
import { previewRecords } from "@/lib/records";
import { parseWorkbookDetailed, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS } from "@/lib/excel";
import { commitImport } from "@/lib/import";
export async function POST(request) {
  try {
    await requireApiSession(); checkOrigin(request);
    if(request.headers.get("content-type")?.includes("multipart/form-data")) {
      let form;
      try { form=await request.formData(); } catch { return Response.json({error:"The upload was interrupted. Please choose your file again."},{status:400}); }
      const file=form.get("file");
      if(!file||typeof file.arrayBuffer!=="function"||!/^.+\.xlsx?$/i.test(file.name))return Response.json({error:"Choose an .xlsx or .xls file."},{status:400});
      if(file.size>MAX_IMPORT_BYTES)return Response.json({error:"The file must be smaller than 5 MB."},{status:400});
      let result;
      try { result=parseWorkbookDetailed(Buffer.from(await file.arrayBuffer())); }
      catch(error){return Response.json({error:error.message},{status:400});}
      if(!result.inputs.length)return Response.json({error:"The workbook has no records. Complete the template and upload it again."},{status:400});
      return Response.json({...result,preview:previewRecords(result.inputs,await getRecords())});
    }
    let body;
    try { body=await request.json(); } catch { return Response.json({error:"Invalid import request."},{status:400}); }
    const {inputs,duplicateMode}=body??{};
    if(!Array.isArray(inputs)||inputs.length>MAX_IMPORT_ROWS||!inputs.length||!["skip","update"].includes(duplicateMode)||inputs.some(r=>!r||typeof r!=="object"||Array.isArray(r)))return Response.json({error:"Invalid import request."},{status:400});
    const result=await mutateRecords(records=>commitImport(inputs,records,duplicateMode));
    return Response.json(result);
  } catch(error){return apiError(error);}
}
