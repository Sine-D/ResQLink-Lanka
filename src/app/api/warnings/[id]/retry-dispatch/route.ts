/**
 * @file route.ts
 * @route /api/warnings/[id]/retry-dispatch
 * @description REST API Controller for re-attempting failed/pending Warning Dispatches (UC1).
 *
 * @architecture Clean Architecture / Presentation Layer (Interface Adapter)
 * @solid
 * - Single Responsibility Principle (SRP): Handles retry invocation for DMC Officers.
 * - Dependency Inversion Principle (DIP): Calls warningService.retryWarningDispatch.
 */

import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import {
  retryWarningDispatch,
  WarningNotFoundError,
} from "@/lib/services/warningService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/warnings/[id]/retry-dispatch
 * Re-attempts notification dispatch for warnings with PENDING_DISPATCH or FAILED status.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "DMC_OFFICER") {
      return NextResponse.json(
        { error: "Forbidden: Only DMC Officers can retry dispatches" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectMongo();
    const updated = await retryWarningDispatch(id);

    return NextResponse.json({
      message: "Retry dispatch completed",
      warning: updated,
    });
  } catch (err: unknown) {
    if (err instanceof WarningNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Retry dispatch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
