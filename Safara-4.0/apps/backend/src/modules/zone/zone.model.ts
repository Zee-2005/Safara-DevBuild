import { Schema, model, Document } from 'mongoose';

export type ZoneType = 'safe' | 'restricted' | 'monitored' | 'high-risk';
export type ZoneStatus = 'active' | 'warning' | 'inactive';

export interface IZone extends Document {
  name: string;
  type: ZoneType;
  status: ZoneStatus;
  center?: { lat: number; lng: number }; // for circle
  radius?: number;                       // in meters
  polygon?: { lat: number; lng: number }[]; // for polygon
  capacity?: number;
  currentOccupancy?: number;
  assignedOfficers?: number;
  incidents?: number;
  lastUpdated?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LatLngSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const ZoneSchema = new Schema<IZone>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['safe', 'restricted', 'monitored', 'high-risk'],
      default: 'monitored',
    },
    status: {
      type: String,
      enum: ['active', 'warning', 'inactive'],
      default: 'active',
    },
    center: LatLngSchema,
    radius: Number,
    polygon: { type: [LatLngSchema], default: [] },
    capacity: { type: Number, default: 0 },
    currentOccupancy: { type: Number, default: 0 },
    assignedOfficers: { type: Number, default: 0 },
    incidents: { type: Number, default: 0 },
    lastUpdated: { type: String },
  },
  { timestamps: true }
);

export const ZoneModel = model<IZone>('Zone', ZoneSchema);
