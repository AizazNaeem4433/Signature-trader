// signature-trader/lib/store/useNotificationStore.ts
import { create } from 'zustand';

interface NotificationState {
  message: string | null;
  type: 'success' | 'error' | 'info' | null;
  show: boolean;
  
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  clearNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  message: null,
  type: null,
  show: false,
  
  addNotification: (message, type) => set({ message, type, show: true }),
  
  clearNotification: () => set({ message: null, type: null, show: false }),
}));