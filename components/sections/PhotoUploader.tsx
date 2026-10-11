// components/sections/PhotoUploader.tsx
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Upload, RefreshCw, AlertCircle } from 'lucide-react';

interface PhotoUploaderProps {
  onImageUploaded: (imageUrl: string, file: File) => void;
  uploadedImage: string | null;
  isProcessing: boolean;
  onRetake: () => void;
  processingStage?: 'initial' | 'uploading' | 'identifying' | 'extracting' | 'complete';
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onImageUploaded,
  uploadedImage,
  isProcessing,
  onRetake,
  processingStage = 'initial'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      onImageUploaded(imageUrl, file);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraClick = async () => {
    try {
      setIsCameraActive(true);
      
      if (videoRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setIsCameraActive(false);
      alert('Could not access your camera. Please check permissions or use the file upload option.');
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current && streamRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get the image data as base64 string
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        
        // Convert base64 to Blob/File
        fetch(imageDataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "camera-capture.jpg", { type: 'image/jpeg' });
            
            // Stop all video tracks
            streamRef.current?.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            
            // Reset camera UI
            setIsCameraActive(false);
            
            // Process the image
            onImageUploaded(imageDataUrl, file);
          });
      }
    }
  };

  const cancelCamera = () => {
    // Stop all video tracks
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    
    // Reset camera UI
    setIsCameraActive(false);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Camera view
  if (isCameraActive) {
    return (
      <div className="relative w-full h-80 bg-black rounded-xl overflow-hidden">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover"
          autoPlay 
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute bottom-4 inset-x-0 flex justify-center space-x-4">
          <button
            onClick={cancelCamera}
            className="p-3 bg-gray-800 text-white rounded-full hover:bg-gray-700"
          >
            <AlertCircle className="h-6 w-6" />
          </button>
          <button
            onClick={handleCapturePhoto}
            className="p-4 bg-white rounded-full hover:bg-gray-100"
          >
            <div className="h-12 w-12 rounded-full border-4 border-blue-600" />
          </button>
        </div>
      </div>
    );
  }

  // Uploaded image view
  if (uploadedImage) {
    return (
      <div className="relative w-full h-80 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
        <Image 
          src={uploadedImage}
          alt="Uploaded item"
          fill
          className="object-contain"
        />
        
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center">
            <div className="h-12 w-12 relative mb-4">
              {processingStage === 'uploading' && (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              )}
              {processingStage === 'identifying' && (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}
              {processingStage === 'extracting' && (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="text-white font-medium">
              {processingStage === 'uploading' && 'Uploading image...'}
              {processingStage === 'identifying' && 'Identifying item...'}
              {processingStage === 'extracting' && 'Extracting item details...'}
            </div>
          </div>
        )}
        
        {!isProcessing && (
          <button 
            onClick={onRetake}
            className="absolute bottom-4 right-4 bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 transition-colors flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retake Photo
          </button>
        )}
      </div>
    );
  }

  // Upload area view
  return (
    <div 
      className={`w-full h-80 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-colors ${
        isDragging 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
        <Camera className="h-8 w-8 text-gray-500" />
      </div>
      
      <p className="text-lg font-medium text-gray-700 mb-2">
        Drag and drop your image here
      </p>
      <p className="text-gray-500 text-sm mb-6">
        Supported formats: JPG, PNG, HEIC
      </p>
      
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={handleCameraClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Camera className="h-5 w-5 mr-2" />
          Take Photo
        </button>
        
        <button
          type="button"
          onClick={handleUploadClick}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload
        </button>
      </div>
    </div>
  );
};