import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  isRehydrated: false, // track if we've checked storage
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    rehydrate(state) {
      if (typeof window !== 'undefined') {
        const access = localStorage.getItem('access_token');
        const refresh = localStorage.getItem('refresh_token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (access && user) {
          state.isAuthenticated = true;
          state.user = user;
          state.accessToken = access;
          state.refreshToken = refresh;
        }
      }
      state.isRehydrated = true;
    },
    loginSuccess(state, action) {
      const { access, refresh, user } = action.payload;
      state.isAuthenticated = true;
      state.accessToken = access;
      state.refreshToken = refresh;
      state.user = user;
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    logout(state) {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

export const { rehydrate, loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
