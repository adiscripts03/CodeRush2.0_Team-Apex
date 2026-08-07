import { connectMongo, disconnectMongo } from "../db/mongo.js";
import { ResourceModel } from "../models/resource.model.js";
import { VehicleModel } from "../models/vehicle.model.js";
import { ShelterCapacityModel } from "../models/shelter-capacity.model.js";
import { logger } from "../logging/logger.js";

async function main(): Promise<void> {
  await connectMongo();

  try {
    // 1. Seed Shelters
    const shelters = [
      {
        shelterId: "SHELTER_ERNAKULAM_TOWN_HALL",
        name: "Ernakulam Town Hall Relief Camp",
        maxCapacity: 1200,
        currentOccupancy: 850,
        availableCapacity: 350,
        location: { type: "Point", coordinates: [76.282, 9.982] },
        status: "open",
        supplies: { foodRationsKg: 5000, medicalKits: 120, drinkingWaterLiters: 8000 }
      },
      {
        shelterId: "SHELTER_ALUVA_ST_XAVIERS",
        name: "Aluva St Xaviers Relief Center",
        maxCapacity: 800,
        currentOccupancy: 760,
        availableCapacity: 40,
        location: { type: "Point", coordinates: [76.355, 10.108] },
        status: "near_capacity",
        supplies: { foodRationsKg: 2000, medicalKits: 45, drinkingWaterLiters: 3500 }
      },
      {
        shelterId: "SHELTER_KALOOR_STADIUM",
        name: "Kaloor Stadium Emergency Camp",
        maxCapacity: 2500,
        currentOccupancy: 1100,
        availableCapacity: 1400,
        location: { type: "Point", coordinates: [76.301, 9.998] },
        status: "open",
        supplies: { foodRationsKg: 12000, medicalKits: 300, drinkingWaterLiters: 20000 }
      },
      {
        shelterId: "SHELTER_THRISSUR_COMMUNITY",
        name: "Thrissur Town Community Shelter",
        maxCapacity: 1000,
        currentOccupancy: 450,
        availableCapacity: 550,
        location: { type: "Point", coordinates: [76.214, 10.527] },
        status: "open",
        supplies: { foodRationsKg: 6000, medicalKits: 150, drinkingWaterLiters: 10000 }
      }
    ];

    for (const s of shelters) {
      await ShelterCapacityModel.findOneAndUpdate({ shelterId: s.shelterId }, { $set: s }, { upsert: true });
    }

    // 2. Seed Resources
    const resources = [
      {
        type: "rescue_boat",
        name: "NDRF Motorised Inflatable Boat Squad 1",
        quantity: 12,
        unit: "boats",
        location: { type: "Point", coordinates: [76.29, 9.97] },
        status: "available",
        assignedZone: "Ernakulam Coast"
      },
      {
        type: "ambulance",
        name: "108 Emergency Ambulance Unit A",
        quantity: 8,
        unit: "vehicles",
        location: { type: "Point", coordinates: [76.31, 9.99] },
        status: "available"
      },
      {
        type: "medical_team",
        name: "Kerala Health Services Rapid Medical Unit",
        quantity: 45,
        unit: "persons",
        location: { type: "Point", coordinates: [76.28, 9.98] },
        status: "deployed"
      },
      {
        type: "food_stock",
        name: "Central Rice & Ration Stockpile",
        quantity: 25000,
        unit: "kg",
        location: { type: "Point", coordinates: [76.30, 10.01] },
        status: "available"
      }
    ];

    for (const r of resources) {
      await ResourceModel.findOneAndUpdate({ name: r.name }, { $set: r }, { upsert: true });
    }

    // 3. Seed Vehicles
    const vehicles = [
      {
        vehicleId: "BOAT_NDRF_01",
        type: "rescue_boat",
        name: "NDRF Rescue Boat Alpha",
        passengerCapacity: 15,
        currentLocation: { type: "Point", coordinates: [76.29, 9.97] },
        status: "available"
      },
      {
        vehicleId: "AMB_KERALA_108",
        type: "ambulance",
        name: "KSDMA Ambulance 108-B",
        passengerCapacity: 4,
        currentLocation: { type: "Point", coordinates: [76.31, 9.99] },
        status: "available"
      }
    ];

    for (const v of vehicles) {
      await VehicleModel.findOneAndUpdate({ vehicleId: v.vehicleId }, { $set: v }, { upsert: true });
    }

    logger.info("Resource and shelter capacity fixtures imported successfully");
  } finally {
    await disconnectMongo();
  }
}

if (process.argv[1]?.endsWith("import-resource-fixtures.ts")) {
  main().catch((err) => {
    logger.fatal({ err }, "Resource fixture import failed");
    process.exit(1);
  });
}
