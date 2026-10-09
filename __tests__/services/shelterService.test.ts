import { ShelterService } from "../../lib/services/shelterService";
import Shelter from "../../lib/models/Shelter";
import connectMongo from "../../lib/db/connectMongo";

// Mock the dependencies
jest.mock("../../lib/models/Shelter");
jest.mock("../../lib/db/connectMongo");

describe("ShelterService", () => {
  let shelterService: ShelterService;

  beforeEach(() => {
    jest.clearAllMocks();
    shelterService = new ShelterService();
  });

  describe("getShelters()", () => {
    it("should fetch all shelters sorted by createdAt", async () => {
      const mockShelters = [{ name: "Shelter A" }, { name: "Shelter B" }];
      const mockSort = jest.fn().mockResolvedValue(mockShelters);
      (Shelter.find as jest.Mock).mockReturnValue({ sort: mockSort });

      const result = await shelterService.getShelters();

      expect(connectMongo).toHaveBeenCalledTimes(1);
      expect(Shelter.find).toHaveBeenCalledTimes(1);
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(mockShelters);
    });
  });

  describe("createShelter()", () => {
    it("should create a shelter and generate an ID if not provided", async () => {
      const data = { name: "New Shelter", capacity: 100, occupancy: 50 };
      (Shelter.countDocuments as jest.Mock).mockResolvedValue(5);
      
      const mockSave = jest.fn().mockResolvedValue(true);
      (Shelter as unknown as jest.Mock).mockImplementation((data) => ({
        ...data,
        save: mockSave
      }));

      const result = await shelterService.createShelter(data);

      expect(connectMongo).toHaveBeenCalledTimes(1);
      expect(Shelter.countDocuments).toHaveBeenCalledTimes(1);
      expect(result.shelterId).toBe("SH-006"); // 5 + 1 padded to 3
      expect(result.status).toBe("AVAILABLE");
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it("should set status to FULL if occupancy >= capacity", async () => {
      const data = { shelterId: "SH-001", name: "Full Shelter", capacity: 100, occupancy: 100 };
      
      const mockSave = jest.fn().mockResolvedValue(true);
      (Shelter as unknown as jest.Mock).mockImplementation((data) => ({
        ...data,
        save: mockSave
      }));

      const result = await shelterService.createShelter(data);

      expect(result.status).toBe("FULL");
      expect(Shelter.countDocuments).not.toHaveBeenCalled();
    });

    it("should set status to NEAR CAPACITY if occupancy >= 80% capacity", async () => {
      const data = { shelterId: "SH-002", name: "Near Full Shelter", capacity: 100, occupancy: 85 };
      
      const mockSave = jest.fn().mockResolvedValue(true);
      (Shelter as unknown as jest.Mock).mockImplementation((data) => ({
        ...data,
        save: mockSave
      }));

      const result = await shelterService.createShelter(data);

      expect(result.status).toBe("NEAR CAPACITY");
    });
  });
});
