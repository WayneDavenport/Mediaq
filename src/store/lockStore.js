import { create } from 'zustand';

const useLockStore = create((set) => ({
    categories: [],
    incompleteItems: [],
    setCategories: (categories) => set({ categories }),
    setIncompleteItems: (items) => set({ incompleteItems: items }),
    fetchCategories: async () => {
        try {
            const response = await fetch('/api/media-items/categories');
            const data = await response.json();
            set({ categories: data.categories });
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    },
    fetchIncompleteItems: async () => {
        try {
            const response = await fetch('/api/media-items/incomplete');
            const data = await response.json();
            set({ incompleteItems: data.items });
        } catch (error) {
            console.error('Failed to fetch incomplete items:', error);
        }
    },
}));

export default useLockStore;