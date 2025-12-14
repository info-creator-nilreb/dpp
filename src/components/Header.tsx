"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

export default function Header() {
  const [isVisible, setIsVisible] = useState(false)
  const lastScrollY = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Header erscheint nur beim Scrollen nach oben (mit Verzögerung)
      if (currentScrollY < lastScrollY.current && currentScrollY > 100) {
        // Scrollen nach oben - Header erscheint mit Verzögerung
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          setIsVisible(true)
        }, 150) // 150ms Verzögerung
      } else if (currentScrollY > lastScrollY.current || currentScrollY < 50) {
        // Scrollen nach unten oder ganz oben - Header verstecken
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        setIsVisible(false)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Header komplett aus dem Layout entfernen wenn nicht sichtbar
  if (!isVisible) {
    return null
  }

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #CDCDCD",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        padding: "0.75rem 1.5rem",
        transform: "translateY(0)",
        transition: "transform 0.3s ease",
        opacity: isVisible ? 1 : 0
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem"
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "clamp(1rem, 3vw, 1.25rem)",
            fontWeight: "700",
            color: "#0A0A0A",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              stroke="#E20074"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              style={{ width: "100%", height: "100%" }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          T-Pass
        </Link>
        <Link
          href="/signup"
          style={{
            backgroundColor: "#E20074",
            color: "#FFFFFF",
            padding: "0.625rem 1.25rem",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "0.9rem",
            border: "2px solid #E20074",
            boxSizing: "border-box",
            display: "inline-block",
            whiteSpace: "nowrap"
          }}
        >
          Jetzt registrieren
        </Link>
      </div>
    </header>
  )
}

