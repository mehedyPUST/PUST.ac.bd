'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2 } from 'lucide-react';

interface ResilientImageProps {
  src?: string;
  alt: string;
  caption?: string;
  className?: string;
  containerClassName?: string;
  frameClassName?: string;
  fallbackMinHeightClassName?: string;
  priority?: boolean;
  /** Kept for API compatibility; native img does not use sizes. */
  sizes?: string;
}

export function ResilientImage({
  src,
  alt,
  caption,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  frameClassName = 'rounded-xl bg-[#F5F2EB] border border-slate-200',
  fallbackMinHeightClassName = 'min-h-[240px]',
  priority = false,
}: ResilientImageProps) {
  const trimmedSrc = src?.trim() || '';
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const failed = Boolean(trimmedSrc) && failedSrc === trimmedSrc;

  useEffect(() => {
    const img = imgRef.current;
    if (trimmedSrc && img && img.complete && img.naturalWidth === 0) {
      setFailedSrc(trimmedSrc);
    }
  }, [trimmedSrc]);

  const showImage = Boolean(trimmedSrc) && !failed;

  return (
    <figure className={containerClassName}>
      <div className={`relative w-full h-full overflow-hidden ${frameClassName}`}>
        {showImage ? (
          <img
            ref={imgRef}
            src={trimmedSrc}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            referrerPolicy="no-referrer"
            onError={() => setFailedSrc(trimmedSrc)}
            className={className}
          />
        ) : (
          <div
            className={`w-full h-full ${fallbackMinHeightClassName} flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-pust-50 to-slate-100 text-pust-800`}
          >
            <Building2 className="w-8 h-8 mb-2.5 opacity-75" strokeWidth={1.5} />
            <p className="font-serif text-sm sm:text-base font-medium text-slate-900 max-w-xs">{alt}</p>
            <p className="text-xs text-slate-600 mt-1">Pabna University of Science and Technology</p>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="text-xs font-serif italic text-slate-600 mt-2.5 leading-relaxed">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
