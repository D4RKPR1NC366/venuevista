// API URL Helper
// Centralized API URL configuration for all components

export const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return `${apiUrl}/api`;
  }
  return '/api';
};

export const getUploadBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return `${apiUrl}/uploads`;
  }
  return '/uploads';
};

export const getGalleryBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return `${apiUrl}/gallery`;
  }
  return '/gallery';
};

export const API_BASE_URL = getApiBaseUrl();
export const UPLOAD_BASE_URL = getUploadBaseUrl();
export const GALLERY_BASE_URL = getGalleryBaseUrl();

// Helper to convert relative image URLs to absolute URLs
export const getImageUrl = (url) => {
  if (!url) return '';
  
  // If already absolute URL, return as-is
  if (url.startsWith('http')) {
    return url;
  }
  
  // If relative path starting with /
  if (url.startsWith('/')) {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      return `${apiUrl}${url}`;
    }
    return url; // In dev mode, relative paths work via proxy
  }
  
  return url;
};
