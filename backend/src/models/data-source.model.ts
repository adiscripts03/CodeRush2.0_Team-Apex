import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const dataSourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sourceType: {
      type: String,
      enum: ["satellite", "weather", "river_gauge", "road_network", "relief_resource", "manual_report"],
      required: true
    },
    provider: { type: String, required: true, trim: true },
    license: { type: String, required: true, trim: true },
    retrievedAt: { type: Date, required: true },
    checksum: { type: String, required: true, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  {
    ...timestamps,
    collection: "data_sources"
  }
);

dataSourceSchema.index({ name: 1, retrievedAt: -1 });
dataSourceSchema.index({ sourceType: 1 });

export type DataSource = InferSchemaType<typeof dataSourceSchema>;

export const DataSourceModel: Model<DataSource> =
  (mongoose.models.DataSource as any) ?? model<DataSource>("DataSource", dataSourceSchema);

