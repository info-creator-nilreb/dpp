"use client"

import { MenuIcon } from "./Icons"

interface MobileHeaderProps {
  onMenuClick: () => void
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (min-width: 768px) {
            .super-admin-mobile-header {
              display: none !important;
            }
          }
          @media (max-width: 767px) {
            .super-admin-mobile-header {
              display: flex !important;
            }
          }
        `
      }} />
      <header
        className="super-admin-mobile-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.5rem",
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E5E5E5",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0A0A0A" }}>
          Super Admin
        </h1>
        <button
          onClick={onMenuClick}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #E5E5E5",
            borderRadius: "6px",
            padding: "0.5rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Menu öffnen"
        >
          <MenuIcon />
        </button>
      </header>
    </>
  )
}
