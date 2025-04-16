import mongoose, { Schema, Document, Types } from 'mongoose';
import Consignment from './Consignment';
import Truck from './Truck';
import Office from './Office';

export interface IssueReport {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export interface TripDocument extends Document {
  truck: Types.ObjectId;
  consignments: Types.ObjectId[];
  departureDate: Date;
  arrivalDate: Date | null;
  startMileage: number;
  endMileage: number | null;
  sourceOffice: Types.ObjectId;
  destinationOffice: Types.ObjectId;
  fuelUsed: number;
  driver: string;
  issues: IssueReport[];
  volumeDelivered: number;
  deliveredOnTime: boolean;
}

const IssueReportSchema = new Schema({
  type: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  resolved: { type: Boolean, default: false }
});

const TripSchema = new Schema(
  {
    truck: { type: Schema.Types.ObjectId, ref: 'Truck', required: true },
    consignments: [{ type: Schema.Types.ObjectId, ref: 'Consignment' }],
    departureDate: { type: Date, required: true },
    arrivalDate: { type: Date, default: null },
    startMileage: { type: Number, required: true },
    endMileage: { type: Number, default: null },
    sourceOffice: { type: Schema.Types.ObjectId, ref: 'Office', required: true },
    destinationOffice: { type: Schema.Types.ObjectId, ref: 'Office', required: true },
    fuelUsed: { type: Number, default: 0 },
    driver: { type: String, required: true },
    issues: [IssueReportSchema],
    volumeDelivered: { type: Number, default: 0 },
    deliveredOnTime: { type: Boolean, default: true }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Trip || mongoose.model<TripDocument>('Trip', TripSchema);