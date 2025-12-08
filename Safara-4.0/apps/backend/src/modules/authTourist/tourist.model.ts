import { Schema, model, Document } from 'mongoose';

export interface ITourist extends Document {
  socketId?: string;
  tid?: string;                 // internal tourist id from app
  personalId?: string;          // DigiLocker / government id
  name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  status?: 'active' | 'flagged' | 'emergency';
  latitude?: number;
  longitude?: number;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TouristSchema = new Schema<ITourist>(
  {
    socketId: { type: String, index: true },
    tid: { type: String, index: true },
    personalId: { type: String, index: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    nationality: { type: String },
    status: {
      type: String,
      enum: ['active', 'flagged', 'emergency'],
      default: 'active',
    },
    latitude: { type: Number },
    longitude: { type: Number },
    lastSeenAt: { type: Date },
  },
  { timestamps: true }
);

export const TouristModel = model<ITourist>('Tourist', TouristSchema);
