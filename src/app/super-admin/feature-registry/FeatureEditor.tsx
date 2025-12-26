"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { Tooltip, TooltipIcon } from "@/components/Tooltip";

interface Feature {
  id?: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  capabilityKey: string | null;
  minimumPlan: string;
  requiresActiveSubscription: boolean;
  requiresPublishingCapability: boolean;
  visibleInTrial: boolean;
  usableInTrial: boolean;
  configSchema: string | null;
  enabled: boolean;
  defaultForNewDpps: boolean;
}

interface FeatureEditorProps {
  feature: Feature | null;
  onSave: () => void;
  onCancel: () => void;
}

const categories = [
  { value: "core", label: "Kern" },
  { value: "content", label: "Inhalt" },
  { value: "interaction", label: "Interaktion" },
  { value: "styling", label: "Gestaltung" },
  { value: "publishing", label: "Veröffentlichung" },
];

const plans = [
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "premium", label: "Premium" },
];

const tooltips = {
  requiresActiveSubscription:
    "Das Feature ist nur verfügbar, wenn die Organisation eine aktive Subscription hat. Im Testzeitraum ist dies nicht der Fall.",
  requiresPublishingCapability:
    "Das Feature erfordert die Berechtigung zur Veröffentlichung. Im Testzeitraum können Inhalte nur als Entwurf oder Vorschau erstellt werden.",
  visibleInTrial:
    "Das Feature wird im Testzeitraum in der Benutzeroberfläche angezeigt, auch wenn es nicht genutzt werden kann.",
  usableInTrial:
    "Das Feature kann im Testzeitraum genutzt werden, jedoch nur für Entwürfe und Vorschauen. Veröffentlichungen sind nicht möglich.",
  defaultForNewDpps:
    "Das Feature wird automatisch allen neuen Digital Product Passports hinzugefügt, die nach der Aktivierung erstellt werden.",
};

