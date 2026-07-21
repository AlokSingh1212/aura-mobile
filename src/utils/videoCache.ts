import { 
  cacheDirectory, 
  getInfoAsync, 
  makeDirectoryAsync, 
  downloadAsync, 
  deleteAsync 
} from "expo-file-system/legacy";

// Folder inside cache directory to isolate video downloads
const CACHE_FOLDER = `${cacheDirectory}reels_prefetch/`;

// Sanitize URL to create a safe, unique filename without slashes/colons for native file systems
const getLocalUri = (url: string): string => {
  const clean = url
    .replace(/^https?:\/\//i, "")
    .replace(/[^a-zA-Z0-9_.-]/g, "_");
  const filename = clean.slice(-100); // Limit length to avoid OS filename limits
  return `${CACHE_FOLDER}${filename}`;
};

/**
 * Ensures the prefetch cache directory exists.
 */
const ensureDirectoryExists = async () => {
  const dirInfo = await getInfoAsync(CACHE_FOLDER);
  if (!dirInfo.exists) {
    try {
      await makeDirectoryAsync(CACHE_FOLDER, { intermediates: true });
    } catch (err) {
      console.warn("Failed to create reels prefetch folder:", err);
    }
  }
};

// Keep track of active download promises to prevent double downloads
const activeDownloads = new Map<string, Promise<string>>();

/**
 * Resolves a remote video URL to a local cached URI. 
 * If not cached, initiates a background download and returns the local URI once finished.
 */
export const prefetchVideo = async (url: string): Promise<string> => {
  if (!url) return "";
  if (url.includes(".m3u8")) return url;
  await ensureDirectoryExists();

  const localUri = getLocalUri(url);
  const fileInfo = await getInfoAsync(localUri);

  if (fileInfo.exists) {
    return localUri;
  }

  // Reuse existing active download promise if present
  if (activeDownloads.has(url)) {
    return activeDownloads.get(url)!;
  }

  const downloadPromise = (async () => {
    try {
      const downloadRes = await downloadAsync(url, localUri);
      return downloadRes.uri;
    } catch (err) {
      console.warn(`Video prefetch failed for URL: ${url}`, err);
      return url; // Fallback
    } finally {
      activeDownloads.delete(url);
    }
  })();

  activeDownloads.set(url, downloadPromise);
  return downloadPromise;
};

/**
 * Checks if a video is already cached, returning its local URI if present, or null.
 * If currently downloading, awaits the active prefetch to prevent duplicate network calls.
 */
export const getCachedVideo = async (url: string): Promise<string | null> => {
  if (!url) return null;
  if (url.includes(".m3u8")) return url;
  
  const localUri = getLocalUri(url);
  const fileInfo = await getInfoAsync(localUri);
  if (fileInfo.exists) {
    return localUri;
  }

  // If currently prefetching in background, await it
  if (activeDownloads.has(url)) {
    try {
      const cached = await activeDownloads.get(url);
      if (cached && !cached.startsWith("http")) {
        return cached;
      }
    } catch {
      // ignore
    }
  }

  return null;
};

/**
 * Clears the prefetch cache folder.
 */
export const clearVideoCache = async () => {
  try {
    const dirInfo = await getInfoAsync(CACHE_FOLDER);
    if (dirInfo.exists) {
      await deleteAsync(CACHE_FOLDER, { idempotent: true });
    }
  } catch (err) {
    console.warn("Failed to clear reels prefetch cache:", err);
  }
};
