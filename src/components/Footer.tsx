"use client"

import { useState } from "react"
import Link from "next/link"

export default function Footer() {
  const [isLoginHovered, setIsLoginHovered] = useState(false)
  
  return (
    <footer style={{
      padding: 'clamp(1.5rem, 4vw, 2rem)',
      textAlign: 'center',
      backgroundColor: '#121212',
      color: '#FFFFFF'
    }}>
      <nav aria-label="Footer-Navigation" style={{
        marginBottom: '1rem'
      }}>
        <Link
          href="/login"
          style={{
            color: isLoginHovered ? '#FFFFFF' : '#CDCDCD',
            textDecoration: isLoginHovered ? 'underline' : 'none',
            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
            fontWeight: '400',
            transition: 'color 0.2s ease, text-decoration 0.2s ease'
          }}
          onMouseEnter={() => setIsLoginHovered(true)}
          onMouseLeave={() => setIsLoginHovered(false)}
        >
          Login
        </Link>
      </nav>
      <p style={{ margin: 0, opacity: 0.8, color: '#CDCDCD', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
        © 2025 T-Pass. Alle Rechte vorbehalten.
      </p>
    </footer>
  )
}

