import React, { useState, useEffect } from "react";
import MediaCapture from "@/components/sentinel/MediaCapture";
import sentinelLogo from "@/assets/sentinel-logo.png";

const Index = () => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<{ status: string; model: string } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/status");
        if (response.ok) {
          const data = await response.json();
          setSystemStatus(data);
        }
      } catch (error) {
        console.error("Failed to fetch system status:", error);
        setSystemStatus({ status: "offline", model: "Connection Failed" });
      }
    };

    // Fetch immediately on mount
    fetchStatus();

    // Poll every 5 seconds
    const intervalId = setInterval(fetchStatus, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <MediaCapture onAnalyzeComplete={(data) => setAnalysisResult(data)} />

      {/* CCTV UI Overlay */}
      <div className="absolute top-6 left-6 z-40 pointer-events-none">
        <div className="flex items-center gap-4">
          <img
            src={sentinelLogo}
            alt="Sentinel-X"
            className="w-16 h-16 rounded-xl object-cover drop-shadow-lg"
          />
          <div>
            <h1 className="font-orbitron text-3xl font-bold text-white drop-shadow-md">
              SENTINEL<span className="text-red-500">-X</span>
            </h1>
            <p className="text-sm text-red-500 font-mono tracking-widest uppercase mb-1 drop-shadow-md">
              {systemStatus?.model || "CONNECTING..."}
            </p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${systemStatus?.status === 'online' ? 'bg-green-500' : 'bg-red-600'} animate-pulse`} />
              <span className={`text-xs ${systemStatus?.status === 'online' ? 'text-green-400' : 'text-red-500'} font-mono tracking-wider`}>
                {systemStatus?.status === 'online' ? 'SYSTEM ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Results Overlay */}
      {analysisResult && (
        <div className="absolute top-28 left-6 z-40 bg-black/80 border border-red-500/50 p-6 rounded-xl max-w-md backdrop-blur-md shadow-2xl">
          <div className="flex justify-between items-center mb-4 border-b border-red-500/30 pb-2">
            <h2 className="text-red-500 font-orbitron font-bold text-xl uppercase">
              Threat Matrix
            </h2>
            <span className="text-xs text-white/50 font-mono">
              CONFIDENCE V:{(analysisResult.confidence_scores.visual * 100).toFixed(0)}% A:{(analysisResult.confidence_scores.audio * 100).toFixed(0)}%
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-white/60 font-mono text-xs mb-1 uppercase tracking-wider">Visual Detections</p>
              <div className="flex flex-wrap gap-2">
                {analysisResult.visual_detections && analysisResult.visual_detections.length > 0 ? (
                  analysisResult.visual_detections.map((det: string, i: number) => (
                    <span key={i} className="bg-red-500/20 text-red-400 px-2 py-1 rounded font-mono text-sm border border-red-500/40 uppercase">
                      {det}
                    </span>
                  ))
                ) : (
                  <span className="text-white/40 font-mono text-sm">NONE</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-white/60 font-mono text-xs mb-1 uppercase tracking-wider">Audio Detections</p>
              <div className="flex flex-wrap gap-2">
                {analysisResult.audio_detections && analysisResult.audio_detections.length > 0 ? (
                  analysisResult.audio_detections.map((det: string, i: number) => (
                    <span key={i} className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded font-mono text-sm border border-yellow-500/40 uppercase">
                      {det}
                    </span>
                  ))
                ) : (
                  <span className="text-white/40 font-mono text-sm">NONE</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-white/60 font-mono text-xs mb-1 uppercase tracking-wider">Required Dispatch</p>
              <div className="flex flex-wrap gap-2">
                {analysisResult.dispatched_agencies && analysisResult.dispatched_agencies.length > 0 ? (
                  analysisResult.dispatched_agencies.map((agency: string, i: number) => (
                    <span key={i} className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold tracking-wider text-sm border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      {agency}
                    </span>
                  ))
                ) : (
                  <span className="text-green-500 font-mono text-sm uppercase">No Action Required</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;