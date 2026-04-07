"use client";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";
import EditProfileModal from "@/components/EditProfileModal";

export default function ProfilePage() {
  const { user, accessToken } = useSelector((state) => state.auth);
  const [walletData, setWalletData] = useState(null);
  const [libraryData, setLibraryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = accessToken || localStorage.getItem("access_token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        // Fetch Wallet Data
        const walletRes = await fetch(`${API_URL}/api/payment/wallet/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (walletRes.ok) {
          const wData = await walletRes.json();
          setWalletData(wData);
        }

        // Fetch Library Data
        const libraryRes = await fetch(`${API_URL}/api/listener/library/all/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (libraryRes.ok) {
          const lData = await libraryRes.json();
          setLibraryData(lData);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">

        {/* 🏆 Profile Header */}
        <section className="relative mb-12 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 blur-3xl opacity-50 rounded-[3rem] pointer-events-none" />
          <div className="relative bg-[#0a0b0d] border border-white/10 rounded-[3rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />

            {/* Avatar */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-gradient-to-tr from-gray-800 to-gray-900 border-2 border-white/10 flex items-center justify-center text-5xl md:text-6xl font-black text-white shadow-2xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                user?.username?.charAt(0).toUpperCase() || 'U'
              )}
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-indigo-500/10 to-transparent pointer-events-none" />
            </div>

            {/* Basic Info */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2 flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{user?.display_name || user?.username}</h1>
                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  {user?.is_creator ? "Verified Creator" : "Pro Listener"}
                </span>
              </div>
              <p className="text-gray-400 font-medium px-1">{user?.bio || user?.email}</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-8 py-3 bg-white text-black font-black rounded-2xl hover:bg-gray-200 active:scale-95 transition-all shadow-xl shadow-white/5"
                >
                  Edit Profile
                </button>
                <Link href="/library" className="px-8 py-3 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 active:scale-95 transition-all">
                  View Library
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 📊 Metrics Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Wallet & Points Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0a0b0d] border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Balance</p>
                <h2 className="text-3xl font-black text-white tracking-tighter">₦{walletData?.balance?.toLocaleString() || '0.00'}</h2>
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Ready to spend</span>
                </div>
              </div>
              <div className="bg-[#0a0b0d] border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Support Points</p>
                <h2 className="text-3xl font-black text-white tracking-tighter">{walletData?.support_points?.toLocaleString() || '0'}</h2>
                <p className="text-[10px] font-bold text-indigo-400 mt-4 uppercase tracking-tighter">Loyalty Points</p>
              </div>
              <div className="bg-[#0a0b0d] border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-pink-500/30 transition-all shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Hype Points</p>
                <h2 className="text-3xl font-black text-white tracking-tighter">{walletData?.hype_points?.toLocaleString() || '0'}</h2>
                <p className="text-[10px] font-bold text-pink-400 mt-4 uppercase tracking-tighter">Promotion Power</p>
              </div>
            </div>

            {/* Experience & Activity */}
            <div className="bg-[#0a0b0d] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xl font-black text-white mb-8 tracking-tight flex items-center gap-3">
                <span className="text-indigo-500">⚡</span> Activity Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-white">{libraryData?.liked_songs?.length || '0'}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Liked Songs</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-white">{libraryData?.playlists?.length || '0'}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Playlists</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-white">{libraryData?.followed_artists?.length || '0'}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Artists Following</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-white">{user?.followers_count || '0'}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Followers</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-white">0</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Minutes Streamed</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/creator/earnings" className="p-8 rounded-[2rem] bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all group flex flex-col justify-between h-48">
                <div>
                  <h4 className="text-xl font-black text-white mb-2">Earnings Dashboard</h4>
                  <p className="text-xs text-gray-400 font-medium">Manage your payouts and points conversion.</p>
                </div>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                  Go to Earnings <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
              </Link>
              {/* <Link href="/discover" className="p-8 rounded-[2rem] bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 transition-all group flex flex-col justify-between h-48">
                  <div>
                    <h4 className="text-xl font-black text-white mb-2">Discover New Hits</h4>
                    <p className="text-xs text-gray-400 font-medium">Explore the latest releases on Soundr.</p>
                  </div>
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                    Explore Now <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </div>
               </Link> */}
            </div>
          </div>

          {/* ⚙️ Sidebar settings column */}
          <div className="space-y-8">
            <div className="bg-[#0a0b0d] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-8">Account Details</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-gray-600 mb-1 uppercase tracking-tighter">Status</p>
                  <p className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active Member
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-600 mb-1 uppercase tracking-tighter">Joined On</p>
                  <p className="text-sm font-bold text-white">August 24, 2024</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-600 mb-1 uppercase tracking-tighter">Currency</p>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">NGN (Nigerian Naira)</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/20 blur-3xl -ml-16 -mt-16 rounded-full" />
              <div className="relative z-10">
                <h4 className="text-xl font-black text-white mb-4">Go Premium</h4>
                <p className="text-xs text-gray-400 font-medium leading-relaxed mb-8">
                  Unlock exclusive artist features, higher payout rates, and unlimited streaming quality.
                </p>
                <button className="w-full py-4 bg-white text-black font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </div>

        <EditProfileModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      </div>
    </AuthGuard>
  );
}
