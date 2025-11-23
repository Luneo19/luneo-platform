import { create } from 'zustand';

interface DashboardStats {
  designsCreated: number;
  activeProjects: number;
  templates: number;
  aiGenerations: number;
}

interface DashboardState {
  stats: DashboardStats;
  isLoading: boolean;
  lastUpdated: Date | null;
  
  // Actions
  fetchStats: () => Promise<void>;
  updateStats: (stats: Partial<DashboardStats>) => void;
  incrementDesigns: () => void;
  incrementGenerations: () => void;
}

const initialStats: DashboardStats = {
  designsCreated: 24,
  activeProjects: 8,
  templates: 156,
  aiGenerations: 342,
};

export const useDashboardStore = create<DashboardState>((set, _get) => ({
  stats: initialStats,
  isLoading: false,
  lastUpdated: null,

  fetchStats: async () => {
    set({ isLoading: true });
    
    try {
      // Simulation d'une requête API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - en production, ceci viendrait de votre API
      const mockStats: DashboardStats = {
        designsCreated: Math.floor(Math.random() * 50) + 20,
        activeProjects: Math.floor(Math.random() * 15) + 5,
        templates: Math.floor(Math.random() * 50) + 150,
        aiGenerations: Math.floor(Math.random() * 100) + 300,
      };
      
      set({ 
        stats: mockStats, 
        isLoading: false, 
        lastUpdated: new Date() 
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  updateStats: (newStats) => {
    set(state => ({
      stats: { ...state.stats, ...newStats },
      lastUpdated: new Date()
    }));
  },

  incrementDesigns: () => {
    set(state => ({
      stats: { 
        ...state.stats, 
        designsCreated: state.stats.designsCreated + 1 
      },
      lastUpdated: new Date()
    }));
  },

  incrementGenerations: () => {
    set(state => ({
      stats: { 
        ...state.stats, 
        aiGenerations: state.stats.aiGenerations + 1 
      },
      lastUpdated: new Date()
    }));
  },
}));

