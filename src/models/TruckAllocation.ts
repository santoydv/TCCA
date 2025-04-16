import mongoose, { Schema, models, model } from 'mongoose';

export enum AllocationStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface ITruckAllocation {
  truck: mongoose.Types.ObjectId;
  sourceOffice: mongoose.Types.ObjectId;
  destinationOffice: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date | null;
  consignments: mongoose.Types.ObjectId[];
  totalVolume: number;
  status: AllocationStatus;
  idleTime: number; // in hours
  waitingTime: number; // average waiting time for consignments in days
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const TruckAllocationSchema = new Schema<ITruckAllocation>(
  {
    truck: {
      type: Schema.Types.ObjectId,
      ref: 'Truck',
      required: [true, 'Please provide truck'],
    },
    sourceOffice: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
      required: [true, 'Please provide source office'],
    },
    destinationOffice: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
      required: [true, 'Please provide destination office'],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    consignments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Consignment',
      },
    ],
    totalVolume: {
      type: Number,
      required: [true, 'Please provide total volume'],
      min: [0, 'Total volume cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(AllocationStatus),
      default: AllocationStatus.PLANNED,
    },
    idleTime: {
      type: Number,
      default: 0,
    },
    waitingTime: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const TruckAllocation = models.TruckAllocation || model<ITruckAllocation>('TruckAllocation', TruckAllocationSchema);

export default TruckAllocation; 