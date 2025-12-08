// src/modules/incident/incident.model.ts
import { Schema, model, Document } from 'mongoose';

export type IncidentStatus = 'new' | 'acknowledged' | 'resolved' | 'assigned' | 'pending';

export interface IIncident extends Document {
  socketId: string;
  touristId?: string;
  touristName?: string;
  touristPhone?: string;
  touristEmail?: string;
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
  description?: string;
  media?: {
    audio?: string;
    video?: string;
    photo?: string;
  };
  severity?: 'low' | 'medium' | 'high';
  status: IncidentStatus;
  timeline?: Array<{
    event: string;
    time: string;
    user?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    name: { type: String },
  },
  { _id: false }
);

const MediaSchema = new Schema(
  {
    audio: { type: String },
    video: { type: String },
    photo: { type: String },
  },
  { _id: false }
);

const TimelineSchema = new Schema(
  {
    event: { type: String, required: true },
    time: { type: String, required: true },
    user: { type: String },
  },
  { _id: false }
);

const IncidentSchema = new Schema<IIncident>(
  {
    socketId: { type: String, required: true, index: true },
    touristId: { type: String },
    touristName: { type: String },
    touristPhone: { type: String },
    touristEmail: { type: String },

    location: { type: LocationSchema },
    description: { type: String },
    media: { type: MediaSchema },

    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },

    status: {
      type: String,
      enum: ['new', 'acknowledged', 'resolved', 'assigned', 'pending'],
      default: 'new',
      index: true,
    },

    timeline: { type: [TimelineSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const IncidentModel = model<IIncident>('Incident', IncidentSchema);
