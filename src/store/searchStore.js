import { create } from 'zustand';

const useSearchStore = create((set) => ({
    searchResults: [],
    stagingItem: null,
    setSearchResults: (results) => set({ searchResults: results }),
    setStagingItem: (item) => set({ stagingItem: item }),
    clearStagingItem: () => set({ stagingItem: null }),
}));

export default useSearchStore;