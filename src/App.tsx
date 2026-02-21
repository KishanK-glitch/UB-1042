import React, { useState, useEffect, useRef } from 'react';

const SpyDashboard = () => {
  const [spyData, setSpyData] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Start camera feed instantly and attach it to the video tag
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("Camera access denied:", err));

    const fetchThreatStatus = async () => {
      try {
        // POINTING TO LOCAL BACKEND FOR DEV
        const response = await fetch('http://localhost:8000/api/v1/status');
        const data = await response.json();
        setSpyData((prev: any) => ({ ...prev, ...data }));
      } catch (error) {
        console.error("🚨 SPY API Connection Error:", error);
      }
    };

    // Fetch instantly on load, then poll every 5 seconds
    fetchThreatStatus();
    const intervalId = setInterval(fetchThreatStatus, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleUpload = async (file: Blob | File, filename: string) => {
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("file", file, filename);

      try {
        // POINTING TO LOCAL BACKEND FOR DEV
        const response = await fetch('http://localhost:8000/api/v1/analyze-video', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      setSpyData((prev: any) => ({
        ...prev,
        ...data,
        visual_confidence: data.confidence_scores?.visual || 0,
        audio_anomaly: data.audio_detections?.length > 0 ? data.audio_detections.join(', ') : null,
        audio_confidence: data.confidence_scores?.audio || 0,
        status: data.dispatched_agencies?.length > 0 ? "CRITICAL_ALERT" : "ONLINE",
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm";

        const recorder = new MediaRecorder(stream, { mimeType });
        chunksRef.current = [];

        recorder.ondataavailable = e => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const file = new File([blob], `capture-${Date.now()}.webm`, { type: 'video/webm' });
          handleUpload(file, file.name);
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
      }
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleUpload(file, file.name);
    }
    if (e.target) e.target.value = '';
  };

  // Defensively parse the API payload
  const isCritical = spyData?.status === "CRITICAL_ALERT";
  const visualDetections = spyData?.visual_detections || [];
  const visualConfidence = spyData?.visual_confidence || 0;
  const audioAnomaly = spyData?.audio_anomaly || null;
  const audioConfidence = spyData?.audio_confidence || 0;
  const timestamp = spyData?.timestamp ? new Date(spyData.timestamp).toLocaleTimeString() : 'N/A';

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: -1
        }}
      />

      {/* If API is not connected yet, show a clean overlay instead of blocking the video mount */}
      {!spyData && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem'
        }}>
          Connecting to SPY Network...
        </div>
      )}

      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
        pointerEvents: 'none', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '40px', color: 'white',
        fontFamily: 'monospace', boxSizing: 'border-box'
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            👁️ SPY TACTICAL DASHBOARD
          </h1>

          <div style={{
            border: `2px solid ${isCritical ? '#ef4444' : '#555'}`, padding: '20px',
            borderRadius: '8px', backgroundColor: 'rgba(17, 17, 17, 0.8)',
            maxWidth: '500px', backdropFilter: 'blur(4px)'
          }}>
            <h2>📍 FEED: {spyData?.camera_id || 'LOCAL_CAM_01'}</h2>
            <h3 style={{ color: isCritical ? '#ef4444' : '#22c55e', fontSize: '1.5rem' }}>
              STATUS: {spyData?.status || 'CONNECTING...'}
            </h3>

            {isAnalyzing && (
              <div style={{ marginTop: '10px', color: '#fbbf24', fontWeight: 'bold' }}>
                ⏳ Processing Video...
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <p><strong>🎥 VISUAL THREATS:</strong> {visualDetections.length > 0 ? visualDetections.join(', ').toUpperCase() : 'NONE'}</p>
              <p><strong>🎯 VISUAL CONFIDENCE:</strong> {visualConfidence > 0 ? (visualConfidence * 100).toFixed(0) + '%' : 'N/A'}</p>
            </div>

            <div style={{ marginTop: '20px' }}>
              <p><strong>🎧 AUDIO ANOMALY:</strong> {audioAnomaly ? audioAnomaly : 'NORMAL BACKGROUND'}</p>
              <p><strong>🔊 AUDIO CONFIDENCE:</strong> {audioConfidence > 0 ? (audioConfidence * 100).toFixed(0) + '%' : 'N/A'}</p>
            </div>

            <p style={{ marginTop: '30px', color: '#888' }}>LAST SYNC: {timestamp}</p>
          </div>
        </div>

        <div style={{ pointerEvents: 'auto', display: 'flex', gap: '20px' }}>
          <button
            onClick={toggleRecording}
            style={{
              padding: '15px 30px', fontSize: '1.2rem', fontWeight: 'bold',
              borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: isRecording ? '#dc2626' : '#2563eb',
              color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              transition: 'background-color 0.2s'
            }}
          >
            {isRecording ? '⏹ STOP' : '🔴 RECORD'}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '15px 30px', fontSize: '1.2rem', fontWeight: 'bold',
              borderRadius: '8px', border: '1px solid #555', cursor: 'pointer',
              backgroundColor: '#374151', color: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)', transition: 'background-color 0.2s'
            }}
          >
            📁 UPLOAD CLIP
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
        </div>
      </div>
    </>
  );
};

export default SpyDashboard;