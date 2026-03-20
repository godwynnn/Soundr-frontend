import { createSlice } from '@reduxjs/toolkit';

/**
 * Helper to shuffle an array while keeping a specific element at the start (optional)
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const playerSlice = createSlice({
  name: 'player',
  initialState: {
    currentTrack: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,
    history: [],
    volume: 0.8,
    repeatMode: 'none', // 'none', 'all', 'one'
    isShuffled: false,
    isMinimized: false,
    shuffleQueue: [], // Pre-shuffled list for deterministic shuffle navigation
  },
  reducers: {
    setTrack: (state, action) => {
      state.currentTrack = action.payload;
      state.isPlaying = true;
      if (!state.history.find(t => t.id === action.payload.id)) {
        state.history = [action.payload, ...state.history.slice(0, 9)];
      }
    },
    setTrackWithQueue: (state, action) => {
      const { track, queue } = action.payload;
      state.currentTrack = track;
      state.queue = queue;
      state.currentIndex = queue.findIndex(t => t.id === track.id);
      state.isPlaying = true;
      
      if (state.isShuffled) {
        state.shuffleQueue = shuffleArray(queue);
      }
      
      if (!state.history.find(t => t.id === track.id)) {
        state.history = [track, ...state.history.slice(0, 9)];
      }
    },
    togglePlay: (state, action) => {
      state.isPlaying = action.payload !== undefined ? action.payload : !state.isPlaying;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
    toggleRepeat: (state) => {
      const modes = ['none', 'all', 'one'];
      const currentIdx = modes.indexOf(state.repeatMode);
      state.repeatMode = modes[(currentIdx + 1) % modes.length];
    },
    toggleShuffle: (state) => {
      state.isShuffled = !state.isShuffled;
      if (state.isShuffled && state.queue.length > 0) {
        state.shuffleQueue = shuffleArray(state.queue);
      }
    },
    toggleMinimize: (state) => {
      state.isMinimized = !state.isMinimized;
    },
    nextTrack: (state) => {
      const activeQueue = state.isShuffled ? state.shuffleQueue : state.queue;
      if (activeQueue.length === 0) return;

      let currentIdxInActive = activeQueue.findIndex(t => t.id === state.currentTrack?.id);
      let nextIdx = currentIdxInActive + 1;
      
      if (nextIdx >= activeQueue.length) {
        // ALWAYS WRAP if next is triggered (manual or auto-with-repeat)
        // However, if we want to stop auto-play at the end, we'd check repeatMode
        // The user explicitly asked to skip to the first music if at the end.
        nextIdx = 0;
      }

      state.currentTrack = activeQueue[nextIdx];
      state.isPlaying = true;
    },
    prevTrack: (state) => {
      const activeQueue = state.isShuffled ? state.shuffleQueue : state.queue;
      if (activeQueue.length === 0) return;

      let currentIdxInActive = activeQueue.findIndex(t => t.id === state.currentTrack?.id);
      let prevIdx = currentIdxInActive - 1;
      
      if (prevIdx < 0) {
        // ALWAYS WRAP to the end
        prevIdx = activeQueue.length - 1;
      }

      state.currentTrack = activeQueue[prevIdx];
      state.isPlaying = true;
    },
    stopPlayer: (state) => {
      state.currentTrack = null;
      state.isPlaying = false;
    }
  },
});

export const { 
  setTrack, 
  setTrackWithQueue, 
  togglePlay, 
  setVolume, 
  toggleRepeat, 
  toggleShuffle, 
  toggleMinimize, 
  nextTrack, 
  prevTrack, 
  stopPlayer 
} = playerSlice.actions;

export default playerSlice.reducer;
