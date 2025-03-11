import axios from 'axios';

// Create an Axios instance with base URL and default headers
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://server.smithery.ai/@madosh/mcp-itsm',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication services
export const authService = {
  login: async (email, password) => {
    try {
      const response = await API.post('/api/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'An error occurred during login' };
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// User services
export const userService = {
  getProfile: async () => {
    try {
      const response = await API.get('/api/users/profile/me');
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to fetch profile' };
    }
  },
  
  getAllUsers: async () => {
    try {
      const response = await API.get('/api/users');
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to fetch users' };
    }
  },
  
  updateUser: async (userId, userData) => {
    try {
      const response = await API.put(`/api/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to update user' };
    }
  },
  
  changePassword: async (userId, passwordData) => {
    try {
      const response = await API.put(`/api/users/${userId}/password`, passwordData);
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to change password' };
    }
  }
};

// Integration services
export const integrationService = {
  getAllIntegrations: async () => {
    try {
      const response = await API.get('/api/integration');
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to fetch integrations' };
    }
  },
  
  getIntegration: async (id) => {
    try {
      const response = await API.get(`/api/integration/${id}`);
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to fetch integration' };
    }
  },
  
  getIntegrationsByType: async (type) => {
    try {
      const response = await API.get(`/api/integration/type/${type}`);
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to fetch integrations by type' };
    }
  },
  
  createIntegration: async (integrationData) => {
    try {
      const response = await API.post('/api/integration', integrationData);
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to create integration' };
    }
  },
  
  updateIntegration: async (id, integrationData) => {
    try {
      const response = await API.put(`/api/integration/${id}`, integrationData);
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to update integration' };
    }
  },
  
  deleteIntegration: async (id) => {
    try {
      const response = await API.delete(`/api/integration/${id}`);
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to delete integration' };
    }
  },
  
  checkIntegrationHealth: async (id) => {
    try {
      const response = await API.post(`/api/integration/${id}/check-health`);
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to check integration health' };
    }
  }
};

export default API; 