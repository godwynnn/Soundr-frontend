"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";

export default function PodcastDetailPage() {
  const router = useRouter();
  const params = useParams();
  const podcastId = params.id;
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [podcast, setPodcast] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchPodcast = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/podcasts/${podcastId}/`);
        if (res.ok) {
          const data = await res.json();
          setPodcast(data.podcast);
          setComments(data.comments);
        } else {
          setError("Podcast not found.");
        }
      } catch (e) {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    };
    fetchPodcast();
  }, [podcastId]);

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert("Please login to like this podcast.");
      return;
    }
    setIsLiking(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/podcasts/${podcastId}/like/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPodcast(prev => ({
          ...prev,
          is_liked: data.liked,
          likes_count: data.likes_count
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please login to comment.");
      return;
    }
    if (!newComment.trim()) return;

    try {
      const accessToken = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/podcasts/${podcastId}/comment/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: newComment })
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [data, ...prev]);
        setNewComment("");
        setPodcast(prev => ({
          ...prev,
          comments_count: prev.comments_count + 1
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !podcast) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-bold text-white">{error || "Podcast not found"}</h2>
      <button onClick={() => router.push('/discover')} className="px-6 py-2 bg-indigo-600 text-white rounded-full">Back to Discover</button>
    </div>
  );

  return (
    <div className="max-w-[1000px] mx-auto w-full flex flex-col gap-8 mt-6 pb-20 animate-in fade-in duration-700">

      {/* Hero Section with Player */}
      <div className="relative w-full rounded-[2.5rem] overflow-hidden border border-white/10 bg-[#0e0f11] shadow-2xl">
        {/* Visual Background */}
        <div className="absolute inset-0 opacity-20 blur-3xl scale-125 pointer-events-none">
          <img src={podcast.cover_image_url} className="w-full h-full object-cover" alt="" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 p-8 md:p-12 items-center md:items-end">
          {/* Cover Art */}
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10 ring-8 ring-white/5">
            <img src={podcast.cover_image_url} alt={podcast.title} className="w-full h-full object-cover" />
          </div>

          {/* Info & Player Controls */}
          <div className="flex-1 flex flex-col gap-6 w-full text-center md:text-left">
            <div className="flex flex-col gap-2">
              <span className="text-indigo-400 font-bold uppercase tracking-widest text-xs">{podcast.category}</span>
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg">{podcast.title}</h1>
              <p className="text-gray-400 font-medium">By <span className="text-white">{podcast.creator}</span> • {podcast.total_play_count} Plays</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Playback Progress */}
              <div className="w-full group/progress cursor-pointer">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-start gap-8">
                <button
                  onClick={handleTogglePlay}
                  className="w-16 h-16 md:w-20 md:h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  {isPlaying ? (
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                  ) : (
                    <svg className="w-8 h-8 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>

                <div className="flex gap-4">
                  <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${podcast.is_liked
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                  >
                    <svg className={`w-6 h-6 ${podcast.is_liked ? 'fill-current' : 'none'}`} stroke="currentColor" fill={podcast.is_liked ? "currentColor" : "none"} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="font-bold">{podcast.likes_count}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={podcast.audio_file_url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      </div>

      {/* Content & Social Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Description & Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[#13151a] border border-white/5 rounded-[2rem] p-8 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-white tracking-tight">About this Episode</h3>
            <p className="text-gray-400 leading-relaxed">
              {podcast.description || "The creator hasn't provided a description for this podcast yet. Tune in and enjoy the vibes!"}
            </p>
          </div>

          {/* Comments Section */}
          <div className="bg-[#13151a] border border-white/5 rounded-[2rem] p-8 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white tracking-tight">Comments ({podcast.comments_count})</h3>
            </div>

            {/* Post Comment */}
            {isAuthenticated ? (
              <form onSubmit={handleComment} className="flex flex-col gap-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none h-24"
                />
                <div className="flex justify-end">
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all">
                    Post Comment
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center">
                <p className="text-gray-500 text-sm">Please <span className="text-indigo-400 cursor-pointer hover:underline" onClick={() => router.push('/login')}>login</span> to join the conversation.</p>
              </div>
            )}

            {/* Comments List */}
            <div className="flex flex-col gap-6">
              {comments.length > 0 ? comments.map(comment => (
                <div key={comment.id} className="flex gap-4">
                  <div className="size-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-xs shrink-0">
                    {comment.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{comment.username}</span>
                      <span className="text-[10px] text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm">No comments yet. Start the discussion!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / More Info */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#13151a] border border-white/5 rounded-[2rem] p-6 flex flex-col gap-4">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Podcast Metadata</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Duration</span>
                <span className="text-xs text-white font-medium">{podcast.duration || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Uploaded</span>
                <span className="text-xs text-white font-medium">{new Date(podcast.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Status</span>
                <span className="text-indigo-400 font-bold text-[10px] uppercase">Public</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
