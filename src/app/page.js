"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import { setTrackWithQueue, togglePlay } from "@/store/playerSlice";

import 'swiper/css';
import 'swiper/css/effect-fade';

export default function Home() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { currentTrack, isPlaying } = useSelector((state) => state.player);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [data, setData] = useState({ featured: [], trending: [], latest: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/landing/`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePlayAction = (e, track, sectionData = []) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentTrack?.id === track.id) {
      dispatch(togglePlay());
    } else {
      const queue = sectionData.length > 0 ? sectionData : [track];
      dispatch(setTrackWithQueue({ track, queue }));
    }
  };

  const handleNavigate = (e, id) => {
    e.preventDefault();
    router.push(`/song/${id}`);
  };

  const handleEdit = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/creator/edit/${id}`);
  };

  const getPlayIcon = (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      return <svg className="w-6 h-6 text-white ml-0.5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
    }
    return <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white ml-0.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-400 font-medium tracking-wider animate-pulse">Loading the vibes...</span>
      </div>
    );
  }

  const featured = data.featured || [];
  const trending = data.trending || [];
  const latest = data.latest || [];

  return (
    <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-6 md:gap-8 mt-12 md:mt-0">

      {/* 🟢 Top Header (Login Button) */}
      {!isAuthenticated && (
        <div className="flex justify-end items-center -mb-2">
          <Link
            href="/login"
            className="group relative px-8 py-2.5 rounded-full font-black text-xs md:text-sm uppercase tracking-widest text-white border border-white/10 bg-white/5 overflow-hidden transition-all hover:bg-white/10 hover:border-white/30 hover:scale-105 active:scale-95 shadow-xl"
          >
            <span className="relative z-10">Login</span>
          </Link>
        </div>
      )}

      {/* 🚀 New Refined Trending Ticker */}
      <section className="w-full h-12 relative flex items-center bg-black/40 border-y border-white/5 overflow-hidden group">
        {/* Fixed Badge */}
        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center px-6 bg-gradient-to-r from-black via-black/90 to-transparent pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-white">Trending</span>
          </div>
        </div>

        {/* Scrolling Content */}
        <div className="flex items-center gap-12 animate-[marquee_25s_linear_infinite] pl-[120px] md:pl-[150px]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-12 items-center flex-nowrap">
              {trending.map((t, idx) => (
                <div key={`${t.id}-${idx}`} className="flex items-center gap-4 whitespace-nowrap">
                  <span className="text-white font-bold text-sm md:text-base tracking-tight hover:text-indigo-400 transition-colors cursor-pointer capitalize">
                    {t.title}
                  </span>
                  <span className="text-gray-500 text-xs">—</span>
                  <span className="text-gray-400 font-medium text-xs md:text-sm uppercase tracking-wider">
                    {t.artist}
                  </span>
                  <span className="text-white/10 text-xl font-thin mx-2">/</span>
                </div>
              ))}
              {trending.length === 0 && (
                <div className="flex items-center gap-4 whitespace-nowrap">
                  <span className="text-white font-bold text-sm md:text-base tracking-tight hover:text-indigo-400 transition-colors cursor-pointer capitalize">Lonely At The Top</span>
                  <span className="text-gray-500 text-xs">—</span>
                  <span className="text-gray-400 font-medium text-xs md:text-sm uppercase tracking-wider">Asake</span>
                  <span className="text-white/10 text-xl font-thin mx-2">/</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Gradient Fade */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}} />

      {/* 🚀 Hero Banner */}
      <section className="relative w-full h-[360px] md:h-[420px] rounded-3xl md:rounded-[2rem] overflow-hidden shadow-2xl group bg-black">
        <Swiper
          modules={[EffectFade, Autoplay]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop={latest.length > 1}
          autoplay={{
            delay: 8000,
            disableOnInteraction: false,
          }}
          className="w-full h-full"
        >
          {latest.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className="w-full h-full relative flex items-end">
                <img src={slide.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f11] via-transparent to-transparent" />

                <div className="relative z-10 p-6 md:p-10 lg:p-12 w-full md:w-3/4">
                  <p className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-white/80 mb-2 md:mb-3">Featured Release</p>
                  <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 tracking-tight leading-tight mb-3 md:mb-4 drop-shadow-sm">
                    {slide.title}
                  </h1>
                  <p className="text-sm md:text-lg lg:text-xl text-white/90 font-medium max-w-xl mb-6 md:mb-8 leading-snug drop-shadow-sm">
                    Posted By {slide.artist}. Available exclusively on Soundr.
                  </p>

                  <div className="flex items-center gap-3 md:gap-4">
                    <button
                      onClick={(e) => handlePlayAction(e, slide, latest)}
                      className="bg-white text-black px-5 md:px-8 py-2.5 md:py-3.5 rounded-full text-sm md:text-base font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform flex items-center gap-2"
                    >
                      {currentTrack?.id === slide.id && isPlaying ? (
                        <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                      ) : (
                        <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      )}
                      Play Now
                    </button>
                    <button
                      onClick={(e) => handleNavigate(e, slide.id)}
                      className="bg-black/30 backdrop-blur-md border border-white/20 text-white px-5 md:px-8 py-2.5 md:py-3.5 rounded-full text-sm md:text-base font-bold hover:bg-white/10 transition-colors"
                    >
                      Details
                    </button>
                    {isAuthenticated && user?.id === slide.uploaded_by && (
                      <button
                        onClick={(e) => handleEdit(e, slide.id)}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
                        title="Edit Track"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* 🔥 Trending Songs */}
      <section className="w-full">
        <div className="flex items-end justify-between mb-3 md:mb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Trending Songs</h2>
            <p className="text-xs md:text-sm text-gray-400 font-medium">Most hyped tracks this week</p>
          </div>
          <Link href="/explore/trending" className="text-xs md:text-sm font-semibold text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            Show all
          </Link>
        </div>

        <div className="-mx-2 px-2">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={16}
            slidesPerView="auto"
            loop={true}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            grabCursor={true}
            breakpoints={{
              768: { spaceBetween: 20 }
            }}
            className="w-full !pb-4"
          >
            {trending.map((track) => (
              <SwiperSlide key={track.id} className="!w-auto">
                <div className="flex flex-col gap-3 w-[140px] md:w-[160px] lg:w-[190px] group block">
                  <div className="w-full aspect-square relative rounded-2xl overflow-hidden shadow-lg bg-white/5">
                    <img src={track.cover_image_url} alt={track.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />

                    {/* Centered Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 md:bg-transparent">
                      <button
                        onClick={(e) => handlePlayAction(e, track, trending)}
                        className="w-10 h-10 md:w-12 lg:w-14 lg:h-14 bg-white/20 md:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl translate-y-0 md:translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
                      >
                        {getPlayIcon(track)}
                      </button>
                    </div>

                    {/* Top Right Edit Button (if owner) */}
                    {isAuthenticated && user?.id === track.uploaded_by && (
                      <button
                        onClick={(e) => handleEdit(e, track.id)}
                        className="absolute top-3 right-3 w-8 h-8 md:w-9 md:h-9 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 hover:bg-indigo-500 transition-colors z-20"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      onClick={(e) => handleNavigate(e, track.id)}
                      className="font-bold text-white text-sm md:text-[15px] leading-tight mb-0.5 truncate group-hover:underline decoration-white/30 cursor-pointer"
                    >
                      {track.title}
                    </span>
                    <span className="text-xs md:text-sm text-gray-400 font-medium truncate">{track.artist}</span>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ✨ Recently Added */}
      <section className="w-full mb-8">
        <div className="flex items-end justify-between mb-3 md:mb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Recently Added</h2>
            <p className="text-xs md:text-sm text-gray-400 font-medium">Fresh sounds just uploaded</p>
          </div>
          <Link href="/explore/latest" className="text-xs md:text-sm font-semibold text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            Show all
          </Link>
        </div>

        <div className="-mx-2 px-2">
          <Swiper
            spaceBetween={16}
            slidesPerView="auto"
            loop={true}
            grabCursor={true}
            breakpoints={{
              768: { spaceBetween: 24 }
            }}
            className="w-full !pb-4"
          >
            {latest.map((track) => (
              <SwiperSlide key={track.id} className="!w-auto">
                <div className="flex flex-col gap-3 w-[150px] md:w-[180px] lg:w-[210px] group">
                  <div className="w-full aspect-square relative rounded-2xl overflow-hidden shadow-lg bg-white/5 group">
                    <img src={track.cover_image_url} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />

                    {/* Play Button Overlay (Bottom Right) */}
                    <div
                      onClick={(e) => handlePlayAction(e, track, latest)}
                      className="absolute bottom-4 right-4 md:translate-y-4 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-20"
                    >
                      <div className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform">
                        {currentTrack?.id === track.id && isPlaying ? (
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        ) : (
                          <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        )}
                      </div>
                    </div>

                    {/* Edit Button Overlay (Top Right) */}
                    {isAuthenticated && user?.id === track.uploaded_by && (
                      <button
                        onClick={(e) => handleEdit(e, track.id)}
                        className="absolute top-4 right-4 w-9 h-9 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 hover:bg-white/20 transition-colors z-20"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col px-1">
                    <span
                      onClick={(e) => handleNavigate(e, track.id)}
                      className="font-bold text-white text-sm md:text-[15px] leading-tight mb-0.5 truncate hover:underline cursor-pointer"
                    >
                      {track.title}
                    </span>
                    <span className="text-xs md:text-sm text-gray-400 font-medium truncate">Posted by: {track.artist}</span>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

    </div>
  );
}
