"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import AuthGuard from "@/components/AuthGuard";

export default function ProfileRedirect() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(`/profile/${user.id}`);
    }
  }, [user, isAuthenticated, router]);

  return (
    <AuthGuard>
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </AuthGuard>
  );
}
