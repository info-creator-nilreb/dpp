"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface TrialBannerProps {
  daysRemaining: number | null;
  plan?: string;
  onUpgrade?: () => void;
}

export function TrialBanner({
  daysRemaining,
  plan = "premium",
  onUpgrade,
}: TrialBannerProps) {
  const router = useRouter();

  if (daysRemaining === null) {
    return null;
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push("/app/account/subscription");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#FFF4E6",
        border: "1px solid #FFD700",
        borderRadius: "8px",
        padding: "1rem 1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <div style={{ flex: 1, minWidth: "200px" }}>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: "600",
            color: "#B8860B",
            marginBottom: "0.5rem",
          }}
        >
          Trial aktiv - {daysRemaining} Tag{daysRemaining !== 1 ? "e" : ""} verbleibend
        </h3>
        <p style={{ color: "#856404", fontSize: "0.95rem", margin: 0 }}>
          Sie nutzen aktuell einen {plan === "premium" ? "Premium" : plan}-Trial.
          Upgrade jetzt, um Publishing zu aktivieren und den Zugriff nach dem
          Trial-Ende aufrechtzuerhalten.
        </p>
      </div>
      <div>
        <Link
          href="/app/account/subscription"
          onClick={(e) => {
            e.preventDefault();
            handleUpgrade();
          }}
          style={{
            backgroundColor: "#E20074",
            color: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "500",
            display: "inline-block",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#C1005F";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#E20074";
          }}
        >
          Jetzt upgraden
        </Link>
      </div>
    </div>
  );
}


