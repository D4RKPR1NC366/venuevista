// Runtime Configuration
// This file provides runtime configuration that works in both dev and production

// For production builds on static sites, we need to detect the API URL at runtime
// since environment variables are baked in at build time

const getApiBaseUrl = () => {
  // If running in development mode, use proxy (empty string means relative URLs work via proxy)
  if (import.meta.env.DEV) {
    return '';
  }
  
  // In production, check if VITE_API_URL was set during build
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback: try to read from window.ENV if set
  if (window.ENV && window.ENV.API_URL) {
    return window.ENV.API_URL;
  }
  
  // Default fallback - will likely fail but prevents undefined errors
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper to construct full API URLs
export const getFullApiUrl = (path) => {
  if (!path) return API_BASE_URL;
  
  // If path already has full URL, return as-is
  if (path.startsWith('http')) {
    return path;
  }
  
  // If no base URL (dev mode), return relative path
  if (!API_BASE_URL) {
    return path;
  }
  
  // Combine base URL with path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

// Log the configuration on load
console.log('[CONFIG] API_BASE_URL:', API_BASE_URL);
console.log('[CONFIG] Environment:', import.meta.env.MODE);
console.log('[CONFIG] VITE_API_URL:', import.meta.env.VITE_API_URL);

// Override global fetch to automatically use full URLs in production
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  // Only intercept API calls (those starting with /api or /uploads or /gallery)
  if (typeof url === 'string' && 
      (url.startsWith('/api') || url.startsWith('/uploads') || url.startsWith('/gallery'))) {
    const fullUrl = getFullApiUrl(url);
    console.log(`[API] ${url} -> ${fullUrl}`);
    return originalFetch.call(this, fullUrl, options);
  }
  
  // Pass through all other requests
  return originalFetch.call(this, url, options);
};
console.log('[CONFIG] Fetch override installed successfully');

export default { API_BASE_URL, getFullApiUrl };
