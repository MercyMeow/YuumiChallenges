"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { championImages, FALLBACK_IMAGE } from "@/lib/apis/datadragon";

interface DataDragonImageProps {
  championId: string;
  type: "icon" | "splash" | "loading" | "square";
  skinNum?: number;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onError?: () => void;
}

export function DataDragonImage({
  championId,
  type,
  skinNum = 0,
  alt,
  className,
  width = 64,
  height = 64,
  priority = false,
  onError,
}: DataDragonImageProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        let url: string;
        
        switch (type) {
          case "icon":
          case "square":
            url = await championImages.icon(championId);
            break;
          case "splash":
            url = championImages.splash(championId, skinNum);
            break;
          case "loading":
            url = championImages.loading(championId, skinNum);
            break;
          default:
            url = await championImages.icon(championId);
        }
        
        setImageUrl(url);
      } catch (error) {
        console.error("Error loading DataDragon image:", error);
        setHasError(true);
        onError?.();
      } finally {
        setIsLoading(false);
      }
    };

    if (championId) {
      loadImage();
    }
  }, [championId, type, skinNum, onError]);

  const handleImageError = () => {
    setHasError(true);
    onError?.();
  };

  if (isLoading) {
    return (
      <div 
        className={`bg-muted animate-pulse rounded flex-shrink-0 ${className || ''}`}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          minWidth: `${width}px`,
          minHeight: `${height}px`,
          maxWidth: `${width}px`,
          maxHeight: `${height}px`
        }}
      />
    );
  }

  return (
    <div 
      className={`relative flex-shrink-0 overflow-hidden rounded ${className || ''}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`,
        maxWidth: `${width}px`,
        maxHeight: `${height}px`
      }}
    >
      <Image
        src={hasError || !imageUrl ? FALLBACK_IMAGE : imageUrl}
        alt={alt || `${championId} ${type} image`}
        width={width}
        height={height}
        priority={priority}
        className="object-cover w-full h-full"
        onError={handleImageError}
        sizes={`${width}px`}
      />
    </div>
  );
}

interface ChampionIconProps {
  championId: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  className?: string;
  alt?: string;
}

export function ChampionIcon({ 
  championId, 
  size = "md", 
  className, 
  alt 
}: ChampionIconProps) {
  const sizes = {
    xs: { width: 24, height: 24 },
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
    xxl: { width: 128, height: 128 },
  };

  const { width, height } = sizes[size];

  return (
    <div 
      className={`relative inline-block flex-shrink-0 ${className || ''}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`,
        maxWidth: `${width}px`,
        maxHeight: `${height}px`
      }}
    >
      <DataDragonImage
        championId={championId}
        type="icon"
        width={width}
        height={height}
        alt={alt || `Champion ${championId}`}
      />
    </div>
  );
}

interface ChampionSplashProps {
  championId: string;
  skinNum?: number;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export function ChampionSplash({ 
  championId, 
  skinNum = 0, 
  className, 
  alt,
  width = 1215,
  height = 717
}: ChampionSplashProps) {
  return (
    <DataDragonImage
      championId={championId}
      type="splash"
      skinNum={skinNum}
      width={width}
      height={height}
      {...(className ? { className } : {})}
      alt={alt || `Champion ${championId} splash art`}
    />
  );
}

interface YuumiImageProps {
  skinNum?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  className?: string;
  alt?: string;
}

export function YuumiIcon({ 
  size = "md", 
  className, 
  alt = "Yuumi" 
}: Omit<YuumiImageProps, 'skinNum'>) {
  return (
    <ChampionIcon
      championId="Yuumi"
      size={size}
      {...(className ? { className } : {})}
      alt={alt}
    />
  );
}

export function YuumiSplash({ 
  skinNum = 0, 
  className, 
  alt = "Yuumi splash art",
  width = 1215,
  height = 717
}: Omit<YuumiImageProps, 'size'> & { width?: number; height?: number }) {
  return (
    <ChampionSplash
      championId="Yuumi"
      skinNum={skinNum}
      {...(className ? { className } : {})}
      alt={alt}
      width={width}
      height={height}
    />
  );
}