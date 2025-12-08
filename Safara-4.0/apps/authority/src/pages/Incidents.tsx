



// src/pages/Incidents.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  User,
  FileText,
  Send,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuthorityData } from "@/context/AuthorityDataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Socket } from "socket.io-client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import EFIR, { generateEFIRContent, handleDownloadPDF } from "./EFIR"; // or wherever EFIR is

// MAIN FUNCTION — SAFE, PERFECT, NO ERRORS



/**
 * Reverse geocode helper — returns human readable name for lat/lng
 * NOTE: Nominatim has rate limits. This caches results locally per session.
 */
 


async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Safara/1.0 (your-email@example.com)",
          "Accept-Language": "en",
        },
      }
    );
    const data = await res.json();
    return data?.display_name || "Unknown Location";
  } catch (err) {
    console.error("Reverse geocode error:", err);
    return "Unknown Location";
  }
}

const Incidents: React.FC = () => {
  const {
    incidents: ctxIncidents = [],
    tourists = {},
    personal,
  } = useAuthorityData();
const navigate = useNavigate();
  // Local copy of incidents so we can optimistically update status (mark resolved / reopen)
  const [incidents, setIncidents] = useState<typeof ctxIncidents>([]);

  // selected incident id for details pane
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // modal state for view details
  const [selectedIncidentForModal, setSelectedIncidentForModal] = useState<any | null>(null);

  // cache human-readable place names per incident id (or latlng key)
  const [placeCache, setPlaceCache] = useState<Record<string, string>>({});

const [showEFIRModal, setShowEFIRModal] = useState(false);
const [efirIncident, setEfirIncident] = useState<any>(null);

  // When context incidents update, sync local state
  useEffect(() => {
    setIncidents(ctxIncidents ?? []);
    // ensure selectedIncidentId remains valid
    if (ctxIncidents && selectedIncidentId) {
      if (!ctxIncidents.find((i: any) => i.id === selectedIncidentId)) {
        setSelectedIncidentId(null);
      }
    }
  }, [ctxIncidents]);

  useEffect(() => {
  fetch('http://localhost:3000/api/incidents')
    .then((r) => r.json())
    .then((data) => {
      // data is array of incidents from Mongo
      setIncidents(data);
    });
}, []);

const API_BASE = "http://localhost:3000";

const handleDeleteIncident = async (id: string) => {
  await fetch(`${API_BASE}/api/incidents/${id}`, {
    method: "DELETE",
  });
  setIncidents((prev) => prev.filter((i: any) => i._id !== id && i.id !== id));
};


  // Helper: find tourist data referenced by an incident
  // const findTouristFromIncident = (inc: any) => {
  //   // try direct fields first
  //   if (inc.touristName || inc.touristPhone) {
  //     return {
  //       name: inc.touristName,
  //       phone: inc.touristPhone,
  //       id: inc.id,
  //     };
  //   }

  //   // if incident supplies touristId, try to find matching tourist by id or personalId
  //   const tid = inc.touristId;
  //   console.log(tid);
  //   if (tid) {
  //     const byId = Object.values(tourists).find(
  //       (t: any) => t.id === tid || t.personalId === tid || t.tid === tid
  //     );
  //     if (byId) {
  //       return { name: byId.name, phone: byId.phone, id: byId.id };
  //     }
  //   }

  //   // if touristSocketId provided, try match by socket id too
  //   if (inc.touristSocketId) {
  //     const bySock = Object.values(tourists).find((t: any) => t.id === inc.touristSocketId);
  //     if (bySock) return { name: bySock.name, phone: bySock.phone, id: bySock.id };
  //   }

  //   // nothing found
  //   return { name: inc.touristName || "Unknown Tourist", phone: inc.touristPhone || "", id: inc.touristId || "" };
  // };


const findTouristFromIncident = (inc: any, tourists: any) => {
  // 1. DIRECT INCIDENT FIELDS (highest priority)
  if (inc.touristName || inc.touristPhone || inc.touristEmail) {
    return {
      name: inc.touristName || "Unknown",
      phone: inc.touristPhone || "",
      email: inc.touristEmail || "",
      id: inc.id || inc.touristId || "",
    };
  }

  // 2. MATCH USING touristId / personalId / tid
  const tid = inc.touristId;
  if (tid) {
    const matchById = Object.values(tourists).find(
      (t: any) =>
        t.id === tid ||
        t.personalId === tid ||
        t.tid === tid
    );
console.log(matchById);
    if (matchById) {
      return {
        name: matchById.name || "Unknown",
        phone: matchById.phone || "",
        email: matchById.email || "",
        id: matchById.id || "",
      };
    }
  }

  // 3. MATCH USING touristSocketId
  if (inc.touristSocketId) {
    const matchBySocket = Object.values(tourists).find(
      (t: any) => t.socketId === inc.touristSocketId
    );
console.log(matchBySocket);
    if (matchBySocket) {
      return {
        name: matchBySocket.name,
        phone: matchBySocket.phone,
        email: matchBySocket.email,
        id: matchBySocket.id,
      };
    }
  }

  // 4. NOTHING FOUND → fallback
  return {
    name: inc.touristName || "Unknown Tourist",
    phone: inc.touristPhone || "",
    email: inc.touristEmail || "",
    id: inc.touristId || "",
  };
};



  // memoized list for rendering
  const incidentList = useMemo(() => incidents || [], [incidents]);

  // compute selected incident object
  const selectedIncident = useMemo(
    () => incidentList.find((i: any) => i.id === selectedIncidentId) ?? null,
    [incidentList, selectedIncidentId]
  );

  // Reverse geocode any incidents that have coordinates and not cached already
  useEffect(() => {
    let active = true;
    const toResolve: Array<Promise<void>> = [];

    for (const inc of incidentList) {
      const loc = inc.location;
      // accept shapes: { lat, lng } or { latitude, longitude } or location.name already present
      const lat = loc?.lat ?? loc?.latitude ?? loc?.latitude;
      const lng = loc?.lng ?? loc?.longitude ?? loc?.longitude;
      const cacheKey = inc.id || `${lat}:${lng}`;
      if ((lat || lng) && !placeCache[cacheKey]) {
        const p = (async () => {
          const name = await reverseGeocode(Number(lat), Number(lng));
          if (!active) return;
          setPlaceCache(prev => ({ ...prev, [cacheKey]: name }));
        })();
        toResolve.push(p);
      } else if (loc?.name && !placeCache[inc.id]) {
        // if backend already sent a place name, cache it
        setPlaceCache(prev => ({ ...prev, [inc.id]: loc.name }));
      }
    }

    // no need to await; side-effects fill cache
    return () => {
      active = false;
    };
  }, [incidentList, placeCache]);

  // severity badge
  const getSeverityBadge = (severity: string | undefined) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-600 text-white">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500 text-white">Medium Priority</Badge>;
      case "low":
        return <Badge className="bg-blue-500 text-white">Low Priority</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // status badge
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "responding":
      case "new":
      case "acknowledged":
        return <Badge className="bg-red-600 text-white animate-pulse">Responding</Badge>;
      case "assigned":
        return <Badge className="bg-yellow-500 text-white">Assigned</Badge>;
      case "resolved":
        return <Badge className="bg-green-600 text-white">Resolved</Badge>;
      case "pending":
        return <Badge className="bg-slate-400 text-white">Pending</Badge>;
      default:
        return <Badge variant="outline">{status ?? "Unknown"}</Badge>;
    }
  };

  // Actions
  const handleView = (inc: any) => {
    setSelectedIncidentId(inc.id);
    setSelectedIncidentForModal(inc);
  };

  const handleLocate = (inc: any) => {
    // prefer incident location lat/lng, else fallback to linked tourist coords
    const loc = inc.location;
    const lat = loc?.lat ?? loc?.latitude ?? loc?.lat ?? null;
    const lng = loc?.lng ?? loc?.longitude ?? loc?.lng ?? null;

    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
      return;
    }

    // fallback: try find tourist coords
    const t = findTouristFromIncident(inc);
    if (t?.id) {
      const byId = Object.values(tourists).find((x: any) => x.id === t.id || x.personalId === t.id);
      if (byId?.latitude && byId?.longitude) {
        window.open(`https://www.google.com/maps?q=${byId.latitude},${byId.longitude}`, "_blank");
        return;
      }
    }

    alert("Location not available for this incident.");
  };

  const handleContact = (inc: any) => {
    const t = findTouristFromIncident(inc);
    const phone = inc.touristPhone || t.phone || "";
    if (!phone) {
      alert("Phone number not available.");
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  // Mark resolved / reopen (local update; you can emit socket or call API here)
  const toggleResolved = (incId: string) => {
    setIncidents(prev => prev.map(i => i.id === incId ? { ...i, status: i.status === "resolved" ? "assigned" : "resolved" } : i));
    // TODO: send socket emit or API call to persist on server
  };
const sendIncidentUpdate = (incident: any) => {
  const payload = {
    id: incident.id,
    status: incident.status,
    timestamp: Date.now(),
    authority: personal?.pid_full_name || "Authority",
  };

  socket.emit("incident:update", payload);

  toast.success("Update sent to server!");
};
const handleEmergencyResponse = (incident: any) => {
  const t = findTouristFromIncident(incident);

  // 1. Call instantly
  if (t.phone) window.location.href = `tel:${t.phone}`;

  // 2. Auto open map
  const lat = incident?.location?.lat ?? incident.location?.latitude;
  const lng = incident?.location?.lng ?? incident.location?.longitude;
  if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");

  // 3. Notify server
  socket.emit("incident:emergency", {
    id: incident.id,
    time: Date.now(),
    authority: personal.pid_full_name,
  });

  toast.success("Emergency response triggered!");
};


// 🔥 MAIN FIX: Build full tourist object safely
const prepareTouristData = (inc,tourists) => {
  const t = findTouristFromIncident(inc,tourists) || {};
console.log(t);
  return {
    name: inc.touristName || t.name || "Unknown",
    phone: inc.touristPhone || t.phone || "N/A",
    email: inc.touristEmail || t.email || "N/A",
    nationality: t.nationality || "Unknown",
    personalId: inc.id || t.personalId || t.id || "N/A",

    // location
    latitude: inc.location?.lat || t.latitude || null,
    longitude: inc.location?.lng || t.longitude || null,
  };
};



const generatePDFReport = (tourist, incidents = [], placeName = "Unknown") => {
  
  try {
    // SAFE VALIDATION
    if (!tourist) throw new Error("Tourist data missing");
    if (!Array.isArray(incidents)) incidents = [];

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Tourist Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Name: ${tourist.name || "N/A"}`, 14, 35);
    doc.text(`Phone: ${tourist.phone || "N/A"}`, 14, 43);
    doc.text(`Email: ${tourist.email || "N/A"}`, 14, 51);
    doc.text(`Nationality: ${tourist.nationality || "N/A"}`, 14, 59);
    doc.text(`Personal ID: ${tourist.id || "N/A"}`, 14, 67);

    doc.text("Live Location:", 14, 80);
    doc.text(`${placeName}`, 14, 88);

    doc.setTextColor(0, 0, 255);
    doc.textWithLink("Open on Google Maps", 14, 98, {
      url: `https://maps.google.com/?q=${tourist.latitude || 0},${tourist.longitude || 0}`,
    });
    doc.setTextColor(0, 0, 0);

    // INCIDENT TABLE (SAFE)
    autoTable(doc, {
      startY: 110,
      head: [["Time", "Type", "Status"]],
      body: incidents.map((inc) => [
        inc.time || "N/A",
        inc.type || "N/A",
        inc.status || "N/A",
      ]),
    });

    doc.save(`Tourist_Report_${tourist.name || "Unknown"}.pdf`);
  } catch (error) {
    console.error("PDF ERROR:", error);
  }
};


