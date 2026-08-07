import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { 
      type: String, 
      enum: ['food', 'water', 'medicine', 'clothing', 'equipment', 'fuel'], 
      required: true 
    },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true }, // e.g., 'liters', 'packets', 'generators'
    assignedToShelter: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter' },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number]
      }
    },
    status: { 
      type: String, 
      enum: ['available', 'in-transit', 'depleted', 'requested'], 
      default: 'available' 
    },
    estimatedDepletionDate: { type: Date }
  },
  { timestamps: true }
);

resourceSchema.index({ currentLocation: '2dsphere' });
resourceSchema.index({ assignedToShelter: 1 });

export default mongoose.model('Resource', resourceSchema);
