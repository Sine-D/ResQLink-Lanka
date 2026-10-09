import { IEvacueeRepository } from "./IEvacueeRepository";
import connectMongo from "@/lib/db/connectMongo";
import Evacuee from "@/lib/models/Evacuee";

export class EvacueeMongoRepository implements IEvacueeRepository {
  async getEvacueesWithContacts(): Promise<{ contactNumber: string }[]> {
    await connectMongo();
    // Fetch only the contactNumber field for optimization
    return await Evacuee.find({ contactNumber: { $exists: true, $ne: "" } }, { contactNumber: 1 });
  }
}
