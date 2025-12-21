"use client"

import { ReactNode } from "react"

interface DashboardGridProps {
  children: ReactNode
}

/**
 * Dashboard Grid Wrapper
 * 
 * Client Component für responsive Grid-Layout
 * Desktop: 3 Spalten, Mobile: 1 Spalte
 */
export default function DashboardGrid({ children }: DashboardGridProps) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(1, 1fr)",
      gap: "1.5rem",
      marginBottom: "2rem",
      width: "100%",
      boxSizing: "border-box"
    }}
    className="dashboard-grid-responsive"
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          .dashboard-grid-responsive {
            grid-auto-rows: min-content;
          }
          @media (min-width: 768px) {
            .dashboard-grid-responsive {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
        `
      }} />
      {children}
    </div>
  )
}

