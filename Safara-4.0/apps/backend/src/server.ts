




// // import { env } from './config/env.js';
// // import { buildApp } from './app.js';
// // import { connectMongo, disconnectMongo } from './db/mongoose.js';
// // import { Server as SocketIOServer } from 'socket.io';
// // // src/server.ts
// // import { IncidentModel } from './modules/incident/incident.model.js';

// // const start = async () => {
// //   await connectMongo();
// //   const app = buildApp();
// //   const server = app.listen(env.PORT, "0.0.0.0", () =>
// //     console.log(`API listening on http://localhost:${env.PORT}`)
// //   );


// //   const io = new SocketIOServer(server, {
// //     cors: { origin: '*', methods: ['GET', 'POST'] },
// //     transports: ['websocket', 'polling'],
// //   });

// //   type LatLng = { lat: number; lng: number };
// //   type Zone = { id: string; name: string; type: 'circle'|'polygon'; coords?: LatLng[]; radius?: number; risk?: string };
// //   type Boundary = { id: string; name: string; type: 'circle'|'polygon'; center?: LatLng; coords?: LatLng[]; radius?: number };
// //   type Incident = {
// //     id: string;
// //     touristSocketId: string;
// //     touristId?: string;
// //     touristName?: string;
// //     touristPhone?: string;
// //     location?: LatLng;
// //     description?: string;
// //     media?: { audio?: string; video?: string; photo?: string };
// //     createdAt: number;
// //     status: 'new' | 'acknowledged' | 'resolved';
// //     officer?: { id?: string; name?: string };
// //   };

// //   const zones = new Map<string, Zone>();
// //   const boundaries = new Map<string, Boundary>();
// //   const incidents = new Map<string, Incident>();
// //   const insideZonesBySocket = new Map<string, Set<string>>();
// //   const boundaryInsideBySocket = new Map<string, boolean>();

// //   const haversine = (a: LatLng, b: LatLng) => {
// //     const toRad = (x: number) => (x * Math.PI)/180;
// //     const R = 6371000;
// //     const dLat = toRad(b.lat - a.lat);
// //     const dLng = toRad(b.lng - a.lng);
// //     const lat1 = toRad(a.lat);
// //     const lat2 = toRad(b.lat);
// //     const s = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
// //     return 2*R*Math.asin(Math.sqrt(s));
// //   };
// // const activeTourists = new Map(); // store last known tourist location

// //   const pointInPolygon = (pt: LatLng, poly: LatLng[]) => {
// //     let inside = false;
// //     for (let i=0,j=poly.length-1;i<poly.length;j=i++) {
// //       const xi = poly[i].lng, yi = poly[i].lat;
// //       const xj = poly[j].lng, yj = poly[j].lat;
// //       const intersect = yi>pt.lat !== yj>pt.lat && pt.lng<((xj-xi)*(pt.lat-yi))/(yj-yi)+xi;
// //       if(intersect) inside = !inside;
// //     }
// //     return inside;
// //   };

// //   io.on('connection', (socket) => {
// //     console.log('Client connected', socket.id);

// //     // Sync existing zones & boundaries
// //     for (const z of zones.values()) socket.emit('zone-update', z);
// //     for (const b of boundaries.values()) socket.emit('boundary-update', b);

// //     // --- 1) Tourist live data ---
// //     socket.on('live-tourist-data', (data: any) => {
// //       const { latitude, longitude, touristId, personalId, name, phone, email, nationality, destination, tripStart, tripEnd, status } = data;

// //       // Broadcast to authority/dashboard
// //       io.emit('receive-location', {
// //         socketId: socket.id,
// //         touristId,
// //         personalId,
// //         name,
// //         phone,
// //         email,
// //         nationality,
// //         destination,
// //         tripStart,
// //         tripEnd,
// //         status,
// //         latitude,
// //         longitude,
// //         timestamp: data.timestamp || Date.now(),
// //       });
// // activeTourists.set(socket.id, { 
// //   ...data, 
// //   socketId: socket.id, 
// //   timestamp: Date.now() 
// // });
// // socket.on("get-active-tourists", () => {
// //   socket.emit("active-tourist-list", Array.from(activeTourists.values()));
// // });

// //       // --- Geofence checks ---
// //       const here: LatLng = { lat: latitude, lng: longitude };
// //       const prevSet = insideZonesBySocket.get(socket.id) ?? new Set<string>();
// //       const nextSet = new Set<string>();

