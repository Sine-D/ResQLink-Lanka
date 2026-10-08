/**
 * @file route.ts
 * @route /api/warnings/[id]/issue
 * @description REST API Controller for issuing and broadcasting Disaster Warnings (UC1).
 *
 * @architecture Clean Architecture / Presentation Layer (Interface Adapter)
 * @solid
 * - Single Responsibility Principle (SRP): Authenticates DMC Officer and issues warning transition.
 * - Dependency Inversion Principle (DIP): Delegates warning publishing to warningService.
 */

import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import {
  issueWarning,
  InvalidTargetAreaError,
  WarningNotFoundError,
} from "@/lib/services/warningService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/warnings/[id]/issue
 * Authorizes and issues a disaster warning. Triggers multi-channel citizen broadcast.
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
        { error: "Forbidden: Only DMC Officers can issue warnings" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectMongo();
    const issuedWarning = await issueWarning(id);

    return NextResponse.json({
      message: "Warning issued and dispatched successfully",
      warning: issuedWarning,
    });
  } catch (err: unknown) {
    if (err instanceof InvalidTargetAreaError) {
      return NextResponse.json(
        {
          error: "NO_COVERAGE",
          message: err.message,
        },
        { status: 422 }
      );
    }
    if (err instanceof WarningNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to issue warning";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
