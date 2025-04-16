import mongoose, { Schema, Document } from 'mongoose';

export interface OfficeDocument extends Document {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
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
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Office || mongoose.model<OfficeDocument>('Office', OfficeSchema); 