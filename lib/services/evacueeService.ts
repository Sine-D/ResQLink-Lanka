import connectMongo from "@/lib/db/connectMongo";
import Evacuee from "@/lib/models/Evacuee";

export class EvacueeService {
  async getEvacuees() {
    await connectMongo();
    return await Evacuee.find().sort({ createdAt: -1 });
  }

  async createEvacuee(data: any) {
    await connectMongo();

    // Generate a case ID if not provided
    if (!data.caseId) {
      data.caseId = `#EV-${Math.floor(10000 + Math.random() * 90000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    }

    const newEvacuee = new Evacuee(data);
    await newEvacuee.save();
    return newEvacuee;
  }
}
