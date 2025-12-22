interface StatCardProps {
  label: string
  value: number | string
}

/**
 * Stat Card - Compact, read-only KPI cards
 * Used in "Systemüberblick" section
 */
export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#FAFAFA",
        border: "1px solid #E5E5E5",
        borderRadius: "8px",
        padding: "1.25rem",
        textAlign: "center",
      }}
    >
      <div style={{
        fontSize: "2rem",
        fontWeight: "700",
        color: "#0A0A0A",
        marginBottom: "0.5rem",
      }}>
        {value}
      </div>
      <div style={{
        fontSize: "0.875rem",
        color: "#7A7A7A",
        fontWeight: "500",
      }}>
        {label}
      </div>
    </div>
  )
}

