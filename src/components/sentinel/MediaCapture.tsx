import React, { useRef, useState, useEffect } from "react";
import { Video, VideoOff, UploadCloud, Loader2 } from "lucide-react";

interface MediaCaptureProps {
  onAnalyzeComplete: (data: any) => void;
}

const MediaCapture: React.FC<MediaCaptureProps> = ({ onAnalyzeComplete }) => {
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: true,
        });
        streamRef.current = stream;
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };
    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const sendFileToBackend = async (file: File | Blob, filename: string) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file, filename);

      const response = await fetch("http://localhost:8000/api/v1/analyze-video", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      onAnalyzeComplete(data);
    } catch (error) {
      console.error("Error analyzing video:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      if (!streamRef.current) return;
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        sendFileToBackend(blob, `capture-${Date.now()}.webm`);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sendFileToBackend(file, file.name);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <>
      <video
        ref={liveVideoRef}
        autoPlay
        muted
        playsInline
        className="fixed top-0 left-0 w-screen h-screen object-cover -z-10 bg-black"
        style={{ filter: "brightness(0.8) contrast(1.1)" }}
      />

      {/* Visual CCTV Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />

      {/* Bottom Interface */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6 z-50">
        <button
          onClick={handleToggleRecord}
          className={`px-8 py-4 rounded-full flex items-center justify-center gap-3 font-orbitron font-bold text-lg text-white shadow-2xl transition-all min-w-[200px] border border-white/20 ${isRecording
              ? "bg-red-600/90 hover:bg-red-700 animate-pulse drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]"
              : "bg-red-500/80 hover:bg-red-500 backdrop-blur-md"
            }`}
          disabled={isProcessing}
        >
          {isRecording ? <VideoOff size={28} /> : <Video size={28} />}
          {isRecording ? "STOP RECORDING" : "START SCAN"}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-8 py-4 rounded-full flex items-center justify-center gap-3 font-orbitron font-bold text-lg text-white bg-blue-600/80 hover:bg-blue-600 backdrop-blur-md shadow-2xl transition-all border border-white/20 min-w-[200px]"
          disabled={isProcessing || isRecording}
        >
          {isProcessing ? <Loader2 size={28} className="animate-spin" /> : <UploadCloud size={28} />}
          {isProcessing ? "ANALYZING AI..." : "UPLOAD FILE"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {isRecording && (
        <div className="absolute top-10 right-10 flex items-center gap-3 z-50 bg-red-600/20 px-4 py-2 rounded-full border border-red-500/50 backdrop-blur-md">
          <span className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" />
          <span className="text-red-500 font-mono font-bold text-xl tracking-widest drop-shadow-md">LIVE REC</span>
        </div>
      )}
    </>
  );
};

export default MediaCapture;
