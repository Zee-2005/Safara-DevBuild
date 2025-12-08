import { Request, Response, NextFunction } from 'express';
import { TouristModel } from './tourist.model';

export const listTourists = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await TouristModel.find().sort({ updatedAt: -1 }).lean();
    res.json(docs);
  } catch (err) {
    next(err);
  }
};

export const getTouristById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await TouristModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Tourist not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

export const upsertTourist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      socketId,
      tid,
      personalId,
      name,
      email,
      phone,
      nationality,
      status,
      latitude,
      longitude,
    } = req.body;

    const query: any = { $or: [] };
    if (tid) query.$or.push({ tid });
    if (personalId) query.$or.push({ personalId });
    if (socketId) query.$or.push({ socketId });

    const base = query.$or.length ? query : { socketId };

    const doc = await TouristModel.findOneAndUpdate(
      base,
      {
        socketId,
        tid,
        personalId,
        name,
        email,
        phone,
        nationality,
        status,
        latitude,
        longitude,
        lastSeenAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(doc);
  } catch (err) {
    next(err);
  }
};

export const deleteTourist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await TouristModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Tourist not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
