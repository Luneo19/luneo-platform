// Widget SDK Types

export interface WidgetConfig {
  apiKey: string;
  brandId: string;
  productId: string;
  productName: string;
  theme?: 'light' | 'dark' | 'auto';
  language?: 'fr' | 'en' | 'es';
  features?: {
    ar?: boolean;
    download?: boolean;
    share?: boolean;
    customPrompts?: boolean;
  };
  customization?: {
    primaryColor?: string;
    secondaryColor?: string;
    borderRadius?: 'none' | 'sm' | 'md' | 'lg';
    fontFamily?: string;
  };
  apiEndpoint?: string;
}

export interface Design {
  id: string;
  prompt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  previewUrl?: string;
  finalUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    style?: string;
    colors?: string[];
    materials?: string[];
    dimensions?: {
      width: number;
      height: number;
    };
    generationTime?: number;
    format?: string;
  };
}

export interface WidgetError {
  code: string;
  message: string;
  details?: any;
}

export interface WidgetEvent {
  type: 'design_generated' | 'design_failed' | 'ar_started' | 'download_clicked' | 'share_clicked';
  data: any;
  timestamp: Date;
}

export interface PromptSuggestion {
  id: string;
  text: string;
  category: 'style' | 'material' | 'color' | 'text' | 'pattern';
  popularity?: number;
}

export interface WidgetAnalytics {
  sessionId: string;
  events: WidgetEvent[];
  userAgent: string;
  timestamp: Date;
}