// //       for (const z of zones.values()) {
// //         let inside = false;
// //         if (z.type === 'circle' && z.coords && z.radius) {
// //           const center = z.coords[0] || z.coords;
// //           const centerLL = Array.isArray(center) ? { lat: center[0], lng: center[1] } : center as LatLng;
// //           inside = haversine(here, centerLL) <= (z.radius ?? 0);
// //         } else if (z.type === 'polygon' && z.coords?.length) {
// //           inside = pointInPolygon(here, z.coords);
// //         }
// //         if(inside){
// //           nextSet.add(z.id);
// //           if(!prevSet.has(z.id)){
// //             io.emit('zone-alert', { touristId, zoneName: z.name, risk: z.risk ?? 'low' });
// //           }
// //         }
// //       }
// //       insideZonesBySocket.set(socket.id, nextSet);

// //       // Boundaries
// //       let insideAnyBoundary = boundaries.size===0 ? true : false;
// //       if(boundaries.size>0){
// //         insideAnyBoundary=false;
// //         for(const b of boundaries.values()){
// //           let inside=false;
// //           if(b.type==='circle' && b.center && b.radius) inside=haversine(here,b.center)<=b.radius;
// //           else if(b.type==='polygon' && b.coords?.length) inside=pointInPolygon(here,b.coords);
// //           if(inside){ insideAnyBoundary=true; break; }
// //         }
// //       }
// //       const prevInside = boundaryInsideBySocket.get(socket.id);
// //       if(prevInside===undefined || (prevInside && !insideAnyBoundary)){
// //         if(!insideAnyBoundary) io.emit('outside-boundary-alert', { touristId, boundaryName: 'Area' });
// //       }
// //       boundaryInsideBySocket.set(socket.id, insideAnyBoundary);
// //     });

// //     // --- Authority zone/boundary management ---
// //     socket.on('zone-update', (z: Zone)=>{ zones.set(z.id,z); io.emit('zone-update',z); });
// //     socket.on('zone-deleted', ({id})=>{ zones.delete(id); io.emit('zone-deleted',{id}); });
// //     socket.on('boundary-update', (b: Boundary)=>{ boundaries.set(b.id,b); io.emit('boundary-update',b); });
// //     socket.on('boundary-deleted', ({id})=>{ boundaries.delete(id); io.emit('boundary-deleted',{id}); });

// //     // --- Heatmap ---
// //     socket.on('heatmap-update', (points:[number,number][])=> io.emit('heatmap-update', points));

// //     // --- Incidents/SOS ---
// //     socket.on('sos-create', (payload: Partial<Incident>) => {
// //       const id = payload.id || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
// //       const incident: Incident = {
// //         id,
// //         touristSocketId: socket.id,
// //         touristId: payload.touristId,
// //         touristName: payload.touristName,
// //         touristPhone: payload.touristPhone,
// //         location: payload.location,
// //         description: payload.description,
// //         media: payload.media,
// //         createdAt: Date.now(),
// //         status:'new',
// //       };
// //       incidents.set(incident.id, incident);
// //       io.emit('incident-new', incident);
// //       socket.emit('sos-received',{id:incident.id});
// //     });
// // socket.on('live-tourist-data', (data) => {
// //   console.log("🔥 Received from Tourist:", data);
// // });

// //     socket.on('incident-ack', ({id, officer}) => {
// //       const inc = incidents.get(id); if(!inc) return;
// //       inc.status='acknowledged'; inc.officer=officer; incidents.set(id,inc);
// //       io.emit('incident-updated',inc);
// //     });

// //     socket.on('incident-resolve', ({id,notes}) => {
// //       const inc = incidents.get(id); if(!inc) return;
// //       inc.status='resolved'; (inc as any).notes=notes; incidents.set(id,inc);
// //       io.emit('incident-updated',inc);
// //     });

// //     socket.on('disconnect', () => {
// //       io.emit('user-disconnected', socket.id);
// //       insideZonesBySocket.delete(socket.id);
// //       boundaryInsideBySocket.delete(socket.id);
// //       activeTourists.delete(socket.id);

// //     });
// //   });


// //   const shutdown = () => server.close(async ()=>{ await disconnectMongo(); process.exit(0); });
// //   process.on('SIGINT', shutdown);
// //   process.on('SIGTERM', shutdown);
// // };

// //  start();

