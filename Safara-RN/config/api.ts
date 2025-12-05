// src/config/api.ts
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.104:3000/api/v1";

 const SOCKET_API_BASE =
  process.env.SOCKET_API_URL || "http://192.168.0.104:3000";

export { SOCKET_API_BASE, API_BASE }; 


