export interface Resource {
  _id: string;
  type: "rescue_boat" | "ambulance" | "medical_team" | "volunteer" | "food_stock";
  name: string;
  quantity: number;
  unit: string;
  status: "available" | "deployed" | "maintenance";
  assignedZone?: string;
}

export interface Vehicle {
  _id: string;
  vehicleId: string;
  type: "rescue_boat" | "ambulance" | "truck" | "helicopter";
  name: string;
  passengerCapacity: number;
  status: "available" | "deployed" | "en_route" | "maintenance";
}

export interface ShelterCapacity {
  _id: string;
  shelterId: string;
  name: string;
  maxCapacity: number;
  currentOccupancy: number;
  availableCapacity: number;
  status: "open" | "near_capacity" | "full" | "flooded";
  supplies: {
    foodRationsKg: number;
    medicalKits: number;
    drinkingWaterLiters: number;
  };
}

export interface RoutePlan {
  origin: { name: string; coordinates: [number, number] };
  destination: { name: string; coordinates: [number, number] };
  path: GeoJSON.Feature<GeoJSON.LineString>;
  totalDistanceKm: number;
  estimatedTimeMinutes: number;
  safetyStatus: "safe" | "blocked" | "caution";
  avoidedFloodAreaKm2: number;
  assignedShelterId?: string;
}
