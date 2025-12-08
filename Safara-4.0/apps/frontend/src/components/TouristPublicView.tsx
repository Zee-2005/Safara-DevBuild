import { useEffect, useState } from "react";
import axios from "axios";

interface TouristPublicViewProps {
  tid: string;
}

interface TouristData {
  tid: string;
  userId: string;
  holderPid: string;
  travelerType: string;
  destination: string;
  status: string;
  startDate: string;
  endDate: string;

  agencyId?: string;
  homeCity?: string;
  itinerary?: string;
}

export default function TouristPublicView({ tid }: TouristPublicViewProps) {
  const [tourist, setTourist] = useState<TouristData | null>(null);
  const [error, setError] = useState("");
const API = import.meta.env.VITE_API_BACKEND_URL;



  useEffect(() => {
    if (!tid) return;

    axios
      .get(`http://10.0.12.219:3000/api/tourist/${tid}`)
      .then((res) => setTourist(res.data))
      .catch(() => setError("Tourist ID not found"));
  }, [tid]);

  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!tourist) return <p className="text-center">Loading tourist details...</p>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Tourist Details</h2>

      <div className="space-y-2">
        <p><strong>ID:</strong> {tourist.tid}</p>
        <p><strong>User ID:</strong> {tourist.userId}</p>
        <p><strong>Holder PID:</strong> {tourist.holderPid}</p>
        <p><strong>Traveler Type:</strong> {tourist.travelerType}</p>
        <p><strong>Destination:</strong> {tourist.destination}</p>
        <p><strong>Status:</strong> {tourist.status}</p>

        <p>
          <strong>Travel Dates:</strong>{" "}
          {new Date(tourist.startDate).toLocaleDateString()} -{" "}
          {new Date(tourist.endDate).toLocaleDateString()}
        </p>

        {tourist.agencyId && <p><strong>Agency:</strong> {tourist.agencyId}</p>}
        {tourist.homeCity && <p><strong>Home City:</strong> {tourist.homeCity}</p>}
        {tourist.itinerary && <p><strong>Itinerary:</strong> {tourist.itinerary}</p>}
      </div>
    </div>
  );
}
