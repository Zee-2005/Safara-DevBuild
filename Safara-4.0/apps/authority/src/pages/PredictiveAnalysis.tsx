// src/pages/PredictiveAnalysis.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Shield,
  MapPin,
  Calendar,
  Loader2,
  Sparkles,
  FileText,
  Download,
  FileSearch,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

import { base44 } from "@/api/base44Client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types are kept generic because your existing entities shape these.
// Adjust if you have TypeScript models already.
interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  status: string;
  description?: string;
  created_date: string;
  location?: { address?: string };
  [key: string]: any;
}

interface RiskZone {
  name: string;
  risk_level: string;
  category: string;
  severity_score: number;
  [key: string]: any;
}

interface SosEvent {
  trigger_type: string;
  escalation_level: string;
  status: string;
  created_date: string;
  [key: string]: any;
}

interface PredictiveAnalysisPageProps {
  incidents?: Incident[];
  riskZones?: RiskZone[];
  sosEvents?: SosEvent[];
  onIncidentsUpdated?: () => void;
}

const PredictiveAnalysis: React.FC<PredictiveAnalysisPageProps> = ({
  incidents = [],
  riskZones = [],
  sosEvents = [],
  onIncidentsUpdated,
}) => {
  // ---------- Shared state for Predictive Analytics ----------
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [predictions, setPredictions] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  // ---------- State for Report Generator ----------
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);

  // ---------- State for Automated Incident Analyzer ----------
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);

  // ==================== PREDICTIVE ANALYTICS SECTION ====================

  useEffect(() => {
    if (incidents.length > 0 || sosEvents.length > 0) {
      performPredictiveAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performPredictiveAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const incidentData = incidents.slice(0, 50).map((inc) => ({
        type: inc.incident_type,
        severity: inc.severity,
        location: inc.location?.address || "Unknown",
        timestamp: inc.created_date,
        status: inc.status,
      }));

      const sosData = sosEvents.slice(0, 30).map((sos) => ({
        trigger: sos.trigger_type,
        escalation: sos.escalation_level,
        status: sos.status,
        timestamp: sos.created_date,
      }));

      const riskData = riskZones.map((zone) => ({
        name: zone.name,
        level: zone.risk_level,
        category: zone.category,
        severity: zone.severity_score,
      }));

      const analysisPrompt = `Analyze this tourism safety data and provide predictive insights:

INCIDENTS (last 50):
${JSON.stringify(incidentData, null, 2)}

SOS EVENTS (last 30):
${JSON.stringify(sosData, null, 2)}

RISK ZONES:
${JSON.stringify(riskData, null, 2)}

Provide a comprehensive analysis with:
1. Pattern detection (trends, hotspots, timing patterns)
2. Risk predictions for next 7 days
3. Recommended preventive actions (priority ranked)
4. Resource allocation suggestions
5. High-risk areas that need immediate attention`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            patterns: {
              type: "object",
              properties: {
                trending_incident_types: {
                  type: "array",
                  items: { type: "string" },
                },
                hotspot_locations: {
                  type: "array",
                  items: { type: "string" },
                },
                peak_times: { type: "string" },
                severity_trend: { type: "string" },
              },
            },
            predictions: {
              type: "object",
              properties: {
                next_7_days_risk_score: { type: "number" },
                likely_incident_types: {
                  type: "array",
                  items: { type: "string" },
                },
                high_risk_areas: {
                  type: "array",
                  items: { type: "string" },
                },
                expected_sos_volume: { type: "string" },
              },
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string" },
                  action: { type: "string" },
                  impact: { type: "string" },
                  timeline: { type: "string" },
                },
              },
            },
            resource_allocation: {
              type: "object",
              properties: {
                patrol_areas: {
                  type: "array",
                  items: { type: "string" },
                },
                staffing_needs: { type: "string" },
                equipment_requirements: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
            urgent_attention: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  reason: { type: "string" },
                  severity: { type: "string" },
                },
              },
            },
          },
        },
      });

      setAnalysis(response);
      setPredictions(response.predictions);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error("Error performing predictive analysis:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  const getPriorityBadge = (priority?: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-blue-500",
    };
    return colors[priority?.toLowerCase() || ""] || "bg-gray-500";
  };

  // ==================== REPORT GENERATOR SECTION ====================

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const today = new Date();
      const timeFrame =
        reportType === "daily" ? 1 : reportType === "weekly" ? 7 : 30;

      const relevantIncidents = incidents.filter((inc) => {
        const incDate = new Date(inc.created_date);
        const daysDiff =
          (today.getTime() - incDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= timeFrame;
      });

      const relevantSOS = sosEvents.filter((sos) => {
        const sosDate = new Date(sos.created_date);
        const daysDiff =
          (today.getTime() - sosDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= timeFrame;
      });

      const prompt = `Generate a comprehensive ${reportType} tourism safety report:

PERIOD: Last ${timeFrame} day(s)
DATE: ${today.toLocaleDateString()}

INCIDENT DATA:
${JSON.stringify(
  relevantIncidents.map((inc) => ({
    type: inc.incident_type,
    severity: inc.severity,
    status: inc.status,
    location: inc.location?.address,
  })),
  null,
  2
)}

SOS EVENTS:
${JSON.stringify(
  relevantSOS.map((sos) => ({
    trigger: sos.trigger_type,
    status: sos.status,
    escalation: sos.escalation_level,
  })),
  null,
  2
)}

ACTIVE RISK ZONES: ${riskZones.length}

Generate a professional report with:
1. Executive Summary
2. Key Statistics
3. Incident Analysis
4. Trend Observations
5. Safety Performance Metrics
6. Recommendations
7. Action Items

Format as professional report text with sections.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            statistics: {
              type: "object",
              properties: {
                total_incidents: { type: "number" },
                total_sos: { type: "number" },
                critical_incidents: { type: "number" },
                resolved_incidents: { type: "number" },
                average_response_time: { type: "string" },
                most_common_incident_type: { type: "string" },
              },
            },
            incident_analysis: { type: "string" },
            trends: { type: "string" },
            performance_metrics: {
              type: "object",
              properties: {
                response_efficiency: { type: "string" },
                resolution_rate: { type: "string" },
                tourist_satisfaction: { type: "string" },
              },
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
            },
            action_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  priority: { type: "string" },
                  deadline: { type: "string" },
                },
              },
            },
          },
        },
      });

      setGeneratedReport({
        ...response,
        generated_date: today.toISOString(),
        report_type: reportType,
        time_frame: timeFrame,
      });
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!generatedReport) return;

    const reportText = `
SAFARA TOURISM SAFETY REPORT
${generatedReport.report_type.toUpperCase()} REPORT
Generated: ${new Date(
      generatedReport.generated_date
    ).toLocaleString()}
Period: Last ${generatedReport.time_frame} day(s)

════════════════════════════════════════════════

EXECUTIVE SUMMARY
${generatedReport.executive_summary}

KEY STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total Incidents: ${generatedReport.statistics.total_incidents}
• Total SOS Events: ${generatedReport.statistics.total_sos}
• Critical Incidents: ${generatedReport.statistics.critical_incidents}
• Resolved Incidents: ${generatedReport.statistics.resolved_incidents}
• Average Response Time: ${generatedReport.statistics.average_response_time}
• Most Common Type: ${generatedReport.statistics.most_common_incident_type}

INCIDENT ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generatedReport.incident_analysis}

TREND OBSERVATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generatedReport.trends}

