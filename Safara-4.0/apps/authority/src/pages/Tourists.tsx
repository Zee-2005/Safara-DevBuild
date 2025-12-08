

// // // import React, { useState } from 'react';
// // // import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// // // import { Button } from '@/components/ui/button';
// // // import { Input } from '@/components/ui/input';
// // // import { Badge } from '@/components/ui/badge';
// // // import { 
// // //   Search, 
// // //   MapPin, 
// // //   Phone, 
// // //   User, 
// // //   Clock,
// // //   Eye,
// // //   Shield,
// // //   AlertCircle
// // // } from 'lucide-react';
// // // import { useAuthorityData } from '@/context/AuthorityDataContext';

// // // const Tourists = () => {
// // //   const [searchTerm, setSearchTerm] = useState('');

// // //   // Mock tourist data
// // //   // const tourists = [
// // //   //   {
// // //   //     id: "TID-2024-001",
// // //   //     name: "John Smith",
// // //   //     country: "USA",
// // //   //     phone: "+1-555-0123",
// // //   //     digitalId: "verified",
// // //   //     location: "Marina Beach",
// // //   //     safetyScore: 92,
// // //   //     status: "active",
// // //   //     lastSeen: "2 min ago",
// // //   //     emergencyContact: "+1-555-0456",
// // //   //     itinerary: ["Marina Beach", "Fort St. George", "Kapaleeshwarar Temple"]
// // //   //   },
// // //   //   {
// // //   //     id: "TID-2024-002", 
// // //   //     name: "Emma Johnson",
// // //   //     country: "UK",
// // //   //     phone: "+44-20-7946-0958",
// // //   //     digitalId: "verified",
// // //   //     location: "Fort St. George",
// // //   //     safetyScore: 88,
// // //   //     status: "active",
// // //   //     lastSeen: "5 min ago",
// // //   //     emergencyContact: "+44-20-7946-0000",
// // //   //     itinerary: ["Fort St. George", "Government Museum", "T. Nagar Shopping"]
// // //   //   },
// // //   //   {
// // //   //     id: "TID-2024-003",
// // //   //     name: "Carlos Rodriguez",
// // //   //     country: "Spain", 
// // //   //     phone: "+34-91-123-4567",
// // //   //     digitalId: "pending",
// // //   //     location: "Unknown",
// // //   //     safetyScore: 65,
// // //   //     status: "flagged",
// // //   //     lastSeen: "45 min ago",
// // //   //     emergencyContact: "+34-91-123-0000",
// // //   //     itinerary: ["Marina Beach", "Mylapore", "ECR Beach"]
// // //   //   }
// // //   // ];

// // // const { tourists, updateTouristInfo, personal,stats,touristInfo, incidents,touristId } = useAuthorityData();

// // //   // Convert tourists object to array for mapping
// // //   const touristArray = Object.values(tourists);

// // //   const filteredTourists = touristArray.filter(tourist =>
// // //     (tourist.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //     (tourist.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //     (tourist.nationality || '').toLowerCase().includes(searchTerm.toLowerCase())
// // //   );

// // //   const getStatusBadge = (status: string) => {
// // //     switch (status) {
// // //       case 'active':
// // //         return <Badge className="bg-success text-success-foreground">Active</Badge>;
// // //       case 'flagged':
// // //         return <Badge className="bg-warning text-warning-foreground">Flagged</Badge>;
// // //       case 'emergency':
// // //         return <Badge className="bg-emergency text-emergency-foreground alert-pulse">Emergency</Badge>;
// // //       default:
// // //         return <Badge variant="outline">{status}</Badge>;
// // //     }
// // //   };

// // //   const getSafetyScoreBadge = (score: number) => {
// // //     if (score >= 90) return <Badge className="bg-success text-success-foreground">{score}</Badge>;
// // //     if (score >= 70) return <Badge className="bg-warning text-warning-foreground">{score}</Badge>;
// // //     return <Badge className="bg-emergency text-emergency-foreground">{score}</Badge>;
// // //   };

