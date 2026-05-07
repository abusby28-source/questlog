import React, { useEffect, memo } from 'react';

// Module-level image URL cache: proxy URL → resolved CDN URL.
// Populated after an image loads so subsequent renders (tab switches) use the
// direct CDN URL and the browser serves it from memory cache instantly.
export const resolvedImgCache = new Map<string, string>();

// Resolves proxy URL to direct CDN URL after first load so tab revisits are flash-free
export const CachedImg = memo(function CachedImg({ proxyUrl, className, alt, onError }: { proxyUrl: string; className?: string; alt?: string; onError?: React.ReactEventHandler<HTMLImageElement> }) {
  const [src, setSrc] = React.useState(() => resolvedImgCache.get(proxyUrl) || proxyUrl);
  // Sync src when proxyUrl changes (e.g. artwork refresh)
  useEffect(() => {
    setSrc(resolvedImgCache.get(proxyUrl) || proxyUrl);
  }, [proxyUrl]);
  const handleLoad = () => {
    if (!resolvedImgCache.has(proxyUrl)) {
      fetch(proxyUrl + '?json=1').then(r => r.json()).then(d => {
        if (d.url) { resolvedImgCache.set(proxyUrl, d.url); setSrc(d.url); }
      }).catch(() => {});
    }
  };
  return <img src={src} alt={alt} className={className} referrerPolicy="no-referrer" onLoad={handleLoad} onError={onError} />;
});

export default CachedImg;
