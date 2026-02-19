import { Suspense } from "react";

import { LoginCard } from "@/components/auth/LoginCard";
import { LoginPadelBall } from "@/components/padel/LoginPadelBall";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md text-center text-sm text-muted-foreground">Laddar...</div>}>
      <div className="relative mx-auto flex w-full max-w-[480px] flex-col items-center min-[1200px]:max-w-[740px] min-[1200px]:items-start min-[1200px]:pr-[220px]">
        <LoginCard />
        <div className="mt-10 h-[92px] w-[92px] min-[640px]:h-[118px] min-[640px]:w-[118px] min-[1200px]:absolute min-[1200px]:right-0 min-[1200px]:top-1/2 min-[1200px]:mt-0 min-[1200px]:h-[172px] min-[1200px]:w-[172px] min-[1200px]:-translate-y-1/2">
          <LoginPadelBall className="h-full w-full" />
        </div>
      </div>
    </Suspense>
  );
}
