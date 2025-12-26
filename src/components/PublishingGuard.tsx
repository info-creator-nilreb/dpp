"use client";

import { useCapabilities } from "@/hooks/useCapabilities";
import { TrialBanner } from "./TrialBanner";

interface PublishingGuardProps {
  dppId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PublishingGuard({
  dppId,
  children,
  fallback,
}: PublishingGuardProps) {
  const { capabilities, isTrial, trialDaysRemaining, subscription, isLoading } =
    useCapabilities(dppId);

  if (isLoading) {
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>Laden...</div>
    );
  }

  if (!capabilities.publishing) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div>
        {isTrial && (
          <TrialBanner
            daysRemaining={trialDaysRemaining}
            plan={subscription?.plan}
          />
        )}
        <div
          style={{
            border: "2px solid #FFD700",
            borderRadius: "8px",
            padding: "1.5rem",
            backgroundColor: "#FFF9E6",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#B8860B", marginBottom: "0.5rem" }}>
            Publishing nicht verfügbar
          </h3>
          <p style={{ color: "#856404", marginBottom: "1rem" }}>
            {isTrial
              ? "Sie befinden sich im Trial. Upgrade jetzt, um DPPs zu veröffentlichen."
              : "Bitte upgraden Sie Ihren Plan, um Publishing zu aktivieren."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


