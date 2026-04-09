"use client";

import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Howl } from 'howler';
import {
  togglePlay,
  setVolume,
  toggleRepeat,
  toggleShuffle,
  toggleMinimize,
  setMinimized,
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
  const {
    isAuthenticated,
    user,
    accessToken,
    isRehydrated
  } = useSelector((state) => state.auth);

  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [isBuffering, setIsBuffering] = useState(false);
  const howlRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [actionStatus, setActionStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [isProcessing, setIsProcessing] = useState(false);
  const prevTrackRef = useRef(null);
  const touchStartY = useRef(0);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // Sync Howler with Redux track
  useEffect(() => {
    if (currentTrack) {
      // ONLY auto-minimize if we're starting from NO track (initial play)
      if (window.innerWidth < 768 && !prevTrackRef.current) {
        dispatch(setMinimized(true));
      }
      prevTrackRef.current = currentTrack;
      
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
      }

      howlRef.current = new Howl({
        src: [currentTrack.audio_file_url],
        html5: true,
        volume: volume,
        onplay: () => dispatch(togglePlay(true)),
        onpause: () => dispatch(togglePlay(false)),
        onstop: () => dispatch(togglePlay(false)),
        onend: () => {
          if (repeatMode === 'one') {
            howlRef.current.play();
          } else {
            dispatch(nextTrack());
          }
        },
        onload: () => {
          setDuration(formatTime(howlRef.current.duration()));
          setIsBuffering(false);
        },
        onloaderror: () => {
          setIsBuffering(false);
        }
      });

      setIsBuffering(true);
      if (isPlaying) howlRef.current.play();

      // Increment play count in backend
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/songs/${currentTrack.id}/play/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => console.warn("Failed to record play:", err));

      return () => {
        if (howlRef.current) {
          howlRef.current.stop();
          howlRef.current.unload();
          howlRef.current = null;
        }
      };
    } else {
      // RESET ALL STATES when currentTrack is closed
      prevTrackRef.current = null;
      setProgress(0);
      setCurrentTime('0:00');
      setDuration('0:00');
      setIsBuffering(false);
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
        howlRef.current = null;
      }
    }
  }, [currentTrack?.id]);

  // Sync Play/Pause state
  useEffect(() => {
    if (howlRef.current) {
      if (isPlaying && !howlRef.current.playing()) {
        howlRef.current.play();
      } else if (!isPlaying && howlRef.current.playing()) {
        howlRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync Volume
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(volume);
    }
  }, [volume]);

  // Progress Tracker
  useEffect(() => {
    let timer;
    if (howlRef.current && isPlaying && !isDragging) {
      timer = setInterval(() => {
        const current = howlRef.current.seek();
        const total = howlRef.current.duration();
        if (total) {
          setProgress((current / total) * 100);
          setCurrentTime(formatTime(current));
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isDragging]);

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
    if (howlRef.current) {
      const newTime = (newProgress / 100) * howlRef.current.duration();
      setCurrentTime(formatTime(newTime));
    }
  };

  const handleSeekEnd = (e) => {
    if (howlRef.current) {
      const newProgress = parseFloat(e.target.value);
      const newTime = (newProgress / 100) * howlRef.current.duration();
      howlRef.current.seek(newTime);
    }
    setIsDragging(false);
  };

  const handleAction = async (actionType) => {
    if (!isAuthenticated) {
      setActionStatus({ type: 'error', message: "Please Login" });
      return;
    }

    setIsProcessing(true);
    setActionStatus(null);
    let endpoint = "";
    if (actionType === 'like') endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/listener/songs/${currentTrack.id}/like/`;
    else if (actionType === 'support') endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/payment/support-song/${currentTrack.id}/`;
    else if (actionType === 'hype') endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/listener/songs/${currentTrack.id}/hype/`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setActionStatus({ type: 'success', message: actionType === 'like' ? (data.liked ? "Liked!" : "Removed") : (actionType === 'support' ? "Supported!" : "Hyped!") });
        setTimeout(() => setActionStatus(null), 2000);
      } else {
        setActionStatus({ type: 'error', message: data.error || "Failed" });
      }
    } catch (err) {
      setActionStatus({ type: 'error', message: "Error" });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * MOBILE GESTURE: Drag handle to minimize
   */
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 60) {
      dispatch(setMinimized(true));
    }
  };

  const router = useRouter();

  const ActionMenuOverlay = () => (
    <div className="absolute bottom-full right-0 mb-4 w-48 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl animate-in slide-in-from-bottom-2 duration-300 z-50">
      <div className="flex flex-col gap-1">
        <button onClick={(e) => { e.stopPropagation(); handleAction('like'); }} disabled={isProcessing} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-xs font-bold text-white whitespace-nowrap">
          <span className="text-pink-500">❤️</span> Like Track
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleAction('support'); }} disabled={isProcessing} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-xs font-bold text-white whitespace-nowrap">
          <span className="text-emerald-500">🪙</span> Send Support
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleAction('hype'); }} disabled={isProcessing} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-xs font-bold text-white whitespace-nowrap">
          <span className="text-yellow-500">🚀</span> Hype It Up
        </button>
        <div className="h-px bg-white/10 my-1" />
        <button onClick={(e) => { e.stopPropagation(); dispatch(stopPlayer()); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-red-500/20 text-red-500 transition-colors text-xs font-bold whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          Close Player
        </button>
      </div>
      {actionStatus && (
        <div className={`mt-2 p-2 rounded-lg text-[10px] font-black text-center ${actionStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {actionStatus.message}
        </div>
      )}
    </div>
  );

  if (!currentTrack || !isRehydrated) return null;

  const LoadingOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-10 animate-in fade-in duration-300">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

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
                <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-5 h-5 text-white ml-0.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </div>
          </div>
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
              <h4
                onClick={() => router.push(`/song/${currentTrack.id}`)}
                className="text-white font-bold text-xs truncate leading-none cursor-pointer hover:text-indigo-400 transition-colors"
              >
                {currentTrack.title}
              </h4>
              <Link
                href={`/profile/${currentTrack.uploaded_by}`}
                className="text-[10px] text-gray-400 truncate mt-1 hover:text-white transition-colors cursor-pointer"
              >
                {currentTrack.artist}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => dispatch(prevTrack())} className="text-gray-400 hover:text-white rotate-180">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
            <button onClick={() => dispatch(togglePlay())} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center">
              {isPlaying ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button onClick={() => dispatch(nextTrack())} className="text-gray-400 hover:text-white">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STABILIZED TRANSITION WRAPPERS
  const containerBase = "fixed bottom-0 left-0 right-0 z-[100] flex justify-center pointer-events-none transition-all duration-500 ease-in-out";
  const cardBase = "relative bg-black/70 backdrop-blur-3xl border-white/10 shadow-2xl transition-all duration-500 ease-in-out pointer-events-auto";
  
  const cardStyles = isMinimized 
    ? "w-[92%] md:w-[60%] lg:w-[45%] mb-6 rounded-2xl py-3 px-4 md:px-6 border max-h-[80px]" 
    : "w-full md:w-[96%] lg:w-[94%] border-t md:border rounded-t-[2.5rem] md:rounded-3xl md:mb-4 py-6 px-4 md:px-8 h-auto max-h-[88vh] md:max-h-[140px]";

  return (
    <div className={containerBase}>
      <div className={`${cardBase} ${cardStyles}`}>
        
        {/* Mobile Sheet Handle (Maximized Only) */}
        {!isMinimized && (
          <div 
            className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-white/20 rounded-full z-50 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        )}

        {/* Global Progress Tracker Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 z-0">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* CONTENT SWITCHER WITH OPACITY FADE */}
        <div className="relative w-full h-full z-10">
          {!isMinimized ? (
            <div className="animate-in fade-in duration-500 flex flex-col md:flex-row items-center gap-8 w-full h-full">
              {/* DESKTOP LAYOUT (md+) */}
              <div className="hidden md:flex items-center gap-8 w-full">
                <div className="flex items-center gap-4 w-1/4 min-w-0">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    {isBuffering && <LoadingOverlay />}
                    <img src={currentTrack.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4
                      onClick={() => router.push(`/song/${currentTrack.id}`)}
                      className="text-white font-bold text-sm truncate cursor-pointer hover:text-indigo-400 transition-colors"
                    >
                      {currentTrack.title}
                    </h4>
                    <Link
                      href={`/profile/${currentTrack.uploaded_by}`}
                      className="text-gray-400 text-xs truncate hover:text-white transition-colors cursor-pointer"
                    >
                      {currentTrack.artist}
                    </Link>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-6">
                    <button onClick={() => dispatch(toggleShuffle())} className={`transition-colors ${isShuffled ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg>
                    </button>
                    <div className="flex items-center gap-4">
                      <button onClick={() => dispatch(prevTrack())} className="text-gray-400 hover:text-white rotate-180"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg></button>
                      <button onClick={() => dispatch(togglePlay())} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                        {isPlaying ? <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                      </button>
                      <button onClick={() => dispatch(nextTrack())} className="text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg></button>
                    </div>
                    <button onClick={() => dispatch(toggleRepeat())} className={`relative transition-colors ${repeatMode !== 'none' ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>
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
                  <div className="relative">
                    <button
                      onClick={() => setShowActions(!showActions)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${showActions ? 'bg-indigo-500 border-indigo-400 text-white' : 'text-gray-400 hover:text-white border-white/5 hover:bg-white/10'}`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                    {showActions && <ActionMenuOverlay />}
                  </div>
                  <button
                    onClick={() => dispatch(toggleMinimize())}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all shadow-md border border-white/5"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              </div>

              {/* MOBILE LAYOUT (max-md) */}
              <div className="md:hidden flex flex-col w-full gap-4 pb-6 pt-2">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-32 h-32 rounded-3xl overflow-hidden shadow-2xl border border-white/10 shrink-0">
                    {isBuffering && <LoadingOverlay />}
                    <img src={currentTrack.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 text-center space-y-1 w-full px-6">
                    <h4 className="text-white font-black text-xl truncate tracking-tight">{currentTrack.title}</h4>
                    <Link
                      href={`/profile/${currentTrack.uploaded_by}`}
                      className="text-xs text-gray-400 truncate hover:text-white transition-colors cursor-pointer block font-bold"
                    >
                      {currentTrack.artist}
                    </Link>
                  </div>
                  <div className="flex items-center gap-10">
                    <button onClick={() => dispatch(prevTrack())} className="text-gray-400 hover:text-white active:scale-90 transition-transform rotate-180">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                    </button>
                    <button onClick={() => dispatch(togglePlay())} className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform">
                      {isPlaying ? (
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                      ) : (
                        <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </button>
                    <button onClick={() => dispatch(nextTrack())} className="text-gray-400 hover:text-white active:scale-90 transition-transform">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between w-full px-8 mt-1">
                    <button onClick={() => dispatch(toggleShuffle())} className={`flex flex-col items-center gap-1 transition-colors ${isShuffled ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg>
                      <span className="text-[7px] font-black uppercase tracking-widest">Shuffle</span>
                    </button>
                    <button onClick={() => dispatch(toggleRepeat())} className={`relative flex flex-col items-center gap-1 transition-colors ${repeatMode !== 'none' ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>
                      <span className="text-[7px] font-black uppercase tracking-widest">Repeat</span>
                      {repeatMode === 'one' && <span className="absolute -top-1 -right-2 text-[8px] bg-indigo-500 text-white w-3 h-3 rounded-full flex items-center justify-center font-bold">1</span>}
                    </button>
                    <div className="relative">
                      <button onClick={() => setShowActions(!showActions)} className={`flex flex-col items-center gap-1 transition-all ${showActions ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        <span className="text-[7px] font-black uppercase tracking-widest">More</span>
                      </button>
                      {showActions && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3"><ActionMenuOverlay /></div>}
                    </div>
                    <button onClick={() => dispatch(toggleMinimize())} className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                      <span className="text-[7px] font-black uppercase tracking-widest">Close</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-4 w-full mt-2">
                  <div className="space-y-3">
                    <div className="w-full flex items-center gap-3 px-2">
                      <span className="text-[9px] text-gray-500 tabular-nums w-7">{currentTime}</span>
                      <input type="range" min="0" max="100" value={progress} onInput={handleScrub} onMouseUp={handleSeekEnd} onTouchEnd={handleSeekEnd} className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white" />
                      <span className="text-[9px] text-gray-500 tabular-nums w-7 text-right">{duration}</span>
                    </div>
                    <div className="flex items-center gap-3 w-full px-4">
                      <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14" /></svg>
                      <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))} className="flex-1 h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500 flex items-center justify-between w-full h-full gap-3 md:gap-4 px-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-xl border border-white/10">
                  {isBuffering && <LoadingOverlay />}
                  <img src={currentTrack.cover_image_url} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 onClick={() => router.push(`/song/${currentTrack.id}`)} className="text-white font-bold text-xs md:text-sm truncate leading-tight tracking-tight cursor-pointer hover:text-indigo-400 transition-colors">{currentTrack.title}</h4>
                  <Link href={`/profile/${currentTrack.uploaded_by}`} className="text-[10px] md:text-xs text-gray-400 truncate mt-0.5 hover:text-white transition-colors cursor-pointer">{currentTrack.artist}</Link>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-auto leading-none">
                <div className="relative">
                  <button onClick={() => setShowActions(!showActions)} className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${showActions ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/10 text-gray-400 border-white/5 hover:bg-white/20'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                  </button>
                  {showActions && <ActionMenuOverlay />}
                </div>
                <button onClick={() => dispatch(togglePlay())} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
                  {isPlaying ? <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                </button>
                <button onClick={() => { dispatch(toggleMinimize()); setShowOptions(true) }} className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 border border-white/5 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
