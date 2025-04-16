import mongoose, { Schema, Document } from 'mongoose';

export enum OfficeType {
  HEAD_OFFICE = 'HEAD_OFFICE',
  BRANCH_OFFICE = 'BRANCH_OFFICE'
}

export interface OfficeDocument extends Document {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  type: OfficeType;
  phoneNumber: string;
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
      street: {
        type: String,
        required: [true, 'Street address is required'],
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
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
      },
      postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true,
      },
    },
    type: {
      type: String,
      enum: Object.values(OfficeType),
      required: [true, 'Office type is required'],
      default: OfficeType.BRANCH_OFFICE,
    },
    phoneNumber: {
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