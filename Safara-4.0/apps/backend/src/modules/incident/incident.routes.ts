// src/modules/incident/incident.routes.ts
import { Router } from 'express';
import {
  createIncident,
  listIncidents,
  getIncidentById,
  updateIncidentStatus,
  deleteIncident,
} from './incident.controller';

export const incidentRouter = Router();

// GET /api/incidents
incidentRouter.get('/', listIncidents);

// POST /api/incidents
incidentRouter.post('/', createIncident);

// GET /api/incidents/:id
incidentRouter.get('/:id', getIncidentById);

// PATCH /api/incidents/:id/status
incidentRouter.patch('/:id/status', updateIncidentStatus);

// DELETE /api/incidents/:id
incidentRouter.delete('/:id', deleteIncident);
