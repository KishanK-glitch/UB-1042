import React from "react";
import { Lock } from "lucide-react";

const PrivacyNotice: React.FC = () => (
  <div className="rounded-xl border border-surface-3 bg-surface-2 p-4 flex items-start gap-3">
    <Lock size={14} className="text-neon-cyan shrink-0 mt-0.5" />
    <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
      <span className="text-neon-cyan font-semibold">Privacy Protected —</span>{" "}
      Sentinel-X does not store raw audio or images. Only threat metadata (type, severity, timestamp, location)
      is shared with emergency responders. All analysis occurs on-device.
    </p>
  </div>
);

export default PrivacyNotice;
