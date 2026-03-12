import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null, 
  token: localStorage.getItem('token') || null, 

  login: (userData, token) => {
    localStorage.setItem('token', token); 
    set({ user: userData, token: token }); 
  },

  logout: () => {
    localStorage.removeItem('token'); 
    set({ user: null, token: null });
  }
}));

export default useAuthStore;