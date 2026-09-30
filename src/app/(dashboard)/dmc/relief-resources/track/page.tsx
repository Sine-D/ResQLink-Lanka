"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TrackRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dmc/relief-resources/track/DISP-2026-0042");
  }, [router]);

  return (
    <div className="p-12 text-center text-xs text-slate-400">
      Loading dispatch tracking...
    </div>
  );
}
