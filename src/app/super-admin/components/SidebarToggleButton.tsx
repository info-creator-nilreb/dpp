"use client"

interface SidebarToggleButtonProps {
  isCollapsed: boolean
  onToggle: () => void
}

/**
 * Floating button to toggle sidebar visibility (shown when sidebar is collapsed)
 */
export default function SidebarToggleButton({ isCollapsed, onToggle }: SidebarToggleButtonProps) {
  if (!isCollapsed) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 767px) {
            .super-admin-sidebar-toggle-button {
              display: none !important;
            }
          }
        `
      }} />
      <button
        className="super-admin-sidebar-toggle-button"
        onClick={onToggle}
        style={{
          position: "fixed",
          left: "1rem",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 30,
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E5E5",
          borderRadius: "8px",
          padding: "0.75rem",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#4A4A4A",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#FAFAFA"
          e.currentTarget.style.borderColor = "#CDCDCD"
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#FFFFFF"
          e.currentTarget.style.borderColor = "#E5E5E5"
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)"
        }}
        aria-label="Menü einblenden"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </>
  )
}