// // //   const getDigitalIdBadge = (status: string) => {
// // //     switch (status) {
// // //       case 'verified':
// // //         return <Badge className="bg-success text-success-foreground">✓ Verified</Badge>;
// // //       case 'pending':
// // //         return <Badge className="bg-warning text-warning-foreground">⏳ Pending</Badge>;
// // //       default:
// // //         return <Badge className="bg-emergency text-emergency-foreground">✗ Not Verified</Badge>;
// // //     }
// // //   };

// // //   // const filteredTourists = tourists.filter(tourist =>
// // //   //   tourist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //   //   tourist.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
// // //   //   tourist.country.toLowerCase().includes(searchTerm.toLowerCase())
// // //   // );

// // //   return (
// // //     <div className="space-y-6">
// // //       {/* Header */}
// // //       <div className="flex items-center justify-between">
// // //         <div>
// // //           <h1 className="text-3xl font-bold tracking-tight">Tourist Management</h1>
// // //           <p className="text-muted-foreground">
// // //             Monitor and manage tourist profiles and safety status
// // //           </p>
// // //         </div>
// // //         <Button className="authority-gradient text-white">
// // //           <User className="w-4 h-4 mr-2" />
// // //           Add Tourist
// // //         </Button>
// // //       </div>

// // //       {/* Search and Filters */}
// // //       <Card className="card-shadow">
// // //         <CardContent className="pt-6">
// // //           <div className="flex items-center gap-4">
// // //             <div className="flex-1 relative">
// // //               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
// // //               <Input
// // //                 placeholder="Search by name, ID, or country..."
// // //                 value={searchTerm}
// // //                 onChange={(e) => setSearchTerm(e.target.value)}
// // //                 className="pl-10"
// // //               />
// // //             </div>
// // //             <Button variant="outline">Filter</Button>
// // //             <Button variant="outline">Export</Button>
// // //           </div>
// // //         </CardContent>
// // //       </Card>

// // //       {/* Tourist List */}
// // //       <div className="space-y-4">
// // //         {filteredTourists.map((tourist) => (
// // //           <Card key={tourist.id} className="card-shadow hover:shadow-lg transition-shadow">
// // //             <CardContent className="pt-6">
// // //               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
// // //                 {/* Tourist Info */}
// // //                 <div className="lg:col-span-2">
// // //                   <div className="flex items-start justify-between mb-4">
// // //                     <div>
// // //                       <div className="flex items-center gap-3 mb-2">
// // //                         <h3 className="text-lg font-semibold">{tourist.name}</h3>
// // //                         {getStatusBadge(tourist.status)}
// // //                       </div>
// // //                       <div className="flex items-center gap-4 text-sm text-muted-foreground">
// // //                         <span className="flex items-center gap-1">
// // //                           <User className="w-4 h-4" />
// // //                           {personal.pid_personal_id}
// // //                         </span>
// // //                         <span className="flex items-center gap-1">
// // //                           <MapPin className="w-4 h-4" />
// // //                           {tourist.country}
// // //                         </span>
// // //                         <span className="flex items-center gap-1">
// // //                           <Phone className="w-4 h-4" />
// // //                           {tourist.phone}
// // //                         </span>
// // //                       </div>
// // //                     </div>
// // //                     <div className="text-right">
// // //                       <p className="text-sm font-medium">Safety Score</p>
// // //                       {getSafetyScoreBadge(tourist.safetyScore)}
// // //                     </div>
// // //                   </div>

// // //                   <div className="space-y-3">
// // //                     <div className="flex items-center justify-between">
// // //                       <span className="text-sm font-medium">Digital ID Status:</span>
// // //                       {getDigitalIdBadge(touristInfo.id)}
// // //                     </div>
// // //                     <div className="flex items-center justify-between">
// // //                       <span className="text-sm font-medium">Current Location:</span>
// // //                       <span className="text-sm">{incidents.location}</span>
// // //                     </div>
// // //                     <div className="flex items-center justify-between">
// // //                       <span className="text-sm font-medium">Last Seen:</span>
// // //                       <span className="text-sm flex items-center gap-1">
// // //                         <Clock className="w-3 h-3" />
// // //                         {tourist.lastSeen}
// // //                       </span>
// // //                     </div>
// // //                   </div>
// // //                 </div>

