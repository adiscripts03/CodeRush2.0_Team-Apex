import mongoose from 'mongoose';

const responseActionSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'FloodEvent' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['evacuation', 'resource_dispatch', 'medical_assistance', 'infrastructure_repair', 'other'], 
      required: true 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      default: 'medium' 
    },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'in-progress', 'completed'], 
      default: 'pending' 
    },
    assignedTo: { type: String }, // e.g., 'NDRF Team Alpha', 'Local Police'
    targetLocation: {
      type: {
        type: String,
        enum: ['Point', 'Polygon']
      },
      coordinates: {
        type: mongoose.Schema.Types.Mixed // Depends on geometry type
      }
    },
    relatedEntities: {
      hospitals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }],
      shelters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shelter' }],
      resources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }]
    },
    notes: { type: String }
  },
  { timestamps: true }
);

responseActionSchema.index({ eventId: 1, status: 1 });
responseActionSchema.index({ targetLocation: '2dsphere' });

export default mongoose.model('ResponseAction', responseActionSchema);
