"use client";

/**
 * Auto Logout Provider
 * 
 * Client component wrapper for auto logout functionality.
 * Use this in server component layouts.
 */

import { useAutoLogout } from "@/hooks/useAutoLogout";

export function AutoLogoutProvider() {
  useAutoLogout({
    timeout: 60 * 60 * 1000, // 60 minutes
    enabled: true,
  });

  return null; // This component doesn't render anything
}

