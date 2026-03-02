// API Configuration
// In production, this will use your Render backend URL
// In development, it will use the local server
export const API_URL = import.meta.env.VITE_API_URL || '';

// Socket.IO Configuration
export const SOCKET_URL = API_URL || '/';

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper function for authenticated fetch
export const authFetch = async (url, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };
  
  return fetch(url, { ...options, headers });
};
