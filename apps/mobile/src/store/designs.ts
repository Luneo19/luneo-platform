import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Design, DesignStatus, PaginatedResponse } from '@/types';
import { designsApi } from '@/services/api';

interface DesignsState {
  // État
  designs: Design[];
  currentDesign: Design | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  
  // Filtres et recherche
  filters: {
    status?: DesignStatus;
    search?: string;
    tags?: string[];
  };
  
  // Actions
  loadDesigns: (page?: number, refresh?: boolean) => Promise<void>;
  loadDesign: (id: string) => Promise<void>;
  createDesign: (data: { name: string; description?: string; prompt?: string }) => Promise<Design>;
  generateDesign: (prompt: string, options?: any) => Promise<Design>;
  updateDesign: (id: string, data: Partial<Design>) => Promise<void>;
  deleteDesign: (id: string) => Promise<void>;
  setFilters: (filters: Partial<DesignsState['filters']>) => void;
  clearFilters: () => void;
  clearError: () => void;
  
  // Actions locales
  addDesign: (design: Design) => void;
  updateDesignLocal: (id: string, data: Partial<Design>) => void;
  removeDesign: (id: string) => void;
  setCurrentDesign: (design: Design | null) => void;
}

export const useDesignsStore = create<DesignsState>()(
  persist(
    (set, get) => ({
      // État initial
      designs: [],
      currentDesign: null,
      isLoading: false,
      isGenerating: false,
      error: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
      filters: {},

      // Actions principales
      loadDesigns: async (page = 1, refresh = false) => {
        const currentPage = refresh ? 1 : page;
        set({ isLoading: true, error: null });

        try {
          const response: PaginatedResponse<Design> = await designsApi.list({
            page: currentPage,
            limit: get().pagination.limit,
            ...get().filters,
          });

          set({
            designs: refresh ? response.data : [...get().designs, ...response.data],
            pagination: response.pagination,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erreur lors du chargement des designs',
          });
        }
      },

      loadDesign: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const design = await designsApi.get(id);
          set({
            currentDesign: design,
            isLoading: false,
          });

          // Mettre à jour le design dans la liste si présent
          const { designs } = get();
          const index = designs.findIndex(d => d.id === id);
          if (index !== -1) {
            designs[index] = design;
            set({ designs: [...designs] });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erreur lors du chargement du design',
          });
        }
      },

      createDesign: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const design = await designsApi.create(data);
          
          set({
            designs: [design, ...get().designs],
            currentDesign: design,
            isLoading: false,
          });

          return design;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erreur lors de la création du design',
          });
          throw error;
        }
      },

      generateDesign: async (prompt: string, options = {}) => {
        set({ isGenerating: true, error: null });

        try {
          const design = await designsApi.generate(prompt, options);
          
          set({
            designs: [design, ...get().designs],
            currentDesign: design,
            isGenerating: false,
          });

          return design;
        } catch (error: any) {
          set({
            isGenerating: false,
            error: error.message || 'Erreur lors de la génération du design',
          });
          throw error;
        }
      },

      updateDesign: async (id: string, data: Partial<Design>) => {
        set({ isLoading: true, error: null });

        try {
          await designsApi.update(id, data);
          
          // Mettre à jour localement
          get().updateDesignLocal(id, data);
          
          // Mettre à jour le design courant si c'est le même
          const { currentDesign } = get();
          if (currentDesign?.id === id) {
            set({ currentDesign: { ...currentDesign, ...data } });
          }

          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erreur lors de la mise à jour du design',
          });
          throw error;
        }
      },

      deleteDesign: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          await designsApi.delete(id);
          
          // Supprimer localement
          get().removeDesign(id);
          
          // Effacer le design courant si c'est le même
          const { currentDesign } = get();
          if (currentDesign?.id === id) {
            set({ currentDesign: null });
          }

          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Erreur lors de la suppression du design',
          });
          throw error;
        }
      },

      setFilters: (filters) => {
        set({ filters: { ...get().filters, ...filters } });
        // Recharger les designs avec les nouveaux filtres
        get().loadDesigns(1, true);
      },

      clearFilters: () => {
        set({ filters: {} });
        // Recharger tous les designs
        get().loadDesigns(1, true);
      },

      clearError: () => {
        set({ error: null });
      },

      // Actions locales
      addDesign: (design) => {
        set({ designs: [design, ...get().designs] });
      },

      updateDesignLocal: (id, data) => {
        const { designs } = get();
        const index = designs.findIndex(d => d.id === id);
        if (index !== -1) {
          designs[index] = { ...designs[index], ...data };
          set({ designs: [...designs] });
        }
      },

      removeDesign: (id) => {
        set({ designs: get().designs.filter(d => d.id !== id) });
      },

      setCurrentDesign: (design) => {
        set({ currentDesign: design });
      },
    }),
    {
      name: 'designs-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        designs: state.designs.slice(0, 50), // Garder seulement les 50 derniers
        currentDesign: state.currentDesign,
        filters: state.filters,
      }),
    }
  )
);


