/**
 * Duration Resolver (SPEC_ADDENDUM_C §C4)
 * Resolves video duration in seconds using:
 * 1. Bunny Stream API (if apiKey & libraryId configured and URL matches Bunny format)
 * 2. Parsing the HLS media playlist (#EXTINF sum)
 * 3. Client/browser fallback
 */

export interface DurationResult {
  durationSec: number | null;
  source: 'BUNNY_API' | 'HLS_PLAYLIST' | 'CLIENT_FALLBACK' | 'UNKNOWN';
  error?: string;
}

export function extractBunnyVideoGuid(url: string): string | null {
  if (!url) return null;
  // Patterns like https://vz-xxxx.b-cdn.net/<videoGuid>/playlist.m3u8
  // or https://<pullzone>.b-cdn.net/<videoGuid>/playlist.m3u8
  const match = url.match(/b-cdn\.net\/([a-zA-Z0-9-]+)\/(?:playlist\.m3u8|play)/i);
  if (match && match[1] && match[1].length > 10) {
    return match[1];
  }
  return null;
}

export async function fetchDurationFromBunnyApi(videoGuid: string): Promise<number | null> {
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  if (!apiKey || !libraryId) return null;

  try {
    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`, {
      headers: {
        AccessKey: apiKey,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      // Bunny video object field `length` represents duration in seconds
      if (typeof data.length === 'number' && data.length > 0) {
        return Math.round(data.length);
      }
    }
  } catch (err) {
    console.warn('Bunny API duration lookup failed:', err);
  }

  return null;
}

export async function fetchDurationFromHlsPlaylist(playlistUrl: string): Promise<number | null> {
  try {
    const res = await fetch(playlistUrl, {
      headers: { 'User-Agent': 'Rasigan-OTT/2.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;
    const body = await res.text();

    let targetMediaPlaylistUrl = playlistUrl;

    // Check if this is a master playlist
    if (body.includes('#EXT-X-STREAM-INF')) {
      const lines = body.split('\n');
      let mediaUri: string | null = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXT-X-STREAM-INF') && i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && !nextLine.startsWith('#')) {
            mediaUri = nextLine;
            break;
          }
        }
      }

      if (mediaUri) {
        if (mediaUri.startsWith('http://') || mediaUri.startsWith('https://')) {
          targetMediaPlaylistUrl = mediaUri;
        } else {
          // Resolve relative to playlistUrl
          const urlObj = new URL(playlistUrl);
          const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
          urlObj.pathname = basePath + mediaUri;
          targetMediaPlaylistUrl = urlObj.toString();
        }

        const mediaRes = await fetch(targetMediaPlaylistUrl, {
          headers: { 'User-Agent': 'Rasigan-OTT/2.0' },
          signal: AbortSignal.timeout(5000),
        });

        if (!mediaRes.ok) return null;
        const mediaBody = await mediaRes.text();
        return parseExtinfTotalDuration(mediaBody);
      }
    }

    return parseExtinfTotalDuration(body);
  } catch (err) {
    console.warn('HLS playlist duration parse failed:', err);
  }

  return null;
}

function parseExtinfTotalDuration(playlistContent: string): number | null {
  const extinfRegex = /#EXTINF:([0-9.]+)/g;
  let totalDuration = 0;
  let match;
  let matchCount = 0;

  while ((match = extinfRegex.exec(playlistContent)) !== null) {
    const sec = parseFloat(match[1]);
    if (!isNaN(sec) && sec > 0) {
      totalDuration += sec;
      matchCount++;
    }
  }

  if (matchCount > 0 && totalDuration > 0) {
    return Math.round(totalDuration);
  }

  return null;
}

export async function resolveVideoDuration(
  url: string,
  clientReportedDurationSec?: number | null
): Promise<DurationResult> {
  if (!url || typeof url !== 'string') {
    return { durationSec: null, source: 'UNKNOWN', error: 'Invalid URL' };
  }

  // 1. Bunny Stream API
  const bunnyGuid = extractBunnyVideoGuid(url);
  if (bunnyGuid) {
    const bunnySec = await fetchDurationFromBunnyApi(bunnyGuid);
    if (bunnySec && bunnySec > 0) {
      return { durationSec: bunnySec, source: 'BUNNY_API' };
    }
  }

  // 2. Parse HLS Playlist
  if (url.includes('.m3u8')) {
    const hlsSec = await fetchDurationFromHlsPlaylist(url);
    if (hlsSec && hlsSec > 0) {
      return { durationSec: hlsSec, source: 'HLS_PLAYLIST' };
    }
  }

  // 3. Client / Browser fallback
  if (typeof clientReportedDurationSec === 'number' && clientReportedDurationSec > 0) {
    return {
      durationSec: Math.round(clientReportedDurationSec),
      source: 'CLIENT_FALLBACK',
    };
  }

  return { durationSec: null, source: 'UNKNOWN' };
}
