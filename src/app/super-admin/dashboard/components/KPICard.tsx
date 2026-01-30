interface KPICardProps {
  label: string;
  value: number | string;
  href?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

/**
 * KPI Card Component
 * 
 * Displays a single KPI with optional link and trend indicator
 */
export default function KPICard({ label, value, href, trend }: KPICardProps) {
  const content = (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: "8px",
        padding: "1.5rem",
        transition: "all 0.2s",
        ...(href && {
          cursor: "pointer",
        }),
      }}
      onMouseEnter={(e) => {
        if (href) {
          e.currentTarget.style.borderColor = "#24c598";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(36, 197, 152, 0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (href) {
          e.currentTarget.style.borderColor = "#E5E5E5";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
      onClick={() => {
        if (href) {
          window.location.href = href;
        }
      }}
    >
      <div
        style={{
          fontSize: "2.5rem",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "0.5rem",
          lineHeight: "1",
        }}
      >
        {typeof value === "number" ? value.toLocaleString("de-DE") : value}
      </div>
      <div
        style={{
          fontSize: "0.875rem",
          color: "#7A7A7A",
          fontWeight: "500",
          marginBottom: trend ? "0.5rem" : "0",
        }}
      >
        {label}
      </div>
      {trend && (
        <div
          style={{
            fontSize: "0.75rem",
            color: trend.isPositive ? "#10B981" : "#EF4444",
            marginTop: "0.5rem",
          }}
        >
          {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  );

  return content;
}

