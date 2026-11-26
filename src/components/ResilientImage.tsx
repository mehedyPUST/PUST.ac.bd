'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  /** Optional sizes hint for responsive next/image optimization */
  sizes?: string;
}

/** Hosts allowed by next.config.mjs remotePatterns (keep in sync). */
const OPTIMIZABLE_REMOTE_HOSTS = new Set([
  'i.ibb.co',
  'i.ibb.co.com',
  'ibb.co',
  'ik.imagekit.io',
  'imagekit.io',
  'pust.ac.bd',
  'www.pust.ac.bd',
]);

function canUseNextImageOptimizer(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  // Local public paths (e.g. /assets/pust-logo.png) — Next can optimize.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    return OPTIMIZABLE_REMOTE_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Detect object-cover / fixed-box layouts that need `fill` so the image
 * stretches inside a sized parent rather than defining intrinsic height.
 */
function needsFillLayout(className: string): boolean {
  return (
    className.includes('object-cover') ||
    className.includes('object-contain') ||
    className.includes('h-full') ||
    className.includes('absolute')
  );
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
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px',
}: ResilientImageProps) {
  const trimmedSrc = src?.trim() || '';
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const failed = Boolean(trimmedSrc) && failedSrc === trimmedSrc;

  const useOptimizer = useMemo(
    () => Boolean(trimmedSrc) && canUseNextImageOptimizer(trimmedSrc),
    [trimmedSrc]
  );
  const useFill = useOptimizer && needsFillLayout(className);

  useEffect(() => {
    if (useOptimizer) return;
    const img = imgRef.current;
    if (trimmedSrc && img && img.complete && img.naturalWidth === 0) {
      setFailedSrc(trimmedSrc);
    }
  }, [trimmedSrc, useOptimizer]);

  const showImage = Boolean(trimmedSrc) && !failed;

  return (
    <figure className={containerClassName}>
      <div
        className={
          useFill
            ? `relative w-full h-full overflow-hidden ${fallbackMinHeightClassName} ${frameClassName}`
            : `relative w-full h-full overflow-hidden ${frameClassName}`
        }
      >
        {showImage ? (
          useOptimizer ? (
            useFill ? (
              <Image
                src={trimmedSrc}
                alt={alt}
                fill
                sizes={sizes}
                priority={priority}
                referrerPolicy="no-referrer"
                onError={() => setFailedSrc(trimmedSrc)}
                className={className}
              />
            ) : (
              <Image
                src={trimmedSrc}
                alt={alt}
                width={1600}
                height={1200}
                sizes={sizes}
                priority={priority}
                referrerPolicy="no-referrer"
                onError={() => setFailedSrc(trimmedSrc)}
                className={className}
                style={{ width: '100%', height: 'auto' }}
              />
            )
          ) : (
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
          )
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
