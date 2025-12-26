/**
 * AUTO LOGOUT AFTER 60 MINUTES OF INACTIVITY
 * 
 * Client-side inactivity tracking:
 * - Tracks mouse, keyboard, navigation events
 * - Resets timer on activity
 * - After 60 minutes: calls logout + redirects to login
 */

"use client";

import { useEffect, useRef } from "react";

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 60 minutes in milliseconds

interface UseAutoLogoutOptions {
  timeout?: number; // in milliseconds
  onLogout?: () => void;
  enabled?: boolean;
}

export function useAutoLogout(options: UseAutoLogoutOptions = {}) {
  const {
    timeout = INACTIVITY_TIMEOUT,
    onLogout,
    enabled = true,
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = () => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();

    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeout);
  };

  const handleLogout = async () => {
    // Clear timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Call custom logout handler if provided
    if (onLogout) {
      onLogout();
      return;
    }

    // Default logout behavior
    const currentPath = window.location.pathname;
    const isSuperAdmin = currentPath.startsWith("/super-admin");
    const logoutPath = isSuperAdmin
      ? "/api/super-admin/auth/logout"
      : "/api/auth/signout";
    const loginPath = isSuperAdmin ? "/super-admin/login" : "/login";

    try {
      // Call logout endpoint (best effort)
      await fetch(logoutPath, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Auto logout API call failed:", error);
    }

    // Redirect to login
    window.location.href = loginPath;
  };

  useEffect(() => {
    if (!enabled) return;

    // Track user activity events
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, timeout]);

  // Reset timer on navigation (Next.js router events)
  useEffect(() => {
    if (!enabled) return;

    const handleRouteChange = () => {
      resetTimer();
    };

    // Listen to popstate (browser back/forward)
    window.addEventListener("popstate", handleRouteChange);

    // Also reset on focus (user returns to tab)
    window.addEventListener("focus", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("focus", handleRouteChange);
    };
  }, [enabled]);
}

