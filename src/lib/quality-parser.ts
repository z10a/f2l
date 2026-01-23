interface QualityLevel {
  value: string;
  badge: string | null;
  color: string;
}

// Quality patterns from M3U playlists
const HD_720P = /https?:\/\/.*\/(\d{3,4}720)\.?\.m3u8\.(?:com\/videos\/)/i;
const HD_1080P = /https?:\/\/.*\/(\d{3,4}1080)\.?\.m3u8\.(?:com\/videos\/)/i;
const FHD_1440P = /https?:\/\/.*\/(\d{3,4}1440)\.?\.m3u8\.(?:com\/videos\/)/i;
const FHD_2160P = /https?:\/\/.*\/(\d{3,4}2160)\.?\.m3u8\.(?:com\/videos\/)/i;
const SD_480P = /https?:\/\/.*\/(\d{3,4}480)\.?\.m3u8\.(?:com\/videos\/)/i;
const HD_720P_ALT = /https?:\/\/.*\/720p(?:\/|\?720\?)/i;

// Quality levels
const QUALITY_LEVELS: Record<string, QualityLevel> = {
  unknown: { value: 'unknown', badge: null, color: 'text-slate-400' },
  sd: { value: 'sd', badge: 'bg-slate-100 text-slate-700', color: 'text-slate-600' },
  hd_720: { value: 'hd_720', badge: 'bg-green-100 text-green-700', color: 'text-green-600' },
  hd_1080: { value: 'hd_1080', badge: 'bg-blue-100 text-blue-700', color: 'text-blue-600' },
  fhd_1440: { value: 'fhd_1440', badge: 'bg-purple-100 text-purple-700', color: 'text-purple-600' },
  fhd_2160: { value: 'fhd_2160', badge: 'bg-pink-100 text-pink-700', color: 'text-pink-600' },
};

/**
 * Detect quality level from a stream URL
 * @param url - The stream URL to check
 * @returns Quality level object
 */
export function getStreamQuality(url: string | null): QualityLevel {
  if (!url) {
    return QUALITY_LEVELS.unknown;
  }

  // Check for different resolution patterns
  if (HD_720P_ALT.test(url) || HD_720P.test(url)) {
    return QUALITY_LEVELS.hd_720;
  }
  if (FHD_1440P.test(url)) {
    return QUALITY_LEVELS.fhd_1440;
  }
  if (HD_1080P.test(url)) {
    return QUALITY_LEVELS.hd_1080;
  }
  if (FHD_2160P.test(url)) {
    return QUALITY_LEVELS.fhd_2160;
  }
  if (SD_480P.test(url)) {
    return QUALITY_LEVELS.sd;
  }

  return QUALITY_LEVELS.unknown;
}

/**
 * Parse quality from stream URL or fallback to checking status
 * @param qualityLevel - The quality level object
 * @param status - The stream status
 * @returns Display quality string
 */
export function getStreamQualityDisplay(
  qualityLevel?: QualityLevel | null,
  status?: 'online' | 'offline' | 'unknown'
): string {
  if (status === 'offline' && qualityLevel) {
    return qualityLevel.badge ?? 'جودة';
  }

  if (!qualityLevel || qualityLevel.value === 'unknown') {
    return 'جودة';
  }

  return qualityLevel.value || '';
}
