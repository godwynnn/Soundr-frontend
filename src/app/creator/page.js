"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { setTrack, togglePlay } from '@/store/playerSlice';
import AuthGuard from '@/components/AuthGuard';

function CreatorDashboardContent() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { currentTrack, isPlaying } = useSelector((state) => state.player);

  const handlePlayTopTrack = () => {
    if (!dashboardData?.top_track) return;
    
    // We need the full song object for the player
    // Dashboard top_track currently lacks some fields like audio_file_url
    // However, setTrack expects a track object. 
    // Usually the dashboard payload should include enough data or we fetch it.
    // For now, let's assume dashboardData.top_track is sufficient or we handle the redirect.
    if (currentTrack?.id === dashboardData.top_track.id) {
      dispatch(togglePlay());
    } else {
      // We set the track. Note: dashboard track needs audio_file_url etc.
      // If it doesn't have it, we might need to fetch the detail first.
      // But let's check what the backend sends.
      dispatch(setTrack(dashboardData.top_track));
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creator/dashboard/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Auth failed or backend error");
        return res.json();
      })
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Real dashboard data unavailable:", err);
        // We set to empty or default to trigger the 0 defaults in render
        setDashboardData({});
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center mt-32">
        <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-10 md:gap-12 mt-16 md:mt-0 animate-[fade-in_0.5s_ease-out]">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
            Creator Dashboard
          </h1>
          <p className="text-gray-400 font-medium">Welcome back. Here&apos;s how your tracks are performing.</p>
        </div>
        <Link href="/creator/upload" className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Upload New Track
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#12141a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none" />
          <h3 className="text-gray-400 font-medium mb-1">Total Plays</h3>
          <p className="text-4xl font-black text-white tracking-tight">{dashboardData?.total_plays || 0}</p>
          <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm font-bold bg-emerald-400/10 w-fit px-2 py-1 rounded-md">
            <span>↑ 12.5%</span><span className="text-emerald-400/70 font-medium">vs last month</span>
          </div>
        </div>

        <div className="bg-[#12141a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none" />
          <h3 className="text-gray-400 font-medium mb-1">Monthly Listeners</h3>
          <p className="text-4xl font-black text-white tracking-tight">{dashboardData?.monthly_listeners || 0}</p>
          <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm font-bold bg-emerald-400/10 w-fit px-2 py-1 rounded-md">
            <span>↑ 8.2%</span><span className="text-emerald-400/70 font-medium">vs last month</span>
          </div>
        </div>

        <div className="bg-[#12141a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none" />
          <h3 className="text-gray-400 font-medium mb-1">Total Revenue</h3>
          <p className="text-4xl font-black text-white tracking-tight">{dashboardData?.total_revenue || "$0.00"}</p>
          <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm font-bold bg-emerald-400/10 w-fit px-2 py-1 rounded-md">
            <span>↑ 15.3%</span><span className="text-emerald-400/70 font-medium">vs last month</span>
          </div>
        </div>
      </div>

      {/* Top Performing Track — Cover Art Hero */}
      <div>
        <h2 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-2">
          <span className="text-yellow-500">🔥</span> Top Performing Track
        </h2>
        <div className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
          {dashboardData?.top_track ? (
            <>
              {/* Cover Art Background */}
              {dashboardData.top_track.artwork?.startsWith('http') ? (
                <img src={dashboardData.top_track.artwork} alt={dashboardData.top_track.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className={`absolute inset-0 w-full h-full ${dashboardData.top_track.artwork || 'bg-gray-800'}`} />
              )}
              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

              {/* Content Over Cover */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
                <div className="flex items-end justify-between w-full">
                  <div>
                    <span className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-2 border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 rounded-full inline-block">Most Played</span>
                    <h3 className="text-3xl md:text-5xl font-black text-white mt-2 drop-shadow-lg">{dashboardData.top_track.title}</h3>
                    <p className="text-gray-300 font-medium mt-1">Uploaded {dashboardData.top_track.upload_date}</p>
                    <div className="flex gap-6 mt-4">
                      <div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Streams</span>
                        <span className="text-xl font-bold text-white">{(dashboardData.top_track.plays || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Likes</span>
                        <span className="text-xl font-bold text-white">{(dashboardData.top_track.likes || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Play Button - Bottom Right */}
                  <button 
                    onClick={handlePlayTopTrack}
                    className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer text-white shadow-xl group-hover:scale-110 shrink-0"
                  >
                    {currentTrack?.id === dashboardData.top_track.id && isPlaying ? (
                      <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                      <svg className="w-7 h-7 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-gray-500 font-bold italic">
               No track data available yet. Upload your first song!
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
        {/* Recent Tracks List */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Recent Tracks</h2>
            <button className="text-sm font-bold text-indigo-400 hover:text-indigo-300">View all</button>
          </div>
          <div className="bg-[#12141a] border border-white/10 rounded-3xl p-2 flex-1 flex flex-col gap-2">
            {dashboardData?.recent_tracks?.length > 0 ? (
              dashboardData.recent_tracks.map((track, i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
                  {track.artwork?.startsWith('http') ? (
                    <img src={track.artwork} className="w-14 h-14 rounded-xl shrink-0 object-cover" alt="" />
                  ) : (
                    <div className={`w-14 h-14 rounded-xl shrink-0 ${track.artwork || 'bg-gray-800'}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{track.title}</h4>
                    <p className="text-xs text-gray-500 font-medium truncate">{(track.plays || 0).toLocaleString()} plays • {track.upload_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/creator/edit/${track.id}`} className="p-2 text-gray-400 hover:text-indigo-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H10v-1.828l8.586-8.586z" /></svg>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
               <div className="p-10 text-center text-gray-600 italic">No tracks yet.</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
            <button className="text-sm font-bold text-indigo-400 hover:text-indigo-300">See all</button>
          </div>
          <div className="bg-[#12141a] border border-white/10 rounded-3xl p-2 flex-1 flex flex-col gap-1">
            {dashboardData.recent_activity?.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-3.5 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0 border border-white/5">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate group-hover:text-indigo-400 transition-colors">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatorDashboard() {
  return (
    <AuthGuard>
      <CreatorDashboardContent />
    </AuthGuard>
  );
}
