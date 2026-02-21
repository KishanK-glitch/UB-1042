import React, { useState } from "react";
import { X, AlertTriangle, CheckCircle, Phone, MessageSquare, Loader2 } from "lucide-react";
import { ThreatResult } from "./ThreatAnalysisPanel";

export type AlertType = "police" | "hospital" | "fire" | "sos";

interface AlertModalProps {
  alertType: AlertType | null;
  threat: ThreatResult | null;
  location: { lat: number; lon: number; address: string } | null;
  sosContact: string;
  onClose: () => void;
  onConfirm: () => void;
}

const alertConfig: Record<
  AlertType,
  {
    label: string;
    emoji: string;
    color: string;
    borderColor: string;
    bg: string;
    phone: string;        // Direct emergency line
    phonelabel: string;   // Display name for the number
  }
> = {
  police: {
    label: "Police Station",
    emoji: "🚓",
    color: "text-blue-400",
    borderColor: "border-blue-400/40",
    bg: "bg-blue-400/10",
    phone: "911",
    phonelabel: "Police Emergency (911)",
  },
  hospital: {
    label: "Hospital / Ambulance",
    emoji: "🚑",
    color: "text-neon-red",
    borderColor: "border-neon-red/40",
    bg: "bg-neon-red/10",
    phone: "911",
    phonelabel: "Ambulance Emergency (911)",
  },
  fire: {
    label: "Fire Station",
    emoji: "🚒",
    color: "text-neon-amber",
    borderColor: "border-neon-amber/40",
    bg: "bg-neon-amber/10",
    phone: "911",
    phonelabel: "Fire Emergency (911)",
  },
  sos: {
    label: "Emergency Contact",
    emoji: "📞",
    color: "text-purple-400",
    borderColor: "border-purple-400/40",
    bg: "bg-purple-400/10",
    phone: "",            // filled from sosContact prop
    phonelabel: "Personal SOS Contact",
  },
};

