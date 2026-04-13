"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from 'next/navigation';
import AuthGuard from "@/components/AuthGuard";
import ConfirmationModal from "@/components/ConfirmationModal";
import { LiveKitRoom, RoomAudioRenderer, ControlBar, VideoTrack, useLocalParticipant } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { setStreaming } from "@/store/playerSlice";

// Self-view rendered inside <LiveKitRoom> context — defined outside to prevent hook remounts
function SelfView({ isCameraOn, onToggleCamera, isFullScreen = false }) {
  const { localParticipant } = useLocalParticipant();

  return (
    <div className={`relative group overflow-hidden w-full h-full md:aspect-video md:rounded-3xl md:border md:border-white/10 md:shadow-2xl md:bg-black/40`}>
      {isCameraOn ? (
        <VideoTrack trackRef={{ participant: localParticipant, source: Track.Source.Camera }} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
          <p className="text-zinc-500 font-bold text-sm">Camera is Off</p>
        </div>
      )}

      {/* Show overlay toggle button on Desktop only (Mobile has dedicated bar) */}
      <div className="hidden md:absolute md:inset-0 md:bg-black/40 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:flex md:items-center md:justify-center">
        <button
          onClick={onToggleCamera}
          className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-transform"
        >
          {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
        </button>
      </div>
    </div>
  );
}

export default function CreatorPodcastsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'live'

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    visibility: "public",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Go Live State
  const [isLive, setIsLive] = useState(false);
  const [liveListeners, setLiveListeners] = useState(0);
  const [liveToken, setLiveToken] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [activeRoomName, setActiveRoomName] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);

  useEffect(() => {
    let interval;
    if (isLive) {
      interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);
    } else {
      setStreamDuration(0);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
    }
  };

  const handleAudioChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) {
      alert("Please provide an audio file.");
      return;
    }
    if (!coverFile) {
      alert("Please provide cover art.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('visibility', formData.visibility);
      data.append('audio_file', audioFile);
      data.append('cover_image', coverFile);

      const token = localStorage.getItem('access_token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creator/podcast/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data,
      });

      if (response.ok) {
        const result = await response.json();
        alert("Podcast successfully published!");

        // Reset form
        setFormData({
          title: "",
          description: "",
          category: "",
          visibility: "public",
        });
        setCoverFile(null);
        setAudioFile(null);
      } else {
        const errorData = await response.json();
        alert(`Failed to upload: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred during upload.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const endStream = async () => {
    // Notify backend to mark stream offline
    if (activeRoomName) {
      try {
        const token = localStorage.getItem('access_token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creator/streams/end/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: activeRoomName }),
        });
      } catch (e) { console.error('Failed to notify end_stream:', e); }
    }
    setIsLive(false);
    setLiveListeners(0);
    setLiveToken("");
    setServerUrl("");
    setIsCameraOn(false);
    setActiveRoomName("");
    dispatch(setStreaming(false));
  };

  const toggleLiveStream = async () => {
    if (isLive) {
      setIsConfirmModalOpen(true);
    } else {
      setIsConnecting(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creator/podcast/live-token/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });
        console.log(response)

        if (response.ok) {
          const data = await response.json();
          setLiveToken(data.token);
          setServerUrl(data.url);
          const room = data.room;
          setActiveRoomName(room);

          // Register the live session so Discover page can list it
          const streamTitle = `${user?.username || 'Creator'}'s Live Session`;
          const authToken = localStorage.getItem('access_token');
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creator/streams/start/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ room, title: streamTitle }),
          });

          setIsLive(true);
          setLiveListeners(1);
          dispatch(setStreaming(true));
        } else {
          alert("Failed to connect to LiveKit server. Ensure your backend has valid credentials.");
        }
      } catch (err) {
        console.error(err);
        alert("Error generating live token");
      } finally {
        setIsConnecting(false);
      }
    }
  };

  return (
    <AuthGuard>
      <>
        <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-8 md:gap-10 mt-12 md:mt-0 pb-12">

        {/* Header */}
        <div className="mb-2 md:mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Create Content</h1>
          <p className="text-gray-400 font-medium text-sm">Choose how you want to reach your audience today.</p>
        </div>

        {/* Toggle Sections (Tabs) */}
        <div className="flex border-b border-white/10 gap-8 md:gap-10">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-4 border-b-2 font-bold text-sm md:text-base flex items-center gap-2 transition-all ${activeTab === 'upload' ? 'border-[#a855f7] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <span className="text-xl">🎙️</span> Upload Episode
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`pb-4 border-b-2 font-bold text-sm md:text-base flex items-center gap-2 transition-all ${activeTab === 'live' ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <span className="text-xl">🎥</span> Go Live
          </button>
        </div>

        <div className="w-full">

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
              <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Form Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#13151a]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#a855f7]/10 rounded-full blur-[100px] pointer-events-none" />

                    <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-6 text-white">
                      Episode Details
                    </h2>

                    <div className="flex flex-col gap-5 relative z-10">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-300">Episode Title *</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="E.g., The Future of AI in Music"
                          required
                          className="bg-black/40 border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-[#a855f7] focus:border-transparent block w-full p-3.5 transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-300">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Briefly describe what this episode is about..."
                          rows={4}
                          className="bg-black/40 border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-[#a855f7] focus:border-transparent block w-full p-3.5 transition-colors resize-none custom-scrollbar"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-gray-300">Category *</label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="bg-black/40 border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-[#a855f7] block w-full p-3.5 outline-none appearance-none"
                          >
                            <option value="" disabled className="text-gray-500">Select Category</option>
                            <option value="entertainment" className="bg-[#13151a]">Entertainment</option>
                            <option value="education" className="bg-[#13151a]">Education</option>
                            <option value="news" className="bg-[#13151a]">News</option>
                            <option value="technology" className="bg-[#13151a]">Technology</option>
                            <option value="music" className="bg-[#13151a]">Music</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-gray-300">Visibility *</label>
                          <select
                            name="visibility"
                            value={formData.visibility}
                            onChange={handleInputChange}
                            required
                            className="bg-black/40 border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-[#a855f7] block w-full p-3.5 outline-none appearance-none"
                          >
                            <option value="public" className="bg-[#13151a]">Public</option>
                            <option value="private" className="bg-[#13151a]">Private</option>
                            <option value="unlisted" className="bg-[#13151a]">Unlisted</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audio Upload Zone */}
                  <div className="bg-[#13151a]/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 relative overflow-hidden transition-all group text-center border-dashed border-2 hover:bg-[#13151a] hover:border-[#a855f7]/50">
                    <div className="size-16 bg-[#a855f7]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-[#a855f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <p className="text-white font-bold mb-1">Upload your audio file</p>
                    <p className="text-gray-500 text-sm mb-4">MP3, WAV, or M4A up to 500MB</p>
                    {audioFile && (
                      <div className="text-[#a855f7] font-semibold text-sm mb-4 bg-[#a855f7]/10 py-2 rounded-lg break-all px-2">
                        {audioFile.name}
                      </div>
                    )}
                    <label className="inline-block px-6 py-2 bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30 rounded-full text-xs font-bold hover:bg-[#a855f7] hover:text-white transition-all cursor-pointer">
                      Select File
                      <input type="file" accept="audio/*" className="hidden" onChange={handleAudioChange} required />
                    </label>
                  </div>
                </div>

                {/* Right Column: Media & Actions */}
                <div className="space-y-6">

                  {/* Cover Art Upload */}
                  <div className="bg-[#13151a]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                    <span className="text-sm font-semibold text-gray-300 block">Cover Art * (JPG, PNG)</span>
                    <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-white/10 border-dashed rounded-2xl cursor-pointer bg-black/40 hover:bg-black/60 hover:border-[#a855f7]/50 transition-colors group relative overflow-hidden">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10">
                        <svg className="w-10 h-10 mb-3 text-gray-500 group-hover:text-[#a855f7] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs text-center text-gray-400 px-4">Click to upload cover <br /> {coverFile ? coverFile.name : "(3000x3000px)"}</p>
                      </div>
                      <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} required />
                      <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/10 to-transparent pointer-events-none" />
                    </label>
                  </div>

                  {/* Actions Area */}
                  <div className="bg-[#13151a]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3.5 rounded-xl font-bold tracking-widest text-sm transition-all shadow-lg ${isSubmitting
                        ? 'bg-[#a855f7]/50 text-white/50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                        }`}
                    >
                      {isSubmitting ? 'Uploading...' : 'Publish Episode'}
                    </button>
                    <button type="button" className="w-full py-3.5 bg-transparent border-2 border-white/10 text-gray-300 rounded-xl font-bold text-sm tracking-widest hover:bg-white/5 transition-all">
                      Save as Draft
                    </button>
                  </div>
                </div>

              </form>
            </div>
          )}

          {/* Live Tab */}
          {activeTab === 'live' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-3xl mx-auto">
              <div className={`backdrop-blur-md border rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-colors duration-500 ${isLive ? 'bg-red-950/20 border-red-500/30' : 'bg-[#13151a]/80 border-white/10'}`}>

                {/* Live accent glow */}
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-colors duration-500 ${isLive ? 'bg-red-500/20' : 'bg-transparent'}`} />

                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <span className={isLive ? "text-red-500 animate-pulse" : "text-gray-400"}>🎥</span> Go Live
                  </h2>
                  {isLive && (
                    <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span> ON AIR
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-6 relative z-10">
                  <p className="text-gray-400 text-sm">
                    {isLive
                      ? "You are currently live broadcasting! Your listeners can interact via the live chat."
                      : "Start a live audio session. Your followers will receive a notification to join in real-time."}
                  </p>

                  {(isLive || isConnecting) ? (
                    <div 
                      className={`fixed md:relative inset-0 md:inset-auto z-[200] md:z-0 w-full md:w-auto transition-all duration-700 ease-in-out ${
                        isCameraOn || isConnecting
                          ? 'bg-black' 
                          : 'bg-black/60 backdrop-blur-xl flex items-center justify-center p-4'
                      }`}
                      style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? '100dvh' : 'auto' }}
                    >
                      {/* Session Content Container */}
                      <div className={`w-full h-full flex flex-col transition-all duration-700 ${
                        (!isCameraOn && !isConnecting) && 'md:h-full max-w-lg max-h-[85vh] md:max-h-none md:max-w-none'
                      }`}>
                        
                        {isConnecting && !liveToken ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="relative mb-8">
                              <div className="size-24 rounded-full border-4 border-red-500/20" />
                              <div className="size-24 rounded-full border-4 border-red-500 border-t-transparent absolute top-0 left-0 animate-spin" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl animate-pulse">📡</span>
                              </div>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Going Live...</h3>
                            <p className="text-gray-400 text-sm max-w-[240px] leading-relaxed mb-10">
                              Initializing secure broadcast channel and synchronizing with your audience.
                            </p>
                            <button 
                              onClick={() => {
                                setIsConnecting(false);
                                setIsLive(false);
                              }}
                              className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
                            >
                              Cancel Setup
                            </button>
                          </div>
                        ) : liveToken ? (
                          <LiveKitRoom
                            token={liveToken}
                            serverUrl={serverUrl}
                            connect={true}
                            audio={true}
                            video={isCameraOn}
                            onDisconnected={endStream}
                            className="h-full w-full flex-1"
                            style={{ height: '100%' }}
                          >
                            {/* FEED LAYER: Immersive background (Camera ON) or Centered Card (Camera OFF) */}
                            <div className={`absolute md:relative inset-0 md:inset-auto z-0 transition-all duration-700 overflow-hidden ${
                              isCameraOn 
                                ? 'h-full w-full' 
                                : 'relative md:h-auto h-[40vh] rounded-3xl md:mb-6 shadow-2xl border border-white/10 mx-auto w-[90%] md:w-full mt-4 md:mt-0'
                            }`}>
                              <SelfView 
                                isCameraOn={isCameraOn} 
                                onToggleCamera={() => setIsCameraOn(prev => !prev)} 
                                isFullScreen={isCameraOn}
                              />
                            </div>

                            {/* MOBILE OVERLAY / INTERFACE LAYER */}
                            <div className={`md:hidden relative z-10 w-full flex-1 flex flex-col transition-all duration-700 ${
                              isCameraOn ? 'p-6 pointer-events-none' : 'p-4 pointer-events-auto mt-4'
                            }`}>
                              
                              {/* Top Stats - Always visible, adjusts style */}
                              <div className={`flex justify-between items-start w-full transition-all ${isCameraOn ? 'pointer-events-auto' : ''}`}>
                                <div className={`flex items-center gap-4 p-2.5 px-5 rounded-2xl border transition-all ${
                                  isCameraOn 
                                    ? 'bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl' 
                                    : 'bg-white/5 border-white/5'
                                  }`}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] font-black tracking-widest uppercase text-white">Live</span>
                                  </div>
                                  <div className="w-px h-4 bg-white/20" />
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    <span className="text-xs font-bold leading-none">{liveListeners}</span>
                                  </div>
                                  <div className="w-px h-4 bg-white/20" />
                                  <span className="text-xs font-mono font-bold text-gray-400">{formatDuration(streamDuration)}</span>
                                </div>

                                <button
                                  onClick={() => setIsConfirmModalOpen(true)}
                                  className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 pointer-events-auto"
                                >
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>

                              <div className="flex-1" />

                              {/* Bottom Context: Chat and Controls */}
                              <div className={`flex flex-col gap-6 transition-all ${isCameraOn ? 'items-end pointer-events-none' : 'items-center pointer-events-auto'}`}>
                                
                                {/* Chat Box - Floats in immersive, contained in modal */}
                                <div className={`w-full transition-all ${
                                  isCameraOn 
                                    ? 'pointer-events-auto bg-gradient-to-t from-black/80 to-transparent p-4' 
                                    : 'bg-white/5 border border-white/10 p-4 rounded-3xl'
                                  }`}>
                                  <div className={`space-y-4 overflow-y-auto no-scrollbar pr-2 transition-all ${
                                    isCameraOn ? 'max-h-[30vh] mb-4' : 'max-h-[20vh] mb-2'
                                  }`}>
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 shrink-0" />
                                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                                        <p className="text-[10px] font-black text-purple-300 uppercase">MusicLover99</p>
                                        <p className="text-sm text-white/90">Sounds amazing tonight! 🔥</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="relative">
                                    <input type="text" placeholder="Say something..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm outline-none focus:border-white/30" />
                                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                    </button>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className={`flex gap-3 transition-all ${isCameraOn ? 'flex-col pointer-events-auto' : 'w-full justify-center'}`}>
                                  <button 
                                    onClick={() => setIsCameraOn(prev => !prev)} 
                                    className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${
                                      isCameraOn 
                                        ? 'bg-white text-black border-white' 
                                        : 'bg-red-500 text-white border-transparent shadow-lg shadow-red-500/20'
                                    }`}
                                  >
                                    {isCameraOn ? (
                                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    ) : (
                                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" strokeWidth="2" /></svg>
                                    )}
                                  </button>
                                  <div className={`transition-all ${
                                    isCameraOn 
                                      ? 'bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 flex flex-col gap-2 shadow-2xl' 
                                      : 'bg-white/5 border border-white/10 rounded-full px-4 flex items-center gap-4'
                                    }`}>
                                    <ControlBar variation="minimal" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* DESKTOP DASHBOARD STYLE (Visible on Desktop) */}
                            <div className="hidden md:flex flex-col gap-6">
                              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                                <div className="flex items-center gap-6">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Listeners</span>
                                    <span className="text-xl font-bold text-white flex items-center gap-2">
                                      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                      {liveListeners}
                                    </span>
                                  </div>
                                  <div className="w-px h-8 bg-white/10" />
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Duration</span>
                                    <span className="text-xl font-mono font-bold text-white">{formatDuration(streamDuration)}</span>
                                  </div>
                                </div>
                                <div className="bg-[#13151a] p-2 rounded-xl border border-white/5">
                                  <ControlBar variation="minimal" />
                                </div>
                              </div>

                              {/* Desktop Chat Box */}
                              <div className="bg-black/30 border border-white/5 rounded-2xl h-64 flex flex-col p-4 shadow-inner">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 px-1">Live Chat</span>
                                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-end gap-3 pb-2">
                                  <div className="text-xs text-gray-500 text-center mb-2 italic">Broadcast started</div>
                                  <div className="text-sm border border-transparent hover:bg-white/5 p-2 rounded-xl transition-colors"><span className="font-bold text-purple-400 mr-2">MusicLover99:</span> Sounds amazing tonight! 🔥</div>
                                  <div className="text-sm border border-transparent hover:bg-white/5 p-2 rounded-xl transition-colors"><span className="font-bold text-pink-400 mr-2">VibeCheck:</span> Can you play the new track? 🚀</div>
                                </div>
                              </div>
                            </div>

                            <RoomAudioRenderer />
                          </LiveKitRoom>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-black/50 border border-white/5 rounded-xl flex items-center justify-center overflow-hidden relative">
                      <svg className="w-20 h-20 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  <button
                    onClick={toggleLiveStream}
                    disabled={isConnecting}
                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${isConnecting ? 'bg-red-500/50 text-white/50 cursor-not-allowed border-2 border-transparent' :
                      isLive
                        ? 'bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                        : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_0_25px_rgba(225,29,72,0.5)]'
                      }`}
                  >
                    {isConnecting ? 'Connecting...' : isLive ? 'End Stream' : 'Start Live Session'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={endStream}
        title="End Live Stream?"
        message="Are you sure you want to end your live session? This will disconnect all currently connected listeners."
        confirmText="End Stream"
        type="danger"
      />
    </>
  </AuthGuard>
);
}
