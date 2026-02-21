import React, { useEffect, useState } from "react";
import { MapPin, Navigation, Building2, Flame, Shield, RefreshCw } from "lucide-react";

interface Location {
  lat: number;
  lon: number;
  address: string;
}

interface NearbyService {
  name: string;
  type: "police" | "hospital" | "fire";
  distance: string;
  eta: string;
}

interface LocationServicesProps {
  onLocationReady: (location: Location) => void;
}

const MOCK_SERVICES: NearbyService[] = [
  { name: "Metro Police Precinct 7", type: "police", distance: "0.8 km", eta: "4 min" },
  { name: "City General Hospital", type: "hospital", distance: "1.2 km", eta: "6 min" },
  { name: "Fire Station No. 12", type: "fire", distance: "1.5 km", eta: "7 min" },
];

const serviceIcon = (type: NearbyService["type"]) => {
  switch (type) {
    case "police": return <Shield size={16} />;
    case "hospital": return <Building2 size={16} />;
    case "fire": return <Flame size={16} />;
  }
};

const serviceColor = (type: NearbyService["type"]) => {
  switch (type) {
    case "police": return "text-blue-400 border-blue-400/30 bg-blue-400/10";
    case "hospital": return "text-neon-red border-neon-red/30 bg-neon-red/10";
    case "fire": return "text-neon-amber border-neon-amber/30 bg-neon-amber/10";
  }
};

const LocationServices: React.FC<LocationServicesProps> = ({ onLocationReady }) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: Location = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          address: `${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`,
        };
        setLocation(loc);
        onLocationReady(loc);
        setLoading(false);
      },
      () => {
        // Fallback mock location
        const loc: Location = {
          lat: 40.7128,
          lon: -74.006,
          address: "Downtown District, New York, NY",
        };
        setLocation(loc);
        onLocationReady(loc);
        setLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return (
    <div className="sentinel-card-highlight p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <h2 className="font-orbitron text-sm text-neon-green tracking-widest uppercase">
            Location Intel
          </h2>
        </div>
        <button
          onClick={fetchLocation}
          disabled={loading}
          className="p-1.5 rounded-lg border border-surface-3 text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/40 transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tactical map display */}
      <div className="relative rounded-xl overflow-hidden border border-surface-3 h-40 bg-surface-2 scan-grid">
        {/* Grid overlay tactical map */}
        <div className="absolute inset-0 flex items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw size={16} className="animate-spin" />
              <span className="font-mono text-xs">Acquiring GPS...</span>
            </div>
          ) : location ? (
            <>
              {/* Concentric rings */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-neon-green/20"
                  style={{ width: `${i * 30}%`, height: `${i * 30}%` }}
                />
              ))}
              {/* Center pin */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-neon-cyan glow-cyan animate-pulse" />
                <div className="w-0.5 h-4 bg-neon-cyan/50 mt-0.5" />
              </div>
              {/* Corner labels */}
              <div className="absolute top-2 left-3 font-mono text-[9px] text-neon-green/50">
                {location.lat.toFixed(3)}°N
              </div>
              <div className="absolute top-2 right-3 font-mono text-[9px] text-neon-green/50">
                {Math.abs(location.lon).toFixed(3)}°W
              </div>
              <div className="absolute bottom-2 left-3 font-mono text-[9px] text-neon-cyan/40">
                GPS LOCK ✓
              </div>
              <div className="absolute bottom-2 right-3 font-mono text-[9px] text-neon-cyan/40">
                ACC ±10m
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground font-mono">{error || "Location unavailable"}</p>
          )}
        </div>
      </div>

      {/* Location details */}
      {location && (
        <div className="rounded-lg bg-surface-2 p-3 flex items-start gap-3">
          <MapPin size={16} className="text-neon-cyan mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Current Position</p>
            <p className="text-sm text-foreground font-mono">{location.address}</p>
          </div>
        </div>
      )}

      {/* Nearby services */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Nearest Emergency Services</p>
        {MOCK_SERVICES.map((svc, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-lg border p-3 ${serviceColor(svc.type)}`}
          >
            <div className={`p-1.5 rounded-lg border ${serviceColor(svc.type)}`}>
              {serviceIcon(svc.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{svc.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {svc.distance} away · ETA {svc.eta}
              </p>
            </div>
            <Navigation size={12} className="text-muted-foreground shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationServices;
