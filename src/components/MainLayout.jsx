"use client";
import Sidebar from "./Sidebar";
import GlobalPlayer from "./GlobalPlayer";
import { usePathname } from "next/navigation";

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <>
      {!isAuthPage && <Sidebar />}
      <main className={isAuthPage 
        ? "w-full h-screen overflow-y-auto relative" 
        : "flex-1 md:ml-64 h-full overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 pb-32 md:pb-24 scroll-smooth scrollbar-hide w-full"
      }>
        {children}
      </main>
      <GlobalPlayer />
    </>
  );
}
