import React from "react";
import { AlertTriangle, ShieldCheck, Flame, Zap, Volume2, Car, Wind } from "lucide-react";

export type ThreatType = "gunshot" | "scream" | "fire" | "collision" | "gas" | "explosion" | null;
export type SeverityLevel = "Low" | "Medium" | "High" | "Critical";

export interface ThreatResult {
  type: ThreatType;
  label: string;
  icon: React.ReactNode;
  confidence: number;
  severity: SeverityLevel;
  message: string;
  audioThreat?: string;
  visualThreat?: string;
}

interface ThreatAnalysisPanelProps {
  result: ThreatResult | null;
  isScanning: boolean;
}

const severityConfig: Record<SeverityLevel, { color: string; bg: string; glow: string }> = {
  Low: {
    color: "text-neon-green",
    bg: "bg-neon-green/10 border-neon-green/30",
    glow: "glow-green",
  },
  Medium: {
    color: "text-neon-amber",
    bg: "bg-neon-amber/10 border-neon-amber/30",
    glow: "glow-amber",
  },
  High: {
    color: "text-neon-red",
    bg: "bg-neon-red/10 border-neon-red/30",
    glow: "glow-red",
  },
  Critical: {
    color: "text-neon-red",
    bg: "bg-neon-red/20 border-neon-red",
    glow: "glow-red",
  },
};

const ThreatAnalysisPanel: React.FC<ThreatAnalysisPanelProps> = ({ result, isScanning }) => {
  if (isScanning) {
    return (
      <div className="sentinel-card-highlight p-6 flex flex-col items-center justify-center gap-4 min-h-[200px]">
        <div className="relative w-16 h-16">
          <div
            className="absolute inset-0 rounded-full border-2 border-neon-cyan/30 animate-rotate-ring"
            style={{ borderTopColor: "hsl(var(--neon-cyan))" }}
          />
          <div className="absolute inset-2 rounded-full border border-neon-cyan/20 animate-rotate-ring" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap size={20} className="text-neon-cyan animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="font-orbitron text-sm text-neon-cyan tracking-widest">ANALYZING</p>
          <p className="text-xs text-muted-foreground font-mono">Processing environmental data...</p>
        </div>
        <div className="w-full h-1 rounded-full bg-surface-3 overflow-hidden">
          <div
            className="h-full bg-neon-cyan rounded-full"
            style={{ width: "60%", animation: "scan-line 1.5s ease-in-out infinite alternate" }}
          />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="sentinel-card p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] border-dashed">
        <ShieldCheck size={32} className="text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground font-mono text-center">
          AI analysis results will appear here after scanning
        </p>
      </div>
    );
  }

  const config = severityConfig[result.severity];

  return (
    <div className={`sentinel-card-highlight p-5 space-y-4 animate-threat-appear border ${config.bg} ${config.glow}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${result.severity === "Low" ? "bg-neon-green" : result.severity === "Medium" ? "bg-neon-amber" : "bg-neon-red animate-blink-alert"}`} />
        <h2 className="font-orbitron text-sm tracking-widest uppercase text-foreground">
          Threat Analysis
        </h2>
      </div>

      {/* Threat type header */}
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl border ${config.bg}`}>
          <span className={config.color}>{result.icon}</span>
        </div>
        <div className="flex-1">
          <p className={`font-orbitron text-lg font-bold ${config.color} text-glow-${result.severity === "Low" ? "cyan" : "red"}`}>
            {result.label}
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{result.message}</p>
        </div>
      </div>

      {/* Confidence + Severity */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-2 p-3 space-y-1.5">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Confidence</p>
          <p className={`font-orbitron text-xl font-bold ${config.color}`}>
            {result.confidence}%
          </p>
          <div className="w-full h-1.5 rounded-full bg-surface-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${result.confidence}%`,
                background: result.severity === "Low"
                  ? "hsl(140 70% 45%)"
                  : result.severity === "Medium"
                  ? "hsl(38 100% 55%)"
                  : "hsl(0 88% 60%)",
              }}
            />
          </div>
        </div>
        <div className="rounded-lg bg-surface-2 p-3 space-y-1.5">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Severity</p>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-sm font-orbitron font-bold ${config.bg} ${config.color}`}>
            <AlertTriangle size={12} />
            {result.severity}
          </div>
        </div>
      </div>

      {/* Threat breakdown */}
      {(result.audioThreat || result.visualThreat) && (
        <div className="rounded-lg bg-surface-2 p-3 space-y-2">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Detection Breakdown</p>
          {result.audioThreat && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <Volume2 size={12} className="text-neon-cyan shrink-0" />
              <span className="text-muted-foreground">Audio:</span>
              <span className="text-foreground">{result.audioThreat}</span>
            </div>
          )}
          {result.visualThreat && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <Car size={12} className="text-neon-cyan shrink-0" />
              <span className="text-muted-foreground">Visual:</span>
              <span className="text-foreground">{result.visualThreat}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThreatAnalysisPanel;

export const MOCK_THREATS: ThreatResult[] = [
  {
    type: "collision",
    label: "Vehicular Collision",
    icon: <Car size={22} />,
    confidence: 87,
    severity: "High",
    message: "Possible vehicular collision detected nearby",
    audioThreat: "High-impact crash sound pattern",
    visualThreat: "Vehicle damage or obstruction visible",
  },
  {
    type: "fire",
    label: "Fire / Explosion",
    icon: <Flame size={22} />,
    confidence: 92,
    severity: "Critical",
    message: "Fire or explosion sound detected in vicinity",
    audioThreat: "Combustion and pressure wave signature",
    visualThreat: "Smoke or fire indicators in frame",
  },
  {
    type: "scream",
    label: "Distress Scream",
    icon: <Volume2 size={22} />,
    confidence: 78,
    severity: "High",
    message: "High intensity scream detected — possible distress",
    audioThreat: "Human scream frequency pattern",
  },
  {
    type: "gunshot",
    label: "Gunshot",
    icon: <Zap size={22} />,
    confidence: 94,
    severity: "Critical",
    message: "Ballistic sound signature detected",
    audioThreat: "Impulse sound matching gunshot profile",
  },
  {
    type: "gas",
    label: "Gas Leak",
    icon: <Wind size={22} />,
    confidence: 65,
    severity: "Medium",
    message: "Possible gas leak or chemical hazard",
    visualThreat: "Discoloration or haze in environment",
  },
];