const AlertModal: React.FC<AlertModalProps> = ({
  alertType,
  threat,
  location,
  sosContact,
  onClose,
  onConfirm,
}) => {
  const [sent, setSent] = useState(false);
  const [dispatchedVia, setDispatchedVia] = useState<"call" | "sms" | null>(null);

  if (!alertType) return null;

  const config = alertConfig[alertType];
  const phone = alertType === "sos" ? sosContact : config.phone;
  const timestamp = new Date().toLocaleString();

  // Build the SMS body sent to each emergency type
  const smsBody = encodeURIComponent(
    `🚨 SENTINEL-X EMERGENCY ALERT 🚨\n` +
    `Type: ${alertType.toUpperCase()} ALERT\n` +
    `Threat: ${threat?.label ?? "Unknown"}\n` +
    `Severity: ${threat?.severity ?? "Unknown"}\n` +
    `Confidence: ${threat?.confidence ?? "—"}%\n` +
    `Location: ${location?.address ?? "Unknown"}\n` +
    (location ? `Coords: ${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}\n` : "") +
    `Maps: https://maps.google.com/?q=${location?.lat ?? 0},${location?.lon ?? 0}\n` +
    `Time: ${timestamp}\n` +
    `Message: ${threat?.message ?? "Threat detected. Assistance required immediately."}\n\n` +
    `— Sent via Sentinel-X Personal Safety System`
  );

  const handleCall = () => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
    setDispatchedVia("call");
    setSent(true);
    setTimeout(onConfirm, 1800);
  };

  const handleSMS = () => {
    if (!phone) return;
    // sms: works on iOS and Android; body param may vary by OS
    window.location.href = `sms:${phone}?body=${smsBody}`;
    setDispatchedVia("sms");
    setSent(true);
    setTimeout(onConfirm, 1800);
  };

  const glowColor =
    alertType === "police"
      ? "hsl(220 80% 60% / 0.2)"
      : alertType === "fire"
      ? "hsl(38 100% 55% / 0.2)"
      : alertType === "sos"
      ? "hsl(270 80% 65% / 0.2)"
      : "hsl(0 88% 60% / 0.2)";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={!sent ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-2xl border ${config.borderColor} bg-surface-1 shadow-2xl animate-threat-appear`}
        style={{ boxShadow: `0 0 40px ${glowColor}` }}
      >
        {sent ? (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="animate-success-pop">
              <CheckCircle size={56} className="text-neon-green" style={{ filter: "drop-shadow(0 0 12px hsl(140 70% 45%))" }} />
            </div>
            <div className="space-y-1">
              <h3 className="font-orbitron text-lg text-neon-green">Alert Dispatched</h3>
              <p className="text-sm text-muted-foreground">
                {dispatchedVia === "call"
                  ? `Calling ${config.phonelabel}...`
                  : `SMS alert opened for ${config.phonelabel}`}
              </p>
            </div>
            <div className="w-full rounded-lg bg-neon-green/10 border border-neon-green/30 p-3 space-y-1">
              <p className="text-xs font-mono text-neon-green">
                ✓ {config.emoji} {config.label} alerted
              </p>
              <p className="text-[10px] font-mono text-muted-foreground">
                {dispatchedVia === "call" ? "📞 Voice call initiated" : "📱 Pre-filled SMS launched"} · {timestamp}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className={`${config.color} animate-blink-alert`} />
                <h3 className="font-orbitron text-sm tracking-widest uppercase text-foreground">
                  Confirm Alert
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target */}
            <div className={`rounded-xl border ${config.borderColor} ${config.bg} p-4 flex items-center gap-3`}>
              <span className="text-2xl">{config.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${config.color} font-orbitron text-sm`}>
                  Alert {config.label}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                  {phone ? `📞 ${config.phonelabel} · ${phone}` : "⚠ No contact number set"}
                </p>
              </div>
            </div>

            {/* No phone warning for SOS */}
            {alertType === "sos" && !phone && (
              <div className="rounded-lg bg-neon-amber/10 border border-neon-amber/30 p-3">
                <p className="text-xs text-neon-amber font-mono">
                  ⚠ No SOS contact number configured. Please set one in the Emergency Response panel.
                </p>
              </div>
            )}

            {/* Signal payload */}
            <div className="rounded-xl border border-surface-3 bg-surface-2 p-4 space-y-3">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                Signal Payload
              </p>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Timestamp</span>
                  <span className="text-foreground text-right">{timestamp}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Location</span>
                  <span className="text-foreground text-right truncate max-w-[180px]">
                    {location?.address || "Unknown"}
                  </span>
                </div>
                {location && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">Coords</span>
                    <span className="text-neon-cyan text-right">
                      {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Threat Type</span>
                  <span className={`${config.color} text-right`}>{threat?.label || "Unknown"}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Severity</span>
                  <span
                    className={
                      threat?.severity === "Critical" || threat?.severity === "High"
                        ? "text-neon-red"
                        : "text-neon-amber"
                    }
                  >
                    {threat?.severity || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Media</span>
                  <span className="text-neon-cyan">Metadata only (encrypted)</span>
                </div>
              </div>
            </div>

            {/* Privacy note */}
            <p className="text-[10px] text-muted-foreground font-mono text-center leading-relaxed">
              🔒 Raw audio/images are NOT transmitted. Only threat metadata is shared.
            </p>

            {/* Action buttons — Call + SMS */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                className="py-3 rounded-xl border border-surface-3 text-muted-foreground hover:text-foreground hover:border-surface-2 transition-all text-sm font-mono"
              >
                Cancel
              </button>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCall}
                  disabled={!phone}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border font-orbitron text-xs font-bold transition-all
                    ${phone
                      ? `${config.borderColor} ${config.bg} ${config.color} hover:brightness-110`
                      : "border-surface-3 text-muted-foreground opacity-40 cursor-not-allowed"
                    }`}
                >
                  <Phone size={13} />
                  Call Now
                </button>
                <button
                  onClick={handleSMS}
                  disabled={!phone}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border font-orbitron text-xs font-bold transition-all
                    ${phone
                      ? `${config.borderColor} ${config.bg} ${config.color} hover:brightness-110`
                      : "border-surface-3 text-muted-foreground opacity-40 cursor-not-allowed"
                    }`}
                >
                  <MessageSquare size={13} />
                  Send SMS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertModal;
