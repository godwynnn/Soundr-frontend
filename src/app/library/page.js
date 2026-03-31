"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useRouter } from 'next/navigation';
import { setTrackWithQueue, togglePlay } from '@/store/playerSlice';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';

function LibraryContent() {
    const { isAuthenticated, accessToken } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [libraryData, setLibraryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const activeTab = searchParams.get('tab') || 'liked';

    useEffect(() => {
        if (isAuthenticated && accessToken) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/library/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            })
                .then(res => res.json())
                .then(data => {
                    setLibraryData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to load library:', err);
                    setLoading(false);
                });
        }
    }, [isAuthenticated]);

    if (!mounted || loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    const {
        liked_songs = [],
        playlists = [],
        followed_artists = [],
        recent_downloads = []
    } = libraryData || {};

    const handlePlaySong = (song, queue) => {
        dispatch(setTrackWithQueue({ track: song, queue }));
    };

    const tabs = [
        { id: 'liked', label: 'Liked Songs', icon: '❤️' },
        { id: 'playlists', label: 'Playlists', icon: '📁' },
        { id: 'artists', label: 'Artists', icon: '🎤' },
        { id: 'downloads', label: 'Downloads', icon: '⬇️' }
    ];

    const foundIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeIndex = foundIndex === -1 ? 0 : foundIndex;

    return (
        <AuthGuard>
            <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-8 mt-12 md:mt-0 pb-32 px-4 md:px-8 animate-in fade-in duration-700">

                {/* Hero Header */}
                <div className="relative pt-8 md:pt-12 pb-6 border-b border-white/5 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">Your Library</h1>
                        </div>
                        <p className="text-gray-400 font-medium text-sm max-w-xl">
                            Everything you love, saved and organized in one place.
                        </p>
                    </div>
                </div>

                {/* Sticky Segmented Control (Tabs) */}
                <div className="sticky top-0 md:top-4 z-30 flex items-center justify-start py-2 bg-[#0e0f11]/80 backdrop-blur-md">
                    <div className="flex items-center gap-8 relative border-b border-white/5 w-full overflow-x-auto custom-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => router.push(`/library?tab=${tab.id}`)}
                                className={`flex items-center gap-2 pb-3 px-1 font-bold transition-all relative text-sm whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                                    }`}
                            >
                                <span className="hidden md:inline">{tab.icon}</span> {tab.label.split(' ')[0]}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full animate-in fade-in zoom-in duration-300" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
                    {activeTab === 'liked' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                            {liked_songs.length > 0 ? liked_songs.map((song) => (
                                <SongCard
                                    key={song.id}
                                    song={song}
                                    onClick={() => handlePlaySong(song, liked_songs)}
                                />
                            )) : (
                                <div className="col-span-full">
                                    <EmptyState icon="❤️" title="Liked Songs" message="Your favorite tracks will appear here." />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'playlists' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                            {playlists.length > 0 ? playlists.map((playlist) => (
                                <LibraryCard key={playlist.id} item={playlist} type="playlist" />
                            )) : (
                                <div className="col-span-full">
                                    <EmptyState icon="📁" title="Playlists" message="Playlists you create or follow will appear here." />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'artists' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                            {followed_artists.length > 0 ? followed_artists.map((artist) => (
                                <LibraryCard key={artist.id} item={artist} type="artist" />
                            )) : (
                                <div className="col-span-full">
                                    <EmptyState icon="🎤" title="Artists" message="Artists you follow will appear here." />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'downloads' && (
                        <div className="flex flex-col gap-1">
                            <EmptyState icon="⬇️" title="Downloads" message="Songs you download for offline playback will appear here." />
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}

function EmptyState({ icon, title, message }) {
    return (
        <div className="w-full bg-white/5 border border-dashed border-white/10 rounded-[3rem] py-24 flex flex-col items-center justify-center text-center gap-6 group hover:bg-white/[0.07] transition-all duration-500">
            <div className="size-24 bg-white/5 rounded-3xl flex items-center justify-center text-5xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-2xl">
                {icon}
            </div>
            <div className="flex flex-col gap-2">
                <p className="text-white text-2xl font-black">No {title} yet</p>
                <p className="text-gray-500 text-base max-w-sm px-8">
                    {message}
                </p>
            </div>
            <button className="mt-4 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20">
                Explore Soundr
            </button>
        </div>
    );
}

function SongCard({ song, onClick }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const { currentTrack, isPlaying } = useSelector((state) => state.player);

    const isCurrentPlaying = currentTrack?.id === song.id && isPlaying;

    const handlePlayPause = (e) => {
        e.stopPropagation();
        if (currentTrack?.id === song.id) {
            dispatch(togglePlay());
        } else {
            onClick();
        }
    };

    return (
        <div className="flex flex-col gap-3 group cursor-pointer" onClick={onClick}>
            <div className="relative aspect-square overflow-hidden shadow-2xl border border-white/5 bg-white/5 rounded-[2rem] transform transition-all duration-500 hover:-translate-y-1.5">
                <img
                    src={song.cover_image_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500"}
                    alt={song.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Play Button Overlay */}
                <button
                    onClick={handlePlayPause}
                    className="absolute inset-0 m-auto w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:scale-110 z-20"
                >
                    {isCurrentPlaying ? (
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                        <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                </button>

                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 delay-75">
                    <span className="text-[9px] uppercase font-black tracking-[0.2em] text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">{song.genre || 'Single'}</span>
                </div>
            </div>

            <div className="flex flex-col gap-0.5 px-1.5">
                <Link
                    href={`/song/${song.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-white font-bold text-sm md:text-base truncate w-full hover:text-indigo-400 transition-colors leading-snug"
                >
                    {song.title}
                </Link>
                <div className="flex items-center justify-between">
                    <p className="text-[11px] md:text-xs text-gray-500 font-medium truncate">
                        {song.artist}
                    </p>
                    <span className="text-[9px] text-gray-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">{song.duration || '3:45'}</span>
                </div>
            </div>
        </div>
    );
}

function LibraryCard({ item, type }) {
    const isArtist = type === 'artist';

    return (
        <div className="flex flex-col gap-4 group cursor-pointer">
            <div className={`relative aspect-square overflow-hidden shadow-2xl border border-white/5 bg-white/5 transform transition-all duration-500 hover:-translate-y-2 ${isArtist ? 'rounded-full scale-95 hover:scale-100' : 'rounded-[2.5rem]'}`}>
                <img
                    src={item.cover_image_url || (isArtist ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400" : "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500")}
                    alt={item.title || item.artist_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Play Button Overlay (for playlists) */}
                {!isArtist && (
                    <button className="absolute inset-0 m-auto w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-500 hover:scale-110">
                        <svg className="w-8 h-8 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </button>
                )}

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 delay-100">
                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/70 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">{type}</span>
                </div>
            </div>

            <div className={`flex flex-col gap-1 ${isArtist ? 'items-center text-center' : 'px-2'}`}>
                <h4 className="text-white font-bold text-lg md:text-xl truncate w-full group-hover:text-indigo-400 transition-colors leading-tight">
                    {item.title || item.artist_name}
                </h4>
                <p className="text-sm text-gray-500 font-medium">
                    {type === 'playlist' ? `${item.track_count || 0} Tracks` : 'Verified Profile'}
                </p>
            </div>
        </div>
    );
}

export default function LibraryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center"><div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin" /></div>}>
            <LibraryContent />
        </Suspense>
    );
}
