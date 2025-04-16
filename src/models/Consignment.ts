import mongoose, { Schema, Document } from 'mongoose';
import { ConsignmentStatus } from '@/types';

export { ConsignmentStatus };

export interface ConsignmentDocument extends Document {
  trackingNumber: string;
  sourceOffice: mongoose.Types.ObjectId;
  destinationOffice: mongoose.Types.ObjectId;
  volume: number;
  charge: number;
  status: string;
  receivedDate: Date;
  dispatchDate?: Date;
  deliveredAt?: Date;
  truck?: mongoose.Types.ObjectId;
  sender: {
    name: string;
    contact: string;
  };
  receiver: {
    name: string;
    contact: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ConsignmentSchema = new Schema<ConsignmentDocument>(
  {
    trackingNumber: {
      type: String,
      required: [true, 'Tracking number is required'],
      unique: true,
      trim: true,
    },
    sourceOffice: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
      required: [true, 'Source office is required'],
    },
    destinationOffice: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
      required: [true, 'Destination office is required'],
    },
    volume: {
      type: Number,
      required: [true, 'Volume is required'],
      min: [0.1, 'Volume must be greater than 0.1 cubic meters'],
    },
    charge: {
      type: Number,
      required: [true, 'Charge is required'],
      min: [0, 'Charge cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(ConsignmentStatus),
      default: ConsignmentStatus.PENDING,
    },
    receivedDate: {
      type: Date,
      required: [true, 'Received date is required'],
      default: Date.now,
    },
    dispatchDate: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    truck: {
      type: Schema.Types.ObjectId,
      ref: 'Truck',
    },
    sender: {
      name: {
        type: String,
        required: [true, 'Sender name is required'],
        trim: true,
      },
      contact: {
        type: String,
        required: [true, 'Sender contact is required'],
        trim: true,
      },
    },
    receiver: {
      name: {
        type: String,
        required: [true, 'Receiver name is required'],
        trim: true,
      },
      contact: {
        type: String,
        required: [true, 'Receiver contact is required'],
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Consignment || mongoose.model<ConsignmentDocument>('Consignment', ConsignmentSchema); 