"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { getSubscriptionStatusLabel } from "@/lib/subscription-status-labels";
import type { SubscriptionStatus, UsageData } from "@/components/SubscriptionUsageCard";

export interface SubscriptionStatusBadgeProps {
  statusData: SubscriptionStatus | null;
  usageData: UsageData | null;
}

function daysRemaining(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const end = new Date(isoDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function SubscriptionStatusBadge({
  statusData,
  usageData,
}: SubscriptionStatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const subscription = statusData?.subscription || usageData?.subscription;
  const planName = subscription?.pricingPlan?.name ?? "—";
  const isTrial = statusData?.subscriptionState === "trial_subscription";
  const trialDays = isTrial && statusData?.trialEndDate
    ? daysRemaining(statusData.trialEndDate)
    : null;

  const label =
    trialDays !== null && trialDays > 0
      ? `${planName} · Testphase (${trialDays} ${trialDays === 1 ? "Tag" : "Tage"} verbleibend)`
      : `${planName} · ${subscription ? getSubscriptionStatusLabel(subscription.status) : "—"}`;

  const teamEntitlement = usageData?.entitlements?.find((e) => e.key === "max_users");
  const storageEntitlement = usageData?.entitlements?.find((e) => e.key === "max_storage_gb");
  const publishedEntitlement = usageData?.entitlements?.find((e) => e.key === "max_published_dpp");

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          padding: "0.5rem 0.75rem",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          backgroundColor: "#FFFFFF",
          color: "#374151",
          fontSize: "0.875rem",
          fontWeight: "500",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {label}
        <span style={{ marginLeft: "0.25rem" }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "0.5rem",
            width: "100%",
            maxWidth: "320px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>Plan</span>
              <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>{planName}</span>
            </div>
            {subscription?.priceSnapshot && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>Preis</span>
                <span style={{ fontSize: "0.875rem" }}>
                  {(subscription.priceSnapshot.amount / 100).toFixed(2)} {subscription.priceSnapshot.currency}
                  {subscription.subscriptionModel && (
                    <span style={{ color: "#6B7280", marginLeft: "0.25rem" }}>
                      / {subscription.subscriptionModel.billingInterval === "monthly" ? "Monat" : "Jahr"}
                    </span>
                  )}
                </span>
              </div>
            )}
            {subscription && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>Status</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "500",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    backgroundColor: subscription.status === "active" ? "#D1FAE5" : "#FEF3C7",
                    color: subscription.status === "active" ? "#065F46" : "#92400E",
                  }}
                >
                  {getSubscriptionStatusLabel(subscription.status)}
                </span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>Veröffentlichung</span>
              <span style={{ fontSize: "0.875rem" }}>
                {statusData?.canPublish ? "Erlaubt" : "Nicht erlaubt"}
              </span>
            </div>
            {teamEntitlement && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{teamEntitlement.label}</span>
                <span style={{ fontSize: "0.875rem" }}>
                  {teamEntitlement.current}
                  {teamEntitlement.limit != null && ` / ${teamEntitlement.limit}`}
                </span>
              </div>
            )}
            {storageEntitlement && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{storageEntitlement.label}</span>
                <span style={{ fontSize: "0.875rem" }}>
                  {storageEntitlement.current} {storageEntitlement.unit ?? "GB"}
                  {storageEntitlement.limit != null && ` / ${storageEntitlement.limit}`}
                </span>
              </div>
            )}
            {publishedEntitlement && !teamEntitlement && !storageEntitlement && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{publishedEntitlement.label}</span>
                <span style={{ fontSize: "0.875rem" }}>
                  {publishedEntitlement.current}
                  {publishedEntitlement.limit != null && ` / ${publishedEntitlement.limit}`}
                </span>
              </div>
            )}
            <div style={{ borderTop: "1px solid #E5E7EB", marginTop: "0.25rem", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Link
                href="/pricing"
                style={{
                  fontSize: "0.875rem",
                  color: "#24c598",
                  fontWeight: "500",
                  textDecoration: "none",
                }}
              >
                Upgrade
              </Link>
              <Link
                href="/app/organization/subscription"
                style={{
                  fontSize: "0.875rem",
                  color: "#24c598",
                  fontWeight: "500",
                  textDecoration: "none",
                }}
              >
                Abo verwalten
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
