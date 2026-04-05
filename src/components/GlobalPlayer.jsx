"use client";

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePathname } from 'next/navigation';
import { Howl } from 'howler';
import { 
  togglePlay, 
  setVolume, 
  toggleRepeat, 
  toggleShuffle, 
  toggleMinimize, 
  nextTrack, 
  prevTrack,
  stopPlayer
} from '@/store/playerSlice';

export default function GlobalPlayer() {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    repeatMode, 
    isShuffled, 
    isMinimized 
  } = useSelector((state) => state.player);
  const { isRehydrated } = useSelector((state) => state.auth);
  
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [isBuffering, setIsBuffering] = useState(false);
  const [howl, setHowl] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // Sync Howler with Redux track
  useEffect(() => {
    if (currentTrack) {
      if (howl) {
        howl.stop();
        howl.unload();
      }

      const newHowl = new Howl({
        src: [currentTrack.audio_file_url],
        html5: true,
        volume: volume,
        onplay: () => dispatch(togglePlay(true)),
        onpause: () => dispatch(togglePlay(false)),
        onstop: () => dispatch(togglePlay(false)),
        onend: () => {
          if (repeatMode === 'one') {
            newHowl.play();
          } else {
            dispatch(nextTrack());
          }
        },
        onload: () => {
          setDuration(formatTime(newHowl.duration()));
          setIsBuffering(false);
        },
        onloaderror: () => {
          setIsBuffering(false);
        }
      });

      setIsBuffering(true);
      setHowl(newHowl);
      if (isPlaying) newHowl.play();

      // Increment play count in backend
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/songs/${currentTrack.id}/play/`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => console.warn("Failed to record play:", err));

      return () => {
        newHowl.stop();
        newHowl.unload();
      }
    } else {
      // RESET ALL STATES when currentTrack is closed
      setProgress(0);
      setCurrentTime('0:00');
      setDuration('0:00');
      setIsBuffering(false);
      if (howl) {
        howl.stop();
        howl.unload();
        setHowl(null);
      }
    }
  }, [currentTrack?.id]);

  // Sync Play/Pause state
  useEffect(() => {
    if (howl) {
      if (isPlaying && !howl.playing()) {
        howl.play();
      } else if (!isPlaying && howl.playing()) {
        howl.pause();
      }
    }
  }, [isPlaying]);

  // Sync Volume
  useEffect(() => {
    if (howl) {
      howl.volume(volume);
    }
  }, [volume]);

  // Progress Tracker
  useEffect(() => {
    let timer;
    if (howl && isPlaying && !isDragging) {
      timer = setInterval(() => {
        const current = howl.seek();
        const total = howl.duration();
        if (total) {
          setProgress((current / total) * 100);
          setCurrentTime(formatTime(current));
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [howl, isPlaying, isDragging]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScrub = (e) => {
    setIsDragging(true);
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    if (howl) {
      const newTime = (newProgress / 100) * howl.duration();
      setCurrentTime(formatTime(newTime));
    }
  };

  const handleSeekEnd = (e) => {
    if (howl) {
      const newProgress = parseFloat(e.target.value);
      const newTime = (newProgress / 100) * howl.duration();
      howl.seek(newTime);
    }
    setIsDragging(false);
  };

  if (!currentTrack || !isRehydrated) return null;

  const LoadingOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-10 animate-in fade-in duration-300">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // LAYOUT CALCULATIONS
  // 1. Auth Page:
  //    - Mobile: Mini-Square
  //    - Desktop: Standard 20% width row
  // 2. Minimized (Normal): 50% width, center
  // 3. Maximized (Normal): 100% width

  if (isAuthPage) {
    return (
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[100] group animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* MOBILE: Mini-Square */}
        <div className="md:hidden relative w-16 h-16 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/40 backdrop-blur-md transition-all duration-300">
           {isBuffering && <LoadingOverlay />}
           <img src={currentTrack.cover_image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
           <div 
             onClick={() => dispatch(togglePlay())}
             className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer"
           >
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                 {isPlaying ? (
                    <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                 ) : (
                    <svg className="w-5 h-5 text-white ml-0.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                 )}
              </div>
           </div>
           
           {/* Close Button for Auth Mobile */}
           <button 
             onClick={(e) => { e.stopPropagation(); dispatch(stopPlayer()); }}
             className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-100 transition-opacity"
           >
             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
           </div>
        </div>

        {/* DESKTOP (md+): Standard 20% Width Row */}
        <div className="hidden md:flex relative w-[320px] lg:w-[400px] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 px-6 shadow-2xl items-center justify-between gap-4 overflow-hidden transition-all duration-300">
           <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5">
              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
           </div>
           <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden">
                {isBuffering && <LoadingOverlay />}
                <img src={currentTrack.cover_image_url} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-bold text-xs truncate leading-none">{currentTrack.title}</h4>
                <p className="text-[10px] text-gray-400 truncate mt-1">{currentTrack.artist}</p>
              </div>
           </div>
           <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => dispatch(prevTrack())} className="text-gray-400 hover:text-white rotate-180">
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
              <button onClick={() => dispatch(togglePlay())} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center">
                 {isPlaying ? (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                 ) : (
                    <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                 )}
              </button>
              <button onClick={() => dispatch(nextTrack())} className="text-gray-400 hover:text-white">
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
           </div>
        </div>

      </div>
    );
  }

  let containerStyles = "fixed z-[100] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]";
  let widthClass = "";

  if (isMinimized) {
    containerStyles += " bottom-6 left-1/2 -translate-x-1/2";
    widthClass = "w-[92%] md:w-[60%] lg:w-[45%]";
  } else {
    containerStyles += " bottom-0 left-0 w-full mb-4 px-4";
    widthClass = "w-full";
  }

  return (
    <div className={`${containerStyles} ${widthClass}`}>
      <div className={`relative bg-black/70 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] md:rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${isMinimized ? 'py-3 px-4 md:px-6' : 'py-4 px-8 flex items-center gap-8'}`}>
        
        {/* Progress Tracker Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* FULL LAYOUT (Maximized && !Auth) */}
        {!isMinimized && (
          <>
            {/* DESKTOP LAYOUT (md+) */}
            <div className="hidden md:flex items-center gap-8 w-full">
              <div className="flex items-center gap-4 w-1/4 min-w-0">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  {isBuffering && <LoadingOverlay />}
                  <img src={currentTrack.cover_image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-sm truncate">{currentTrack.title}</h4>
                  <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="flex items-center gap-6">
                  <button onClick={() => dispatch(toggleShuffle())} className={`transition-colors ${isShuffled ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
                  </button>
                  <div className="flex items-center gap-4">
                    <button onClick={() => dispatch(prevTrack())} className="text-gray-400 hover:text-white rotate-180"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
                    <button onClick={() => dispatch(togglePlay())} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                      {isPlaying ? <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                    </button>
                    <button onClick={() => dispatch(nextTrack())} className="text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
                  </div>
                  <button onClick={() => dispatch(toggleRepeat())} className={`relative transition-colors ${repeatMode !== 'none' ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                    {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[8px] bg-indigo-500 text-white w-2 h-2 rounded-full flex items-center justify-center">1</span>}
                  </button>
                </div>
                <div className="flex items-center gap-3 w-full max-w-lg">
                  <span className="text-[10px] text-gray-500 tabular-nums">{currentTime}</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={progress} 
                    onInput={handleScrub} 
                    onMouseUp={handleSeekEnd}
                    onTouchEnd={handleSeekEnd}
                    className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white" 
                  />
                  <span className="text-[10px] text-gray-500 tabular-nums">{duration}</span>
                </div>
              </div>

              <div className="w-[30%] flex justify-end items-center gap-6 shrink-0">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  <div className="w-24 lg:w-32">
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white" />
                  </div>
                </div>
                 <button 
                   onClick={() => dispatch(stopPlayer())} 
                   className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/5"
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
                <button 
                  onClick={() => dispatch(toggleMinimize())} 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all shadow-md border border-white/5"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            </div>

            {/* MOBILE LAYOUT (max-md) */}
            <div className="md:hidden flex flex-col w-full gap-4">
               <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/5">
                      {isBuffering && <LoadingOverlay />}
                      <img src={currentTrack.cover_image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-black text-sm truncate tracking-tight">{currentTrack.title}</h4>
                      <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => dispatch(togglePlay())} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-95 transition-transform">
                      {isPlaying ? <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                    </button>
                    <button onClick={() => setShowOptions(!showOptions)} className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 transition-colors ${showOptions ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                    </button>
                     <button onClick={() => dispatch(toggleMinimize())} className="w-10 h-10 rounded-full bg-white/5 text-gray-400 flex items-center justify-center border border-white/10">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                     </button>
                     <button onClick={() => dispatch(stopPlayer())} className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 active:scale-95 transition-all">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>
               </div>

               {/* Mobile Progress Bar */}
               <div className="w-full flex items-center gap-2">
                 <span className="text-[10px] text-gray-500 tabular-nums">{currentTime}</span>
                 <input 
                   type="range" 
                   min="0" 
                   max="100" 
                   value={progress} 
                   onInput={handleScrub} 
                   onMouseUp={handleSeekEnd}
                   onTouchEnd={handleSeekEnd}
                   className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white" 
                 />
                 <span className="text-[10px] text-gray-500 tabular-nums">{duration}</span>
               </div>

               {/* Conditional Mobile Options Drawer */}
               {showOptions && (
                 <div className="flex flex-col gap-4 pb-2 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button onClick={() => dispatch(prevTrack())} className="w-10 h-10 rounded-full bg-white/5 text-gray-400 flex items-center justify-center border border-white/5 active:scale-95 transition-transform rotate-180">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                        </button>
                        <button onClick={() => dispatch(nextTrack())} className="w-10 h-10 rounded-full bg-white/5 text-gray-400 flex items-center justify-center border border-white/5 active:scale-95 transition-transform">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <button onClick={() => dispatch(toggleShuffle())} className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 transition-colors ${isShuffled ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-white/5 text-gray-500'}`}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
                        </button>
                        <button onClick={() => dispatch(toggleRepeat())} className={`relative w-10 h-10 rounded-full flex items-center justify-center border border-white/5 transition-colors ${repeatMode !== 'none' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-white/5 text-gray-500'}`}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
                          {repeatMode === 'one' && <span className="absolute top-1 right-1 text-[7px] bg-indigo-500 text-white w-2.5 h-2.5 rounded-full flex items-center justify-center font-bold">1</span>}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full bg-white/5 p-2 rounded-xl border border-white/5">
                       <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14" /></svg>
                       <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))} className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white" />
                    </div>
                 </div>
               )}
            </div>
          </>
        )}

        {/* MINIMIZED LAYOUT */}
        {isMinimized && (
          <div className="flex items-center justify-between w-full h-full gap-3 md:gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
               <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-xl border border-white/10">
                 {isBuffering && <LoadingOverlay />}
                 <img src={currentTrack.cover_image_url} className="w-full h-full object-cover" alt="" />
               </div>
               <div className="min-w-0 flex-1">
                 <h4 className="text-white font-bold text-xs md:text-sm truncate leading-tight tracking-tight">{currentTrack.title}</h4>
                 <p className="text-[10px] md:text-xs text-gray-400 truncate mt-0.5">{currentTrack.artist}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0 ml-auto leading-none">
               <button onClick={() => dispatch(togglePlay())} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
                 {isPlaying ? <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
               </button>
                <button onClick={() => dispatch(toggleMinimize())} className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 border border-white/5 transition-all">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button onClick={() => dispatch(stopPlayer())} className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 border border-red-500/10 transition-all">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
