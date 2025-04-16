import mongoose, { Schema, Document } from 'mongoose';

export interface OfficeDocument extends Document {
  name: string;
  address: string;
  contactNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const OfficeSchema = new Schema<OfficeDocument>(
  {
    name: {
      type: String,
      required: [true, 'Office name is required'],
      trim: true,
      unique: true,
    },
    address: {
      type: String,
      required: [true, 'Office address is required'],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Office || mongoose.model<OfficeDocument>('Office', OfficeSchema); 