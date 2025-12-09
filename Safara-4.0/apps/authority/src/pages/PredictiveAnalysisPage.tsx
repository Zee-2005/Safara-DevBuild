// src/pages/PredictiveAnalysisPage.tsx
import React from "react";
import PredictiveAnalysis from "./PredictiveAnalysis";
import {
  mockIncidents,
  mockSosEvents,
  mockRiskZones,
} from "@/mock/predictiveMock";

const PredictiveAnalysisPage: React.FC = () => (
  <PredictiveAnalysis
    incidents={mockIncidents as any}
    sosEvents={mockSosEvents as any}
    riskZones={mockRiskZones as any}
  />
);

export default PredictiveAnalysisPage;