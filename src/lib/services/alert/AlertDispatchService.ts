import { IEvacueeRepository } from "@/lib/repositories/IEvacueeRepository";
import { ISmsProvider } from "@/lib/services/sms/ISmsProvider";

export class AlertDispatchService {
  private repository: IEvacueeRepository;
  private smsProvider: ISmsProvider;

  constructor(repository: IEvacueeRepository, smsProvider: ISmsProvider) {
    this.repository = repository;
    this.smsProvider = smsProvider;
  }

  async dispatchToAll(message: string): Promise<number> {
    const evacuees = await this.repository.getEvacueesWithContacts();
    let successCount = 0;
    
    for (const e of evacuees) {
      if (e.contactNumber) {
        try {
          const isSuccess = await this.smsProvider.sendSms(e.contactNumber, message);
          if (isSuccess) {
            successCount++;
          }
        } catch (error) {
          console.error(`AlertDispatchService: Failed to dispatch to ${e.contactNumber}`, error);
        }
      }
    }
    
    return successCount;
  }
}
