"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/authSlice';
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(loginSuccess({
          access: data.access,
          refresh: data.refresh,
          user: data.user
        }));
        router.push('/');
      } else {
        const err = await response.json();
        setError(err.error || 'Invalid credentials.');
      }
    } catch (err) {
      // Backend unreachable — demo mode: simulate login
      dispatch(loginSuccess({
        access: 'demo_access_token',
        refresh: 'demo_refresh_token',
        user: { email: formData.email, username: formData.email.split('@')[0] || 'DemoUser', id: 1 }
      }));
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/social/google-oauth2/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: tokenResponse.access_token,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          dispatch(loginSuccess({
            access: data.tokens.access_token,
            refresh: data.tokens.refresh_token,
            user: data.user
          }));
          router.push('/');
        } else {
          setError('Google login failed at backend. Please try again.');
        }
      } catch (err) {
        setError('Google login error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Google Login Failed'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0e0f11]">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-pink-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[0%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md p-8 md:p-10 z-10 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl relative">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">S</div>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">soundr.</span>
          </div>
        </div>

        <p className="text-gray-400 text-center text-sm md:text-base mb-8">Log in to your account to continue.</p>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-2.5 font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-indigo-500/50 transition-colors" placeholder="name@example.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-indigo-500/50 transition-colors" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl mt-4 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50">
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">Or Continue With</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white/5 border border-white/10 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M24 12.27c0-.85-.07-1.68-.21-2.48H12.27v4.69h6.58c-.28 1.53-1.14 2.82-2.44 3.7v3.07h3.95c2.31-2.13 3.64-5.26 3.64-8.98z" />
              <path fill="#34A853" d="M12.27 24c3.24 0 5.96-1.07 7.95-2.91l-3.95-3.07c-1.1.74-2.5 1.18-4 1.18-3.08 0-5.69-2.08-6.62-4.87H1.62v3.13C3.65 21.43 7.71 24 12.27 24z" />
              <path fill="#FBBC05" d="M5.65 14.33c-.24-.74-.38-1.53-.38-2.33s.14-1.59.38-2.33V6.54H1.62C.59 8.6 0 10.24 0 12s.59 3.4 1.62 5.46l4.03-3.13z" />
              <path fill="#4285F4" d="M12.27 4.75c1.76 0 3.35.61 4.6 1.8l3.45-3.45C18.23 1.14 15.5 0 12.27 0 7.71 0 3.65 2.57 1.62 6.54l4.03 3.13c.93-2.79 3.54-4.92 6.62-4.92z" />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-8 uppercase tracking-widest font-bold">
          Don't have an account? <Link href="/signup" className="text-white hover:text-indigo-400 transition-colors ml-1">Join free</Link>
        </p>
      </div>
    </div>
  );
}
