// src/modules/incident/incident.controller.ts
import { Request, Response, NextFunction } from 'express';
import { IncidentModel, IIncident } from './incident.model.ts';

export const createIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as Partial<IIncident>;
    const incident = await IncidentModel.create(payload);
    res.status(201).json(incident);
  } catch (err) {
    next(err);
  }
};

export const listIncidents = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const incidents = await IncidentModel.find().sort({ createdAt: -1 }).lean();
    res.json(incidents);
  } catch (err) {
    next(err);
  }
};

export const getIncidentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incident = await IncidentModel.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (err) {
    next(err);
  }
};

export const updateIncidentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, timelineEvent } = req.body as {
      status?: IIncident['status'];
      timelineEvent?: { event: string; time: string; user?: string };
    };

    const incident = await IncidentModel.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    if (status) incident.status = status;
    if (timelineEvent) {
      incident.timeline = incident.timeline || [];
      incident.timeline.push(timelineEvent);
    }

    await incident.save();
    res.json(incident);
  } catch (err) {
    next(err);
  }
};

export const deleteIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await IncidentModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
