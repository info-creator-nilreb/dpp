"use client"

import { MenuIcon } from "@/app/super-admin/components/Icons"
import EasyPassLogo from "@/components/EasyPassLogo"

interface MobileHeaderProps {
  onMenuClick: () => void
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (min-width: 768px) {
            .app-mobile-header {
              display: none !important;
            }
          }
          @media (max-width: 767px) {
            .app-mobile-header {
              display: flex !important;
            }
          }
        `
      }} />
      <header
        className="app-mobile-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.5rem",
          paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E5E5E5",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
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
    </>
  )
}

