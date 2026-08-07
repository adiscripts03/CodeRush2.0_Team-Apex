import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const floodPolygonSchema = new Schema(
  {
    snapshotId: { type: Schema.Types.ObjectId, ref: "FloodSnapshot", required: true },
    timestamp: { type: Date, required: true },
    geometry: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon"],
        required: true
      },
      coordinates: { type: Schema.Types.Mixed, required: true }
    },
    properties: {
      areaKm2: { type: Number, required: true, min: 0 },
      confidence: { type: Number, required: true, min: 0, max: 1 },
      meanNdwi: { type: Number, required: true },
      sensorType: { type: String, required: true, default: "Sentinel-2" }
    },
    checksum: { type: String, required: true }
  },
  {
    ...timestamps,
    collection: "flood_polygons"
  }
);

floodPolygonSchema.index({ geometry: "2dsphere" });
floodPolygonSchema.index({ timestamp: -1 });
floodPolygonSchema.index({ snapshotId: 1 });

export type FloodPolygon = InferSchemaType<typeof floodPolygonSchema>;

export const FloodPolygonModel: Model<FloodPolygon> =
  models.FloodPolygon ?? model<FloodPolygon>("FloodPolygon", floodPolygonSchema);
