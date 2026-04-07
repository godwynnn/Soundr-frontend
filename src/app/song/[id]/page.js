"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setTrack, togglePlay } from "@/store/playerSlice";
import HeartBurst from "@/components/HeartBurst";
import { useRouter } from "next/navigation";

export default function SongDetail({ params }) {
  const unwrappedParams = use(params);
  const songId = unwrappedParams.id;
  const router = useRouter();
  const dispatch = useDispatch();

  const { isAuthenticated, user, accessToken } = useSelector((state) => state.auth);
  const { currentTrack, isPlaying } = useSelector((state) => state.player);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [song, setSong] = useState(null);
  const [hypeCount, setHypeCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [supportStatus, setSupportStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [hypeStatus, setHypeStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [isSupporting, setIsSupporting] = useState(false);
  const [isHyping, setIsHyping] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/songs/${songId}/`, { headers })
      .then(res => {
        if (!res.ok) throw new Error("Backend offline");
        return res.json();
      })
      .then(data => {
        setSong(data);
        setHypeCount(data.hype_count || 0);
        setLiked(data.is_liked || false);
        setLikesCount(data.likes_count || 0);
        setIsFollowing(data.is_following_artist || false);
        setIsLoading(false);
      })
      .catch(err => {
        console.warn("Backend error:", err);
        setIsLoading(false);
      });
  }, [songId, accessToken]);

  const handlePlayToggle = () => {
    if (currentTrack?.id === song.id) {
      dispatch(togglePlay());
    } else {
      dispatch(setTrack(song));
    }
  };

  const requireAuth = (action) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    action();
  };

  const handleHype = () => requireAuth(async () => {
    try {
      setIsHyping(true);
      setHypeStatus(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/songs/${songId}/hype/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setHypeCount(data.hype_count);
        setHypeStatus({ type: 'success', message: data.message });
        // Clear success message after 3 seconds
        setTimeout(() => setHypeStatus(null), 3000);
      } else {
        setHypeStatus({ type: 'error', message: data.error || "Hype failed." });
      }
    } catch (err) {
      console.error("Hype failed:", err);
      setHypeStatus({ type: 'error', message: "An error occurred." });
    } finally {
      setIsHyping(false);
    }
  });

  const handleLike = () => requireAuth(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/songs/${songId}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikesCount(data.likes_count);
      }
    } catch (err) {
      console.error("Like failed:", err);
    }
  });

  const handleSupport = () => requireAuth(async () => {
    try {
      setIsSupporting(true);
      setSupportStatus(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/support-song/${songId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSupportStatus({ type: 'success', message: data.message });
        setShowHeartBurst(Date.now()); // Trigger animation
        // Clear success message after 3 seconds to keep UI clean for next clicks
        setTimeout(() => setSupportStatus(null), 3000);
      } else {
        setSupportStatus({ type: 'error', message: data.error || "Support failed." });
      }
    } catch (err) {
      console.error("Support error:", err);
      setSupportStatus({ type: 'error', message: "An error occurred." });
    } finally {
      setIsSupporting(false);
    }
  });

  const handleFollow = () => requireAuth(async () => {
    try {
      setIsFollowLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/artists/${song.uploaded_by}/follow/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.followed);
      }
    } catch (err) {
      console.error("Follow failed:", err);
    } finally {
      setIsFollowLoading(false);
    }
  });

  if (isLoading || !song) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-400 font-medium tracking-wider animate-pulse">Fetching Track Details...</span>
      </div>
    );
  }

  const isCurrentPlaying = currentTrack?.id === song.id && isPlaying;
  const isOwner = mounted && isAuthenticated && user?.id === song.uploaded_by;

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-10 mt-16 md:mt-0 pb-20">

      {/* 🎼 Hero Section (Song Cover + Info) */}
      <section className="flex flex-col md:flex-row items-center md:items-end gap-8 bg-gradient-to-t from-white/5 to-transparent p-6 md:p-8 rounded-3xl border border-white/5 shadow-2xl relative">
        <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl flex-shrink-0 bg-gray-800 shadow-2xl relative overflow-hidden group">
          <img src={song.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />

          {/* Play button overlaying on the bottom left */}
          <div className="absolute bottom-4 left-4 z-20">
            <button
              onClick={handlePlayToggle}
              className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              {isCurrentPlaying ? (
                <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-5 h-5 text-white ml-1 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2 w-full">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs font-bold tracking-widest uppercase text-white/70">Single</p>
            {mounted && isOwner && (
              <button
                onClick={() => router.push(`/creator/edit/${song.id}`)}
                className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded-full transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                EDIT TRACK
              </button>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            {song.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500" />
              <Link href={`/profile/${song.uploaded_by}`} className="font-bold border-b border-transparent hover:border-white transition-colors">{song.artist}</Link>
            </div>
            {!isOwner && (
              <button 
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all active:scale-95 flex items-center gap-2 ${
                  isFollowing 
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                  : 'bg-white text-black border-white hover:bg-gray-200'
                }`}
              >
                {isFollowLoading ? (
                  <div className={`w-3 h-3 border-2 rounded-full animate-spin ${isFollowing ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'}`}></div>
                ) : (
                  <>
                    {isFollowing ? (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
                    )}
                    {isFollowing ? "Following" : "Follow"}
                  </>
                )}
              </button>
            )}
            <span className="text-gray-400 text-sm font-medium ml-1">• {song.genre}</span>
          </div>

          <div className="flex items-center gap-4 mt-6 w-full justify-center md:justify-start">
            <button
              onClick={handlePlayToggle}
              className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform flex items-center gap-2"
            >
              {isCurrentPlaying ? "Pause" : "Play Now"}
            </button>

            {mounted && isAuthenticated && (
              <>
                <button
                  onClick={handleLike}
                  className={`h-12 px-5 rounded-full border border-white/20 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors ${liked ? 'bg-pink-500/20 border-pink-500/50' : ''}`}
                >
                  <svg className={`w-5 h-5 ${liked ? 'text-pink-500 fill-current' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  <span className={`text-sm font-bold ${liked ? 'text-pink-100' : 'text-white'}`}>{likesCount}</span>
                </button>
                <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {mounted && isAuthenticated && !isOwner && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 p-6 rounded-2xl flex flex-col gap-3 hover:border-indigo-400/50 transition-colors relative`}>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-pink-500">❤️</span> Support {song.artist}
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Use 1 Support Point to show your appreciation. 100% of value goes to the artist.
            </p>

            <div className="mt-2 flex flex-col gap-3">
              <button
                onClick={handleSupport}
                disabled={isSupporting}
                className="bg-white text-black px-6 py-2.5 rounded-full font-bold hover:scale-[1.02] active:scale-95 transition-all self-start disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 relative shadow-lg shadow-white/5"
              >
                {isSupporting ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : null}
                Send 1 Support Point
              </button>

              {supportStatus && (
                <div 
                  className={`p-2.5 rounded-xl text-[10px] font-bold flex items-center gap-2 animate-[fade_0.3s_ease-out] w-fit ${
                    supportStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {supportStatus.type === 'success' ? '✅' : '❌'} {supportStatus.message}
                </div>
              )}
            </div>

            {/* Floating Hearts Container */}
            <div className="absolute left-1/2 bottom-12 -translate-x-1/2 pointer-events-none">
              <HeartBurst trigger={showHeartBurst} />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col gap-3 items-start relative overflow-hidden group hover:bg-white/10 transition-colors">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-yellow-500">🚀</span> Hype This Track
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Push this track to the Trending charts!
            </p>

            {hypeStatus ? (
              <div className={`mt-2 p-3 rounded-xl text-[10px] font-bold flex items-center gap-2 animate-[fade_0.3s_ease-out] ${hypeStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {hypeStatus.type === 'success' ? '✅' : '❌'} {hypeStatus.message}
              </div>
            ) : (
              <button
                onClick={handleHype}
                disabled={isHyping}
                className="mt-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-full font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isHyping ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : "Hype it Up"}
                <span className="bg-black/50 px-2 py-0.5 rounded text-xs ml-2">{hypeCount}</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* 📜 Up Next / Track List */}
      <section className="w-full mt-6">
        <h2 className="text-2xl font-bold mb-4">Up Next</h2>
        <div className="flex flex-col">
          {song.up_next.map((track, i) => (
            <div
              key={track.id}
              onClick={() => router.push(`/song/${track.id}`)}
              className="flex items-center justify-between p-3 md:p-4 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-4">
                <img src={track.cover_image_url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white group-hover:text-pink-400 transition-colors">{track.title}</span>
                    {mounted && user?.id === track.uploaded_by && (
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-md">YOU</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{track.artist}</span>
                </div>
              </div>
              <span className="text-sm text-gray-500 font-medium">{track.duration || '3:45'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 💬 Comments Section */}
      <section className="w-full mt-8">
        <h2 className="text-2xl font-bold mb-6">Comments ({song.comments.length})</h2>
        <div className="flex flex-col gap-8">
          {song.comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white uppercase">{comment.avatar_text}</div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="font-bold text-[15px]">{comment.user}</span>
                  <span className="text-xs text-gray-500 font-medium">{comment.time_ago}</span>
                </div>
                <p className="text-[15px] text-gray-300 leading-relaxed">
                  {comment.text}
                </p>
                <div className="flex gap-5 mt-3">
                  <button className="text-xs font-semibold text-gray-500 hover:text-white transition-colors">Reply</button>
                  <button className="text-xs font-semibold text-gray-500 hover:text-white flex items-center gap-1.5 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg> {comment.likes}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
