import connectMongo from "@/lib/db/connectMongo";
import Shelter from "@/lib/models/Shelter";

export class ShelterService {
  async getShelters() {
    await connectMongo();
    return await Shelter.find().sort({ createdAt: -1 });
  }

  async createShelter(data: any) {
    await connectMongo();

    // Generate a shelter ID if not provided
    if (!data.shelterId) {
      const count = await Shelter.countDocuments();
      data.shelterId = `SH-${String(count + 1).padStart(3, '0')}`;
    }
    
    if (data.capacity !== undefined && data.occupancy !== undefined) {
      if (data.occupancy >= data.capacity) {
         data.status = "FULL";
      } else if (data.occupancy >= data.capacity * 0.8) {
         data.status = "NEAR CAPACITY";
      } else {
         data.status = "AVAILABLE";
      }
    }

    const newShelter = new Shelter(data);
    await newShelter.save();
    return newShelter;
  }
}
