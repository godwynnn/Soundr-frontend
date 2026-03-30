"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from 'next/navigation';
import AuthGuard from "@/components/AuthGuard";
import { LiveKitRoom, RoomAudioRenderer, ControlBar, VideoTrack, useLocalParticipant } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';

// Self-view rendered inside <LiveKitRoom> context — defined outside to prevent hook remounts
function SelfView({ isCameraOn, onToggleCamera }) {
  const { localParticipant } = useLocalParticipant();
  const cameraPub = localParticipant?.getTrackPublication(Track.Source.Camera);
  return (
    <div className="w-full h-full flex items-center justify-center">
      {cameraPub?.track ? (
        <VideoTrack
          key={localParticipant?.sid}
          trackRef={{ participant: localParticipant, source: Track.Source.Camera, publication: cameraPub }}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium">Camera is off — click the button to enable</p>
        </div>
      )}
      {/* Camera toggle button overlaid on preview */}
      <button
        onClick={onToggleCamera}
        className={`absolute bottom-3 right-3 p-2.5 rounded-full border transition-all ${isCameraOn
            ? 'bg-white text-black border-white hover:bg-white/80'
            : 'bg-black/60 text-white border-white/20 hover:bg-black/80 backdrop-blur-md'
          }`}
        title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
      >
        {isCameraOn ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" strokeWidth="2" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function CreatorPodcastsPage() {
  const router = useRouter();
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
  };

  const toggleLiveStream = async () => {
    if (isLive) {
      if (confirm("Are you sure you want to end your live session?")) {
        endStream();
      }
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
      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-8 md:gap-10 mt-12 md:mt-0 pb-12">

        {/* Header */}
        <div className="mb-2 md:mb-6">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">Create Content</h1>
          <p className="text-gray-400 font-medium text-sm md:text-base">Choose how you want to reach your audience today.</p>
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
                        : 'bg-[#a855f7] text-white hover:brightness-110 active:scale-95'
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

                  {isLive && liveToken ? (
                    <LiveKitRoom
                      token={liveToken}
                      serverUrl={serverUrl}
                      connect={true}
                      audio={true}
                      video={isCameraOn}
                      onDisconnected={endStream}
                    >
                      <div className="flex flex-col gap-4">
                        {/* Self-view / camera preview */}
                        <div className="w-full aspect-video bg-black border border-white/10 rounded-xl overflow-hidden relative">
                          <SelfView isCameraOn={isCameraOn} onToggleCamera={() => setIsCameraOn(prev => !prev)} />
                        </div>

                        <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-300">Current Listeners</span>
                          <span className="text-xl font-bold text-white flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            {liveListeners}
                          </span>
                        </div>

                        <div className="bg-[#13151a] p-4 rounded-xl border border-white/5 mx-auto">
                          <ControlBar variation="minimal" />
                        </div>
                        <RoomAudioRenderer />

                        {/* Mock Chat Box */}
                        <div className="bg-black/30 border border-white/5 rounded-xl h-48 flex flex-col pt-3 px-3">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 px-1">Live Chat</span>
                          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-end gap-2 pb-2">
                            <div className="text-xs text-gray-400 px-2 italic text-center mb-2">Chat started</div>
                            <div className="text-sm px-2 py-1"><span className="font-bold text-[#a855f7] mr-2">MusicLover99:</span> Sounds amazing! 🔥</div>
                            <div className="text-sm px-2 py-1"><span className="font-bold text-pink-400 mr-2">VibeCheck:</span> Can you play the new track?</div>
                          </div>
                        </div>
                      </div>
                    </LiveKitRoom>
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
                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] ${isConnecting ? 'bg-red-500/50 text-white/50 cursor-not-allowed border-2 border-transparent' :
                      isLive
                        ? 'bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                        : 'bg-red-600 border-2 border-red-600 text-white hover:bg-red-500 hover:border-red-500'
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
    </AuthGuard>
  );
}
