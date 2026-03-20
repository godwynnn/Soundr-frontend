"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { setTrack, togglePlay } from '@/store/playerSlice';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const dispatch = useDispatch();
  const router = useRouter();
  const { currentTrack, isPlaying } = useSelector((state) => state.player);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/search/?q=${query}`)
        .then(res => res.json())
        .then(data => {
          setResults(data);
          setIsSearching(false);
        })
        .catch(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handlePlayClick = (e, track) => {
    e.stopPropagation();
    if (currentTrack?.id === track.id) {
      dispatch(togglePlay());
    } else {
      dispatch(setTrack(track));
    }
  };

  const handleNavigate = (trackId) => {
    router.push(`/song/${trackId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="w-full max-w-2xl bg-[#0f1115] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-5 flex items-center gap-4 bg-white/[0.02] border-b border-white/10">
          <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            autoFocus
            type="text" 
            placeholder="Search songs, artists, genres..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white text-xl font-medium placeholder-gray-600"
          />
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Results Body */}
        <div className="min-h-[100px] max-h-[65vh] overflow-y-auto custom-scrollbar p-2">
          {isSearching ? (
             <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-400 text-sm font-bold tracking-widest uppercase animate-pulse">Searching Universe...</span>
             </div>
          ) : results.length > 0 ? (
             <div className="flex flex-col gap-1 p-2">
                {results.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isPlayingIcon = isCurrent && isPlaying;
                  
                  return (
                    <div 
                      key={track.id}
                      onClick={() => handleNavigate(track.id)}
                      className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-xl relative">
                           <img src={track.cover_image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                           <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                        <div className="flex flex-col min-w-0">
                           <span className="font-bold text-white truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight text-[15px]">{track.title}</span>
                           <span className="text-sm text-gray-400 truncate mt-0.5">{track.artist} • <span className="opacity-60">{track.genre}</span></span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => handlePlayClick(e, track)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${isCurrent ? 'bg-white text-black scale-105' : 'bg-white/5 text-white hover:bg-white/20 hover:scale-105 active:scale-95'}`}
                      >
                         {isPlayingIcon ? (
                           <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                         ) : (
                           <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                         )}
                      </button>
                    </div>
                  );
                })}
             </div>
          ) : query.length >= 2 ? (
             <div className="py-20 text-center flex flex-col items-center gap-2">
                <span className="text-3xl">🏜️</span>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-2">No matches found for &quot;{query}&quot;</p>
                <button onClick={() => setQuery('')} className="mt-4 text-indigo-400 text-sm font-bold hover:underline">Clear Search</button>
             </div>
          ) : (
             <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-2xl border border-white/5">🔭</div>
                <div className="flex flex-col gap-1">
                   <h4 className="text-white font-bold leading-none">Global Discovery</h4>
                   <p className="text-gray-500 text-sm mt-2">Enter a song title, artist name, or genre to start exploring.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-xs">
                   {['Afrobeats', 'Trending', 'New Hits', 'Hip Hop'].map(tag => (
                     <button key={tag} onClick={() => setQuery(tag)} className="text-xs font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all">{tag}</button>
                   ))}
                </div>
             </div>
          )}
        </div>

        {/* Search Footer */}
        <div className="p-3 bg-white/[0.02] border-t border-white/10 flex justify-center">
            <div className="flex items-center gap-6 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-600">
               <div className="flex items-center gap-2 underline decoration-gray-700 underline-offset-4 cursor-default"><span className="text-gray-400">ESC</span> Close</div>
               <div className="flex items-center gap-2 underline decoration-gray-700 underline-offset-4 cursor-default"><span className="text-gray-400">ENTER</span> Select</div>
            </div>
        </div>
      </div>
      {/* Background overlay click to close */}
      <div className="absolute inset-0 z-[-1]" onClick={onClose} />
    </div>
  );
}
