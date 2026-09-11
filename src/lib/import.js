import { randomUUID } from "node:crypto";
import { previewRecords, recordKey } from "./records.js";
export function commitImport(inputs,records,duplicateMode) {
  const preview=previewRecords(inputs,records);
  const indices=new Map(records.map((record,index)=>[recordKey(record),index]));
  const addedRecords=[];
  let added=0,updated=0,skipped=0;
  for(const row of preview) {
    if(!row.valid||row.repeated){skipped++;continue;}
    const index=indices.get(recordKey(row.record));
    const now=new Date().toISOString();
    if(index!==undefined) {
      if(duplicateMode==="skip"){skipped++;continue;}
      records[index]={...row.record,id:records[index].id,createdAt:records[index].createdAt,updatedAt:now}; updated++;
    } else {
      addedRecords.push({...row.record,id:randomUUID(),createdAt:now,updatedAt:now}); added++;
    }
  }
  records.unshift(...addedRecords);
  return {added,updated,skipped};
}
