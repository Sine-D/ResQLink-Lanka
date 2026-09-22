import { NextResponse } from "next/server";
import connectMongo from "@/lib/db/connectMongo";
import { telemetryReadingSchema } from "@/core/application/dtos/telemetrySchema";
import { MongoTelemetryRepository } from "@/core/infrastructure/repositories/MongoTelemetryRepository";
import {
  IngestTelemetryUseCase,
  GetLatestTelemetryUseCase,
} from "@/core/application/use-cases/TelemetryUseCases";
import { registerTelemetryEventHandlers } from "@/core/application/event-handlers/TelemetryEventHandler";
import { ZodError } from "zod";

// Initialize EDA Event Listeners
registerTelemetryEventHandlers();

const telemetryRepo = new MongoTelemetryRepository();
const ingestUseCase = new IngestTelemetryUseCase(telemetryRepo);
const getLatestUseCase = new GetLatestTelemetryUseCase(telemetryRepo);

export async function GET(req: Request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const district = searchParams.get("district") || undefined;
    const sensorId = searchParams.get("sensorId") || undefined;

    const readings = await getLatestUseCase.execute(district, sensorId);
    return NextResponse.json({ telemetry: readings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch telemetry data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedInput = telemetryReadingSchema.parse(body);

    await connectMongo();

    const reading = await ingestUseCase.execute(validatedInput);
    return NextResponse.json({ telemetry: reading }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: err.issues[0].message, details: err.issues },
        { status: 422 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to ingest telemetry data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
