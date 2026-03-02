// API Configuration
// In production, this will use your Render backend URL
// In development, it will use the local server
export const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Socket.IO Configuration
export const SOCKET_URL = API_URL;

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper function for authenticated GET requests
export const authGet = async (endpoint) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Helper function for authenticated POST requests
export const authPost = async (endpoint, data) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

