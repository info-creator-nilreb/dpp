"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface SubscriptionData {
  id: string;
  plan: string; // Plan slug (e.g. "basic", "pro", "premium")
  planName?: string | null; // Full plan name for display (e.g. "Basic", "Pro", "Premium")
  status: string;
  trialExpiresAt: string | null;
  trialStartedAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionResponse {
  subscription: SubscriptionData | null;
  capabilities: any;
  trialDaysRemaining: number | null;
  organization: {
    id: string;
    name: string;
  };
}

export function SubscriptionPageContent() {
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/app/account/subscription");
        if (!response.ok) {
          throw new Error("Failed to fetch subscription");
        }
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  const subscription = data?.subscription;
  const trialDaysRemaining = data?.trialDaysRemaining;
  const isTrial = subscription?.status === "trial_active";

  const mutate = async () => {
    try {
      const response = await fetch("/api/app/account/subscription");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error("Error refreshing subscription:", err);
    }
  };

  const handleUpgrade = async (plan: string) => {
    setUpgrading(true);
    setUpgradePlan(plan);

    try {
      const response = await fetch("/api/app/account/subscription/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        await mutate(); // Refresh data
        alert("Upgrade erfolgreich!");
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error || "Upgrade fehlgeschlagen"}`);
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Fehler beim Upgrade. Bitte versuchen Sie es erneut.");
    } finally {
      setUpgrading(false);
      setUpgradePlan(null);
    }
  };

  const getPlanName = (plan: string, planName?: string | null) => {
    // Use planName from API if available (from subscriptionModel.pricingPlan.name)
    if (planName) {
      return planName;
    }
    // Fallback to mapping if planName not available
    const names: Record<string, string> = {
      basic: "Basic",
      pro: "Pro",
      premium: "Premium",
    };
    return names[plan.toLowerCase()] || plan;
  };

  const getStatusName = (status: string) => {
    const { getSubscriptionStatusLabel } = require("@/lib/subscription-status-labels");
    return getSubscriptionStatusLabel(status);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !subscription) {
    return (
      <div style={{ padding: "2rem" }}>
        <Link
          href="/app/account"
          style={{
            color: "#7A7A7A",
            textDecoration: "none",
            fontSize: "0.95rem",
            marginBottom: "1rem",
            display: "inline-block",
          }}
        >
          ← Zurück zu Meine Daten
        </Link>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "1rem" }}>
          Abonnement
        </h1>
        <p style={{ color: "#7A7A7A" }}>
          Kein Abonnement gefunden. Bitte kontaktieren Sie den Support.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <Link
        href="/app/account"
        style={{
          color: "#7A7A7A",
          textDecoration: "none",
          fontSize: "0.95rem",
          marginBottom: "1rem",
          display: "inline-block",
        }}
      >
        ← Zurück zu Meine Daten
      </Link>

      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "700",
          marginBottom: "0.5rem",
        }}
      >
        Abonnement
      </h1>

      <p style={{ color: "#7A7A7A", marginBottom: "2rem" }}>
        Verwalten Sie Ihr Abonnement und Plan-Details.
      </p>

      {/* Trial Banner */}
      {isTrial && trialDaysRemaining !== null && (
        <div
          style={{
            backgroundColor: "#FFF4E6",
            border: "1px solid #FFD700",
            borderRadius: "8px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#B8860B",
              marginBottom: "0.5rem",
            }}
          >
            Testphase aktiv - {trialDaysRemaining} Tag
            {trialDaysRemaining !== 1 ? "e" : ""} verbleibend
          </h2>
          <p style={{ color: "#856404", marginBottom: "1rem" }}>
            Sie nutzen aktuell eine Premium-Testphase. Upgrade jetzt, um Publishing
            zu aktivieren und den Zugriff nach dem Ende der Testphase aufrechtzuerhalten.
          </p>
        </div>
      )}

      {/* Current Plan */}
      <div
        style={{
          backgroundColor: "#F9F9F9",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            marginBottom: "1rem",
          }}
        >
          Aktueller Plan
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <strong>Plan:</strong> {getPlanName(subscription.plan, subscription.planName)}
          </div>
          <div>
            <strong>Status:</strong> {getStatusName(subscription.status)}
          </div>
          {subscription.currentPeriodEnd && (
            <div>
              <strong>Ablaufdatum:</strong>{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString("de-DE")}
            </div>
          )}
          {subscription.cancelAtPeriodEnd && (
            <div style={{ color: "#24c598", fontWeight: "600" }}>
              Abonnement wird am Periodenende gekündigt
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Options */}
      {isTrial && (
        <div style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              marginBottom: "1rem",
            }}
          >
            Plan upgraden
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {["basic", "pro", "premium"].map((plan) => (
              <div
                key={plan}
                style={{
                  border:
                    subscription.plan === plan
                      ? "2px solid #24c598"
                      : "1px solid #DDD",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  textAlign: "center",
                }}
              >
                <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  {getPlanName(plan)}
                </h3>
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={upgrading || subscription.plan === plan}
                  style={{
                    backgroundColor:
                      subscription.plan === plan ? "#CCC" : "#24c598",
                    color: "white",
                    border: "none",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "6px",
                    cursor:
                      upgrading || subscription.plan === plan
                        ? "not-allowed"
                        : "pointer",
                    width: "100%",
                    marginTop: "1rem",
                  }}
                >
                  {upgrading && upgradePlan === plan
                    ? "Wird aktualisiert..."
                    : subscription.plan === plan
                    ? "Aktueller Plan"
                    : "Upgrade"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

