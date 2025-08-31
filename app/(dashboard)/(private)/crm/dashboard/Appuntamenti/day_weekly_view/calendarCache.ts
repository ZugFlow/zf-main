// Optimized helpers for local calendar cache (day & weekly views)
export function loadCalendarCache(key: string) {
  try {
    const cache = localStorage.getItem(key);
    if (cache) {
      // Check cache size to prevent large string serialization
      if (cache.length > 500000) { // 500KB limit
        localStorage.removeItem(key);
        console.warn(`Calendar cache too large for ${key}, removed`);
        return null;
      }
      return JSON.parse(cache);
    }
  } catch (error) {
    console.warn(`Error loading calendar cache for ${key}:`, error);
  }
  return null;
}

export function saveCalendarCache(key: string, data: any) {
  try {
    const serialized = JSON.stringify(data);
    
    // Check serialized size before storing
    if (serialized.length > 500000) { // 500KB limit
      console.warn(`Calendar cache too large for ${key}, skipping save`);
      return;
    }
    
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.warn(`Error saving calendar cache for ${key}:`, error);
  }
}
