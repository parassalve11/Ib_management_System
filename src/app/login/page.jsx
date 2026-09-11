import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isDemo } from "@/lib/storage";
import LoginForm from "@/components/auth/LoginForm";
export default async function LoginPage() {
  if (await getSession()) redirect("/ib-records");
  return <LoginForm demo={isDemo()}/>;
}
