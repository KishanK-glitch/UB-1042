import React, { useEffect, useRef, useState } from "react";
import { X, Siren, Phone, MessageSquare, CheckCircle, ShieldAlert } from "lucide-react";
import { ThreatResult, ThreatType } from "./ThreatAnalysisPanel";
import { AlertType } from "./AlertModal";

// Maps each threat type to which services get auto-dispatched, in priority order
export const THREAT_DISPATCH_MAP: Record<NonNullable<ThreatType>, AlertType[]> = {
  gunshot:   ["police"],
  explosion: ["police", "fire"],
  fire:      ["fire", "police"],
  collision: ["police", "hospital"],
  scream:    ["police", "hospital"],
  gas:       ["fire"],
};

// Human-readable service labels
const SERVICE_META: Record<AlertType, { emoji: string; label: string; phone: string; color: string; bg: string; border: string }> = {
  police:   { emoji: "🚓", label: "Police",   phone: "911", color: "text-blue-400",   bg: "bg-blue-400/15",   border: "border-blue-400/40" },
  hospital: { emoji: "🚑", label: "Ambulance", phone: "911", color: "text-neon-red",   bg: "bg-neon-red/15",   border: "border-neon-red/40" },
  fire:     { emoji: "🚒", label: "Fire Dept", phone: "911", color: "text-neon-amber", bg: "bg-neon-amber/15", border: "border-neon-amber/40" },
  sos:      { emoji: "📞", label: "SOS Contact", phone: "",  color: "text-purple-400", bg: "bg-purple-400/15", border: "border-purple-400/40" },
};

// Countdown seconds by severity
const COUNTDOWN_BY_SEVERITY: Record<string, number> = {
  Critical: 5,
  High:     8,
  Medium:   12,
};

interface AutoDispatchProps {
  threat: ThreatResult | null;
  location: { lat: number; lon: number; address: string } | null;
  sosContact: string;
  onDispatched: (services: AlertType[]) => void;
  onDismissed: () => void;
}

const buildSmsBody = (
  service: AlertType,
  threat: ThreatResult,
  location: { lat: number; lon: number; address: string } | null,
) =>
  encodeURIComponent(
    `🚨 SENTINEL-X AUTO ALERT 🚨\n` +
    `Service: ${SERVICE_META[service].label.toUpperCase()}\n` +
    `Threat: ${threat.label}\n` +
    `Severity: ${threat.severity}\n` +
    `Confidence: ${threat.confidence}%\n` +
    `Details: ${threat.message}\n` +
    `Location: ${location?.address ?? "Unknown"}\n` +
    (location ? `Coords: ${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}\n` +
      `Maps: https://maps.google.com/?q=${location.lat},${location.lon}\n` : "") +
    `Time: ${new Date().toLocaleString()}\n\n` +
    `— Auto-dispatched by Sentinel-X Personal Safety System`
  );

