/**
 * Extracts a YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 *
 * Returns null if the URL is not a recognized YouTube link.
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Returns a YouTube embed URL if the input is a YouTube link, otherwise null.
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Determines the media type from a URL.
 */
export type MediaType = "youtube" | "video" | "audio" | "image";

export function getMediaType(url: string): MediaType {
  if (getYouTubeVideoId(url)) return "youtube";
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return "video";
  if (/\.(mp3|wav|m4a|aac|flac|oga|opus)(\?.*)?$/i.test(url)) return "audio";
  return "image";
}