// // src/server.ts
// // src/server.ts
// import { env } from './config/env.js';
// import { buildApp } from './app.js';
// import { connectMongo, disconnectMongo } from './db/mongoose.js';
// import { Server as SocketIOServer } from 'socket.io';
// import { IncidentModel } from './modules/incident/incident.model.js';
// import { TouristModel } from './modules/authTourist/tourist.model.js';

// const start = async () => {
//   await connectMongo();
//   const app = buildApp();
//   const server = app.listen(env.PORT, '0.0.0.0', () =>
//     console.log(`API listening on http://localhost:${env.PORT}`)
//   );

//   const io = new SocketIOServer(server, {
//     cors: { origin: '*', methods: ['GET', 'POST'] },
//     transports: ['websocket', 'polling'],
//   });

//   type LatLng = { lat: number; lng: number };
//   type Zone = {
//     id: string;
//     name: string;
//     type: 'circle' | 'polygon';
//     coords?: LatLng[];
//     radius?: number;
//     risk?: string;
//   };
//   type Boundary = {
//     id: string;
//     name: string;
//     type: 'circle' | 'polygon';
//     center?: LatLng;
//     coords?: LatLng[];
//     radius?: number;
//   };
//   type Incident = {
//     id: string;
//     touristSocketId: string;
//     touristId?: string;
//     touristName?: string;
//     touristEmail?:string;
//     touristPhone?: string;
//     location?: LatLng;
//     description?: string;
//     media?: { audio?: string; video?: string; photo?: string };
//     createdAt: number;
//     status: 'new' | 'acknowledged' | 'resolved';
//     officer?: { id?: string; name?: string };
//   };

//   const zones = new Map<string, Zone>();
//   const boundaries = new Map<string, Boundary>();
//   const incidents = new Map<string, Incident>();
//   const insideZonesBySocket = new Map<string, Set<string>>();
//   const boundaryInsideBySocket = new Map<string, boolean>();
//   const activeTourists = new Map<string, any>();

//   const haversine = (a: LatLng, b: LatLng) => {
//     const toRad = (x: number) => (x * Math.PI) / 180;
//     const R = 6371000;
//     const dLat = toRad(b.lat - a.lat);
//     const dLng = toRad(b.lng - a.lng);
//     const lat1 = toRad(a.lat);
//     const lat2 = toRad(b.lat);
//     const s =
//       Math.sin(dLat / 2) ** 2 +
//       Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
//     return 2 * R * Math.asin(Math.sqrt(s));
//   };

//   const pointInPolygon = (pt: LatLng, poly: LatLng[]) => {
//     let inside = false;
//     for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
//       const xi = poly[i].lng,
//         yi = poly[i].lat;
//       const xj = poly[j].lng,
//         yj = poly[j].lat;
//       const intersect =
//         yi > pt.lat !== yj > pt.lat &&
//         pt.lng < ((xj - xi) * (pt.lat - yi)) / (yj - yi) + xi;
//       if (intersect) inside = !inside;
//     }
//     return inside;
//   };

//   // Simple REST endpoint to fetch all incidents from DB
//   app.get('/api/incidents', async (_req, res, next) => {
//     try {
//       const list = await IncidentModel.find().sort({ createdAt: -1 }).lean();
//       res.json(list);
//     } catch (err) {
//       next(err);
//     }
//   });

//   io.on('connection', (socket) => {
//     console.log('Client connected', socket.id);

//     // Sync existing zones & boundaries (in-memory)
//     for (const z of zones.values()) socket.emit('zone-update', z);
//     for (const b of boundaries.values()) socket.emit('boundary-update', b);

//     // --- 1) Tourist live data (merged logic + DB upsert) ---
//     socket.on('live-tourist-data', async (data: any) => {
//       const {
//         latitude,
//         longitude,
//         touristId,
//         personalId,
//         name,
//         phone,
//         email,
//         nationality,
//         destination,
//         tripStart,
//         tripEnd,
//         status,
//       } = data;

//       // Broadcast live location to authority/dashboard
//       io.emit('receive-location', {
//         socketId: socket.id,
//         touristId,
//         personalId,
//         name,
//         phone,
//         email,
//         nationality,
//         destination,
//         tripStart,
//         tripEnd,
//         status,
//         latitude,
//         longitude,
//         timestamp: data.timestamp || Date.now(),
//       });

//       // Store last known data in memory
//       activeTourists.set(socket.id, {
//         ...data,
//         socketId: socket.id,
//         timestamp: Date.now(),
//       });

