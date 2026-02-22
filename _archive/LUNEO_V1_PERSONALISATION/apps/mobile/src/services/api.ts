import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse, PaginatedResponse, User, LoginForm, RegisterForm } from '@/types';

// Configuration de base
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1' 
  : 'https://api.luneo.app/api/v1';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokens();
  }

  private setupInterceptors() {
    // Request interceptor pour ajouter le token
    this.client.interceptors.request.use(
      async (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor pour gérer les erreurs et refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${this.token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            await this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async loadTokens() {
    try {
      this.token = await SecureStore.getItemAsync('access_token');
      this.refreshToken = await SecureStore.getItemAsync('refresh_token');
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }

  private async saveTokens(accessToken: string, refreshToken: string) {
    try {
      await SecureStore.setItemAsync('access_token', accessToken);
      await SecureStore.setItemAsync('refresh_token', refreshToken);
      this.token = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  private async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: this.refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      await this.saveTokens(accessToken, newRefreshToken);
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  async logout() {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await AsyncStorage.removeItem('user');
      this.token = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  // Méthodes d'authentification
  async login(credentials: LoginForm): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    const response = await this.client.post('/auth/login', credentials);
    const { user, accessToken, refreshToken } = response.data;
    
    await this.saveTokens(accessToken, refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { user, tokens: { accessToken, refreshToken } };
  }

  async register(userData: RegisterForm): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    const response = await this.client.post('/auth/register', userData);
    const { user, accessToken, refreshToken } = response.data;
    
    await this.saveTokens(accessToken, refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { user, tokens: { accessToken, refreshToken } };
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.client.patch('/auth/profile', data);
    return response.data;
  }

  // Méthodes génériques
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // Upload de fichiers
  async uploadFile(file: any, onProgress?: (progress: number) => void): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Méthodes avec pagination
  async getPaginated<T>(
    url: string,
    params?: { page?: number; limit?: number; [key: string]: any }
  ): Promise<PaginatedResponse<T>> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  // Configuration des requêtes
  setBaseURL(url: string) {
    this.client.defaults.baseURL = url;
  }

  setTimeout(timeout: number) {
    this.client.defaults.timeout = timeout;
  }

  // Gestion des erreurs
  isNetworkError(error: any): boolean {
    return !error.response && error.request;
  }

  isServerError(error: any): boolean {
    return error.response && error.response.status >= 500;
  }

  isClientError(error: any): boolean {
    return error.response && error.response.status >= 400 && error.response.status < 500;
  }

  getErrorMessage(error: any): string {
    if (this.isNetworkError(error)) {
      return 'Erreur de connexion. Vérifiez votre connexion internet.';
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.message) {
      return error.message;
    }

    return 'Une erreur inattendue s\'est produite.';
  }
}

// Instance singleton
export const apiService = new ApiService();

// Méthodes utilitaires pour les endpoints spécifiques
export const authApi = {
  login: (credentials: LoginForm) => apiService.login(credentials),
  register: (userData: RegisterForm) => apiService.register(userData),
  getCurrentUser: () => apiService.getCurrentUser(),
  updateProfile: (data: Partial<User>) => apiService.updateProfile(data),
  logout: () => apiService.logout(),
};

export const designsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    apiService.getPaginated('/designs', params),
  get: (id: string) => apiService.get(`/designs/${id}`),
  create: (data: any) => apiService.post('/designs', data),
  update: (id: string, data: any) => apiService.patch(`/designs/${id}`, data),
  delete: (id: string) => apiService.delete(`/designs/${id}`),
  generate: (prompt: string, options?: any) =>
    apiService.post('/designs/generate', { prompt, ...options }),
};

export const productsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; brandId?: string }) =>
    apiService.getPaginated('/products', params),
  get: (id: string) => apiService.get(`/products/${id}`),
  search: (query: string) => apiService.get(`/products/search?q=${encodeURIComponent(query)}`),
  scan: (qrCode: string) => apiService.post('/products/scan', { qrCode }),
};

export const ordersApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    apiService.getPaginated('/orders', params),
  get: (id: string) => apiService.get(`/orders/${id}`),
  create: (data: any) => apiService.post('/orders', data),
  update: (id: string, data: any) => apiService.patch(`/orders/${id}`, data),
  cancel: (id: string) => apiService.post(`/orders/${id}/cancel`),
};

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; read?: boolean }) =>
    apiService.getPaginated('/notifications', params),
  markAsRead: (id: string) => apiService.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiService.patch('/notifications/read-all'),
};

export default apiService;


