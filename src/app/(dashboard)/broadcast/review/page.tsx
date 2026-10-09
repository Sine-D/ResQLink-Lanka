"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function BroadcastReviewRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || searchParams.get("warningId");

  useEffect(() => {
    if (id) {
      router.replace(`/broadcast/review/${id}`);
    } else {
      router.replace("/broadcast/create");
    }
  }, [id, router]);

  return (
    <div className="py-20 text-center text-slate-400 text-sm">
      Loading review page...
    </div>
  );
}

export default function BroadcastReviewIndexPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400 text-sm">Loading...</div>}>
      <BroadcastReviewRedirect />
    </Suspense>
  );
}
