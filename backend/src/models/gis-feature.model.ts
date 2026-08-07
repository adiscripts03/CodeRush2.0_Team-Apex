import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { gisLayerTypes } from "../gis/gis.types.js";
import { timestamps } from "./model-options.js";

const sourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    license: { type: String, required: true, trim: true },
    sourceUrl: { type: String, trim: true },
    checksum: { type: String, required: true, trim: true },
    importedAt: { type: Date, required: true }
  },
  { _id: false }
);

const gisFeatureSchema = new Schema(
  {
    layer: { type: String, enum: gisLayerTypes, required: true },
    name: { type: String, required: true, trim: true },
    externalId: { type: String, required: true, trim: true },
    geometry: { type: Schema.Types.Mixed, required: true },
    properties: { type: Schema.Types.Mixed, default: {} },
    source: { type: sourceSchema, required: true }
  },
  {
    ...timestamps,
    collection: "gis_features"
  }
);

gisFeatureSchema.index({ geometry: "2dsphere" });
gisFeatureSchema.index({ layer: 1, name: 1 });
gisFeatureSchema.index({ layer: 1, externalId: 1 }, { unique: true });
gisFeatureSchema.index({ "source.checksum": 1 });

export type GisFeature = InferSchemaType<typeof gisFeatureSchema>;

export const GisFeatureModel: Model<GisFeature> =
  (mongoose.models.GisFeature as any) ?? model<GisFeature>("GisFeature", gisFeatureSchema);
