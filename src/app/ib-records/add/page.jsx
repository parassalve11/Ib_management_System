import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import AddDataWorkspace from "@/components/forms/AddDataWorkspace";
import { getRecords, isDemo } from "@/lib/storage";
import { getSession } from "@/lib/auth";
export default async function AddPage({ searchParams }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { edit } = await searchParams;
  const record = edit ? (await getRecords()).find(r => r.id === edit) : null;
  if (edit && !record) notFound();
  return <div className="app-shell add-shell"><Header email={session.email} demo={isDemo()} title={record ? "Edit IB Data" : "Add IB Data"} subtitle={record ? "Update IB record details" : "Add IB records manually or import from Excel"}/><AddDataWorkspace record={record}/></div>;
}
