import { MongoTelemetryRepository } from "../../src/core/infrastructure/repositories/MongoTelemetryRepository";
import {
  IngestTelemetryUseCase,
  GetLatestTelemetryUseCase,
} from "../../src/core/application/use-cases/TelemetryUseCases";
import { evaluateTelemetryStatus } from "../../src/core/application/event-handlers/TelemetryEventHandler";
import { eventBus } from "../../src/core/infrastructure/event-bus/EventBus";
import TelemetryModel from "../../src/core/infrastructure/db/models/TelemetryModel";

jest.mock("../../src/core/infrastructure/db/models/TelemetryModel");

describe("Telemetry EDA & Clean Architecture Unit Tests", () => {
  let mockTelemetryStore: any[] = [];
  let telemetryRepo: MongoTelemetryRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTelemetryStore = [];
    telemetryRepo = new MongoTelemetryRepository();

    (TelemetryModel.create as jest.Mock).mockImplementation((data: any) => {
      const doc = {
        ...data,
        _id: `telemetry_${Math.random().toString(36).substr(2, 9)}`,
      };
      mockTelemetryStore.push(doc);
      return Promise.resolve(doc);
    });

    (TelemetryModel.find as jest.Mock).mockImplementation((query: any) => {
      let result = [...mockTelemetryStore];
      if (query.sensorId) {
        result = result.filter((item) => item.sensorId === query.sensorId);
      }
      if (query.districtName) {
        result = result.filter((item) => item.districtName === query.districtName);
      }
      return {
        sort: () => ({
          limit: (n: number) => Promise.resolve(result.slice(0, n)),
        }),
      };
    });
  });

  test("evaluateTelemetryStatus calculates NORMAL, WARNING, and CRITICAL thresholds", () => {
    expect(evaluateTelemetryStatus("water_level_m", 4.0).status).toBe("NORMAL");
    expect(evaluateTelemetryStatus("water_level_m", 6.5).status).toBe("WARNING");
    expect(evaluateTelemetryStatus("water_level_m", 9.0).status).toBe("CRITICAL");
    expect(evaluateTelemetryStatus("unknown_metric", 100).status).toBe("NORMAL");
  });

  test("IngestTelemetryUseCase persists reading and publishes TelemetryReceivedEvent", async () => {
    const publishSpy = jest.spyOn(eventBus, "publish");
    const useCase = new IngestTelemetryUseCase(telemetryRepo);

    const result = await useCase.execute({
      sensorId: "SENSOR_COLOMBO_01",
      districtName: "Colombo",
      hazardType: "Flood",
      metricName: "water_level_m",
      metricValue: 8.8,
      unit: "m",
    });

    expect(result).toBeDefined();
    expect(result.sensorId).toBe("SENSOR_COLOMBO_01");
    expect(result.status).toBe("CRITICAL");
    expect(publishSpy).toHaveBeenCalled();
  });

  test("GetLatestTelemetryUseCase fetches readings by sensorId and districtName", async () => {
    const ingestUseCase = new IngestTelemetryUseCase(telemetryRepo);
    await ingestUseCase.execute({
      sensorId: "SENSOR_GALLE_02",
      districtName: "Galle",
      hazardType: "Tsunami",
      metricName: "water_level_m",
      metricValue: 2.1,
      unit: "m",
    });

    const getUseCase = new GetLatestTelemetryUseCase(telemetryRepo);

    const bySensor = await getUseCase.execute(undefined, "SENSOR_GALLE_02");
    expect(bySensor.length).toBeGreaterThan(0);
    expect(bySensor[0].districtName).toBe("Galle");

    const byDistrict = await getUseCase.execute("Galle");
    expect(byDistrict.length).toBeGreaterThan(0);
  });
});