//       socket.on('get-active-tourists', () => {
//         socket.emit('active-tourist-list', Array.from(activeTourists.values()));
//       });

//       // Persist/update tourist in MongoDB
//       try {
//         await TouristModel.findOneAndUpdate(
//           { socketId: socket.id },
//           {
//             socketId: socket.id,
//             tid: touristId,
//             personalId,
//             name,
//             email,
//             phone,
//             nationality,
//             latitude,
//             longitude,
//             status: status || 'active',
//             lastSeenAt: new Date(),
//           },
//           { new: true, upsert: true, setDefaultsOnInsert: true }
//         );
//       } catch (err) {
//         console.error('Error upserting tourist:', err);
//       }

//       // Geofence checks (unchanged logic)
//       const here: LatLng = { lat: latitude, lng: longitude };
//       const prevSet = insideZonesBySocket.get(socket.id) ?? new Set<string>();
//       const nextSet = new Set<string>();

//       for (const z of zones.values()) {
//         let inside = false;
//         if (z.type === 'circle' && z.coords && z.radius) {
//           const center = z.coords[0] || z.coords;
//           const centerLL = Array.isArray(center)
//             ? { lat: center[0], lng: center[1] }
//             : (center as LatLng);
//           inside = haversine(here, centerLL) <= (z.radius ?? 0);
//         } else if (z.type === 'polygon' && z.coords?.length) {
//           inside = pointInPolygon(here, z.coords);
//         }
//         if (inside) {
//           nextSet.add(z.id);
//           if (!prevSet.has(z.id)) {
//             io.emit('zone-alert', {
//               touristId,
//               zoneName: z.name,
//               risk: z.risk ?? 'low',
//             });
//           }
//         }
//       }
//       insideZonesBySocket.set(socket.id, nextSet);

//       // Boundary checks (unchanged)
//       let insideAnyBoundary = boundaries.size === 0 ? true : false;
//       if (boundaries.size > 0) {
//         insideAnyBoundary = false;
//         for (const b of boundaries.values()) {
//           let inside = false;
//           if (b.type === 'circle' && b.center && b.radius)
//             inside = haversine(here, b.center) <= b.radius;
//           else if (b.type === 'polygon' && b.coords?.length)
//             inside = pointInPolygon(here, b.coords);
//           if (inside) {
//             insideAnyBoundary = true;
//             break;
//           }
//         }
//       }
//       const prevInside = boundaryInsideBySocket.get(socket.id);
//       if (prevInside === undefined || (prevInside && !insideAnyBoundary)) {
//         if (!insideAnyBoundary)
//           io.emit('outside-boundary-alert', {
//             touristId,
//             boundaryName: 'Area',
//           });
//       }
//       boundaryInsideBySocket.set(socket.id, insideAnyBoundary);

//       // Extra debug log preserved
//       console.log('🔥 Received from Tourist:', data);
//     });

//     // --- Authority zone/boundary management (unchanged) ---
//     socket.on('zone-update', (z: Zone) => {
//       zones.set(z.id, z);
//       io.emit('zone-update', z);
//     });

//     socket.on('zone-deleted', ({ id }) => {
//       zones.delete(id);
//       io.emit('zone-deleted', { id });
//     });

//     socket.on('boundary-update', (b: Boundary) => {
//       boundaries.set(b.id, b);
//       io.emit('boundary-update', b);
//     });

//     socket.on('boundary-deleted', ({ id }) => {
//       boundaries.delete(id);
//       io.emit('boundary-deleted', { id });
//     });

//     // --- Heatmap (unchanged) ---
//     socket.on('heatmap-update', (points: [number, number][]) =>
//       io.emit('heatmap-update', points)
//     );

//     // --- Incidents/SOS with DB persistence ---
//     socket.on('sos-create', async (payload: Partial<Incident>) => {
//       const id =
//         payload.id ||
//         `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

//       const incident: Incident = {
//         id,
//         touristSocketId: socket.id,
//         touristId: payload.touristId,
//         touristName: payload.touristName,
//         touristPhone: payload.touristPhone,
//         touristEmail: payload.touristEmail,
//         location: payload.location,
//         description: payload.description,
//         media: payload.media,
//         createdAt: Date.now(),
//         status: 'new',
//       };
//       incidents.set(incident.id, incident);

