import type { ApiResponse, ProductConfig, SaveDesignResponse, DesignData } from '../types/designer.types';

const API_BASE_URL = (typeof process !== 'undefined' && process.env?.WIDGET_API_URL) || '/api';

export class ApiService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  async getProductConfig(productId: string): Promise<ApiResponse<ProductConfig>> {
    return this.request<ProductConfig>(`/products/${productId}`);
  }
  
  async saveDesign(designData: DesignData): Promise<ApiResponse<SaveDesignResponse>> {
    return this.request<SaveDesignResponse>('/designs', {
      method: 'POST',
      body: JSON.stringify(designData),
    });
  }
  
  async loadDesign(designId: string): Promise<ApiResponse<DesignData>> {
    return this.request<DesignData>(`/designs/${designId}`);
  }

  // Generation API methods
  async createGeneration(productId: string, customizations: Record<string, any>, userPrompt?: string, sessionId?: string): Promise<ApiResponse<{ id: string; status: string; estimatedTime?: number; statusUrl: string }>> {
    return this.request('/generation/create', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        customizations,
        userPrompt,
        sessionId,
      }),
    });
  }

  async getGenerationStatus(publicId: string): Promise<ApiResponse<{ status: string; progress?: number; result?: any; error?: string }>> {
    return this.request(`/generation/${publicId}/status`);
  }

  async getGeneration(publicId: string): Promise<ApiResponse<{ id: string; status: string; result?: any }>> {
    return this.request(`/generation/${publicId}`);
  }

  async getArData(publicId: string): Promise<ApiResponse<{ textureUrl: string; modelUrl: string; trackingType: string; scale: number; offset: any; sessionConfig: any }>> {
    return this.request(`/generation/${publicId}/ar`);
  }
}

