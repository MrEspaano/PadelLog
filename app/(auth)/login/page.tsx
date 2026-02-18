import { Suspense } from "react";

import { LoginForm } from "@/components/core/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md text-center text-sm text-muted-foreground">Laddar...</div>}>
      <LoginForm />
    </Suspense>
  );
}