//       try {
//         const mongoDoc = await IncidentModel.create({
//           socketId: socket.id,
//           touristId: payload.touristId,
//           touristName: payload.touristName,
//           touristPhone: payload.touristPhone,
//             touristEmail: payload.touristEmail,
//           location: payload.location
//             ? { lat: payload.location.lat, lng: payload.location.lng }
//             : undefined,
//           description: payload.description,
//           media: payload.media,
//           status: 'new',
//           severity: (payload as any).severity || 'high',
//           timeline: [
//             {
//               event: 'SOS created',
//               time: new Date().toISOString(),
//               user: payload.touristName || 'Tourist',
//             },
//           ],
//         });

//         const incidentForClients = {
//           ...incident,
//           dbId: mongoDoc._id.toString(),
//         };

//         io.emit('incident-new', incidentForClients);
//         socket.emit('sos-received', {
//           id: incident.id,
//           dbId: mongoDoc._id.toString(),
//         });
//       } catch (err) {
//         console.error('Error saving incident:', err);
//         io.emit('incident-new', incident);
//         socket.emit('sos-received', { id: incident.id });
//       }
//     });

//     socket.on('incident-ack', async ({ id, officer }) => {
//       const inc = incidents.get(id);
//       if (inc) {
//         inc.status = 'acknowledged';
//         inc.officer = officer;
//         incidents.set(id, inc);
//       }

//       try {
//         await IncidentModel.updateOne(
//           { socketId: inc?.touristSocketId, description: inc?.description },
//           {
//             $set: { status: 'acknowledged' },
//             $push: {
//               timeline: {
//                 event: 'Incident acknowledged',
//                 time: new Date().toISOString(),
//                 user: officer?.name || 'Officer',
//               },
//             },
//           }
//         );
//       } catch (err) {
//         console.error('Error updating incident (ack):', err);
//       }

//       if (inc) io.emit('incident-updated', inc);
//     });

//     socket.on('incident-resolve', async ({ id, notes }) => {
//       const inc = incidents.get(id);
//       if (inc) {
//         inc.status = 'resolved';
//         (inc as any).notes = notes;
//         incidents.set(id, inc);
//       }

//       try {
//         await IncidentModel.updateOne(
//           { socketId: inc?.touristSocketId, description: inc?.description },
//           {
//             $set: { status: 'resolved', notes },
//             $push: {
//               timeline: {
//                 event: 'Incident resolved',
//                 time: new Date().toISOString(),
//                 user: 'Officer',
//               },
//             },
//           }
//         );
//       } catch (err) {
//         console.error('Error updating incident (resolve):', err);
//       }

//       if (inc) io.emit('incident-updated', inc);
//     });

//     socket.on('disconnect', () => {
//       io.emit('user-disconnected', socket.id);
//       insideZonesBySocket.delete(socket.id);
//       boundaryInsideBySocket.delete(socket.id);
//       activeTourists.delete(socket.id);
//     });
//   });

//   const shutdown = () =>
//     server.close(async () => {
//       await disconnectMongo();
//       process.exit(0);
//     });
//   process.on('SIGINT', shutdown);
//   process.on('SIGTERM', shutdown);
// };

// start();


// src/server.ts
import { env } from './config/env.js';
import { buildApp } from './app.js';
import { connectMongo, disconnectMongo } from './db/mongoose.js';
import { Server as SocketIOServer } from 'socket.io';
import { IncidentModel } from './modules/incident/incident.model.js';
import { TouristModel } from './modules/authTourist/tourist.model.js';

