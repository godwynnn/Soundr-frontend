"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, VideoTrack, useRemoteParticipants, useLocalParticipant } from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";

// Shows the host's video if they have camera enabled
function HostVideo() {
  const remoteParticipants = useRemoteParticipants();
  // Find the host (the one who is publishing something)
  const host = remoteParticipants.find(p => p.getTrackPublication(Track.Source.Microphone) || p.getTrackPublication(Track.Source.Camera)) || remoteParticipants[0];

  if (!host) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg className="w-16 h-16 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <p className="text-sm font-medium">Waiting for host audio...</p>
        </div>
      </div>
    );
  }

  const cameraPub = host.getTrackPublication(Track.Source.Camera);

  if (cameraPub?.track) {
    return (
      <VideoTrack
        key={host?.sid}
        trackRef={{ participant: host, source: Track.Source.Camera, publication: cameraPub }}
        className="w-full h-full object-cover"
      />
    );
  }

  // Host is live but camera is off — show audio-only indicator
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="size-24 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm font-medium">Audio Only — Host camera is off</p>
      </div>
    </div>
  );
}

// Listener count inside the room
function ListenerCount() {
  const remoteParticipants = useRemoteParticipants();
  return (
    <span className="text-xl font-bold text-white flex items-center gap-2">
      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      {remoteParticipants.length + 1}
    </span>
  );
}

export default function LiveSessionPage() {
  const router = useRouter();
  const params = useParams();
  const roomName = params.roomName;

  const { isAuthenticated } = useSelector((state) => state.auth);
  const [token, setToken] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [streamTitle, setStreamTitle] = useState("");
  const [hostName, setHostName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [streamEnded, setStreamEnded] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchToken = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/streams/join-token/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ room: roomName }),
        });

        if (res.ok) {
          const data = await res.json();
          setToken(data.token);
          setServerUrl(data.url);
          setStreamTitle(data.stream_title);
          setHostName(data.host);
        } else {
          const err = await res.json();
          setError(err.error || "Failed to join stream.");
        }
      } catch (e) {
        console.error(e);
        setError("Connection error.");
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [isAuthenticated, roomName, router]);

  // Poll the backend every 5s to check if stream is still live
  useEffect(() => {
    if (!token || streamEnded) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creator/streams/`);
        if (res.ok) {
          const streams = await res.json();
          const stillLive = streams.some(s => s.room_name === roomName && s.is_live);
          if (!stillLive) {
            setStreamEnded(true);
            clearInterval(pollRef.current);
          }
        }
      } catch (e) {
        // Network blip — ignore, next poll will retry
      }
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [token, roomName, streamEnded]);

  const handleLeave = () => {
    clearInterval(pollRef.current);
    router.push("/discover");
  };

  const handleStreamEnded = () => {
    clearInterval(pollRef.current);
    setStreamEnded(true);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Joining live session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">{error}</h2>
          <p className="text-gray-400 text-sm">The stream may have ended or is unavailable.</p>
          <button
            onClick={() => router.push("/discover")}
            className="mt-2 px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-transform"
          >
            Back to Discover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto w-full flex flex-col gap-6 mt-12 md:mt-0 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{streamTitle}</h1>
          </div>
          <p className="text-gray-400 text-sm font-medium">Hosted by <span className="text-white font-semibold">{hostName}</span></p>
        </div>
        <button
          onClick={handleLeave}
          className="px-5 py-2.5 bg-white/10 border border-white/10 text-white rounded-full text-sm font-bold hover:bg-red-500 hover:border-red-500 transition-all"
        >
          Leave
        </button>
      </div>

      {/* LiveKit Room */}
      {token && (
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          audio={false}
          video={false}
          onDisconnected={handleStreamEnded}
        >
          {/* Stream-ended overlay */}
          {streamEnded && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="size-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">Stream Ended</h2>
                <p className="text-gray-400 text-sm">The host has ended this live session.</p>
                <button
                  onClick={handleLeave}
                  className="mt-2 px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-transform"
                >
                  Back to Discover
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {/* Video / Audio Preview */}
            <div className="w-full aspect-video bg-black border border-white/10 rounded-2xl overflow-hidden relative">
              <HostVideo />
            </div>

            {/* Stats bar */}
            <div className="bg-[#13151a]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Viewers in session</span>
              <ListenerCount />
            </div>

            <RoomAudioRenderer />

            {/* Chat placeholder */}
            <div className="bg-[#13151a]/80 backdrop-blur-md border border-white/10 rounded-2xl h-56 flex flex-col pt-3 px-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 px-1">Live Chat</span>
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-end gap-2 pb-3">
                <div className="text-xs text-gray-400 px-2 italic text-center mb-2">You joined the session</div>
                <div className="text-sm px-2 py-1"><span className="font-bold text-[#a855f7] mr-2">MusicLover99:</span> Sounds amazing! 🔥</div>
                <div className="text-sm px-2 py-1"><span className="font-bold text-pink-400 mr-2">VibeCheck:</span> Can you play the new track?</div>
              </div>
            </div>
          </div>
        </LiveKitRoom>
      )}
    </div>
  );
}
