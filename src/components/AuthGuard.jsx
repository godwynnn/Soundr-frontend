"use client";
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

/**
 * AuthGuard – wraps protected routes.
 * If the user is not authenticated, redirects to /login.
 */
export default function AuthGuard({ children }) {
  const { isAuthenticated, isRehydrated } = useSelector((state) => state.auth);
  const router = useRouter();
  
  useEffect(() => {
    // Only redirect if rehydration attempt is finished and user is definitely NOT authenticated
    if (isRehydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isRehydrated, router]);

  // If we haven't checked storage yet or are redirects are in flight, show loading
  if (!isRehydrated || (!isAuthenticated)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}