// // //                 {/* Itinerary */}
// // //                 <div>
// // //                   <h4 className="font-medium mb-3">Planned Itinerary</h4>
// // //                   <div className="space-y-2">
// // //                     {tourist.itinerary.map((location, index) => (
// // //                       <div key={index} className="flex items-center gap-2 text-sm">
// // //                         <div className="w-2 h-2 rounded-full bg-primary"></div>
// // //                         {location}
// // //                       </div>
// // //                     ))}
// // //                   </div>
// // //                 </div>

// // //                 {/* Actions */}
// // //                 <div className="flex flex-col gap-3">
// // //                   <Button variant="outline" size="sm" className="w-full">
// // //                     <Eye className="w-4 h-4 mr-2" />
// // //                     View Details
// // //                   </Button>
// // //                   <Button variant="outline" size="sm" className="w-full">
// // //                     <MapPin className="w-4 h-4 mr-2" />
// // //                     Track Location
// // //                   </Button>
// // //                   <Button variant="outline" size="sm" className="w-full">
// // //                     <Phone className="w-4 h-4 mr-2" />
// // //                     Contact Tourist
// // //                   </Button>
// // //                   {tourist.status === 'flagged' && (
// // //                     <Button variant="outline" size="sm" className="w-full text-emergency border-emergency">
// // //                       <AlertCircle className="w-4 h-4 mr-2" />
// // //                       Review Flag
// // //                     </Button>
// // //                   )}
// // //                 </div>
// // //               </div>
// // //             </CardContent>
// // //           </Card>
// // //         ))}
// // //       </div>

// // //       {filteredTourists.length === 0 && (
// // //         <Card className="card-shadow">
// // //           <CardContent className="py-12">
// // //             <div className="text-center">
// // //               <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
// // //               <h3 className="text-lg font-medium mb-2">No tourists found</h3>
// // //               <p className="text-muted-foreground">
// // //                 Try adjusting your search criteria or add new tourists to the system.
// // //               </p>
// // //             </div>
// // //           </CardContent>
// // //         </Card>
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // export default Tourists;
// ;


// import React, { useState, useEffect } from 'react';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import {
//   Search,
//   MapPin,
//   Phone,
//   User,
//   Mail,
//   AlertCircle,
//   Compass,
//   Eye
// } from 'lucide-react';
// import { useAuthorityData } from '@/context/AuthorityDataContext';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// // ------------- 🛰️ Reverse Geocode --------------------
// async function getPlaceName(lat: number, lng: number): Promise<string> {
//   try {
//     const res = await fetch(
//       `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
//       {
//         headers: {
//           "User-Agent": "Safara/1.0 (your-email@example.com)",
//           "Accept-Language": "en",
//         },
//       }
//     );
//     const data = await res.json();
//     return data.display_name || "Unknown Location";
//   } catch (err) {
//     console.error("Reverse geocode error:", err);
//     return "Unknown Location";
//   }
// }
// // ------------------------------------------------------
// const Tourists = () => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [touristLocations, setTouristLocations] = useState<Record<string, string>>({});
//   const [selectedTourist, setSelectedTourist] = useState<any>(null);

//   const { tourists } = useAuthorityData();
//   const touristArray = Object.values(tourists);

//   // ⭐ Store processed IDs so we don't reverse-geocode again
//   const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

// // Assuming `touristArray` or `storedTourists` contains your current tourist data
// // 1️⃣ Add state for stored tourists
// const [storedTourists, setStoredTourists] = useState<any[]>(() => {
//   const saved = localStorage.getItem('touristData');
//   return saved ? JSON.parse(saved) : Object.values(tourists); // fallback to your current tourists
// });

// // 2️⃣ Sync to localStorage whenever data changes
// useEffect(() => {
//   localStorage.setItem('touristData', JSON.stringify(storedTourists));
// }, [storedTourists]);

// // 3️⃣ Optional: Update storedTourists whenever tourists from context changes
// useEffect(() => {
//   setStoredTourists(Object.values(tourists));
// }, [tourists]);


//   // ------------------ 📍 Load Locations (SAFE VERSION) ------------------
//   useEffect(() => {
//     const fetchLocations = async () => {
//       const newLocations: Record<string, string> = {};
//       const newProcessedIds = new Set(processedIds);

