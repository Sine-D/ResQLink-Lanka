import { EvacueeService } from "../../lib/services/evacueeService";
import Evacuee from "../../lib/models/Evacuee";
import connectMongo from "../../lib/db/connectMongo";

// Mock the dependencies
jest.mock("../../lib/models/Evacuee");
jest.mock("../../lib/db/connectMongo");

describe("EvacueeService", () => {
  let evacueeService: EvacueeService;

  beforeEach(() => {
    jest.clearAllMocks();
    evacueeService = new EvacueeService();
    
    // Mock Math.random so case IDs are predictable in tests
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getEvacuees()", () => {
    it("should fetch all evacuees sorted by createdAt", async () => {
      const mockEvacuees = [{ name: "John Doe" }, { name: "Jane Doe" }];
      const mockSort = jest.fn().mockResolvedValue(mockEvacuees);
      (Evacuee.find as jest.Mock).mockReturnValue({ sort: mockSort });

      const result = await evacueeService.getEvacuees();

      expect(connectMongo).toHaveBeenCalledTimes(1);
      expect(Evacuee.find).toHaveBeenCalledTimes(1);
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(mockEvacuees);
    });
  });

  describe("createEvacuee()", () => {
    it("should create an evacuee and generate a case ID if not provided", async () => {
      const data = { name: "New Evacuee" };
      
      const mockSave = jest.fn().mockResolvedValue(true);
      (Evacuee as unknown as jest.Mock).mockImplementation((data) => ({
        ...data,
        save: mockSave
      }));

      const result = await evacueeService.createEvacuee(data);

      expect(connectMongo).toHaveBeenCalledTimes(1);
      
      // With Math.random() mocked to 0.5:
      // Math.floor(10000 + 0.5 * 90000) = 55000
      // String.fromCharCode(65 + Math.floor(0.5 * 26)) = 65 + 13 = 78 ('N')
      expect(result.caseId).toBe("#EV-55000-N"); 
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it("should use the provided case ID if present", async () => {
      const data = { caseId: "#EV-12345-A", name: "Existing Evacuee" };
      
      const mockSave = jest.fn().mockResolvedValue(true);
      (Evacuee as unknown as jest.Mock).mockImplementation((data) => ({
        ...data,
        save: mockSave
      }));

      const result = await evacueeService.createEvacuee(data);

      expect(result.caseId).toBe("#EV-12345-A");
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
  });
});