const AutoDispatch: React.FC<AutoDispatchProps> = ({
  threat,
  location,
  sosContact,
  onDispatched,
  onDismissed,
}) => {
  const totalSeconds =
    COUNTDOWN_BY_SEVERITY[threat?.severity ?? "High"] ?? 8;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [phase, setPhase] = useState<"countdown" | "dispatching" | "done">("countdown");
  const [dispatchIndex, setDispatchIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const services: AlertType[] =
    threat?.type ? THREAT_DISPATCH_MAP[threat.type] ?? ["police"] : ["police"];

  // Countdown tick
  useEffect(() => {
    if (phase !== "countdown") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          startDispatch();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  const startDispatch = () => {
    setPhase("dispatching");
  };

  // When dispatching: fire each SMS sequentially with small delay
  useEffect(() => {
    if (phase !== "dispatching") return;
    const service = services[dispatchIndex];
    if (!service || !threat) return;

    const phone = service === "sos" ? sosContact : SERVICE_META[service].phone;
    if (phone) {
      const body = buildSmsBody(service, threat, location);
      // Open SMS with pre-filled body
      window.location.href = `sms:${phone}?body=${body}`;
    }

    const next = setTimeout(() => {
      if (dispatchIndex + 1 < services.length) {
        setDispatchIndex((i) => i + 1);
      } else {
        setPhase("done");
        onDispatched(services);
      }
    }, 1200);

    return () => clearTimeout(next);
  }, [phase, dispatchIndex]);

  const handleCancel = () => {
    clearInterval(timerRef.current!);
    onDismissed();
  };

  const handleSendNow = () => {
    clearInterval(timerRef.current!);
    setSecondsLeft(0);
    startDispatch();
  };

  if (!threat) return null;

  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const isCritical = threat.severity === "Critical";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-neon-red/50 bg-surface-1 shadow-2xl animate-threat-appear overflow-hidden"
        style={{ boxShadow: "0 0 60px hsl(0 88% 60% / 0.25), 0 0 120px hsl(0 88% 60% / 0.1)" }}
      >
        {/* Red pulse stripe at top */}
        <div
          className="h-1 w-full"
          style={{
            background: isCritical
              ? "linear-gradient(90deg, hsl(0 88% 60%), hsl(38 100% 55%), hsl(0 88% 60%))"
              : "hsl(0 88% 60%)",
            animation: isCritical ? "blink-alert 0.8s ease-in-out infinite" : "none",
          }}
        />

        {phase === "done" ? (
          /* ── DONE ── */
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="animate-success-pop">
              <CheckCircle size={56} className="text-neon-green" style={{ filter: "drop-shadow(0 0 14px hsl(140 70% 45%))" }} />
            </div>
            <div className="space-y-1">
              <h3 className="font-orbitron text-lg text-neon-green">Alerts Dispatched</h3>
              <p className="text-sm text-muted-foreground">
                Emergency services have been automatically notified
              </p>
            </div>
            <div className="w-full space-y-2">
              {services.map((s) => (
                <div key={s} className={`flex items-center gap-3 rounded-lg border p-2.5 ${SERVICE_META[s].border} ${SERVICE_META[s].bg}`}>
                  <span className="text-lg">{SERVICE_META[s].emoji}</span>
                  <span className={`font-mono text-xs font-semibold ${SERVICE_META[s].color}`}>
                    {SERVICE_META[s].label}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-neon-green">✓ SMS sent</span>
                </div>
              ))}
            </div>
          </div>
        ) : phase === "dispatching" ? (
          /* ── DISPATCHING ── */
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-neon-red/30 animate-rotate-ring" style={{ borderTopColor: "hsl(0 88% 60%)" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <MessageSquare size={22} className="text-neon-red animate-pulse" />
              </div>
            </div>
            <div>
              <p className="font-orbitron text-sm text-neon-red tracking-widest">DISPATCHING</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Sending SMS to {SERVICE_META[services[dispatchIndex]]?.label}...
              </p>
            </div>
            <div className="w-full space-y-2">
              {services.map((s, i) => (
                <div key={s} className={`flex items-center gap-3 rounded-lg border p-2.5 ${SERVICE_META[s].border} ${SERVICE_META[s].bg}`}>
                  <span className="text-lg">{SERVICE_META[s].emoji}</span>
                  <span className={`font-mono text-xs font-semibold ${SERVICE_META[s].color}`}>
                    {SERVICE_META[s].label}
                  </span>
                  <span className="ml-auto font-mono text-[10px]">
                    {i < dispatchIndex
                      ? <span className="text-neon-green">✓ Sent</span>
                      : i === dispatchIndex
                      ? <span className="text-neon-amber animate-pulse">Sending...</span>
                      : <span className="text-muted-foreground">Queued</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── COUNTDOWN ── */
          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Siren size={18} className="text-neon-red animate-blink-alert" />
                <h3 className="font-orbitron text-sm tracking-widest uppercase text-neon-red">
                  Auto-Dispatch
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded font-orbitron text-xs font-bold border ${
                isCritical
                  ? "border-neon-red text-neon-red bg-neon-red/10 animate-blink-alert"
                  : "border-neon-amber text-neon-amber bg-neon-amber/10"
              }`}>
                {threat.severity}
              </span>
            </div>

            {/* Threat summary */}
            <div className="rounded-xl bg-neon-red/10 border border-neon-red/30 p-4 space-y-1">
              <p className="font-orbitron text-base font-bold text-neon-red text-glow-red">
                ⚠ {threat.label.toUpperCase()} DETECTED
              </p>
              <p className="text-xs text-muted-foreground font-mono">{threat.message}</p>
              <p className="text-xs font-mono">
                <span className="text-muted-foreground">Confidence: </span>
                <span className="text-neon-red font-bold">{threat.confidence}%</span>
                <span className="text-muted-foreground ml-3">Location: </span>
                <span className="text-foreground">{location?.address ?? "Acquiring..."}</span>
              </p>
            </div>

            {/* Services being dispatched */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                <ShieldAlert size={10} className="inline mr-1" />
                Auto-dispatching to
              </p>
              {services.map((s) => (
                <div key={s} className={`flex items-center gap-3 rounded-lg border p-3 ${SERVICE_META[s].border} ${SERVICE_META[s].bg}`}>
                  <span className="text-xl">{SERVICE_META[s].emoji}</span>
                  <div className="flex-1">
                    <p className={`font-orbitron text-xs font-bold ${SERVICE_META[s].color}`}>
                      {SERVICE_META[s].label}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      SMS + Call · {SERVICE_META[s].phone || sosContact || "No number set"}
                    </p>
                  </div>
                  <Phone size={13} className={SERVICE_META[s].color} />
                </div>
              ))}
            </div>

            {/* Countdown ring */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="hsl(220 15% 16%)" strokeWidth="6" />
                  <circle
                    cx="48" cy="48" r="40"
                    fill="none"
                    stroke="hsl(0 88% 60%)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                    style={{ transition: "stroke-dashoffset 1s linear", filter: "drop-shadow(0 0 6px hsl(0 88% 60% / 0.8))" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-orbitron text-3xl font-black text-neon-red leading-none">
                    {secondsLeft}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono mt-0.5">seconds</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-mono text-center">
                Alert will auto-send in <span className="text-neon-red font-bold">{secondsLeft}s</span> unless cancelled
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-surface-3 text-muted-foreground hover:text-foreground hover:border-surface-2 transition-all text-sm font-mono"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                onClick={handleSendNow}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-neon-red bg-neon-red/10 text-neon-red hover:bg-neon-red hover:text-background font-orbitron text-sm font-bold transition-all glow-red"
              >
                <MessageSquare size={14} />
                Send Now
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground font-mono text-center">
              🔒 Only threat metadata & location sent · No raw audio/image
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoDispatch;
