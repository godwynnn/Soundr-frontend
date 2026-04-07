"use client";
import { useEffect } from "react";

export default function KeepAlive() {
  useEffect(() => {
    // Keep-alive is now handled by the backend cron job (apscheduler).
    // This frontend component is preserved as a no-op to maintain layout compatibility.
  }, []);

  return null;
}
