// API Service Configuration
// This module handles all API calls with axios
// Configure base URL via environment variables

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token - handle both JSON stringified and plain string storage
    let token = null;
    
    try {
      const rawToken = localStorage.getItem('auth_token');
      if (rawToken) {
        // Try to parse as JSON (in case it was stored with JSON.stringify)
        try {
          token = JSON.parse(rawToken);
        } catch {
          // If parsing fails, it's already a plain string
          token = rawToken;
        }
        // Ensure token is a string (remove any quotes if double-stringified)
        if (typeof token === 'string') {
          token = token.replace(/^["']|["']$/g, '');
        }
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles common error cases
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log network errors for debugging
    if (!error.response) {
      console.error('Network Error:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
    }
    
    // Handle 401 Unauthorized - redirect to login
    // But don't redirect if we're already on the login page or if it's a login/register request
    const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                         error.config?.url?.includes('/auth/register');
    const isLoginPage = window.location.pathname === '/login';
    const isRegisterPage = window.location.pathname === '/register';
    const isProfilePage = window.location.pathname === '/profile';
    
    // Don't redirect on auth pages or profile page (let ProtectedRoute handle it)
    if (error.response?.status === 401 && !isAuthRequest && !isLoginPage && !isRegisterPage && !isProfilePage) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  register: (data) =>
    api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (data) =>
    api.put('/auth/profile', data),
  
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  changePassword: (data) =>
    api.put('/auth/password', data),
};

// Products API endpoints
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  
  getById: (id) => api.get(`/products/${id}`),
  
  getFeatured: () => api.get('/products/featured'),
  
  getCategories: () => api.get('/products/categories'),
  
  // Admin endpoints
  create: (data) =>
    api.post('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  update: (id, data) =>
    api.put(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  delete: (id) => api.delete(`/products/${id}`),
};

// Cart API endpoints
export const cartAPI = {
  get: () => api.get('/cart'),
  
  addItem: (productId, quantity, variant) =>
    api.post('/cart/items', { productId, quantity, variant }),
  
  updateItem: (itemId, quantity) =>
    api.put(`/cart/items/${itemId}`, { quantity }),
  
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  
  clear: () => api.delete('/cart'),
};

// Orders API endpoints
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  
  getAll: (params) =>
    api.get('/orders', { params }),
  
  getById: (id) => api.get(`/orders/${id}`),
  
  cancel: (id) => api.put(`/orders/${id}/cancel`),
  
  // Admin endpoints
  updateStatus: (id, status) =>
    api.put(`/orders/${id}/status`, { status }),
};

// Wishlist API endpoints
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  
  add: (productId) => api.post('/wishlist', { productId }),
  
  remove: (productId) => api.delete(`/wishlist/${productId}`),
  
  check: (productId) => api.get(`/wishlist/check/${productId}`),
};

// Users API (Admin)
export const usersAPI = {
  getAll: (params) =>
    api.get('/users', { params }),
  
  getById: (id) => api.get(`/users/${id}`),
  
  update: (id, data) =>
    api.put(`/users/${id}`, data),
  
  delete: (id) => api.delete(`/users/${id}`),
};

// Admin API endpoints
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
};

// Reviews API endpoints
export const reviewsAPI = {
  getByProduct: (productId) => api.get(`/reviews/product/${productId}`),
  
  create: (data) => api.post('/reviews', data),
  
  update: (id, data) => api.put(`/reviews/${id}`, data),
  
  delete: (id) => api.delete(`/reviews/${id}`),
};

export default api;

