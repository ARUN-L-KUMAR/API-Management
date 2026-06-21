import { create } from 'zustand';

interface StoreState {
  activeFolderId: string | null;
  activeTagIds: string[];
  searchQuery: string;
  providerFilter: string | null;
  statusFilter: string | null;
  showFailedModels: boolean;
  showAllModels: boolean;
  activeKeyId: string | null;
  activeModelId: string | null;
  
  setActiveFolderId: (id: string | null) => void;
  toggleTagId: (id: string) => void;
  clearTagIds: () => void;
  setSearchQuery: (query: string) => void;
  setProviderFilter: (provider: string | null) => void;
  setStatusFilter: (status: string | null) => void;
  setShowFailedModels: (val: boolean) => void;
  setShowAllModels: (val: boolean) => void;
  setActiveKeyId: (id: string | null) => void;
  setActiveModelId: (id: string | null) => void;
  resetFilters: () => void;
}

export const useStore = create<StoreState>((set) => ({
  activeFolderId: null,
  activeTagIds: [],
  searchQuery: '',
  providerFilter: null,
  statusFilter: null,
  showFailedModels: false,
  showAllModels: false,
  activeKeyId: null,
  activeModelId: null,

  setActiveFolderId: (id) => set({ activeFolderId: id }),
  toggleTagId: (id) =>
    set((state) => ({
      activeTagIds: state.activeTagIds.includes(id)
        ? state.activeTagIds.filter((t) => t !== id)
        : [...state.activeTagIds, id],
    })),
  clearTagIds: () => set({ activeTagIds: [] }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setProviderFilter: (provider) => set({ providerFilter: provider }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setShowFailedModels: (val) => set({ showFailedModels: val }),
  setShowAllModels: (val) => set({ showAllModels: val }),
  setActiveKeyId: (id) => set({ activeKeyId: id }),
  setActiveModelId: (id) => set({ activeModelId: id }),
  resetFilters: () =>
    set({
      activeFolderId: null,
      activeTagIds: [],
      searchQuery: '',
      providerFilter: null,
      statusFilter: null,
    }),
}));
