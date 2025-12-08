import { Router } from 'express';
import {
  listTourists,
  getTouristById,
  upsertTourist,
  deleteTourist,
} from './tourist.controller';

export const touristRouter = Router();

touristRouter.get('/', listTourists);
touristRouter.get('/:id', getTouristById);
touristRouter.post('/', upsertTourist);      // create or update
touristRouter.put('/:id', upsertTourist);
touristRouter.delete('/:id', deleteTourist);
