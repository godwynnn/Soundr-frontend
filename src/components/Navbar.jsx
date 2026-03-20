import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0e0f11]/80 backdrop-blur-md border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-pink-500/50 transition duration-300">
                S
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                soundr
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <Link href="#trending" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium tracking-wide">
              Trending
            </Link>
            <Link href="#discover" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium tracking-wide">
              Discover
            </Link>
            <Link href="#categories" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium tracking-wide">
              Categories
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/listener/home" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition duration-200">
              Log In
            </Link>
            <Link href="/signup" className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
