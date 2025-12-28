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
    const token = localStorage.getItem('auth_token');
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
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (data: { name?: string; email?: string; phone?: string; address?: string }) =>
    api.put('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),
};

// Products API endpoints
export const productsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => api.get('/products', { params }),
  
  getById: (id: string) => api.get(`/products/${id}`),
  
  getFeatured: () => api.get('/products/featured'),
  
  getCategories: () => api.get('/products/categories'),
  
  // Admin endpoints
  create: (data: FormData) =>
    api.post('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  update: (id: string, data: FormData) =>
    api.put(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Cart API endpoints
export const cartAPI = {
  get: () => api.get('/cart'),
  
  addItem: (productId: string, quantity: number, variant?: string) =>
    api.post('/cart/items', { productId, quantity, variant }),
  
  updateItem: (itemId: string, quantity: number) =>
    api.put(`/cart/items/${itemId}`, { quantity }),
  
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),
  
  clear: () => api.delete('/cart'),
};

// Orders API endpoints
export const ordersAPI = {
  create: (data: {
    shippingAddress: object;
    paymentMethod: string;
    items: Array<{ productId: string; quantity: number; variant?: string }>;
  }) => api.post('/orders', data),
  
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/orders', { params }),
  
  getById: (id: string) => api.get(`/orders/${id}`),
  
  cancel: (id: string) => api.put(`/orders/${id}/cancel`),
  
  // Admin endpoints
  updateStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
};

// Wishlist API endpoints
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  
  add: (productId: string) => api.post('/wishlist', { productId }),
  
  remove: (productId: string) => api.delete(`/wishlist/${productId}`),
  
  check: (productId: string) => api.get(`/wishlist/check/${productId}`),
};

// Users API (Admin)
export const usersAPI = {
  getAll: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get('/users', { params }),
  
  getById: (id: string) => api.get(`/users/${id}`),
  
  update: (id: string, data: { role?: string; status?: string }) =>
    api.put(`/users/${id}`, data),
  
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Reviews API endpoints
export const reviewsAPI = {
  getByProduct: (productId: string) => api.get(`/reviews/product/${productId}`),
  
  create: (data: { productId: string; rating: number; comment?: string }) => 
    api.post('/reviews', data),
  
  update: (id: string, data: { rating?: number; comment?: string }) => 
    api.put(`/reviews/${id}`, data),
  
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

export default api;