PERFORMANCE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Response Efficiency: ${generatedReport.performance_metrics.response_efficiency}
• Resolution Rate: ${generatedReport.performance_metrics.resolution_rate}
• Tourist Satisfaction: ${generatedReport.performance_metrics.tourist_satisfaction}

RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generatedReport.recommendations
  .map((rec: string, i: number) => `${i + 1}. ${rec}`)
  .join("\n")}

ACTION ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generatedReport.action_items
  .map(
    (action: any, i: number) =>
      `${i + 1}. [${action.priority}] ${action.item}\n   Deadline: ${
        action.deadline
      }`
  )
  .join("\n\n")}

════════════════════════════════════════════════
End of Report
    `;

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safara-${generatedReport.report_type}-report-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    a.click();
  };

  // ==================== AUTOMATED INCIDENT ANALYZER SECTION ====================

  const analyzePendingIncidents = async () => {
    setIsAutoAnalyzing(true);

    const pendingIncidents = incidents.filter(
      (inc) => inc.status === "reported" || inc.status === "acknowledged"
    );

    if (pendingIncidents.length === 0) {
      setIsAutoAnalyzing(false);
      return;
    }

    try {
      const results: any[] = [];

      for (const incident of pendingIncidents.slice(0, 10)) {
        const prompt = `Analyze this tourist safety incident and provide automated assessment:

Incident Details:
- Type: ${incident.incident_type}
- Severity: ${incident.severity}
- Location: ${incident.location?.address || "Unknown"}
- Description: ${incident.description}
- Status: ${incident.status}
- Time: ${new Date(incident.created_date).toLocaleString()}

