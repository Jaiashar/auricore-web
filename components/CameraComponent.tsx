'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

interface CameraComponentProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

// Simple mobile detection
const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/.test(navigator.userAgent);

const CameraComponent: React.FC<CameraComponentProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle native camera via file input on mobile
  useEffect(() => {
    if (isMobile) {
      fileInputRef.current?.click();
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  };

  // Initialize camera when component mounts (desktop)
  useEffect(() => {
    if (isMobile) return;
    let mounted = true;

    async function setupCamera() {
      try {
        setIsLoading(true);
        streamRef.current?.getTracks().forEach(t => t.stop());

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (!mounted) return;
        streamRef.current = stream;
        const videoEl = videoRef.current;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.muted = true;
          videoEl.setAttribute('playsinline', '');
          setIsLoading(false);
          setTimeout(() => mounted && setIsReady(true), 500);
        }
      } catch (err: any) {
        console.error('Camera setup error:', err);
        if (mounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    setupCamera();
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Play and error events (desktop)
  useEffect(() => {
    if (isMobile) return;
    const videoEl = videoRef.current;
    if (!videoEl || !videoEl.srcObject) return;

    const onCanPlay = () => { setIsReady(true); setIsLoading(false); };
    const onError = () => { setError('Video error: ' + (videoEl.error?.message || 'unknown')); setIsLoading(false); };

    videoEl.addEventListener('canplay', onCanPlay);
    videoEl.addEventListener('error', onError);
    videoEl.play().catch(() => setIsLoading(false));

    const timer = setTimeout(() => {
      setIsReady(true);
      setIsLoading(false);
    }, 1000);

    return () => {
      videoEl.removeEventListener('canplay', onCanPlay);
      videoEl.removeEventListener('error', onError);
      clearTimeout(timer);
    };
  }, []);

  // Capture a photo (desktop)
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      onCapture(file);
      streamRef.current?.getTracks().forEach(t => t.stop());
    }, 'image/jpeg', 0.95);
  };

  // Render
  if (isMobile) {
    return (
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white">Initializing camera…</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-70">
          <div className="text-white p-4 text-center">
            <div className="font-bold mb-2">Camera Error</div>
            <div>{error}</div>
            <button onClick={onCancel} className="mt-4 px-4 py-2 bg-white text-red-900 rounded">
              Cancel
            </button>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
        <button
          onClick={takePhoto}
          disabled={!isReady}
          className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Camera size={24} />
        </button>
        <button
          onClick={onCancel}
          className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};

export default CameraComponent;