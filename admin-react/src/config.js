// API Configuration
// In production, this will use your Render backend URL
// In development, it will use the local server
export const API_URL = import.meta.env.VITE_API_URL || '';

// Socket.IO Configuration
export const SOCKET_URL = API_URL || '/';