Provide:
1. Legitimacy assessment (genuine/suspicious/false alarm)
2. Urgency score (1-10)
3. Recommended priority level (critical/high/medium/low)
4. Suggested immediate actions
5. Required resources
6. Estimated resolution time`;

        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              legitimacy: {
                type: "string",
                enum: ["genuine", "suspicious", "false_alarm"],
              },
              urgency_score: { type: "number" },
              priority: {
                type: "string",
                enum: ["critical", "high", "medium", "low"],
              },
              immediate_actions: {
                type: "array",
                items: { type: "string" },
              },
              required_resources: {
                type: "array",
                items: { type: "string" },
              },
              estimated_resolution_hours: { type: "number" },
              reasoning: { type: "string" },
            },
          },
        });

        results.push({
          incident_id: incident.id,
          incident,
          analysis: response,
        });

        await base44.entities.Incident.update(incident.id, {
          ...incident,
          ai_analysis: JSON.stringify(response),
          ai_urgency_score: response.urgency_score,
          ai_priority: response.priority,
        });
      }

      setAnalysisResults(results);
      onIncidentsUpdated?.();
    } catch (error) {
      console.error("Error analyzing incidents:", error);
    } finally {
      setIsAutoAnalyzing(false);
    }
  };

  const getLegitimacyColor = (legitimacy?: string) => {
    switch (legitimacy) {
      case "genuine":
        return "bg-green-500";
      case "suspicious":
        return "bg-yellow-500";
      case "false_alarm":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "border-red-500 bg-red-50";
      case "high":
        return "border-orange-500 bg-orange-50";
      case "medium":
        return "border-yellow-500 bg-yellow-50";
      case "low":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  const pendingCount = incidents.filter(
    (inc) => inc.status === "reported" || inc.status === "acknowledged"
  ).length;

  // ==================== PAGE RENDER ====================

  return (
    <div className="space-y-8 p-6">
      {/* TOP HERO: Predictive Analytics header */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-8 h-8" />
              </motion.div>
              <div>
                <CardTitle className="text-white">
                  AI Predictive Analysis & Reports
                </CardTitle>
                <p className="text-sm text-purple-100 mt-1">
                  Machine learning insights, automated triage, and
                  auto-generated safety reports
                </p>
              </div>
            </div>
            <Button
              onClick={performPredictiveAnalysis}
              disabled={isAnalyzing}
              variant="secondary"
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Refresh Forecast
                </>
              )}
            </Button>
          </div>
          {lastAnalyzed && (
            <p className="text-xs text-purple-100 mt-2">
              Last analyzed: {lastAnalyzed.toLocaleString()}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* LOADING STATE FOR PREDICTIVE ANALYTICS */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-8 text-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            </motion.div>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              AI Analysis in Progress
            </p>
            <p className="text-gray-600">
              Processing patterns, predicting risks, and generating
              recommendations...
            </p>
          </CardContent>
        </Card>
      )}

      {/* MAIN GRID: Forecast + Analyzer + Report generator */}
      {analysis && !isAnalyzing && (
        <>
          {/* 7-day Forecast */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  7-Day Risk Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      Risk Score:{" "}
                      {predictions?.next_7_days_risk_score ?? 0}
                      /100
                    </span>
                    <Badge
                      className={`${
                        (predictions?.next_7_days_risk_score ?? 0) > 70
                          ? "bg-red-500"
                          : (predictions?.next_7_days_risk_score ?? 0) > 40
                          ? "bg-orange-500"
                          : "bg-green-500"
                      }`}
                    >
                      {(predictions?.next_7_days_risk_score ?? 0) > 70
                        ? "High Risk"
                        : (predictions?.next_7_days_risk_score ?? 0) > 40
                        ? "Moderate"
                        : "Low Risk"}
                    </Badge>
                  </div>
                  <Progress value={predictions?.next_7_days_risk_score ?? 0} />

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-orange-900 mb-2">
                        Likely Incident Types
                      </p>
                      <ul className="space-y-1">
                        {predictions?.likely_incident_types?.map(
                          (type: string, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-orange-700 flex items-center gap-2"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {type}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-red-900 mb-2">
                        High Risk Areas
                      </p>
                      <ul className="space-y-1">
                        {predictions?.high_risk_areas?.map(
                          (area: string, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-red-700 flex items-center gap-2"
                            >
                              <MapPin className="w-3 h-3" />
                              {area}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Expected SOS Volume
                    </p>
                    <p className="text-blue-700">
                      {predictions?.expected_sos_volume}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Patterns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Detected Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Trending Incidents
                    </p>
                    <div className="space-y-2">
                      {analysis.patterns?.trending_incident_types?.map(
                        (type: string, i: number) => (
                          <Badge key={i} variant="outline" className="mr-2">
                            {type}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Hotspot Locations
                    </p>
                    <div className="space-y-2">
                      {analysis.patterns?.hotspot_locations?.map(
                        (loc: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <MapPin className="w-3 h-3 text-red-500" />
                            {loc}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Peak Times
                    </p>
                    <p className="text-sm text-gray-600">
                      {analysis.patterns?.peak_times}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Severity Trend
                    </p>
                    <p className="text-sm text-gray-600">
                      {analysis.patterns?.severity_trend}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  AI-Recommended Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recommendations?.map((rec: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Badge className={getPriorityBadge(rec.priority)}>
                        {rec.priority}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {rec.action}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Impact: {rec.impact}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {rec.timeline}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Resource Allocation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Optimal Resource Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Priority Patrol Areas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.resource_allocation?.patrol_areas?.map(
                        (area: string, i: number) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="bg-blue-50"
                          >
                            {area}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Staffing Recommendations
                    </p>
                    <p className="text-sm text-gray-600">
                      {analysis.resource_allocation?.staffing_needs}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Equipment Needs
                    </p>
                    <ul className="space-y-1">
                      {analysis.resource_allocation?.equipment_requirements?.map(
                        (eq: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600">
                            • {eq}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Urgent Attention */}
          {analysis.urgent_attention?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-2 border-red-300 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <AlertTriangle className="w-5 h-5" />
                    Urgent Attention Required
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.urgent_attention.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="bg-white p-4 rounded-lg border-l-4 border-red-500"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {item.area}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.reason}
                            </p>
                          </div>
                          <Badge
                            className={`${getSeverityColor(
                              item.severity
                            )} bg-red-100`}
                          >
                            {item.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}

      {/* ===== SECOND BLOCK ROW: AUTOMATED INCIDENT ANALYZER + REPORT GENERATOR ===== */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Automated Incident Analyzer */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <FileSearch className="w-6 h-6 text-purple-600" />
                  </motion.div>
                  <div>
                    <CardTitle>Automated Incident Analyzer</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      AI-powered incident assessment and prioritization
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gap-2">
                    <Clock className="w-3 h-3" />
                    {pendingCount} Pending
                  </Badge>
                  <Button
                    onClick={analyzePendingIncidents}
                    disabled={isAutoAnalyzing || pendingCount === 0}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
                  >
                    {isAutoAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze All
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {analysisResults.length > 0 && (
            <div className="space-y-3">
              {analysisResults.map((result, index) => (
                <motion.div
                  key={result.incident_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`border-l-4 ${getPriorityColor(
                      result.analysis.priority
                    )}`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                className={getLegitimacyColor(
                                  result.analysis.legitimacy
                                )}
                              >
                                {result.analysis.legitimacy}
                              </Badge>
                              <Badge variant="outline">
                                Urgency: {result.analysis.urgency_score}/10
                              </Badge>
                              <Badge
                                className={
                                  result.analysis.priority === "critical"
                                    ? "bg-red-500"
                                    : result.analysis.priority === "high"
                                    ? "bg-orange-500"
                                    : result.analysis.priority === "medium"
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                                }
                              >
                                {result.analysis.priority} Priority
                              </Badge>
                            </div>
                            <p className="font-semibold text-gray-900">
                              {result.incident.incident_type} -{" "}
                              {result.incident.location?.address}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {result.incident.description}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/50 p-3 rounded-lg">
                          <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            AI Assessment
                          </p>
                          <p className="text-sm text-gray-600">
                            {result.analysis.reasoning}
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              Immediate Actions
                            </p>
                            <ul className="space-y-1">
                              {result.analysis.immediate_actions?.map(
                                (action: string, i: number) => (
                                  <li
                                    key={i}
                                    className="text-xs text-gray-600 flex items-start gap-2"
                                  >
                                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{action}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              Required Resources
                            </p>
                            <ul className="space-y-1">
                              {result.analysis.required_resources?.map(
                                (resource: string, i: number) => (
                                  <li
                                    key={i}
                                    className="text-xs text-gray-600 flex items-start gap-2"
                                  >
                                    <AlertCircle className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span>{resource}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          Estimated resolution:{" "}
                          {result.analysis.estimated_resolution_hours} hours
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Intelligent Report Generator */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <CardTitle>AI Report Generator</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Automated comprehensive safety reports
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={reportType}
                  onValueChange={(val: "daily" | "weekly" | "monthly") =>
                    setReportType(val)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          {generatedReport && (
            <CardContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Executive Summary
                  </h3>
                  <p className="text-sm text-blue-800">
                    {generatedReport.executive_summary}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {generatedReport.statistics.total_incidents}
                    </p>
                    <p className="text-sm text-gray-600">Total Incidents</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {generatedReport.statistics.critical_incidents}
                    </p>
                    <p className="text-sm text-gray-600">Critical</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {generatedReport.statistics.resolved_incidents}
                    </p>
                    <p className="text-sm text-gray-600">Resolved</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Incident Analysis
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {generatedReport.incident_analysis}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Trends</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {generatedReport.trends}
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {generatedReport.recommendations.map(
                      (rec: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm text-yellow-800"
                        >{`• ${rec}`}</li>
                      )
                    )}
                  </ul>
                </div>

                <Button
                  onClick={downloadReport}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Download className="w-4 h-4" />
                  Download Full Report
                </Button>
              </motion.div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PredictiveAnalysis;