import { Request, Response, NextFunction } from 'express';
import { ZoneModel } from './zone.model';

export const listZones = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const zones = await ZoneModel.find().sort({ createdAt: -1 }).lean();
    res.json(zones);
  } catch (err) {
    next(err);
  }
};

export const getZoneById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zone = await ZoneModel.findById(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json(zone);
  } catch (err) {
    next(err);
  }
};

export const createZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zone = await ZoneModel.create(req.body);
    res.status(201).json(zone);
  } catch (err) {
    next(err);
  }
};

export const updateZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zone = await ZoneModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json(zone);
  } catch (err) {
    next(err);
  }
};

export const deleteZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await ZoneModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Zone not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
