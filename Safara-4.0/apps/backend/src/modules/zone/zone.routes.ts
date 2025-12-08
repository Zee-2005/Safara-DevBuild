import { Router } from 'express';
import {
  listZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
} from './zone.controller';

export const zoneRouter = Router();

zoneRouter.get('/', listZones);
zoneRouter.get('/:id', getZoneById);
zoneRouter.post('/', createZone);
zoneRouter.put('/:id', updateZone);
zoneRouter.delete('/:id', deleteZone);
