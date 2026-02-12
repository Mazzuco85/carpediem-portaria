import { redirect } from "next/navigation";
import { isAuthenticatedServer } from "@/lib/auth";

export default async function Home() {
  const authenticated = await isAuthenticatedServer();

  if (authenticated) {
    redirect("/dashboard");
  }

  redirect("/login");
}
