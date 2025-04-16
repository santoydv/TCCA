import mongoose, { Schema, Document } from 'mongoose';

export interface TruckDocument extends Document {
  registrationNumber: string;
  truckModel: string;
  capacity: number;
  office: mongoose.Types.ObjectId;
  maintenanceStatus: string;
  lastMaintenance: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TruckSchema = new Schema<TruckDocument>(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
    },
    truckModel: {
      type: String,
      required: [true, 'Truck model is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
    },
    office: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
      required: [true, 'Office is required'],
    },
    maintenanceStatus: {
      type: String,
      enum: ['Ready', 'Under Maintenance', 'Scheduled Maintenance'],
      default: 'Ready',
    },
    lastMaintenance: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Truck || mongoose.model<TruckDocument>('Truck', TruckSchema); 