"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  onError?: () => void;
}

export default function SafeImage({ src, alt, className, fill, width, height, onError }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Check if the image is a base64 data URL
  const isBase64 = src.startsWith('data:image');
  
  // Use proxy for external URLs to avoid CORS issues
  const getProxiedUrl = (url: string) => {
    if (isBase64) return url;
    
    try {
      new URL(url); // Validate URL
      // Using a reliable CORS proxy service
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=800&h=600&fit=cover&a=attention`;
    } catch {
      return url; // Fallback to original URL
    }
  };

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      onError?.();
      
      // Try different fallback strategies
      if (!isBase64 && !imgSrc.includes('placeholder')) {
        // First fallback: try direct URL
        setImgSrc(src);
      }
    }
  };

  const handleLoad = () => {
    setHasError(false);
  };

  if (hasError) {
    // Fallback UI when image fails to load
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center text-gray-400">
          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Image unavailable</p>
        </div>
      </div>
    );
  }

  const imageProps = {
    src: getProxiedUrl(imgSrc),
    alt,
    className,
    onError: handleError,
    onLoad: handleLoad,
    ...(fill ? { fill: true } : { width: width || 400, height: height || 300 }),
  };

  return <Image {...imageProps} />;
}