import { AlertDispatchService } from "../../lib/services/alertDispatchService";
import { IEvacueeRepository } from "../../lib/repositories/IEvacueeRepository";
import { ISmsProvider } from "../../lib/services/sms/ISmsProvider";

describe("AlertDispatchService", () => {
  let mockRepository: jest.Mocked<IEvacueeRepository>;
  let mockSmsProvider: jest.Mocked<ISmsProvider>;
  let alertDispatchService: AlertDispatchService;

  beforeEach(() => {
    // Reset mocks before each test
    mockRepository = {
      getEvacueesWithContacts: jest.fn(),
    };
    mockSmsProvider = {
      sendSms: jest.fn(),
    };
    
    // Inject the mock dependencies (DIP)
    alertDispatchService = new AlertDispatchService(mockRepository, mockSmsProvider);
  });

  describe("dispatchToAll()", () => {
    
    // 1. Positive Case
    it("should dispatch SMS to all evacuees with valid contact numbers and return success count", async () => {
      const evacuees = [
        { contactNumber: "0771234567" },
        { contactNumber: "0719876543" },
      ];
      mockRepository.getEvacueesWithContacts.mockResolvedValue(evacuees);
      mockSmsProvider.sendSms.mockResolvedValue(true);

      const message = "Please evacuate immediately.";
      const result = await alertDispatchService.dispatchToAll(message);

      expect(mockRepository.getEvacueesWithContacts).toHaveBeenCalledTimes(1);
      expect(mockSmsProvider.sendSms).toHaveBeenCalledTimes(2);
      expect(mockSmsProvider.sendSms).toHaveBeenNthCalledWith(1, "0771234567", message);
      expect(mockSmsProvider.sendSms).toHaveBeenNthCalledWith(2, "0719876543", message);
      expect(result).toBe(2); // 2 successful dispatches
    });

    // 2. Negative Case (Partial Failure)
    it("should return the correct success count when SMS delivery fails for some contacts", async () => {
      const evacuees = [
        { contactNumber: "0771234567" },
        { contactNumber: "0719876543" },
      ];
      mockRepository.getEvacueesWithContacts.mockResolvedValue(evacuees);
      
      // First succeeds, second fails
      mockSmsProvider.sendSms.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      const result = await alertDispatchService.dispatchToAll("Test message");

      expect(mockSmsProvider.sendSms).toHaveBeenCalledTimes(2);
      expect(result).toBe(1); // Only 1 succeeded
    });

    // 3. Error Case (SMS Gateway Exception)
    it("should catch exceptions from the SMS provider and continue processing other contacts", async () => {
      const evacuees = [
        { contactNumber: "0771234567" },
        { contactNumber: "0719876543" },
        { contactNumber: "0755555555" }
      ];
      mockRepository.getEvacueesWithContacts.mockResolvedValue(evacuees);
      
      // First fails with exception, second succeeds, third succeeds
      mockSmsProvider.sendSms
        .mockRejectedValueOnce(new Error("Network Error"))
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      // Spy on console.error to prevent test log pollution and to assert it was called
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await alertDispatchService.dispatchToAll("Test message");

      expect(mockSmsProvider.sendSms).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith(
        "AlertDispatchService: Failed to dispatch to 0771234567",
        expect.any(Error)
      );
      expect(result).toBe(2); // 2 succeeded despite the exception on the first

      consoleSpy.mockRestore();
    });

    // 4. Edge Case (No Data)
    it("should return 0 when there are no evacuees returned from the repository", async () => {
      mockRepository.getEvacueesWithContacts.mockResolvedValue([]);

      const result = await alertDispatchService.dispatchToAll("Test message");

      expect(mockRepository.getEvacueesWithContacts).toHaveBeenCalledTimes(1);
      expect(mockSmsProvider.sendSms).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    // 5. Edge Case (Bad Data Handling)
    it("should skip evacuees with missing or empty contact numbers", async () => {
      const evacuees = [
        { contactNumber: "" },
        { contactNumber: "0771234567" },
        { contactNumber: undefined as unknown as string } // testing runtime boundary
      ];
      mockRepository.getEvacueesWithContacts.mockResolvedValue(evacuees);
      mockSmsProvider.sendSms.mockResolvedValue(true);

      const result = await alertDispatchService.dispatchToAll("Test message");

      // Only one valid number exists in the array
      expect(mockSmsProvider.sendSms).toHaveBeenCalledTimes(1);
      expect(mockSmsProvider.sendSms).toHaveBeenCalledWith("0771234567", "Test message");
      expect(result).toBe(1);
    });

    // 6. Error Case (Database Failure)
    it("should bubble up exceptions if the repository (Database) fails", async () => {
      mockRepository.getEvacueesWithContacts.mockRejectedValue(new Error("Database offline"));

      await expect(alertDispatchService.dispatchToAll("Test")).rejects.toThrow("Database offline");
      expect(mockSmsProvider.sendSms).not.toHaveBeenCalled();
    });
    
  });
});
