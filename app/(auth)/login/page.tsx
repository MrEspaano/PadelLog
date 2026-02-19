import { Suspense } from "react";

import { LoginCard } from "@/components/auth/LoginCard";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md text-center text-sm text-muted-foreground">Laddar...</div>}>
      <LoginCard />
    </Suspense>
  );
}
