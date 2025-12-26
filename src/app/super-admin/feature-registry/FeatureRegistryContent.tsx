"use client";

import { useState } from "react";
import { FeatureEditor } from "./FeatureEditor";
import FeatureFilterBar from "./FeatureFilterBar";

interface Feature {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  minimumPlan: string;
  enabled: boolean;
}

interface FeatureRegistryContentProps {
  features: Feature[];
  availableCategories: string[];
  currentFilters: {
    category: string;
    minimumPlan: string;
    status: string;
  };
}

const categoryLabels: Record<string, string> = {
  core: "Kern",
  content: "Inhalt",
  interaction: "Interaktion",
  styling: "Gestaltung",
  publishing: "Veröffentlichung",
};

const planLabels: Record<string, string> = {
  basic: "Basic",
  pro: "Pro",
  premium: "Premium",
};

export default function FeatureRegistryContent({
  features,
  availableCategories,
  currentFilters,
}: FeatureRegistryContentProps) {
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleToggleEnabled = async (feature: Feature) => {
    try {
      const response = await fetch(`/api/super-admin/feature-registry/${feature.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled: !feature.enabled }),
      });

      if (response.ok) {
        // Reload page to reflect changes (server-side filtering)
        window.location.reload();
      }
    } catch (error) {
      console.error("Error toggling feature:", error);
      alert("Fehler beim Aktualisieren des Features");
    }
  };

  return (
    <>
      {/* Filter Bar */}
      <FeatureFilterBar
        availableCategories={availableCategories}
        currentFilters={currentFilters}
      />

      {/* Header with Create Button */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p style={{ color: "#7A7A7A", fontSize: "0.875rem" }}>
            {features.length} {features.length === 1 ? "Funktion" : "Funktionen"}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            backgroundColor: "#E20074",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "0.875rem",
          }}
        >
          Neues Feature
        </button>
      </div>

      {/* Feature List */}
      <div style={{ display: "grid", gap: "1rem" }}>
        {features.map((feature) => (
          <div
            key={feature.id}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E5E5",
              borderRadius: "8px",
              padding: "1.5rem",
            }}
          >
            {/* Header: Identity + Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1.5rem",
                marginBottom: "1rem",
              }}
            >
              {/* Identity */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    color: "#0A0A0A",
                  }}
                >
                  {feature.name}
                </h3>
                {feature.description && (
                  <p style={{ color: "#7A7A7A", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                    {feature.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  onClick={() => setEditingFeature(feature)}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #CDCDCD",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0A0A0A",
                  }}
                  title="Bearbeiten"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleToggleEnabled(feature)}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #DC3545",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#DC3545",
                  }}
                  title={feature.enabled ? "Deaktivieren" : "Aktivieren"}
                >
                  {feature.enabled ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Meta Info: Badges */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              {/* Category - Neutral grey */}
              <span
                style={{
                  backgroundColor: "#64748B",
                  color: "white",
                  padding: "0.25rem 0.625rem",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                }}
              >
                {categoryLabels[feature.category] || feature.category}
              </span>

              {/* Plan - Distinct colors */}
              <span
                style={{
                  backgroundColor:
                    feature.minimumPlan === "basic"
                      ? "#64748B"
                      : feature.minimumPlan === "pro"
                        ? "#3B82F6"
                        : "#E20074",
                  color: "white",
                  padding: "0.25rem 0.625rem",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                }}
              >
                {planLabels[feature.minimumPlan] || feature.minimumPlan}
              </span>

              {/* Status - Green for active, grey for inactive */}
              <span
                style={{
                  backgroundColor: feature.enabled ? "#10B981" : "#94A3B8",
                  color: "white",
                  padding: "0.25rem 0.625rem",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                }}
              >
                {feature.enabled ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {features.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#7A7A7A" }}>
          Keine Funktionen gefunden
        </div>
      )}

      {/* Feature Editor Modal */}
      {(showCreateForm || editingFeature) && (
        <FeatureEditor
          feature={editingFeature}
          onSave={() => {
            setShowCreateForm(false);
            setEditingFeature(null);
            window.location.reload();
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingFeature(null);
          }}
        />
      )}
    </>
  );
}
