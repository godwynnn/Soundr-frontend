"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setTrackWithQueue, togglePlay } from "@/store/playerSlice";

export default function ExplorePage() {
  const { type } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentTrack, isPlaying } = useSelector((state) => state.player);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoryTitle = type === 'trending' ? 'Trending Songs' : 
                   type === 'latest' ? 'Recently Added' : 
                   type === 'featured' ? 'Featured Selection' : 'Explore Music';

  const categorySub = type === 'trending' ? 'The most popular tracks across Soundr' : 
                 type === 'latest' ? 'Fresh sounds uploaded by our community' : 
                 type === 'featured' ? 'Hand-picked highlights just for you' : 'Discover something new';

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/songs/list/${type}/`)
      .then(res => res.json())
      .then(json => {
        setSongs(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [type]);

  const handlePlayAction = (e, track) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentTrack?.id === track.id) {
      dispatch(togglePlay());
    } else {
      // For this page, the entire list of songs becomes the queue
      dispatch(setTrackWithQueue({ track, queue: songs }));
    }
  };

  const getPlayIcon = (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      return <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
    }
    return <svg className="w-5 h-5 text-white fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
        <span className="text-gray-400 font-medium tracking-widest uppercase animate-pulse">Loading {type}...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-8 md:gap-12 mt-16 md:mt-0 animate-in fade-in duration-500 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
            <button 
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-2"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-sm uppercase">
              {categoryTitle}
            </h1>
            <p className="text-sm md:text-lg text-gray-400 font-medium max-w-xl">
              {categorySub}
            </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
           <div className="px-4 py-2 text-xs font-black uppercase tracking-widest text-indigo-400 border-r border-white/10">{songs.length} Tracks</div>
           <button 
             onClick={(e) => songs.length > 0 && handlePlayAction(e, songs[0])}
             className="px-6 py-2 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 shadow-xl active:scale-95"
           >
             <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
             Play All
           </button>
        </div>
      </div>

      {/* Grid Section */}
      {songs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 fallback-grid gap-4 md:gap-8">
          {songs.map((track) => (
            <div key={track.id} className="flex flex-col gap-3 group relative cursor-pointer" onClick={() => router.push(`/song/${track.id}`)}>
              <div
                className="w-full aspect-square rounded-3xl overflow-hidden bg-white/[0.03] border border-white/5 relative shadow-lg"
              >
                <img src={track.cover_image_url} alt={track.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] flex items-center justify-center">
                    <button
                      onClick={(e) => handlePlayAction(e, track)}
                      className="w-16 h-16 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-indigo-400 hover:scale-110 active:scale-95 z-30"
                    >
                      {getPlayIcon(track)}
                    </button>
                </div>

                {/* Number Badge (Optional for trending) */}
                {type === 'trending' && (
                  <div className="absolute top-4 left-4 w-9 h-9 bg-black/60 backdrop-blur-md rounded-2xl flex items-center justify-center text-sm font-black text-white border border-white/20 z-20">
                    {songs.indexOf(track) + 1}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col px-1">
                <span className="font-bold text-white text-[15px] md:text-lg leading-tight mb-1 truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                  {track.title}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-gray-500 font-medium truncate">{track.artist}</span>
                  {type === 'trending' && (
                    <span className="text-[10px] items-center gap-1 font-black text-indigo-500 flex opacity-0 group-hover:opacity-100 transition-opacity">
                      🔥 {track.total_play_count || 0}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 gap-4 bg-white/[0.02] rounded-[3rem] border border-white/5 border-dashed">
            <span className="text-5xl">🔭</span>
            <div className="text-center">
               <h3 className="text-white font-bold text-xl mb-1 uppercase tracking-tight">No tracks found</h3>
               <p className="text-gray-500 text-sm">We couldn&apos;t find any songs in this category yet.</p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all"
            >
              Back to Home
            </button>
        </div>
      )}

    </div>
  );
}
