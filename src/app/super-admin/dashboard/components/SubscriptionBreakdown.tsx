interface SubscriptionBreakdownProps {
  subscriptions: {
    trial: number;
    basic: number;
    pro: number;
    premium: number;
  };
}

/**
 * Subscription Breakdown Component
 * 
 * Compact breakdown of subscriptions by type
 */
export default function SubscriptionBreakdown({
  subscriptions,
}: SubscriptionBreakdownProps) {
  const total =
    subscriptions.trial +
    subscriptions.basic +
    subscriptions.pro +
    subscriptions.premium;

  const items = [
    { label: "Testphase", value: subscriptions.trial, color: "#94A3B8" },
    { label: "Basic", value: subscriptions.basic, color: "#64748B" },
    { label: "Pro", value: subscriptions.pro, color: "#3B82F6" },
    { label: "Premium", value: subscriptions.premium, color: "#24c598" },
  ];

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E5E5",
        borderRadius: "8px",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "#0A0A0A",
          marginBottom: "1rem",
        }}
      >
        Subscriptions nach Typ
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {items.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.25rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: "#7A7A7A",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#0A0A0A",
                  }}
                >
                  {item.value}
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  backgroundColor: "#F5F5F5",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: "100%",
                    backgroundColor: item.color,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

