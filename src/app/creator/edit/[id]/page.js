"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';

function EditPageContent({ trackId }) {
  const router = useRouter();
  const { accessToken } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    tags: '',
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [existingAudioUrl, setExistingAudioUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const genres = [
    { value: 'afrobeats', label: 'Afrobeats' },
    { value: 'hiphop', label: 'Hip-Hop' },
    { value: 'rnb', label: 'R&B' },
    { value: 'gospel', label: 'Gospel' },
    { value: 'pop', label: 'Pop' },
    { value: 'electronic', label: 'Electronic' },
    { value: 'rock', label: 'Rock' },
    { value: 'jazz', label: 'Jazz' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    // Fetch existing track data
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listener/songs/${trackId}/`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          title: data.title,
          genre: data.genre || '',
          tags: data.tags || '',
        });
        setCoverPreview(data.cover_image_url);
        setExistingAudioUrl(data.audio_file_url);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch track data.');
        setLoading(false);
      });
  }, [trackId]);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Audio file size must be less than 10MB.');
        return;
      }
      setAudioFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsUpdating(true);
    setProgress(0);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('genre', formData.genre);
    data.append('tags', formData.tags);
    if (audioFile) data.append('audio_file', audioFile);
    if (coverImage) data.append('cover_image', coverImage);

    // Progress simulation
    const interval = setInterval(() => {
      setProgress(p => (p >= 90 ? 90 : p + 10));
    }, 200);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creator/edit/${trackId}//`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: data,
      });

      clearInterval(interval);
      setProgress(100);

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/creator'), 2000);
      } else {
        const err = await response.json();
        setError(err.error || 'Update failed.');
      }
    } catch (err) {
      clearInterval(interval);
      setError('Server connection error.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center mt-32">
        <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center gap-6 mt-32 animate-[fade-in_0.5s_ease-out]">
        <div className="w-20 h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center">
          <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white">Changes Saved!</h2>
        <p className="text-gray-400 font-medium">Your track has been updated. Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-8 mt-16 md:mt-0 pb-20 animate-[fade-in_0.5s_ease-out]">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/creator" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Edit Track
          </h1>
          <p className="text-gray-400 font-medium mt-1">Update your track details and files.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-5 py-3 font-medium">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Cover Artwork */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Cover Artwork</label>
          <label className="cursor-pointer group">
            <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleCoverChange} className="hidden" />
            <div className={`relative w-full h-56 md:h-72 rounded-2xl border-2 border-dashed transition-colors overflow-hidden flex items-center justify-center ${coverPreview ? 'border-indigo-500/50' : 'border-white/10 hover:border-white/30 bg-white/[0.02]'}`}>
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full">Change Image</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-sm font-medium">Click to upload cover artwork</span>
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Track Title */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Track Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-lg"
            required
          />
        </div>

        {/* Genre */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Genre</label>
          <select
            value={formData.genre}
            onChange={(e) => setFormData({...formData, genre: e.target.value})}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            required
          >
            <option value="" disabled className="text-gray-500">Select a genre</option>
            {genres.map(g => (
              <option key={g.value} value={g.value} className="bg-[#12141a] text-white">{g.label}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Tags</label>
          <input
            type="text"
            placeholder="comma-separated tags"
            value={formData.tags}
            onChange={(e) => setFormData({...formData, tags: e.target.value})}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Audio File */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Audio File <span className="text-gray-500 text-xs normal-case">(leave empty to keep current)</span></label>
          <label className="cursor-pointer group">
            <input type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
            <div className={`w-full rounded-2xl border-2 border-dashed p-6 transition-colors flex items-center gap-4 ${audioFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-white/30 bg-white/[0.02]'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${audioFile ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{audioFile ? audioFile.name : 'Using current audio file'}</p>
                {audioFile && <p className="text-xs text-gray-400 mt-0.5">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>}
              </div>
              <span className="text-xs text-indigo-400 font-bold bg-indigo-400/10 px-3 py-1 rounded-full">Change</span>
            </div>
          </label>
        </div>

        {isUpdating && (
          <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/10">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        <button
          type="submit"
          disabled={isUpdating}
          className="w-full bg-white text-black font-bold py-4 px-6 rounded-xl transition-colors text-lg disabled:opacity-50"
        >
          {isUpdating ? `Saving... ${progress}%` : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default function EditPage({ params }) {
  const unwrappedParams = use(params);
  return (
    <AuthGuard>
      <EditPageContent trackId={unwrappedParams.id} />
    </AuthGuard>
  );
}
