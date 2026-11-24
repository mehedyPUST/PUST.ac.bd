export function isSafeMediaUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) {
    return !trimmed.startsWith('//');
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

export function parseYouTubeVideoId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  let candidate: string | null = null;
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    candidate = parsed.pathname.split('/').filter(Boolean)[0] || null;
  } else {
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments[0] === 'watch' || parsed.searchParams.has('v')) {
      candidate = parsed.searchParams.get('v');
    } else if (
      segments.length >= 2 &&
      (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'live')
    ) {
      candidate = segments[1];
    }
  }

  if (!candidate || !/^[A-Za-z0-9_-]{11}$/.test(candidate)) {
    return null;
  }
  return candidate;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function detectAttachmentType(
  urlOrName: string,
  explicitType?: 'image' | 'pdf' | 'other'
): 'image' | 'pdf' | 'other' {
  if (explicitType) return explicitType;
  const clean = urlOrName.split('?')[0].split('#')[0].trim().toLowerCase();
  if (clean.endsWith('.pdf')) return 'pdf';
  if (
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.avif')
  ) {
    return 'image';
  }
  return 'other';
}
