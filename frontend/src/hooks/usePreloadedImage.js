// src/hooks/usePreloadedImage.js
import { useEffect, useState } from "react";

export default function usePreloadedImage(src) {
  const [displaySrc, setDisplaySrc] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(src));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setDisplaySrc("");
      setIsLoading(false);
      setHasError(true);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    img.decoding = "async";
    img.src = src;

    img.onload = () => {
      if (cancelled) return;
      setDisplaySrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      if (cancelled) return;
      setIsLoading(false);
      setHasError(true);
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

  return { displaySrc, isLoading, hasError };
}
