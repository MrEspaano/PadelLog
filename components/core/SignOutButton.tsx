"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOut({ callbackUrl: "/login" });
    setLoading(false);
  }

  return (
    <Button variant="ghost" onClick={handleSignOut} disabled={loading} className="gap-2">
      <LogOut className="h-4 w-4" />
      {loading ? "Loggar ut..." : "Logga ut"}
    </Button>
  );
}