//       for (const tourist of touristArray) {
//         if (!tourist.id) continue;

//         // Only fetch location if NOT already processed
//         if (!newProcessedIds.has(tourist.id)) {
//           const location = await getPlaceName(tourist.latitude, tourist.longitude);
//           newLocations[tourist.id] = location;
//           newProcessedIds.add(tourist.id);
//         }
//       }

//       if (Object.keys(newLocations).length > 0) {
//         setTouristLocations(prev => ({ ...prev, ...newLocations }));
//         setProcessedIds(newProcessedIds);
//       }
//     };

//     fetchLocations();
//   }, [tourists]); // 🔥 only run when "tourists" object actually updates



//   // ------------------ 🔍 Filter Search ------------------
//   const filteredTourists = touristArray.filter(tourist =>
//     (tourist.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//     (tourist.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//     (tourist.nationality || '').toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // ------------------ 🔵 Status Badges ------------------
//   const getStatusBadge = (status?: string) => {
//     switch (status) {
//       case 'active': return <Badge className="bg-success text-white">Active</Badge>;
//       case 'flagged': return <Badge className="bg-yellow-500 text-white">Flagged</Badge>;
//       case 'emergency': return <Badge className="bg-red-600 text-white alert-pulse">Emergency</Badge>;
//       default: return <Badge variant="outline">{status || 'Unknown'}</Badge>;
//     }
//   };

//   // ---------------- ACTION HANDLERS ------------------

//   // 📍 Track Location (Google Maps)
//   const handleTrackLocation = (tourist: any) => {
//     if (tourist.latitude && tourist.longitude) {
//       window.open(
//         `https://www.google.com/maps?q=${tourist.latitude},${tourist.longitude}`,
//         '_blank'
//       );
//     }
//   };

//   // 📞 Contact Tourist
//   const handleCall = (phone: string) => {
//     if (phone) {
//       window.location.href = `tel:${phone}`;
//     }
//   };

//   // 👁️ View Details (opens modal)
//   const handleViewDetails = (tourist: any) => {
//     setSelectedTourist(tourist);
//   };

//   return (
//     <div className="space-y-6">

//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Tourist Management</h1>
//           <p className="text-muted-foreground">Monitor and manage tourist profiles</p>
//         </div>
//         <Button className="authority-gradient text-white">
//           <User className="w-4 h-4 mr-2" /> Add Tourist
//         </Button>
//       </div>

//       {/* Search Box */}
//       <Card className="card-shadow">
//         <CardContent className="pt-6">
//           <Input
//             placeholder="Search by name, ID, or nationality..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </CardContent>
//       </Card>

//       {/* Tourist List */}
//       <div className="space-y-4">
//         {filteredTourists.map((tourist) => (
//           <Card key={tourist.id} className="card-shadow p-2 rounded-xl">
//             <CardContent className="pt-6">
//               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

//                 {/* LEFT SIDE INFO */}
//                 <div className="lg:col-span-2">
//                   <div className="flex items-start justify-between mb-4">
//                     <div>
//                       <div className="flex items-center gap-3 mb-2">
//                         <h3 className="text-xl font-semibold flex items-center gap-2">
//                           <User className="w-5 h-5 text-blue-600" />
//                           {tourist.name}
//                         </h3>
//                         {getStatusBadge(tourist.status)}
//                       </div>

//                       <div className="flex flex-col gap-2 text-[15px] text-muted-foreground">
//                         <div className="flex items-center gap-2">
//                           <span className="font-medium">Personal ID:</span>
//                           <span>{tourist.personalId || "-"}</span>
//                         </div>

                      

//                         <div className="flex items-center gap-2">
//                           <span className="font-medium">Phone:</span>
//                           <span>{tourist.phone}</span>
//                         </div>

//                         <div className="flex items-center gap-2">
//                           <span className="font-medium">Email:</span>
//                           <span>{tourist.email}</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Location */}
//                   <div className="space-y-2">
//                     <div className="flex items-center gap-2">
//                       <MapPin className="w-4 h-4 text-red-500" />
//                       <span className="text-sm font-medium">Location:</span>
//                       <span>{touristLocations[tourist.id!] || "Loading..."}</span>
//                     </div>

                    
//                   </div>
//                 </div>

