// API Configuration Utility
// This centralizes API URL configuration for all API calls

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get the full API URL for a given endpoint
 * @param {string} endpoint - The API endpoint (e.g., '/api/users')
 * @returns {string} The full URL
 */
export const getApiUrl = (endpoint) => {
  // If endpoint already starts with http, return as-is
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // In development with proxy, just use the endpoint
  if (import.meta.env.DEV) {
    return endpoint;
  }
  
  // In production, prepend the API base URL
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Make a fetch request to an API endpoint
 * @param {string} endpoint - The API endpoint
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  
  // Add default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Get token from localStorage if exists
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers
  });
};

export default { getApiUrl, apiFetch };
