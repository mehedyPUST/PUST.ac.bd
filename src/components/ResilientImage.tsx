import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  containerClassName?: string;
}

export function ResilientImage({
  src,
  alt,
  caption,
  className = 'w-full h-full object-cover',
  containerClassName = '',
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className={containerClassName}>
      <div className="relative w-full h-full overflow-hidden bg-slate-100 border border-slate-200">
        {!failed ? (
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className={className}
          />
        ) : (
          <div className="w-full h-full min-h-[240px] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-emerald-50 to-slate-100 text-emerald-800">
            <Building2 className="w-8 h-8 mb-3 opacity-75" strokeWidth={1.5} />
            <p className="font-serif text-base font-medium text-slate-900 max-w-xs">{alt}</p>
            <p className="text-xs text-slate-600 mt-1">Pabna University of Science and Technology</p>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="text-xs font-serif italic text-slate-500 mt-2.5 leading-relaxed">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
