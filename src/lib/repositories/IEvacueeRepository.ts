export interface IEvacueeRepository {
  getEvacueesWithContacts(): Promise<{ contactNumber: string }[]>;
}
