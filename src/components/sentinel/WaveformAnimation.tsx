import React from "react";

interface WaveformAnimationProps {
  isRecording: boolean;
  bars?: number;
}

const WaveformAnimation: React.FC<WaveformAnimationProps> = ({ isRecording, bars = 32 }) => {
  return (
    <div className="flex items-center justify-center gap-[3px] h-16 w-full">
      {Array.from({ length: bars }).map((_, i) => {
        const delays = [0, 0.1, 0.2, 0.15, 0.3, 0.05, 0.25, 0.4, 0.1, 0.35];
        const delay = delays[i % delays.length];
        const heights = [40, 70, 55, 90, 45, 80, 60, 95, 50, 75, 65, 85, 40, 70, 55, 90];
        const maxH = heights[i % heights.length];

        return (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: "3px",
              height: isRecording ? `${maxH}%` : "15%",
              background: isRecording
                ? `hsl(${185 + (i % 3) * 10} 100% ${45 + (i % 5) * 4}%)`
                : "hsl(220 15% 25%)",
              animation: isRecording
                ? `waveBar ${0.6 + (i % 4) * 0.1}s ease-in-out ${delay}s infinite`
                : "none",
              boxShadow: isRecording
                ? `0 0 6px hsl(185 100% 48% / 0.6)`
                : "none",
              transformOrigin: "bottom",
            }}
          />
        );
      })}
    </div>
  );
};

export default WaveformAnimation;
