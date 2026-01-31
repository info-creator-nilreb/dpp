"use client"

import { useState, useEffect, useRef } from "react"
import { MenuIcon } from "./PublicIcons"
import EasyPassLogo from "./EasyPassLogo"

interface PublicHeaderProps {
  onMenuClick: () => void
}

export default function PublicHeader({ onMenuClick }: PublicHeaderProps) {
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
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 1.5rem",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E5E5E5",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        transform: "translateY(0)",
        transition: "transform 0.3s ease",
        opacity: isVisible ? 1 : 0
      }}
    >
      <EasyPassLogo size={32} color="#24c598" iconOnly={false} textColor="#0A0A0A" />
      <button
        onClick={onMenuClick}
        style={{
          backgroundColor: "transparent",
          border: "1px solid #24c598",
          borderRadius: "6px",
          padding: "0.5rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#24c598",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#24c598"
          e.currentTarget.style.color = "#FFFFFF"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent"
          e.currentTarget.style.color = "#24c598"
        }}
        aria-label="Menu öffnen"
      >
        <MenuIcon />
      </button>
    </header>
  )
}