const printReport = (tourist, incidents = []) => {
  const win = window.open("", "_blank");

  const html = `
    <h2>Tourist Report</h2>
    <p><b>Name:</b> ${tourist.name}</p>
    <p><b>Phone:</b> ${tourist.phone}</p>
    <p><b>Email:</b> ${tourist.email}</p>
    <p><b>Nationality:</b> ${tourist.nationality}</p>
    <p><b>ID:</b> ${tourist.id}</p>
    <p><b>Location:</b> ${tourist.latitude}, ${tourist.longitude}</p>
    <a href="https://maps.google.com/?q=${tourist.latitude},${tourist.longitude}" target="_blank">
      View Live Location
    </a>

    <h3>Incidents</h3>
    <ul>
      ${
        incidents.length > 0
          ? incidents.map(i => `<li>${i.type} - ${i.status}</li>`).join("")
          : "<li>No Incidents</li>"
      }
    </ul>
  `;

  win.document.write(html);
  win.print();
  win.close();
};

 
const shareReport = async (inc, incidents = []) => {
  try {
    const tourist = prepareTouristData(inc,tourists);
console.log(tourist);
    const liveLoc = tourist.latitude
      ? `https://maps.google.com/?q=${tourist.latitude},${tourist.longitude}`
      : "Location Not Available";

    const text = `
Tourist Report
Name: ${tourist.name}
Phone: ${tourist.phone}
Email: ${tourist.email}
Nationality: ${tourist.nationality}
Personal ID: ${tourist.id}

Live Location:
${liveLoc}

Incidents:
${incidents.length ? incidents.map(i => `• ${i.type} (${i.status})`).join("\n") : "No Incidents"}
`;

    if (navigator.share) {
      await navigator.share({ title: "Tourist Report", text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    }
  } catch (err) {
    console.log("Share canceled", err);
  }
};





  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incident Management</h1>
          <p className="text-muted-foreground">Monitor and respond to SOS alerts and security incidents</p>
        </div>
<div className="flex gap-2">
 
  <Button
    className="emergency-gradient text-white"
    onClick={() => handleEmergencyResponse(selectedIncident)}
  >
    <Phone className="w-4 h-4 mr-2" /> Emergency Response
  </Button>
</div>


      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Incidents List */}
        <div className="lg:col-span-2 space-y-4">
          {incidentList.length === 0 && (
            <Card className="card-shadow">
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No incidents</h3>
                  <p className="text-muted-foreground">No incidents available right now.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {incidentList.map((incident: any) => {
            const tourist = findTouristFromIncident(incident);
            const placeKey = incident.id || `${incident.location?.lat}:${incident.location?.lng}`;
            const placeName = placeCache[placeKey] || incident.location?.name || "Unknown Location";
            return (
              <Card
                key={incident.id}
                className={`card-shadow hover:shadow-lg transition-all cursor-pointer ${selectedIncidentId === incident.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedIncidentId(incident.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{incident.id}</code>
                        <span>{incident.type ?? "Incident"}</span>
                        {getSeverityBadge(incident.severity)}
                      </CardTitle>
                      <CardDescription className="mt-2 text-sm">
                        {incident.description ?? "No description available"}
                      </CardDescription>
                    </div>

                    {getStatusBadge(incident.status)}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium flex items-center gap-1">
                        <User className="w-4 h-4" /> Tourist
                      </p>
                      <p className="text-muted-foreground">{tourist.name || incident.touristName || "Unknown"}</p>
                    </div>

                    <div>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> Location
                      </p>
                      <p className="text-muted-foreground">{placeName}</p>
                    </div>

                    <div>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Time
                      </p>
                      <p className="text-muted-foreground">
                        {incident.timestamp ? new Date(incident.timestamp).toLocaleString() : (incident.time ?? "Unknown")}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium">Response Time</p>
                      <p className="text-muted-foreground">{incident.responseTime ?? "-"}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleView(incident); }}>
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>

                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleLocate(incident); }}>
                      <MapPin className="w-3 h-3 mr-1" /> Locate
                    </Button>

                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleContact(incident); }}>
                      <Phone className="w-3 h-3 mr-1" /> Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Incident Details / Right Column */}
        <div className="space-y-6">
          {selectedIncident ? (
            <>
              {/* Quick Actions */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
<Button
  className="w-full authority-gradient text-white"
  onClick={() => sendIncidentUpdate(selectedIncident)}
>
  <Send className="w-4 h-4 mr-2" /> Send Update
</Button>


                  <Button variant="outline" className="w-full" onClick={() => handleContact(selectedIncident)}>
                    <Phone className="w-4 h-4 mr-2" /> Call Tourist
                  </Button>

                  <Button variant="outline" className="w-full" onClick={() => handleLocate(selectedIncident)}>
                    <MapPin className="w-4 h-4 mr-2" /> Track Location
                  </Button>
<Button
  variant="outline"
  size="sm"
  className="w-full" 
  onClick={(e) => {
    e.stopPropagation();
    handleDeleteIncident(selectedIncident._id || selectedIncident.id);
  }}
>
  Delete
</Button>



                  {selectedIncident.status !== "resolved" ? (
                    <Button variant="outline" className="w-full text-success border-success" onClick={() => toggleResolved(selectedIncident.id)}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Mark Resolved
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full text-emergency border-emergency" onClick={() => toggleResolved(selectedIncident.id)}>
                      <XCircle className="w-4 h-4 mr-2" /> Reopen Incident
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Response Timeline</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {(selectedIncident.timeline || []).map((ev: any, idx: number) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ev.event}</p>
                          <p className="text-xs text-muted-foreground">{ev.time} • {ev.user}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Evidence */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Evidence & Files</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2">
                    {(selectedIncident.evidence || []).map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{item}</span>
                        <Button variant="ghost" size="sm" onClick={() => { /* preview logic */ }}>
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="card-shadow">
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select an Incident</h3>
                  <p className="text-muted-foreground">Click on an incident from the list to view details and take action.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
{/* Modal for full view */}
<Dialog
  open={!!selectedIncidentForModal}
  onOpenChange={() => setSelectedIncidentForModal(null)}
>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Incident Details</DialogTitle>
    </DialogHeader>

    {selectedIncidentForModal && (
      <div className="space-y-3">
        <p><strong>ID:</strong> {selectedIncidentForModal.id}</p>
        <p><strong>Email:</strong> {selectedIncidentForModal.touristSocketId}</p>
        <p><strong>Description:</strong> {selectedIncidentForModal.description}</p>
        <p><strong>Status:</strong> {selectedIncidentForModal.status ?? selectedIncidentForModal.time}</p>

        <p>
          <strong>Tourist:</strong>{" "}
          {findTouristFromIncident(selectedIncidentForModal).name}
        </p>
        <p>
          <strong>Phone:</strong>{" "}
          {findTouristFromIncident(selectedIncidentForModal).phone}
        </p>

        <p>
          <strong>Location:</strong>{" "}
          {placeCache[selectedIncidentForModal.id] ||
            selectedIncidentForModal.location?.name ||
            "Unknown"}
        </p>

        {/* ------------------------ EXTRA FEATURE BUTTONS ------------------------ */}
        <div className="flex flex-wrap gap-3 mt-5">

          {/* DOWNLOAD PDF */}
          <Button
            variant="outline"
            onClick={() => {
              const tourist = prepareTouristData(selectedIncidentForModal);
              const allInc = incidents.filter(
                i => i.touristId === selectedIncidentForModal.touristId
              );
              const placeKey =
                selectedIncidentForModal.id ||
                `${selectedIncidentForModal.location?.lat}:${selectedIncidentForModal.location?.lng}`;
              const placeName =
                placeCache[placeKey] ||
                selectedIncidentForModal.location?.name ||
                "Unknown Location";
              generatePDFReport(tourist, allInc, placeName);
            }}
          >
            Download PDF
          </Button>

          {/* SHARE DETAILS */}
          <Button
            variant="outline"
            onClick={() => {
              const allInc = incidents.filter(
                i => i.id === selectedIncidentForModal.id
              );
              shareReport(selectedIncidentForModal, allInc);
            }}
          >
            Share
          </Button>

          {/* PRINT REPORT */}
          <Button
            variant="outline"
            onClick={() => {
              const tourist = prepareTouristData(selectedIncidentForModal);
              const allInc = incidents.filter(
                i => i.touristId === selectedIncidentForModal.touristId
              );
              printReport(tourist, allInc);
            }}
          >
            Print
          </Button>

          {/* OPEN MAP */}
          <Button
            onClick={() => {
              handleLocate(selectedIncidentForModal);
              setSelectedIncidentForModal(null);
            }}
          >
            Open in Maps
          </Button>

          {/* CLOSE */}
          <Button
            variant="outline"
            onClick={() => setSelectedIncidentForModal(null)}
          >
            Close
          </Button>

          {/* ----------------- GENERATE / VIEW E-FIR ----------------- */}


{/*<Button
  variant="outline"
  onClick={() => {
    setShowEFIRModal(true);
    setEfirIncident(selectedIncidentForModal);
  }}
>
  View / Generate E-FIR
</Button>*/}





<Button
  variant="outline"
  onClick={() => {
    navigate("/efir", { state: { incident: selectedIncidentForModal } });
  }}
>
  View / Generate E-FIR
</Button>


          {/* --------------------------------------------------------- */}

        </div>
      </div>
    )}
  </DialogContent>
</Dialog>



{/* EFIR Modal */}
{showEFIRModal && efirIncident && (
  <Dialog
    open={showEFIRModal}
    onOpenChange={() => setShowEFIRModal(false)}
  >
    <DialogContent>
      <EFIR alert={efirIncident} /> {/* Pass the selected incident as alert prop */}
    </DialogContent>
  </Dialog>
)}

    </div>
  );
};

export default Incidents;
