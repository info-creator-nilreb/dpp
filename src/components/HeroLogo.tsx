"use client"

import { useState, useEffect } from "react"

export default function HeroLogo() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50
      setScrolled(isScrolled)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Logo wird ausgeblendet wenn gescrollt wurde
  if (scrolled) {
    return null
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: "2rem",
        transition: "opacity 0.3s ease"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(1rem, 3vw, 1.5rem)",
          marginBottom: "1.5rem"
        }}
      >
        <div
          style={{
            width: "clamp(100px, 18vw, 140px)",
            height: "clamp(100px, 18vw, 140px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
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
        <span
          style={{
            fontSize: "clamp(2rem, 6vw, 4rem)",
            fontWeight: "700",
            color: "#0A0A0A"
          }}
        >
          T-Pass
        </span>
      </div>
    </div>
  )
}