export function FeatureEditor({ feature, onSave, onCancel }: FeatureEditorProps) {
  const [formData, setFormData] = useState<Feature>({
    key: "",
    name: "",
    description: "",
    category: "core",
    capabilityKey: "",
    minimumPlan: "basic",
    requiresActiveSubscription: true,
    requiresPublishingCapability: false,
    visibleInTrial: true,
    usableInTrial: true,
    configSchema: null,
    enabled: true,
    defaultForNewDpps: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (feature) {
      setFormData({
        ...feature,
        description: feature.description || "",
        capabilityKey: feature.capabilityKey || "",
      });
    }
  }, [feature]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        ...formData,
        description: formData.description || null,
        capabilityKey: formData.capabilityKey || null,
        configSchema: formData.configSchema
          ? typeof formData.configSchema === "string"
            ? JSON.parse(formData.configSchema)
            : formData.configSchema
          : null,
      };

      let response;
      if (feature?.id) {
        response = await apiFetch(`/api/super-admin/feature-registry/${feature.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await apiFetch("/api/super-admin/feature-registry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler beim Speichern");
      }

      onSave();
    } catch (err: any) {
      console.error("Error saving feature:", err);
      setError(err.message || "Fehler beim Speichern des Features");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          padding: "1.5rem",
          maxWidth: "700px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
          border: "1px solid #E5E5E5",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #E5E5E5" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem", color: "#0A0A0A" }}>
            Feature-Konfiguration
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#7A7A7A", margin: 0 }}>
            Systemweite Einstellungen für dieses Feature. Änderungen wirken sich auf alle Organisationen aus.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#FFF5F5",
              border: "1px solid #FCC",
              borderRadius: "6px",
              padding: "0.75rem",
              marginBottom: "1.5rem",
              color: "#DC3545",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "1.25rem" }}>
            {/* Section: Grunddaten */}
            <div>
              <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A", marginBottom: "0.75rem" }}>
                Grunddaten
              </h3>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.375rem",
                      color: "#0A0A0A",
                    }}
                  >
                    Technischer Schlüssel <span style={{ color: "#DC3545" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    required
                    disabled={!!feature?.id}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      border: "1px solid #CDCDCD",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                      backgroundColor: feature?.id ? "#F5F5F5" : "#FFFFFF",
                      color: feature?.id ? "#7A7A7A" : "#0A0A0A",
                    }}
                    placeholder="z.B. cms_access"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.375rem",
                      color: "#0A0A0A",
                    }}
                  >
                    Name <span style={{ color: "#DC3545" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      border: "1px solid #CDCDCD",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                    }}
                    placeholder="z.B. CMS-Zugriff"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.375rem",
                      color: "#0A0A0A",
                    }}
                  >
                    Beschreibung
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      border: "1px solid #CDCDCD",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                      resize: "vertical",
                    }}
                    placeholder="Optionale Beschreibung"
                  />
                </div>
              </div>
            </div>

            {/* Section: Zuordnung */}
            <div>
              <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A", marginBottom: "0.75rem" }}>
                Zuordnung
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.375rem",
                      color: "#0A0A0A",
                    }}
                  >
                    Kategorie <span style={{ color: "#DC3545" }}>*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      border: "1px solid #CDCDCD",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.375rem",
                      color: "#0A0A0A",
                    }}
                  >
                    Mindest-Plan <span style={{ color: "#DC3545" }}>*</span>
                  </label>
                  <select
                    value={formData.minimumPlan}
                    onChange={(e) => setFormData({ ...formData, minimumPlan: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      border: "1px solid #CDCDCD",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                    }}
                  >
                    {plans.map((plan) => (
                      <option key={plan.value} value={plan.value}>
                        {plan.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Erweiterte Einstellungen */}
            <div>
              <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0A0A0A", marginBottom: "0.75rem" }}>
                Erweiterte Einstellungen
              </h3>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.375rem",
                      color: "#0A0A0A",
                    }}
                  >
                    Capability-Schlüssel
                  </label>
                  <input
                    type="text"
                    value={formData.capabilityKey || ""}
                    onChange={(e) => setFormData({ ...formData, capabilityKey: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      border: "1px solid #CDCDCD",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                    }}
                    placeholder="z.B. cms_access"
                  />
                </div>

                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.requiresActiveSubscription}
                      onChange={(e) =>
                        setFormData({ ...formData, requiresActiveSubscription: e.target.checked })
                      }
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span>Aktive Subscription erforderlich</span>
                    <Tooltip content={tooltips.requiresActiveSubscription}>
                      <TooltipIcon />
                    </Tooltip>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.requiresPublishingCapability}
                      onChange={(e) =>
                        setFormData({ ...formData, requiresPublishingCapability: e.target.checked })
                      }
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span>Veröffentlichung erforderlich</span>
                    <Tooltip content={tooltips.requiresPublishingCapability}>
                      <TooltipIcon />
                    </Tooltip>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.visibleInTrial}
                      onChange={(e) => setFormData({ ...formData, visibleInTrial: e.target.checked })}
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span>Im Testzeitraum sichtbar</span>
                    <Tooltip content={tooltips.visibleInTrial}>
                      <TooltipIcon />
                    </Tooltip>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.usableInTrial}
                      onChange={(e) => setFormData({ ...formData, usableInTrial: e.target.checked })}
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span>Im Testzeitraum nutzbar</span>
                    <Tooltip content={tooltips.usableInTrial}>
                      <TooltipIcon />
                    </Tooltip>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.defaultForNewDpps}
                      onChange={(e) => setFormData({ ...formData, defaultForNewDpps: e.target.checked })}
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span>Standard für neue DPPs</span>
                    <Tooltip content={tooltips.defaultForNewDpps}>
                      <TooltipIcon />
                    </Tooltip>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span>Aktiviert</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #E5E5E5",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: "0.625rem 1.25rem",
                border: "1px solid #CDCDCD",
                borderRadius: "4px",
                backgroundColor: "#FFFFFF",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                color: "#0A0A0A",
              }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.625rem 1.25rem",
                border: "none",
                borderRadius: "4px",
                backgroundColor: loading ? "#CDCDCD" : "#E20074",
                color: "#FFFFFF",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              {loading ? "Wird gespeichert..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
