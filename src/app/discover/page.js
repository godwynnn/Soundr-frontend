"use client";

import { useSelector } from "react-redux";
import { Swiper, SwiperSlide } from 'swiper/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";

import 'swiper/css';




export default function DiscoverPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('podcasts');
  const [liveStreams, setLiveStreams] = useState([]);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [podcasts, setPodcasts] = useState([]);
  const [loadingPodcasts, setLoadingPodcasts] = useState(false);

  useEffect(() => {
    // Initial fetch for podcasts
    setLoadingPodcasts(true);
    fetch('http://127.0.0.1:8000/api/listener/podcasts/')
      .then(res => res.json())
      .then(data => setPodcasts(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load podcasts:', err))
      .finally(() => setLoadingPodcasts(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'live') {
      setLoadingStreams(true);
      fetch('http://127.0.0.1:8000/api/creator/streams/')
        .then(res => res.json())
        .then(data => setLiveStreams(Array.isArray(data) ? data : []))
        .catch(err => console.error('Failed to load streams:', err))
        .finally(() => setLoadingStreams(false));
    }
  }, [activeTab]);

  const handleInteraction = (action) => {
    if (!isAuthenticated) {
      alert(`You must be logged in to ${action}. Redirecting to login...`);
      router.push('/login');
      return;
    }
    // TODO: implement logic
    console.log(`${action} triggered!`);
    alert(`${action} successful! (Mock Action)`);
  };

  const HeartIcon = () => (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const CommentIcon = () => (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );

  const SupportIcon = () => (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const HypeIcon = () => (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );

  const PlayIcon = () => (
    <svg className="w-6 h-6 ml-0.5 flex-shrink-0 fill-current" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );

  return (
    <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-10 mt-12 md:mt-0 pb-12">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">Discover</h1>
        <p className="text-gray-400 font-medium text-sm md:text-base max-w-2xl">
          Explore the latest podcasts, exclusive shows, and jump into vibrant live sessions from your favorite creators.
        </p>
      </div>

      {/* Segmented Control Toggle */}
      <div className="flex items-center justify-center -mt-2 mb-4">
        <div className="bg-[#13151a] border border-white/5 p-1.5 rounded-2xl flex items-center w-full max-w-[360px] shadow-inner relative">
          {/* Animated Background Pill */}
          <div
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-indigo-900 rounded-xl transition-transform duration-300 ease-out shadow-lg ${activeTab === 'podcasts' ? 'translate-x-0' : 'translate-x-full ml-3'
              }`}
          />

          <button
            onClick={() => setActiveTab('podcasts')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all relative z-10 ${activeTab === 'podcasts' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            <span className="text-xl">🎙️</span> Podcasts
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all relative z-10 ${activeTab === 'live' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            <span className="text-xl">🎥</span> Live
          </button>
        </div>
      </div>

      {/* Podcasts Section */}
      {activeTab === 'podcasts' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
          <section className="w-full">
            <div className="flex items-end justify-between mb-4 md:mb-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                  <span className="text-indigo-400">🎙️</span> Listen to Podcasts
                </h2>
              </div>
            </div>

            <div className="-mx-2 px-2">
              {loadingPodcasts ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : podcasts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 md:py-16 text-center gap-4 bg-white/5 rounded-[2rem] border border-white/5 mx-2">
                   <div className="size-16 bg-white/5 rounded-full flex items-center justify-center">
                    <span className="text-3xl text-gray-400">🎙️</span>
                   </div>
                   <div className="flex flex-col gap-1">
                    <p className="text-gray-300 font-semibold">No podcasts yet</p>
                    <p className="text-gray-500 text-sm">Be the first to share your voice with the world.</p>
                   </div>
                </div>
              ) : (
                <Swiper
                  spaceBetween={16}
                  slidesPerView="auto"
                  grabCursor={true}
                  breakpoints={{
                    768: { spaceBetween: 24 }
                  }}
                  className="w-full !pb-6"
                >
                  {podcasts.map((podcast) => (
                    <SwiperSlide key={podcast.id} className="!w-auto">
                      <div className="flex flex-col gap-3 w-[220px] md:w-[260px] group">
                        <div 
                          className="w-full aspect-square relative rounded-3xl overflow-hidden shadow-2xl bg-white/5 border border-white/5 cursor-pointer"
                          onClick={() => router.push(`/discover/podcast/${podcast.id}`)}
                        >
                          <img
                            src={podcast.cover_image_url || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop&q=60"}
                            alt={podcast.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Dark gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Play button centered - now goes to detail page */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/discover/podcast/${podcast.id}`);
                            }}
                            className="absolute inset-0 m-auto w-14 h-14 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] md:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 md:translate-y-4 group-hover:translate-y-0"
                          >
                            <PlayIcon />
                          </button>

                          {/* Interaction buttons bottom overlay */}
                          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center md:opacity-0 group-hover:opacity-100 transition-all duration-300 md:translate-y-2 group-hover:translate-y-0">
                            <div className="flex gap-2">
                              <button onClick={(e) => { e.stopPropagation(); handleInteraction('Like'); }} className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors border border-white/10 shadow-lg" title="Like">
                                <HeartIcon />
                              </button>
                              <button onClick={() => handleInteraction('Comment')} className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors border border-white/10 shadow-lg" title="Comment">
                                <CommentIcon />
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleInteraction('Support')} className="p-2 bg-white/10 hover:bg-green-500/50 backdrop-blur-md rounded-full text-white transition-colors border border-white/10 shadow-lg" title="Support">
                                <SupportIcon />
                              </button>
                              <button onClick={() => handleInteraction('Hype')} className="p-2 bg-white/10 hover:bg-pink-500/50 backdrop-blur-md rounded-full text-white transition-colors border border-white/10 shadow-lg" title="Hype">
                                <HypeIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col px-1">
                          <span className="font-bold text-white text-base leading-tight mb-1 truncate hover:underline cursor-pointer decoration-white/30">
                            {podcast.title}
                          </span>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400 font-medium truncate">By {podcast.creator}</span>
                            <span className="text-xs font-semibold text-gray-500">{podcast.total_play_count} Plays • {podcast.category}</span>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Live Sessions Section */}
      {activeTab === 'live' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
          <section className="w-full">
            <div className="flex items-end justify-between mb-4 md:mb-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                  <span className="text-red-500">🎥</span> Join Live
                </h2>
                <p className="text-xs md:text-sm text-gray-400 font-medium ml-10">Real-time sessions happening now</p>
              </div>
            </div>

            {loadingStreams ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : liveStreams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="size-20 bg-white/5 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-400 font-medium text-sm">No one is live right now.</p>
                <p className="text-gray-600 text-xs">Check back later or follow your favorite creators to get notified.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveStreams.map((stream) => (
                  <div key={stream.id} className="relative w-full h-[240px] rounded-[2rem] overflow-hidden group cursor-pointer border border-white/10 shadow-xl bg-black">
                    {/* Abstract gradient background since streams have no cover image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-950/60 via-indigo-950/40 to-black opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-red-500 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 flex flex-col gap-4 z-10 rounded-b-[2rem] bg-gradient-to-t from-[#0e0f11] via-[#0e0f11]/80 to-transparent pb-4 md:pb-5">
                      <div className="flex flex-col">
                        <h3 className="text-xl md:text-2xl text-white font-bold leading-tight drop-shadow-md mb-1">{stream.title}</h3>
                        <p className="text-sm text-gray-300 font-medium">Host: {stream.host_username}</p>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              alert('You must be logged in to join a live session. Redirecting...');
                              router.push('/login');
                              return;
                            }
                            router.push(`/discover/live/${stream.room_name}`);
                          }}
                          className="bg-white text-black px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[13px] md:text-sm font-bold shadow-lg hover:scale-105 transition-transform active:scale-95"
                        >
                          Join Session
                        </button>

                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleInteraction('Like'); }} className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors border border-white/5 shadow-lg" title="Like">
                            <HeartIcon />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleInteraction('Hype'); }} className="p-2 bg-white/10 hover:bg-pink-500/50 backdrop-blur-md rounded-full text-white transition-colors border border-white/5 shadow-lg" title="Hype">
                            <HypeIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

    </div>
  );
}
