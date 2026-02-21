import React, { useState } from "react";
import { Shield, Heart, Flame, Phone, Edit2, Check, Zap } from "lucide-react";
import AlertModal, { AlertType } from "./AlertModal";
import { ThreatResult } from "./ThreatAnalysisPanel";

interface EmergencyAlertsProps {
  threat: ThreatResult | null;
  location: { lat: number; lon: number; address: string } | null;
  disabled?: boolean;
  autoDispatchedServices?: AlertType[];
}

interface AlertButton {
  type: AlertType;
  label: string;
  emoji: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  bg: string;
  hoverBg: string;
  phone: string;
}

const ALERT_BUTTONS: AlertButton[] = [
  {
    type: "police",
    label: "Alert Police",
    emoji: "🚓",
    icon: <Shield size={18} />,
    color: "text-blue-400",
    border: "border-blue-400/30",
    bg: "bg-blue-400/10",
    hoverBg: "hover:bg-blue-400 hover:text-background hover:border-blue-400",
    phone: "911",
  },
  {
    type: "hospital",
    label: "Alert Hospital",
    emoji: "🚑",
    icon: <Heart size={18} />,
    color: "text-neon-red",
    border: "border-neon-red/30",
    bg: "bg-neon-red/10",
    hoverBg: "hover:bg-neon-red hover:text-background hover:border-neon-red",
    phone: "911",
  },
  {
    type: "fire",
    label: "Alert Fire Dept",
    emoji: "🚒",
    icon: <Flame size={18} />,
    color: "text-neon-amber",
    border: "border-neon-amber/30",
    bg: "bg-neon-amber/10",
    hoverBg: "hover:bg-neon-amber hover:text-background hover:border-neon-amber",
    phone: "911",
  },
  {
    type: "sos",
    label: "SOS Contact",
    emoji: "📞",
    icon: <Phone size={18} />,
    color: "text-purple-400",
    border: "border-purple-400/30",
    bg: "bg-purple-400/10",
    hoverBg: "hover:bg-purple-400 hover:text-background hover:border-purple-400",
    phone: "",
  },
];

