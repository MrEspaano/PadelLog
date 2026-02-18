import { redirect } from "next/navigation";

import { AppLayoutShell } from "@/components/layout/AppLayoutShell";
import { auth } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <AppLayoutShell userEmail={session.user.email ?? undefined}>{children}</AppLayoutShell>;
}