//                 {/* RIGHT SIDE BUTTONS */}
//                 <div className="flex flex-col gap-3 justify-center">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handleViewDetails(tourist)}
//                   >
//                     <Eye className="w-4 h-4 mr-2" /> View Details
//                   </Button>

//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handleTrackLocation(tourist)}
//                   >
//                     <MapPin className="w-4 h-4 mr-2 text-red-500" />
//                     Track Location
//                   </Button>

//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handleCall(tourist.phone)}
//                   >
//                     <Phone className="w-4 h-4 mr-2 text-green-600" />
//                     Contact Tourist
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* -------------- 👁️ VIEW DETAILS MODAL ---------------- */}
//       <Dialog open={!!selectedTourist} onOpenChange={() => setSelectedTourist(null)}>
//         <DialogContent className="max-w-lg">
//           <DialogHeader>
//             <DialogTitle>Tourist Details</DialogTitle>
//           </DialogHeader>

//           {selectedTourist && (
//             <div className="space-y-3">
//               <p><strong>Name:</strong> {selectedTourist.name}</p>
//               <p><strong>ID:</strong> {selectedTourist.personalId}</p>
          
//               <p><strong>Nationality:</strong> {selectedTourist.nationality}</p>
//               <p><strong>Email:</strong> {selectedTourist.email}</p>
//               <p><strong>Phone:</strong> {selectedTourist.phone}</p>
//               <p><strong>Current Status:</strong> {selectedTourist.status}</p>

//               <hr />

//               <p><strong>Coordinates:</strong>  
//                 {selectedTourist.latitude}, {selectedTourist.longitude}
//               </p>

//               <p><strong>Location:</strong>  
//                 {touristLocations[selectedTourist.id] || "Loading..."}
//               </p>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//     </div>
//   );
// };

// export default Tourists;


import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MapPin,
  Phone,
  User,
  Eye
} from 'lucide-react';
import { useAuthorityData } from '@/context/AuthorityDataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ------------- 🛰️ Reverse Geocode --------------------
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
// ------------------------------------------------------

type Tourist = {
  _id?: string;
  id?: string;          // optional if backend returns _id only
  personalId?: string;
  name?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
};

