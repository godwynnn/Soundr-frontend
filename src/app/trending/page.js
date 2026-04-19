"use client";
import { useState, useEffect } from 'react';
import { Play, Zap, Heart, PlusCircle, ChevronRight, TrendingUp } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setTrackWithQueue } from '@/store/playerSlice';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

function TrendingPage() {
  const router = useRouter();
  const [topSongs, setTopSongs] = useState([]);
  const [activeGenre, setActiveGenre] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  const fetchTrending = async (genre) => {
    setIsLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/listener/trending-hype/${genre !== 'All' ? `?genre=${genre}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setTopSongs(data);
    } catch (error) {
      console.error("Error fetching trending:", error);
      toast.error("Failed to load trending chart");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending(activeGenre);
  }, [activeGenre]);

  const handleSongPlay = (song) => {
    dispatch(setTrackWithQueue({
      track: song,
      queue: topSongs
    }));
  };

  const handleTitleClick = (e, songId) => {
    e.stopPropagation();
    router.push(`/song/${songId}`);
  };

  const handleArtistClick = (e, artistId) => {
    e.stopPropagation();
    if (artistId) {
      router.push(`/profile/${artistId}`);
    }
  };

  const handleHype = async (songId) => {
    if (!isAuthenticated) {
      toast.error("Please login to hype tracks!");
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/songs/${songId}/hype/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchTrending(activeGenre);
      } else {
        toast.error(data.error || "Hype failed");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleLike = async (songId) => {
    if (!isAuthenticated) {
      toast.error("Please login to like tracks!");
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/songs/${songId}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.liked ? "Added to library" : "Removed from library");
      }
    } catch (error) {
      toast.error("Error liking song");
    }
  };

  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  const getImageForSong = (song, index) => {
    if (song.cover_image) return song.cover_image;
    // Fallback images if backend has none
    const fallbacks = [
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop', // Purple abstract
      'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop', // DJ
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', // Concert
      'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=400&h=400&fit=crop', // Microphone
      'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=400&h=400&fit=crop', // Night club
    ];
    return fallbacks[index % fallbacks.length];
  };

  return (
    <main className="min-h-screen bg-[#0a0b0d] text-white pt-20 md:pt-24 pb-32 px-2 sm:px-4 md:px-8 lg:px-12 font-inter">
      {/* Hero Section for Rank #1 */}
      {topSongs.length > 0 && activeGenre === 'All' && (
        <div className="relative w-full h-[300px] md:h-[400px] mb-8 md:mb-12 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group cursor-pointer" onClick={() => handleSongPlay(topSongs[0])}>
          <img
            src={getImageForSong(topSongs[0], 0)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt="Billboard top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0d] via-[#0a0b0d]/60 to-transparent" />

          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 flex flex-col items-start gap-2 md:gap-4 right-6 md:right-10">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="px-3 py-1 md:px-4 md:py-1.5 bg-purple-600 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Billboard Top 100</span>
              <span className="text-gray-400 font-bold text-xs md:text-sm whitespace-nowrap hidden sm:inline">#1 Trending Globally</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight line-clamp-1 w-full">
              {topSongs[0].title}
            </h2>
            <p className="text-sm sm:text-base md:text-xl font-medium text-gray-300">{topSongs[0].artist}</p>
            <div className="flex items-center gap-3 md:gap-4 mt-2">
              <button className="px-6 py-2.5 md:px-8 md:py-3 bg-white text-black rounded-full font-black text-xs md:text-sm uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all flex items-center gap-2">
                <Play className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" /> Play Now
              </button>
              <div className="flex items-center gap-1.5 md:gap-2">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-purple-500 fill-current" />
                <span className="text-sm md:text-lg font-black tabular-nums">{formatCount(topSongs[0].hype_count)} <span className="hidden sm:inline">Hypes</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Genre Tabs */}
      <div className="flex gap-2 md:gap-3 mb-8 md:mb-10 overflow-x-auto pb-4 no-scrollbar">
        {['All', 'Afrobeats', 'HipHop', 'RnB', 'Gospel', 'Pop', 'Electronic', 'Rock', 'Jazz'].map((genre) => (
          <button
            key={genre}
            onClick={() => setActiveGenre(genre)}
            className={`px-5 py-2 md:px-6 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold transition-all border shrink-0 ${activeGenre === genre
              ? 'bg-purple-600 border-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]'
              : 'bg-[#121212] border-white/5 text-gray-500 hover:border-white/20'
              }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-[#121212]/40 backdrop-blur-md rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-8 py-4 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-1 text-center">RK</div>
          <div className="col-span-6">Track Info</div>
          <div className="col-span-2">Peak Pos</div>
          <div className="col-span-2 text-left">Hype</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-white/5">
          {topSongs.length > 0 ? (
            topSongs.map((song, index) => (
              <div
                key={song.id}
                onClick={() => handleSongPlay(song)}
                className="flex items-center md:grid md:grid-cols-12 gap-3 md:gap-0 px-4 py-4 md:px-8 md:py-7 hover:bg-white/[0.03] transition-all cursor-pointer group"
              >
                <div className="w-6 md:w-auto md:col-span-1 text-center shrink-0">
                  <span className={`text-lg md:text-xl font-bold ${index === 0 ? 'text-purple-500' :
                    index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-orange-400' :
                        'text-gray-600'
                    }`}>
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 md:col-span-6 flex items-center gap-3 md:gap-6 min-w-0">
                  <div className="relative w-12 h-12 md:w-20 md:h-20 flex-shrink-0">
                    <img
                      src={getImageForSong(song, index)}
                      className="w-full h-full object-cover rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl group-hover:scale-105 transition-transform duration-500"
                      alt=""
                    />
                    <div className="absolute inset-0 bg-purple-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl md:rounded-2xl transition-all">
                      <Play className="w-5 h-5 md:w-8 md:h-8 text-white fill-current" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5 md:gap-1 pr-2 min-w-0">
                    <h3 
                      onClick={(e) => handleTitleClick(e, song.id)}
                      className="text-sm md:text-base font-semibold line-clamp-1 group-hover:text-purple-400 transition-colors hover:underline cursor-pointer"
                    >
                      {song.title.length > 25 ? song.title.substring(0, 25) + '...' : song.title}
                    </h3>
                    <p 
                      onClick={(e) => handleArtistClick(e, song.uploaded_by)}
                      className="text-[10px] md:text-sm font-medium text-gray-400 hover:text-purple-400 transition-colors hover:underline cursor-pointer truncate"
                    >
                      {song.artist}
                    </p>
                    <div className="md:hidden flex items-center gap-1 mt-0.5">
                      <Zap className="w-3 h-3 text-purple-500 fill-current" />
                      <span className="text-[10px] font-semibold text-purple-400 tabular-nums">{formatCount(song.hype_count)}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex md:col-span-2 flex-col justify-center">
                  <span className="text-sm text-gray-300 font-medium">#{index + 1}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] text-emerald-500 font-medium">
                      {index === 0 ? 'Peak Reached' : 'Climbing'}
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex md:col-span-2 text-left items-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/10 border border-purple-500/20 rounded-lg group-hover:bg-purple-600/20 group-hover:border-purple-500/40 transition-all">
                    <Zap className="w-3.5 h-3.5 text-purple-500 fill-current" />
                    <span className="text-xs font-semibold text-purple-400 tabular-nums">{formatCount(song.hype_count)}</span>
                  </div>
                </div>

                <div className="md:col-span-1 flex justify-end shrink-0 ml-auto md:ml-0 gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleHype(song.id); }}
                    className="p-2.5 md:p-3 bg-white/5 hover:bg-purple-600 rounded-[10px] md:rounded-2xl text-gray-500 hover:text-white transition-all active:scale-90"
                  >
                    <Zap className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              {isLoading ? (
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-gray-500 uppercase font-black tracking-widest">No Tracks Available</span>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default TrendingPage;
