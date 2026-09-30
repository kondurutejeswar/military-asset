import axios from 'axios';

// Helper to ensure baseURL is always a valid, properly formatted absolute URL
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const defaultUrl = 'https://military-assets-lvqt.onrender.com/api';

  if (!envUrl || typeof envUrl !== 'string') {
    return defaultUrl;
  }

  // Clean trailing spaces, newlines, and surrounding quotes
  let cleaned = envUrl.trim().replace(/^["']|["']$/g, '');
  if (!cleaned || cleaned === 'undefined' || cleaned === 'null') {
    return defaultUrl;
  }

  // Prepend protocol if omitted in deployment environment variables
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }

  // Normalize /api suffix
  cleaned = cleaned.replace(/\/+$/, '');
  if (!cleaned.endsWith('/api')) {
    cleaned = cleaned + '/api';
  }

  try {
    return new URL(cleaned).href.replace(/\/+$/, '');
  } catch (err) {
    console.warn('Invalid VITE_API_BASE_URL provided:', envUrl, 'falling back to default URL');
    return defaultUrl;
  }
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 Unauthorized, clear auth and redirect to appropriate login page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        window.location.href = '/admin/login';
      } else if (!currentPath.startsWith('/admin') && currentPath !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
