import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@/types';

export { UserRole };

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  office?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STAFF,
    },
    office: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema); 