const start = async () => {
  await connectMongo();
  const app = buildApp();
  const server = app.listen(env.PORT, '0.0.0.0', () =>
    console.log(`API listening on http://localhost:${env.PORT}`)
  );

  const io = new SocketIOServer(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  type LatLng = { lat: number; lng: number };
  type Zone = {
    id: string;
    name: string;
    type: 'circle' | 'polygon';
    coords?: LatLng[];
    radius?: number;
    risk?: string;
  };
  type Boundary = {
    id: string;
    name: string;
    type: 'circle' | 'polygon';
    center?: LatLng;
    coords?: LatLng[];
    radius?: number;
  };
  type Incident = {
    id: string;
    touristSocketId: string;
    touristId?: string;
    touristName?: string;
    touristEmail?: string;
    touristPhone?: string;
    location?: LatLng;
    description?: string;
    media?: { audio?: string; video?: string; photo?: string };
    createdAt: number;
    status: 'new' | 'acknowledged' | 'resolved';
    officer?: { id?: string; name?: string };
  };

  const zones = new Map<string, Zone>();
  const boundaries = new Map<string, Boundary>();
  const incidents = new Map<string, Incident>();
  const insideZonesBySocket = new Map<string, Set<string>>();
  const boundaryInsideBySocket = new Map<string, boolean>();
  const activeTourists = new Map<string, any>();

  const haversine = (a: LatLng, b: LatLng) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };

  const pointInPolygon = (pt: LatLng, poly: LatLng[]) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].lng, yi = poly[i].lat;
      const xj = poly[j].lng, yj = poly[j].lat;
      const intersect =
        yi > pt.lat !== yj > pt.lat &&
        pt.lng < ((xj - xi) * (pt.lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // REST incidents
  app.get('/api/incidents', async (_req, res, next) => {
    try {
      const list = await IncidentModel.find().sort({ createdAt: -1 }).lean();
      res.json(list);
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected', socket.id);

    // sync zones/boundaries
    for (const z of zones.values()) socket.emit('zone-update', z);
    for (const b of boundaries.values()) socket.emit('boundary-update', b);

    // --- Tourist live data + DB + geofence + heatmap ---
    socket.on('live-tourist-data', async (data: any) => {
      const {
        latitude,
        longitude,
        touristId,
        personalId,
        name,
        phone,
        email,
        nationality,
        destination,
        tripStart,
        tripEnd,
        status,
      } = data;

      // broadcast location
      io.emit('receive-location', {
        socketId: socket.id,
        touristId,
        personalId,
        name,
        phone,
        email,
        nationality,
        destination,
        tripStart,
        tripEnd,
        status,
        latitude,
        longitude,
        timestamp: data.timestamp || Date.now(),
      });

      // in-memory
      activeTourists.set(socket.id, {
        ...data,
        socketId: socket.id,
        timestamp: Date.now(),
      });

      socket.on('get-active-tourists', () => {
        socket.emit('active-tourist-list', Array.from(activeTourists.values()));
      });

      // DB upsert
      try {
        await TouristModel.findOneAndUpdate(
          { socketId: socket.id },
          {
            socketId: socket.id,
            tid: touristId,
            personalId,
            name,
            email,
            phone,
            nationality,
            latitude,
            longitude,
            status: status || 'active',
            lastSeenAt: new Date(),
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        console.error('Error upserting tourist:', err);
      }

      // geofence
      const here: LatLng = { lat: latitude, lng: longitude };
      const prevSet = insideZonesBySocket.get(socket.id) ?? new Set<string>();
      const nextSet = new Set<string>();

      for (const z of zones.values()) {
        let inside = false;
        if (z.type === 'circle' && z.coords && z.radius) {
          const center = z.coords[0] || z.coords;
          const centerLL = Array.isArray(center)
            ? { lat: center[0], lng: center[1] }
            : (center as LatLng);
          inside = haversine(here, centerLL) <= (z.radius ?? 0);
        } else if (z.type === 'polygon' && z.coords?.length) {
          inside = pointInPolygon(here, z.coords);
        }
        if (inside) {
          nextSet.add(z.id);
          if (!prevSet.has(z.id)) {
            io.emit('zone-alert', {
              touristId,
              zoneName: z.name,
              risk: z.risk ?? 'low',
            });
          }
        }
      }
      insideZonesBySocket.set(socket.id, nextSet);

      // boundary
      let insideAnyBoundary = boundaries.size === 0 ? true : false;
      if (boundaries.size > 0) {
        insideAnyBoundary = false;
        for (const b of boundaries.values()) {
          let inside = false;
          if (b.type === 'circle' && b.center && b.radius)
            inside = haversine(here, b.center) <= b.radius;
          else if (b.type === 'polygon' && b.coords?.length)
            inside = pointInPolygon(here, b.coords);
          if (inside) {
            insideAnyBoundary = true;
            break;
          }
        }
      }
      const prevInside = boundaryInsideBySocket.get(socket.id);
      if (prevInside === undefined || (prevInside && !insideAnyBoundary)) {
        if (!insideAnyBoundary)
          io.emit('outside-boundary-alert', {
            touristId,
            boundaryName: 'Area',
          });
      }
      boundaryInsideBySocket.set(socket.id, insideAnyBoundary);

      console.log('🔥 Received from Tourist:', data);

      // 🔥 HEATMAP: build points for all active tourists and broadcast
      const heatPoints: [number, number][] = Array.from(activeTourists.values())
        .filter(
          (t: any) =>
            typeof t.latitude === 'number' && typeof t.longitude === 'number'
        )
        .map((t: any) => [t.longitude, t.latitude]); // [lng, lat]

      console.log('🔥 server heatmap points', heatPoints.length, heatPoints);
      io.emit('heatmap-update', heatPoints);
    });

    // --- zones/boundaries ---
    socket.on('zone-update', (z: Zone) => {
      zones.set(z.id, z);
      io.emit('zone-update', z);
    });

    socket.on('zone-deleted', ({ id }) => {
      zones.delete(id);
      io.emit('zone-deleted', { id });
    });

    socket.on('boundary-update', (b: Boundary) => {
      boundaries.set(b.id, b);
      io.emit('boundary-update', b);
    });

    socket.on('boundary-deleted', ({ id }) => {
      boundaries.delete(id);
      io.emit('boundary-deleted', { id });
    });

    // ❌ remove the old socket.on('heatmap-update', ...) – server should not listen
    // (no heatmap listener block here)

    // --- incidents ---
    socket.on('sos-create', async (payload: Partial<Incident>) => {
      const id =
        payload.id ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const incident: Incident = {
        id,
        touristSocketId: socket.id,
        touristId: payload.touristId,
        touristName: payload.touristName,
        touristPhone: payload.touristPhone,
        touristEmail: payload.touristEmail,
        location: payload.location,
        description: payload.description,
        media: payload.media,
        createdAt: Date.now(),
        status: 'new',
      };
      incidents.set(incident.id, incident);

      try {
        const mongoDoc = await IncidentModel.create({
          socketId: socket.id,
          touristId: payload.touristId,
          touristName: payload.touristName,
          touristPhone: payload.touristPhone,
          touristEmail: payload.touristEmail,
          location: payload.location
            ? { lat: payload.location.lat, lng: payload.location.lng }
            : undefined,
          description: payload.description,
          media: payload.media,
          status: 'new',
          severity: (payload as any).severity || 'high',
          timeline: [
            {
              event: 'SOS created',
              time: new Date().toISOString(),
              user: payload.touristName || 'Tourist',
            },
          ],
        });

        const incidentForClients = {
          ...incident,
          dbId: mongoDoc._id.toString(),
        };

        io.emit('incident-new', incidentForClients);
        socket.emit('sos-received', {
          id: incident.id,
          dbId: mongoDoc._id.toString(),
        });
      } catch (err) {
        console.error('Error saving incident:', err);
        io.emit('incident-new', incident);
        socket.emit('sos-received', { id: incident.id });
      }
    });

    socket.on('incident-ack', async ({ id, officer }) => {
      const inc = incidents.get(id);
      if (inc) {
        inc.status = 'acknowledged';
        inc.officer = officer;
        incidents.set(id, inc);
      }

      try {
        await IncidentModel.updateOne(
          { socketId: inc?.touristSocketId, description: inc?.description },
          {
            $set: { status: 'acknowledged' },
            $push: {
              timeline: {
                event: 'Incident acknowledged',
                time: new Date().toISOString(),
                user: officer?.name || 'Officer',
              },
            },
          }
        );
      } catch (err) {
        console.error('Error updating incident (ack):', err);
      }

      if (inc) io.emit('incident-updated', inc);
    });

    socket.on('incident-resolve', async ({ id, notes }) => {
      const inc = incidents.get(id);
      if (inc) {
        inc.status = 'resolved';
        (inc as any).notes = notes;
        incidents.set(id, inc);
      }

      try {
        await IncidentModel.updateOne(
          { socketId: inc?.touristSocketId, description: inc?.description },
          {
            $set: { status: 'resolved', notes },
            $push: {
              timeline: {
                event: 'Incident resolved',
                time: new Date().toISOString(),
                user: 'Officer',
              },
            },
          }
        );
      } catch (err) {
        console.error('Error updating incident (resolve):', err);
      }

      if (inc) io.emit('incident-updated', inc);
    });

    socket.on('disconnect', () => {
      io.emit('user-disconnected', socket.id);
      insideZonesBySocket.delete(socket.id);
      boundaryInsideBySocket.delete(socket.id);
      activeTourists.delete(socket.id);
    });
  });

  const shutdown = () =>
    server.close(async () => {
      await disconnectMongo();
      process.exit(0);
    });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();
