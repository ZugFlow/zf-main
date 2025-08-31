"use client"

import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "./avatar"

interface StableAvatarProps {
  src?: string | null | undefined
  alt?: string
  fallback: React.ReactNode
  className?: string
  fallbackClassName?: string
}

export const StableAvatar = React.memo(({ src, alt, fallback, className, fallbackClassName }: StableAvatarProps) => {
  // Memoize the src to prevent unnecessary re-renders
  const stableSrc = React.useMemo(() => {
    return src || undefined;
  }, [src]);

  // Prevent re-renders when src changes rapidly
  const [imgSrc, setImgSrc] = React.useState(stableSrc);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (stableSrc !== imgSrc && !hasError) {
      setImgSrc(stableSrc);
      setHasError(false);
    }
  }, [stableSrc, imgSrc, hasError]);

  const handleError = React.useCallback(() => {
    setHasError(true);
    setImgSrc(undefined);
  }, []);

  const handleLoad = React.useCallback(() => {
    setHasError(false);
  }, []);

  return (
    <Avatar className={className}>
      {imgSrc && !hasError && (
        <AvatarImage 
          src={imgSrc} 
          alt={alt}
          onError={handleError}
          onLoad={handleLoad}
        />
      )}
      <AvatarFallback className={fallbackClassName}>
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
});

StableAvatar.displayName = 'StableAvatar';