const EmergencyAlerts: React.FC<EmergencyAlertsProps> = ({
  threat,
  location,
  disabled,
  autoDispatchedServices = [],
}) => {
  const [activeAlert, setActiveAlert] = useState<AlertType | null>(null);
  const [manualSentAlerts, setManualSentAlerts] = useState<Set<AlertType>>(new Set());
  const [sosContact, setSosContact] = useState<string>(
    () => localStorage.getItem("sentinel_sos_contact") ?? ""
  );
  const [editingSos, setEditingSos] = useState(false);
  const [sosInput, setSosInput] = useState(sosContact);

  const saveSosContact = () => {
    setSosContact(sosInput.trim());
    localStorage.setItem("sentinel_sos_contact", sosInput.trim());
    setEditingSos(false);
  };

  const handleAlertConfirmed = () => {
    if (activeAlert) {
      setManualSentAlerts((prev) => new Set([...prev, activeAlert]));
    }
    setTimeout(() => setActiveAlert(null), 300);
  };

  // Combine auto-dispatched + manually sent
  const allSentAlerts = new Set([...autoDispatchedServices, ...manualSentAlerts]);

  return (
    <>
      <div className="sentinel-card-highlight p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-red animate-blink-alert" />
            <h2 className="font-orbitron text-sm text-neon-red tracking-widest uppercase">
              Emergency Response
            </h2>
          </div>
          {autoDispatchedServices.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-neon-green/30 bg-neon-green/10">
              <Zap size={10} className="text-neon-green" />
              <span className="text-[9px] font-mono text-neon-green font-bold tracking-wider">AUTO-SENT</span>
            </div>
          )}
        </div>

        {disabled && autoDispatchedServices.length === 0 && (
          <div className="rounded-lg bg-surface-2 border border-surface-3 p-3 text-center">
            <p className="text-xs text-muted-foreground font-mono">
              Run a threat scan first to enable emergency alerts
            </p>
          </div>
        )}

        {/* Auto-dispatch summary */}
        {autoDispatchedServices.length > 0 && (
          <div className="rounded-lg border border-neon-green/30 bg-neon-green/10 p-3 space-y-1.5">
            <p className="text-[10px] font-mono text-neon-green font-semibold uppercase tracking-wider">
              ⚡ Auto-dispatched based on threat type
            </p>
            {autoDispatchedServices.map((s) => (
              <p key={s} className="text-xs font-mono text-foreground">
                ✓{" "}
                {s === "police" ? "🚓 Police alerted via SMS"
                  : s === "hospital" ? "🚑 Ambulance alerted via SMS"
                  : s === "fire" ? "🚒 Fire Dept alerted via SMS"
                  : "📞 SOS contact alerted via SMS"}
              </p>
            ))}
          </div>
        )}

        {/* SOS contact config */}
        <div className="rounded-lg bg-surface-2 border border-purple-400/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              📞 SOS Contact Number
            </p>
            {!editingSos && (
              <button
                onClick={() => { setEditingSos(true); setSosInput(sosContact); }}
                className="p-1 rounded text-muted-foreground hover:text-purple-400 transition-colors"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
          {editingSos ? (
            <div className="flex gap-2">
              <input
                type="tel"
                value={sosInput}
                onChange={(e) => setSosInput(e.target.value)}
                placeholder="e.g. +1 555 000 1234"
                className="flex-1 bg-surface-3 border border-purple-400/30 rounded-lg px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-purple-400/60 placeholder:text-muted-foreground/40"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveSosContact()}
              />
              <button
                onClick={saveSosContact}
                className="p-1.5 rounded-lg bg-purple-400/20 border border-purple-400/40 text-purple-400 hover:bg-purple-400 hover:text-background transition-all"
              >
                <Check size={13} />
              </button>
            </div>
          ) : (
            <p className={`font-mono text-sm ${sosContact ? "text-purple-300" : "text-muted-foreground/50"}`}>
              {sosContact || "Tap ✏ to set your emergency contact"}
            </p>
          )}
        </div>

        {/* Dispatch numbers reference */}
        <div className="rounded-lg bg-surface-2 border border-surface-3 p-3">
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">
            Dispatch Numbers
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { emoji: "🚓", label: "Police", num: "911" },
              { emoji: "🚑", label: "Ambulance", num: "911" },
              { emoji: "🚒", label: "Fire Dept", num: "911" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-surface-3 p-2 space-y-0.5">
                <p className="text-base">{s.emoji}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{s.label}</p>
                <p className="text-[10px] font-orbitron font-bold text-neon-cyan">{s.num}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Manual alert buttons */}
        <div>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">
            Manual Override
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ALERT_BUTTONS.map((btn) => {
              const wasSent = allSentAlerts.has(btn.type);
              const wasAuto = autoDispatchedServices.includes(btn.type);
              return (
                <button
                  key={btn.type}
                  onClick={() => !disabled && setActiveAlert(btn.type)}
                  disabled={disabled}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border font-mono text-xs font-semibold transition-all duration-200
                    ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                    ${wasSent
                      ? "border-neon-green/40 bg-neon-green/10 text-neon-green"
                      : `${btn.color} ${btn.border} ${btn.bg} ${!disabled ? btn.hoverBg : ""}`
                    }`}
                >
                  <span className="text-xl">{btn.emoji}</span>
                  <div className="flex items-center gap-1.5 text-center leading-tight">
                    {wasAuto ? <Zap size={11} /> : btn.icon}
                    <span>{wasSent ? (wasAuto ? "✓ Auto-Sent" : "✓ Sent") : btn.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {allSentAlerts.size > 0 && (
          <div className="rounded-lg bg-neon-green/10 border border-neon-green/30 p-3 animate-threat-appear">
            <p className="text-xs text-neon-green font-mono text-center">
              ✓ Emergency response notified · Stay calm, help is on the way
            </p>
          </div>
        )}
      </div>

      <AlertModal
        alertType={activeAlert}
        threat={threat}
        location={location}
        sosContact={sosContact}
        onClose={() => setActiveAlert(null)}
        onConfirm={handleAlertConfirmed}
      />
    </>
  );
};

export default EmergencyAlerts;
