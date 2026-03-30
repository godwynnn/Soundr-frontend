"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/store/authSlice';
import SearchModal from './SearchModal';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const { isAuthenticated, user, isRehydrated } = useSelector((state) => state.auth);

  const isCreatorInitial = pathname.startsWith('/creator');
  const [isCreator, setIsCreator] = useState(isCreatorInitial);
  const [isOpen, setIsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  if (!isRehydrated) return null; // Moved after all hooks to comply with Rules of Hooks

  const handleToggle = (creatorMode) => {
    setIsCreator(creatorMode);
    if (creatorMode) {
      router.push('/creator');
    } else {
      router.push('/');
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      });
    } catch (err) { /* Backend may be offline */ }
    dispatch(logout());
    setIsCreator(false);
    setAccountMenuOpen(false);
    
    // Only redirect if on a protected creator page
    if (pathname.startsWith('/creator')) {
      router.push('/');
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-[#0a0b0d]/90 backdrop-blur-md z-40 flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsOpen(!isOpen)} className="text-white p-1 hover:bg-white/10 rounded-md transition-colors mr-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">S</div>
        </div>
        {isAuthenticated && (
          <div className="flex items-center bg-black/50 rounded-full p-1 border border-white/10">
            <button onClick={() => handleToggle(false)} className={`text-xs px-3 py-1 rounded-full transition-all ${!isCreator ? 'bg-white/20 text-white' : 'text-gray-400'}`}>Listener</button>
            <button onClick={() => handleToggle(true)} className={`text-xs px-3 py-1 rounded-full transition-all ${isCreator ? 'bg-white/20 text-white' : 'text-gray-400'}`}>Creator</button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-screen w-64 bg-[#0a0b0d]/95 md:bg-[#0a0b0d] backdrop-blur-xl border-r border-white/5 flex flex-col pt-4 md:pt-8 pb-32 px-4 z-50 transition-transform duration-300 overflow-y-auto custom-scrollbar ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

        <div className="md:hidden flex justify-end mb-4">
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="mb-8 px-2 flex flex-col gap-6">
          <div className="flex justify-center md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">S</div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Soundr</span>
            </div>
          </div>

          {isAuthenticated && (
            <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/5 mx-2 relative">
              <div className="flex w-full">
                <button onClick={() => handleToggle(false)} className={`flex-1 text-sm py-1.5 rounded-full z-10 font-medium transition-colors ${!isCreator ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>Listener</button>
                <button onClick={() => handleToggle(true)} className={`flex-1 text-sm py-1.5 rounded-full z-10 font-medium transition-colors ${isCreator ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>Creator</button>
              </div>
              <div className={`absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-full transition-transform duration-300 ${isCreator ? 'translate-x-full' : 'translate-x-0'}`} />
            </div>
          )}
        </div>

        <nav className="flex flex-col w-full gap-2">
          <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-3 py-2.5 text-white bg-white/10 rounded-lg transition-colors font-medium hover:text-white">
            <svg className="w-5 h-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-base">Home</span>
          </Link>
          <button 
            onClick={() => {
              setSearchModalOpen(true);
              setIsOpen(false);
            }} 
            className="flex items-center gap-4 px-3 py-2.5 text-gray-400 hover:text-white transition-colors font-medium w-full text-left"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span className="text-base">Search</span>
          </button>
          <Link href={isCreator ? "/creator/podcasts" : "/discover"} onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-3 py-2.5 text-gray-400 hover:text-white transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            <span className="text-base">{isCreator ? 'Podcast' : 'Discover'}</span>
          </Link>
          <Link href="#library" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-3 py-2.5 text-gray-400 hover:text-white transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            <span className="text-base">Library</span>
          </Link>
        </nav>

        <div className="mt-8 px-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Playlists</h3>
          <div className="flex flex-col gap-3">
            <Link href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors truncate">Deep Focus Mix</Link>
            <Link href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors truncate">Summer Hits 2024</Link>
            <Link href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors truncate">Indie Discoveries</Link>
            <Link href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors truncate">Workout Energy</Link>
          </div>
        </div>

        {/* Account Section */}
        <div className="relative mt-auto px-3 border-t border-white/5 pt-6">
          <button
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            className="w-full flex items-center justify-between hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-xs font-bold text-white uppercase shadow-md">
                {isAuthenticated && user ? user.username?.charAt(0) : '?'}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-white">{isAuthenticated && user ? user.username : 'Account'}</span>
                <span className="text-xs text-gray-500">{isAuthenticated ? 'Free Tier' : 'Guest'}</span>
              </div>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </button>

          {accountMenuOpen && (
            <div className="absolute bottom-full left-0 w-full mb-3 bg-[#13151a] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col p-1.5 z-50">
              {isAuthenticated ? (
                <button onClick={handleLogout} className="text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors font-semibold">
                  Log out
                </button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setAccountMenuOpen(false)} className="px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium">Log in</Link>
                  <Link href="/signup" onClick={() => setAccountMenuOpen(false)} className="px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium">Sign up for free</Link>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      <SearchModal 
        isOpen={searchModalOpen} 
        onClose={() => setSearchModalOpen(false)} 
      />
    </>
  );
}
