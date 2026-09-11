import Header from "@/components/Header";
import RecordsWorkspace from "@/components/table/RecordsWorkspace";
import { getRecords, isDemo } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function RecordsPage() {
  if (!await getSession()) redirect("/login");
  const records = await getRecords();
  return <div className="app-shell records-shell"><Header demo={isDemo()}/><RecordsWorkspace initialRecords={records}/></div>;
}
