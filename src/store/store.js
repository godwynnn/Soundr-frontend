import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import playerReducer from './playerSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    player: playerReducer,
  },
});

export default store;