const Tourists: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [touristLocations, setTouristLocations] = useState<Record<string, string>>({});
  const [selectedTourist, setSelectedTourist] = useState<Tourist | null>(null);

  // socket context (still available if needed)
  const { tourists: ctxTourists } = useAuthorityData();

  // main list coming from API
  const [touristList, setTouristList] = useState<Tourist[]>([]);

  // cache of processed ids for reverse geocoding
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  // ---------- Fetch tourists from backend ----------
  useEffect(() => {
    const fetchTourists = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/tourists'); // adjust PORT / base URL
        const data = await res.json();
        // ensure each item has a stable id
        const normalized: Tourist[] = data.map((t: any) => ({
          ...t,
          id: t.id || t._id || t.socketId,
        }));
        setTouristList(normalized);
      } catch (err) {
        console.error('Error fetching tourists:', err);
      }
    };
    fetchTourists();
  }, []);

  // Optional: merge/override with live socket tourists (if you want live updates)
  useEffect(() => {
    if (!ctxTourists || typeof ctxTourists !== 'object') return;
    const liveArray = Object.values(ctxTourists as any).map((t: any) => ({
      ...t,
      id: t.id || t._id || t.socketId,
    }));
    // simple merge by id
    setTouristList(prev => {
      const byId = new Map<string, Tourist>();
      [...prev, ...liveArray].forEach(t => {
        if (!t.id) return;
        byId.set(t.id, { ...(byId.get(t.id) || {}), ...t });
      });
      return Array.from(byId.values());
    });
  }, [ctxTourists]);

  // ------------------ 📍 Load Locations ------------------
  useEffect(() => {
    const fetchLocations = async () => {
      const newLocations: Record<string, string> = {};
      const newProcessedIds = new Set(processedIds);

      for (const tourist of touristList) {
        const key = tourist.id || tourist._id;
        if (!key) continue;

        if (!newProcessedIds.has(key) && tourist.latitude && tourist.longitude) {
          const location = await getPlaceName(tourist.latitude, tourist.longitude);
          newLocations[key] = location;
          newProcessedIds.add(key);
        }
      }

      if (Object.keys(newLocations).length > 0) {
        setTouristLocations(prev => ({ ...prev, ...newLocations }));
        setProcessedIds(newProcessedIds);
      }
    };

    if (touristList.length) fetchLocations();
  }, [touristList, processedIds]);

  // ------------------ 🔍 Filter Search ------------------
  const filteredTourists = touristList.filter(tourist =>
    (tourist.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tourist.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tourist.nationality || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ------------------ 🔵 Status Badges ------------------
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-success text-white">Active</Badge>;
      case 'flagged': return <Badge className="bg-yellow-500 text-white">Flagged</Badge>;
      case 'emergency': return <Badge className="bg-red-600 text-white alert-pulse">Emergency</Badge>;
      default: return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  // 📍 Track Location (Google Maps)
  const handleTrackLocation = (tourist: Tourist) => {
    if (tourist.latitude && tourist.longitude) {
      window.open(
        `https://www.google.com/maps?q=${tourist.latitude},${tourist.longitude}`,
        '_blank'
      );
    }
  };

  // 📞 Contact Tourist
  const handleCall = (phone?: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  // 👁️ View Details (opens modal)
  const handleViewDetails = (tourist: Tourist) => {
    setSelectedTourist(tourist);
  };

  const getKey = (t: Tourist) => t.id || t._id || '';

  const getLocationName = (t: Tourist) => {
    const key = getKey(t);
    return key ? (touristLocations[key] || 'Loading...') : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tourist Management</h1>
          <p className="text-muted-foreground">Monitor and manage tourist profiles</p>
        </div>
        <Button className="authority-gradient text-white">
          <User className="w-4 h-4 mr-2" /> Add Tourist
        </Button>
      </div>

      {/* Search Box */}
      <Card className="card-shadow">
        <CardContent className="pt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name, ID, or nationality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </CardContent>
      </Card>

      {/* Tourist List */}
      <div className="space-y-4">
        {filteredTourists.map((tourist) => (
          <Card key={getKey(tourist)} className="card-shadow p-2 rounded-xl">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* LEFT SIDE INFO */}
                <div className="lg:col-span-2">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-600" />
                          {tourist.name}
                        </h3>
                        {getStatusBadge(tourist.status)}
                      </div>

                      <div className="flex flex-col gap-2 text-[15px] text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Personal ID:</span>
                          <span>{tourist.personalId || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Phone:</span>
                          <span>{tourist.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Email:</span>
                          <span>{tourist.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium">Location:</span>
                      <span>{getLocationName(tourist)}</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE BUTTONS */}
                <div className="flex flex-col gap-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(tourist)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> View Details
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTrackLocation(tourist)}
                  >
                    <MapPin className="w-4 h-4 mr-2 text-red-500" />
                    Track Location
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCall(tourist.phone)}
                  >
                    <Phone className="w-4 h-4 mr-2 text-green-600" />
                    Contact Tourist
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTourists.length === 0 && (
          <Card className="card-shadow">
            <CardContent className="py-12 text-center text-muted-foreground">
              No tourists found.
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Details Modal */}
      <Dialog open={!!selectedTourist} onOpenChange={() => setSelectedTourist(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tourist Details</DialogTitle>
          </DialogHeader>

          {selectedTourist && (
            <div className="space-y-3">
              <p><strong>Name:</strong> {selectedTourist.name}</p>
              <p><strong>ID:</strong> {selectedTourist.personalId}</p>
              <p><strong>Nationality:</strong> {selectedTourist.nationality}</p>
              <p><strong>Email:</strong> {selectedTourist.email}</p>
              <p><strong>Phone:</strong> {selectedTourist.phone}</p>
              <p><strong>Current Status:</strong> {selectedTourist.status}</p>
              <hr />
              <p>
                <strong>Coordinates:</strong>{" "}
                {selectedTourist.latitude}, {selectedTourist.longitude}
              </p>
              <p>
                <strong>Location:</strong>{" "}
                {getLocationName(selectedTourist)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tourists;
