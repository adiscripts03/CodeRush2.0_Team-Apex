import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import { createApp } from "../app.js";
import { ResourceModel } from "../models/resource.model.js";
import { VehicleModel } from "../models/vehicle.model.js";
import { ShelterCapacityModel } from "../models/shelter-capacity.model.js";
import { RoutePlanModel } from "../models/route-plan.model.js";
import { AuditEventModel } from "../models/audit-event.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "resource_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await ResourceModel.deleteMany({});
  await VehicleModel.deleteMany({});
  await ShelterCapacityModel.deleteMany({});
  await RoutePlanModel.deleteMany({});
  await AuditEventModel.deleteMany({});
});

const app = createApp();

async function seedResourcesAndShelter() {
  const shelter = await ShelterCapacityModel.create({
    shelterId: "SHELTER_TEST_1",
    name: "Test Relief Camp",
    maxCapacity: 1000,
    currentOccupancy: 200,
    availableCapacity: 800,
    location: { type: "Point", coordinates: [76.28, 9.98] },
    status: "open",
    supplies: { foodRationsKg: 2000, medicalKits: 50, drinkingWaterLiters: 5000 }
  });

  const resource = await ResourceModel.create({
    type: "rescue_boat",
    name: "NDRF Test Boat Unit",
    quantity: 10,
    unit: "boats",
    location: { type: "Point", coordinates: [76.29, 9.97] },
    status: "available"
  });

  const vehicle = await VehicleModel.create({
    vehicleId: "BOAT_TEST_101",
    type: "rescue_boat",
    name: "Rescue Boat 101",
    passengerCapacity: 12,
    currentLocation: { type: "Point", coordinates: [76.29, 9.97] },
    status: "available"
  });

  return { shelter, resource, vehicle };
}

describe("GET /api/resources & /resources", () => {
  it("returns resource inventory, vehicles, and shelter capacities", async () => {
    await seedResourcesAndShelter();

    const response = await supertest(app).get("/api/resources").expect(200);
    expect(response.body.resources).toHaveLength(1);
    expect(response.body.vehicles).toHaveLength(1);
    expect(response.body.shelters).toHaveLength(1);
  });

  it("works with spec alias GET /resources", async () => {
    await seedResourcesAndShelter();
    await supertest(app).get("/resources").expect(200);
  });
});

describe("POST /api/resources/update & /resources/update", () => {
  it("updates resource status and emits audit log event", async () => {
    const { resource } = await seedResourcesAndShelter();

    const response = await supertest(app)
      .post("/api/resources/update")
      .send({ resourceId: String(resource._id), quantity: 15, status: "deployed" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.resource.quantity).toBe(15);
    expect(response.body.resource.status).toBe("deployed");

    const auditEvents = await AuditEventModel.find({ eventType: "resource.updated" }).lean();
    expect(auditEvents).toHaveLength(1);
  });
});

describe("GET /api/routes/evacuation & /routes/evacuation", () => {
  it("calculates evacuation route to nearest shelter and updates capacity", async () => {
    await seedResourcesAndShelter();

    const response = await supertest(app)
      .get("/api/routes/evacuation?lng=76.26&lat=9.96&evacueesCount=100")
      .expect(200);

    expect(response.body.assignedShelterId).toBe("SHELTER_TEST_1");
    expect(response.body.totalDistanceKm).toBeGreaterThan(0);
    expect(["safe", "caution", "blocked"]).toContain(response.body.safetyStatus);

    const updatedShelter = await ShelterCapacityModel.findOne({ shelterId: "SHELTER_TEST_1" }).lean();
    expect(updatedShelter!.currentOccupancy).toBe(300); // 200 + 100
  });

  it("works with spec alias GET /routes/evacuation", async () => {
    await seedResourcesAndShelter();
    await supertest(app)
      .get("/routes/evacuation?lng=76.26&lat=9.96")
      .expect(200);
  });
});

describe("GET /api/routes/safe & /routes/safe", () => {
  it("calculates safe point-to-point route bypassing flood hazards", async () => {
    const response = await supertest(app)
      .get("/api/routes/safe?origLng=76.20&origLat=9.90&destLng=76.25&destLat=9.95")
      .expect(200);

    expect(response.body.path.type).toBe("Feature");
    expect(response.body.totalDistanceKm).toBeGreaterThan(0);
    expect(response.body.safetyStatus).toBe("safe");
  });
});
