


import React, { useState, useEffect } from "react";
import { useAuthorityData } from "@/context/AuthorityDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Mail, Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import { io, Socket } from "socket.io-client";
import { useLocation } from "react-router-dom";
import { log } from "console";
interface TouristLocation {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  destination?: string;
  status?: string;
  tripStart?: string;
  tripEnd?: string;
  timestamp?: number;
  personalId?: string;
}

interface Incident {
  id: string;
  type?: string;
  touristId?: string;
  touristName?: string;
  touristPhone?: string;
  location?: { lat: number; lng: number };
  description?: string;
  status?: "new" | "acknowledged" | "resolved";
  [key: string]: any;
}

interface EFIR {
  id: string;
  zoneId: string;
  zoneName: string;
  touristId?: string;
  touristName?: string;
  email?: string;
  mobile?: string;
  latitude?: number;
  longitude?: number;
  nationality?: string;
  description: string;
  timestamp: string;
  status: "pending" | "submitted" | "resolved";
}

async function getPlaceName(lat: number, lng: number): Promise<string> {
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
    return data.display_name || "Unknown Location";
  } catch (err) {
    console.error("Reverse geocode error:", err);
    return "Unknown Location";
  }
}

const EFIR: React.FC = () => {
  const { zones, liveAlerts,touristInfo} = useAuthorityData();
  const [tourists, setTourists] = useState<Record<string, TouristLocation>>({});

const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const touristArray = Object.values(tourists); // Convert object to array
const location = useLocation();
  const incident = location.state?.incident;
console.log(incident);

  useEffect(() => {
    const fetchLocations = async () => {
      const newLocations: Record<string, string> = {};
      const newProcessedIds = new Set(processedIds);

      for (const tourist of touristArray) {
        if (!tourist.id) continue;

        // Only fetch location if NOT already processed
        if (!newProcessedIds.has(tourist.id)) {
          const location = await getPlaceName(tourist.latitude, tourist.longitude);
          newLocations[tourist.id] = location;
          newProcessedIds.add(tourist.id);
          
        }
      }
      if (Object.keys(newLocations).length > 0) {
        setTouristLocations(prev => ({ ...prev, ...newLocations }));
        setProcessedIds(newProcessedIds);
      }
    };

    fetchLocations();
  }, [tourists]);
  
  
  
  const [efirs, setEfirs] = useState<EFIR[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [description, setDescription] = useState("");
const [manualFIR, setManualFIR] = useState<Partial<EFIR & {
  district?: string;
  policeStation?: string;
  landmark?: string;
  latitude?: string;
  longitude?: string;
}>>({
  zoneName: "",
  zoneId: "",
  latitude: "",
  longitude: "",
  district: "",
  policeStation: "",
  landmark: "",
  touristName: "",
  touristId: "",
  email: "",
  mobile: "",
  nationality: "",
  description: "",
});



useEffect(() => {
  const SOCKET_URL = import.meta.env.VITE_AUTHORITY_SOCKET_URL || "http://localhost:3000";
  const socket: Socket = io(SOCKET_URL, { transports: ["websocket", "polling"], reconnection: true });

  // Request full data when connected
  socket.on("connect", () => {
    console.log("Connected → requesting active tourist list...");
    socket.emit("get-active-tourists");
    socket.emit("get-incident-list"); // optional if needed
  });

  // ------------------- Tourist Events -------------------
  socket.on("receive-location", (raw: any) => {
    const data: TouristLocation = {
      id: raw.socketId || raw.id || raw.tid,
      latitude: raw.latitude ?? raw.lat,
      longitude: raw.longitude ?? raw.lng,
      name: raw.name,
      phone: raw.phone,
      email: raw.email,
      nationality: raw.nationality,
      destination: raw.destination,
      status: raw.status,
      tripStart: raw.tripStart,
      tripEnd: raw.tripEnd,
      timestamp: raw.timestamp || Date.now(),
      personalId: raw.personalId,
    };
    if (!data.id || !data.latitude || !data.longitude) return;
    addOrUpdateTourist(data);
  });

  socket.on("active-tourist-list", (list: TouristLocation[]) => {
    console.log("Received full tourist list:", list);
    list.forEach(t => addOrUpdateTourist(t));
  });

  socket.on("user-disconnected", removeTourist);

  // ------------------- Incident Events -------------------
  socket.on("incident-new", (inc: Incident) => {
    handleIncidentFIR(inc);
  });

  socket.on("incident-list", (list: Incident[]) => {
    list.forEach(inc => handleIncidentFIR(inc));
  });

  socket.on("incident-updated", (inc: Incident) => {
    setEfirs(prev => prev.map(f => (f.id === inc.id ? { ...f, status: inc.status || f.status } : f)));
  });

  return () => socket.disconnect();
}, []);





const addOrUpdateTourist = (data: TouristLocation) => {
  setTourists(prev => ({ ...prev, [data.id]: data }));
};

const removeTourist = (id: string) => {
  setTourists(prev => {
    const copy = { ...prev };
    delete copy[id];
    return copy;
  });
};


  // ---------------- Demo Data (remove in production) ----------------
  const demoTourists = Object.values(tourists).length
    ? Object.values(tourists)
    : [
        {
          id: "t1",
          name: "John Doe",
          email: "john@example.com",
          phone: "9876543210",
          nationality: "Indian",
          destination: "Zone A",
        },
        {
          id: "t2",
          name: "Alice Smith",
          email: "alice@example.com",
          phone: "9123456780",
          nationality: "Indian",
          destination: "Zone B",
        },
      ];

  const demoAlerts = liveAlerts.length
    ? liveAlerts
    : [
        { id: "a1", type: "sos", zoneId: "z1", zoneName: "Zone A", touristId: "t1" },
        { id: "a2", type: "restricted-zone-entry", zoneId: "z2", zoneName: "Zone B", touristId: "t2" },
      ];

  // ---------------- Automatic FIR from alerts ----------------
  useEffect(() => {
    demoAlerts.forEach(alert => {
      const exists = efirs.some(f => f.zoneId === alert.zoneId && f.touristId === alert.touristId);
      if (!exists && (alert.type === "restricted-zone-entry" || alert.type === "sos")) {
        const tourist = demoTourists.find(t => t.id === alert.touristId);
        generateEFIR(alert, tourist);
      }
    });
  }, [demoAlerts, demoTourists, efirs]);


const handleIncidentFIR = (incident:any) => {
  // Avoid duplicate FIR for same incident
  const exists = efirs.some(f => f.touristId === incident.touristId );
  if (exists) return;
console.log(incident);

  const tourist = Object.values(tourists).find(t => t.id === incident.touristId);
  console.log(tourist);
  const newEFIR: EFIR = {
    id: crypto.randomUUID(),
   // zoneId: incident.zoneId || "",
   // zoneName: incident.zoneName || "",
    placeName: incident.placeName || "",
    touristId: tourist?.id || incident.touristId,
    touristName: tourist?.name || incident.touristName,
    email: tourist?.email,
    mobile: tourist?.phone || incident.touristPhone,
    lat:incident.location.lat,
    lng:incident.location.lng,
    nationality: tourist?.nationality,
    description: incident.description || `Automatic FIR generated for incident ${incident.type || "unknown"}`,
    timestamp: new Date().toISOString(),
    status: "pending",
  };

  setEfirs(prev => [newEFIR, ...prev]);
  handleDownloadPDF(newEFIR);
};

  // ---------------- Generate EFIR ----------------
  const generateEFIR = (alert: any, tourist?: any, manualDescription?: string) => {
    const newEFIR: EFIR = {
      id: crypto.randomUUID(),
      zoneId: alert.zoneId,
      zoneName: alert.zoneName,
      touristId: tourist?.id,
      touristName: tourist?.name,
      email: tourist?.email,
      mobile: tourist?.phone,
      nationality: tourist?.nationality,
      description: manualDescription || `Automatic FIR generated for ${alert.type} in zone ${alert.zoneName}`,
      timestamp: new Date().toISOString(),
      status: "pending",
    };
    setEfirs(prev => [newEFIR, ...prev]);
  };

  // ---------------- Manual FIR ----------------
  // const handleManualFIR = () => {
  //   if (!selectedAlert || !description) return alert("Select alert and add description!");
  //   const tourist = demoTourists.find(t => t.id === selectedAlert.touristId);
  //   generateEFIR(selectedAlert, tourist, description);
  //   setDescription("");
  //   setSelectedAlert(null);
  // };


const handleManualFIR = (data: Partial<EFIR & { district?: string; policeStation?: string; landmark?: string; latitude?: string; longitude?: string }>) => {
  if (!data.zoneName || !data.description) return alert("Please fill in required fields!");

  const newEFIR: EFIR & typeof data = {
    id: crypto.randomUUID(),
    zoneName: data.zoneName || "",
    zoneId: data.zoneId || "",
    latitude: data.latitude,
    longitude: data.longitude,
    district: data.district,
    policeStation: data.policeStation,
    landmark: data.landmark,
    touristName: data.touristName,
    touristId: data.touristId,
    email: data.email,
    mobile: data.mobile,
    nationality: data.nationality,
    description: data.description,
    timestamp: new Date().toISOString(),
    status: "pending",
  };

  setEfirs(prev => [newEFIR, ...prev]);
  handleDownloadPDF(newEFIR);
};

  // ---------------- Print ----------------
  const handlePrintEFIR = (fir: EFIR) => {
    const printContent = generateEFIRContent(fir);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // ---------------- Email ----------------
  // const handleSendEmail = async (fir: EFIR) => {
  //   if (!fir.email) return alert("No email available for this tourist.");
  //   alert(`E-FIR sent to ${fir.email}`);
  // };


const handleShareFIR = (fir: EFIR) => {
  console.log(fir);
  const firText = `
E-FIR Report
FIR No: ${fir.id}
Tourist: ${fir.touristName} (${fir.touristId})
Email: ${fir.email || "N/A"}
Mobile: ${fir.mobile || "N/A"}
Place Name : ${fir.placeName} (${fir.zoneId})
Location: ${fir.lat || "N/A"}, ${fir.lng|| "N/A"}
District: ${fir.district || "N/A"}
Police Station: ${fir.policeStation || "N/A"}
Nearest Landmark: ${fir.placeName || "N/A"}

Description:
${fir.description || "N/A"}
`;

  if (navigator.share) {
    // Use native share if available
    navigator.share({
      title: `E-FIR - ${fir.id}`,
      text: firText,
    }).then(() => console.log("Shared successfully"))
      .catch((err) => console.error("Share failed", err));
  } else {
    // Fallback: download as text file
    const blob = new Blob([firText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `E-FIR_${fir.id}.txt`;
    link.click();
  }
};

  // ---------------- PDF ----------------
  const handleDownloadPDF = (fir: EFIR) => {
  const doc = new jsPDF();

  // ------------------- Header -------------------
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.text("FIRST INFORMATION REPORT (F.I.R.)", 105, 20, { align: "center" });

  doc.setFontSize(14);
  doc.text("(Under Section 154 Cr.P.C.)", 105, 28, { align: "center" });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Government of India – Ministry of Tourism & Local Police Department", 105, 36, { align: "center" });
doc.text(`District: ${fir.district || "____________________"}`, 14, 46);
doc.text(`Police Station: ${fir.policeStation || "____________________"}`, 14, 54);
doc.text(`Nearest Landmark: ${fir.landmark || "____________________"}`, 14, 62);

  doc.line(14, 42, 196, 42); // horizontal line

  // ------------------- FIR Details -------------------
  let y = 50;
  doc.setFont("Helvetica", "bold");
  doc.text("FIR Details", 14, y);
  doc.setFont("Helvetica", "normal");
  y += 8;
  doc.text(`FIR No.: ${fir.id}`, 14, y);
  doc.text(`Year: ${new Date().getFullYear()}`, 150, y);
  y += 8;
  doc.text(`Date & Time of FIR: ${new Date(fir.timestamp).toLocaleString()}`, 14, y);
  y += 10;
  doc.line(14, y, 196, y); // separator line

  // ------------------- Place of Occurrence -------------------
  y += 10;
  doc.setFont("Helvetica", "bold");
  doc.text("1. Place of Occurrence", 14, y);
  doc.setFont("Helvetica", "normal");
  y += 8;
  doc.text(`Place Name: ${fir.placeName}`, 14, y);
  y +=8;
  doc.text(`Zone Name: ${fir.zoneName}`, 14, y);
  y += 8;
  doc.text(`Zone Type / ID: ${fir.zoneId}`, 14, y);
  y += 8;
  doc.text(`Coordinates: ${fir.lat || "N/A"}, ${fir.lng|| "N/A"}`, 14, y);
  y += 8;
  doc.text("Nearest Landmark: ____________________________", 14, y);

  // ------------------- Complainant Details -------------------
  y += 14;
  doc.setFont("Helvetica", "bold");
  doc.text("2. Complainant / Informant (Tourist)", 14, y);
  doc.setFont("Helvetica", "normal");
  y += 8;
  doc.text(`Name: ${fir.touristName || "N/A"}`, 14, y);
  y += 8;
  doc.text(`Tourist ID: ${fir.touristId || "N/A"}`, 14, y);
  y += 8;
  doc.text(`Email: ${fir.email || "N/A"}`, 14, y);
  y += 8;
  doc.text(`Mobile: ${fir.touristPhone || fir.mobile || "N/A"}`, 14, y);
  y += 8;
  doc.text(`Nationality: ${fir.nationality || "N/A"}`, 14, y);

  // ------------------- Incident Details -------------------
  y += 14;
  doc.setFont("Helvetica", "bold");
  doc.text("3. Details of the Occurrence / Incident", 14, y);
  y += 8;
  doc.setFont("Helvetica", "italic");
  const splitDescription = doc.splitTextToSize(fir.description || "No details provided.", 180);
  doc.text(splitDescription, 14, y);
  y += splitDescription.length * 8;
  doc.setFont("Helvetica", "normal");

  // ------------------- Actions Taken -------------------
  y += 8;
  doc.setFont("Helvetica", "bold");
  doc.text("4. Actions Taken by Authority", 14, y);
  doc.setFont("Helvetica", "normal");
  y += 8;
  doc.text("• Alert received via automated monitoring system", 14, y);
  y += 8;
  doc.text("• Verified tourist & location details", 14, y);
  y += 8;
  doc.text("• FIR generated digitally under Indian Tourism Safety Program", 14, y);

  // ------------------- Signatures -------------------
  y += 20;
  doc.setFont("Helvetica", "bold");
  doc.text("5. Signature of Complainant:", 14, y);
  doc.setFont("Helvetica", "normal");
  doc.text("(Digital E-FIR — Not Required)", 80, y);

  y += 20;
  doc.setFont("Helvetica", "bold");
  doc.text("6. Signature of Officer-in-Charge:", 14, y);
  doc.setFont("Helvetica", "normal");
  y += 8;
  doc.text("Name: ____________________", 14, y);
  y += 8;
  doc.text("Badge No: ________________", 14, y);
  y += 8;
  doc.text("Police Station: ____________", 14, y);

  // ------------------- Footer -------------------
  y += 16;
  doc.setFontSize(10);
  doc.text(
    "This is an electronically generated FIR under the Indian Tourism Safety Program. No physical signature required.",
    105,
    y,
    { align: "center" }
  );

  doc.save(`E-FIR_${fir.id}.pdf`);
};


  const generateEFIRContent = (fir: EFIR) => `
    <h2 style="text-align:center">E-FIR (Electronic First Information Report)</h2>
    <p><strong>FIR ID:</strong> ${fir.id}</p>
    <p><strong>place Name:</strong> ${fir.placeName || fir.zoneName}</p>
    <p><strong>Tourist Name:</strong> ${fir.touristName || "N/A"}</p>
    <p><strong>Email:</strong> ${fir.email || "N/A"}</p>
    <p><strong>Mobile:</strong> ${fir.touristPhone|| fir.mobile || "N/A"}</p>
    <p><strong>Nationality:</strong> ${fir.nationality || "N/A"}</p>
    <p><strong>Description:</strong> ${fir.description}</p>
    <p><strong>Date/Time:</strong> ${new Date(fir.timestamp).toLocaleString()}</p>
    <p><strong>Status:</strong> ${fir.status}</p>
    <hr/>
    <p style="text-align:center;">Generated electronically under Indian Tourism Department guidelines.</p>
  `;
// useEffect(() => {
//     handleIncidentFIR(incident);
//   }, [incident]);

useEffect(() => {
  if (incident) {
    handleIncidentFIR(incident);
  }
}, [incident]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">E-FIR Management</h1>

      {/* Manual FIR Creation */}{/* Full Professional Manual FIR Creation */}
<Card className="card-shadow">
  <CardHeader>
    <CardTitle>Create Manual FIR</CardTitle>
    <CardDescription>Fill in all details to generate a complete FIR.</CardDescription>
  </CardHeader>
  <CardContent className="space-y-3">

    {/* Zone Details */}
    <Input
      placeholder="Zone Name"
      value={manualFIR.zoneName}
      onChange={e => setManualFIR(prev => ({ ...prev, zoneName: e.target.value }))}
    />
    <Input
      placeholder="Zone ID / Type"
      value={manualFIR.zoneId}
      onChange={e => setManualFIR(prev => ({ ...prev, zoneId: e.target.value }))}
    />
    <div className="flex gap-2">
      <Input
        placeholder="Latitude"
        value={manualFIR.latitude}
        onChange={e => setManualFIR(prev => ({ ...prev, latitude: e.target.value }))}
      />
      <Input
        placeholder="Longitude"
        value={manualFIR.longitude}
        onChange={e => setManualFIR(prev => ({ ...prev, longitude: e.target.value }))}
      />
    </div>

    {/* Location Details */}
    <Input
      placeholder="District"
      value={manualFIR.district}
      onChange={e => setManualFIR(prev => ({ ...prev, district: e.target.value }))}
    />
    <Input
      placeholder="Police Station"
      value={manualFIR.policeStation}
      onChange={e => setManualFIR(prev => ({ ...prev, policeStation: e.target.value }))}
    />
    <Input
      placeholder="Nearest Landmark"
      value={manualFIR.landmark}
      onChange={e => setManualFIR(prev => ({ ...prev, landmark: e.target.value }))}
    />

    {/* Tourist / Complainant Details */}
    <Input
      placeholder="Tourist Name"
      value={manualFIR.touristName}
      onChange={e => setManualFIR(prev => ({ ...prev, touristName: e.target.value }))}
    />
    <Input
      placeholder="Tourist ID"
      value={manualFIR.touristId}
      onChange={e => setManualFIR(prev => ({ ...prev, touristId: e.target.value }))}
    />
    <Input
      placeholder="Email"
      value={manualFIR.email}
      onChange={e => setManualFIR(prev => ({ ...prev, email: e.target.value }))}
    />
    <Input
      placeholder="Mobile"
      value={manualFIR.mobile}
      onChange={e => setManualFIR(prev => ({ ...prev, mobile: e.target.value }))}
    />
    <Input
      placeholder="Nationality"
      value={manualFIR.nationality}
      onChange={e => setManualFIR(prev => ({ ...prev, nationality: e.target.value }))}
    />

    {/* Description / Incident Details */}
    <Textarea
      placeholder="Incident / FIR Description"
      value={manualFIR.description}
      onChange={e => setManualFIR(prev => ({ ...prev, description: e.target.value }))}
      rows={5}
    />

    {/* Generate FIR Button */}
    <Button onClick={() => handleManualFIR(manualFIR)}>Generate FIR & PDF</Button>
  </CardContent>
</Card>

      

      {/* List of E-FIRs */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>All E-FIRs</CardTitle>
          <CardDescription>Automatically and manually generated FIRs.</CardDescription>
        </CardHeader>
        <CardContent>
          {efirs.length > 0 ? (
            <div className="space-y-4">
              {efirs.map(fir => (
                <div key={fir.id} className="p-3 border rounded-lg">
                  <p><strong>ID:</strong> {fir.id}</p>
                  <p><strong>Zone:</strong> {fir.zoneName || fir.placeName}</p>
                  <p><strong>Tourist:</strong> {fir.touristName || "N/A"}</p>
                  <p><strong>Tourist Id:</strong> {fir.touristId|| "N/A"}</p>
                  <p><strong>Tourist Number:</strong> {fir.mobile|| "N/A"}</p>
                  <p><strong>Description:</strong> {fir.description}</p>
                  <p><strong>Date/Time:</strong> {new Date(fir.timestamp).toLocaleString()}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handlePrintEFIR(fir)}><Printer className="w-4 h-4 mr-1"/> Print</Button>
                  <Button onClick={() => handleShareFIR(fir)}>Share FIR</Button>

                    <Button size="sm" onClick={() => handleDownloadPDF(fir)}><Download className="w-4 h-4 mr-1"/> PDF</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No FIRs generated yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EFIR;





// import React, { useState, useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import { useAuthorityData } from "@/context/AuthorityDataContext";
// import { jsPDF } from "jspdf";

// interface EFIR {
//   id: string;
//   zoneId?: string;
//   zoneName?: string;
//   touristId?: string;
//   touristName?: string;
//   email?: string;
//   mobile?: string;
//   nationality?: string;
//   description: string;
//   timestamp: string;
//   status: "pending" | "submitted" | "resolved";
// }

// const EFIR = () => {
//   const location = useLocation();
//   const incident = location.state?.incident || null; // fallback to null
//   const { tourists = {} } = useAuthorityData();
//   const [efirs, setEfirs] = useState<EFIR[]>([]);
// console.log(incident);
//   // If incident is missing
//   if (!incident) return <p>No incident selected. Please navigate from the Incidents page.</p>;

//   const handleIncidentFIR = (incident: any) => {
//     const exists = efirs.some(
//       f => f.touristId === incident.touristId && f.zoneId === incident.zoneId
//     );
//     if (exists) return;

//     const tourist = Object.values(tourists).find(t => t.id === incident.touristId);

//     const newEFIR: EFIR = {
//       id: crypto.randomUUID(),
//       zoneId: incident.zoneId || "",
//       zoneName: incident.zoneName || "",
//       touristId: tourist?.id || incident.touristId,
//       touristName: tourist?.name || incident.touristName || "Unknown Tourist",
//       email: tourist?.email,
//       mobile: tourist?.phone || incident.touristPhone,
//       nationality: tourist?.nationality,
//       description:
//         incident.description ||
//         `Automatic FIR generated for incident ${incident.type || "unknown"}`,
//       timestamp: new Date().toISOString(),
//       status: "pending",
//     };

//     setEfirs(prev => [newEFIR, ...prev]);
//     handleDownloadPDF(newEFIR);
//   };
// const handleDownloadPDF = (fir: EFIR) => {
//   const doc = new jsPDF(); // ✅ now works
//   doc.setFontSize(16);
//   doc.text("FIRST INFORMATION REPORT (F.I.R.)", 105, 20, { align: "center" });
//   doc.setFontSize(12);
//   doc.text(`Zone: ${fir.zoneName}`, 14, 40);
//   doc.text(`Tourist: ${fir.touristName}`, 14, 48);
//   doc.text(`Email: ${fir.email || "N/A"}`, 14, 56);
//   doc.text(`Mobile: ${fir.mobile || "N/A"}`, 14, 64);
//   doc.text(`Description: ${fir.description}`, 14, 72);
//   doc.save(`EFIR_${fir.id}.pdf`);
// };

  

//   useEffect(() => {
//     handleIncidentFIR(incident);
//   }, [incident]);

//   return (
//     <div>
//       <h2>E-FIR for {incident?.touristName || "Unknown Tourist"}</h2>
//       <p>Incident ID: {incident?.id || "N/A"}</p>

//       <div>
//         {efirs.map(fir => (
//           <div key={fir.id} className="border p-2 my-2">
//             <p><b>Tourist:</b> {fir.touristName}</p>
//             <p><b>Description:</b> {fir.description}</p>
//             <p><b>Status:</b> {fir.status}</p>
//             <button onClick={() => handleDownloadPDF(fir)}>Download PDF</button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default EFIR;
