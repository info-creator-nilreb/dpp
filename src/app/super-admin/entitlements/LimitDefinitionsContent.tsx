"use client"

import Link from "next/link"
import { getEntitlementDefinition } from "@/lib/pricing/entitlement-definitions"
import { getEntitlementIcon } from "@/components/EntitlementIcons"

interface Entitlement {
  id: string
  key: string
  type: string
  unit: string | null
}

interface LimitDefinitionsContentProps {
  entitlements: Entitlement[]
}

export default function LimitDefinitionsContent({
  entitlements
}: LimitDefinitionsContentProps) {
  if (entitlements.length === 0) {
    return (
      <div style={{
        padding: "3rem",
        textAlign: "center",
        backgroundColor: "#F9F9F9",
        borderRadius: "12px",
        border: "1px solid #E5E5E5"
      }}>
        <p style={{ color: "#7A7A7A", fontSize: "1rem", marginBottom: "1rem" }}>
          Noch keine Limit-Definitionen vorhanden
        </p>
        <p style={{ fontSize: "0.875rem", color: "#9A9A9A", marginBottom: "1.5rem" }}>
          Limit-Definitionen werden systemweit verwaltet. Kontaktieren Sie einen Entwickler, um neue Definitionen hinzuzufügen.
        </p>
        <Link
          href="/super-admin/pricing"
          style={{
            backgroundColor: "#E20074",
            color: "#FFFFFF",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: "600",
            display: "inline-block"
          }}
        >
          Zu Pricing Plans
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        padding: "1rem",
        backgroundColor: "#F0F9FF",
        border: "1px solid #BAE6FD",
        borderRadius: "8px",
        marginBottom: "1.5rem"
      }}>
        <p style={{
          fontSize: "0.875rem",
          color: "#0369A1",
          margin: 0,
          lineHeight: "1.5"
        }}>
          <strong>Hinweis:</strong> Diese Seite zeigt nur die verfügbaren Limit-Definitionen an. 
          Um Limits für Pricing Plans zu konfigurieren, gehen Sie zu{" "}
          <Link href="/super-admin/pricing" style={{ color: "#E20074", textDecoration: "underline" }}>
            Preise & Abos
          </Link>{" "}
          und bearbeiten Sie einen Pricing Plan.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1rem"
      }}>
        {entitlements.map((entitlement) => {
          const definition = getEntitlementDefinition(entitlement.key)
          const icon = getEntitlementIcon(definition.icon, 24, "#7A7A7A")

          return (
            <div
              key={entitlement.id}
              style={{
                padding: "1.5rem",
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                border: "1px solid #E5E5E5"
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                marginBottom: "1rem"
              }}>
                {icon && (
                  <div style={{ flexShrink: 0 }}>
                    {icon}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#0A0A0A",
                    marginBottom: "0.25rem",
                    wordWrap: "break-word",
                    overflowWrap: "break-word"
                  }}>
                    {definition.label}
                  </div>
                  <div style={{
                    fontSize: "0.75rem",
                    color: "#7A7A7A",
                    fontFamily: "monospace",
                    marginBottom: "0.5rem",
                    backgroundColor: "#F5F5F5",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    display: "inline-block"
                  }}>
                    {entitlement.key}
                  </div>
                  <p style={{
                    fontSize: "0.75rem",
                    color: "#7A7A7A",
                    margin: 0,
                    lineHeight: "1.4"
                  }}>
                    {definition.description}
                  </p>
                </div>
              </div>
              <div style={{
                display: "flex",
                gap: "0.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid #F0F0F0"
              }}>
                <span style={{
                  padding: "0.25rem 0.75rem",
                  backgroundColor: "#F0F9FF",
                  color: "#0369A1",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: "500"
                }}>
                  {entitlement.type === "limit" ? "Limit" : "Boolean"}
                </span>
                {entitlement.unit && (
                  <span style={{
                    padding: "0.25rem 0.75rem",
                    backgroundColor: "#F5F5F5",
                    color: "#7A7A7A",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: "500"
                  }}>
                    {entitlement.unit}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


