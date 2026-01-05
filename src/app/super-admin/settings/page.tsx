/**
 * SUPER ADMIN SETTINGS PAGE
 * 
 * Configure Password Protection and other system settings
 * Requires: super_admin role
 */

import { getSuperAdminSession } from "@/lib/super-admin-auth"
import { requireSuperAdminRole } from "@/lib/super-admin-guards"
import { getPasswordProtectionConfig } from "@/lib/password-protection"
import PasswordProtectionSettings from "./PasswordProtectionSettings"

export const dynamic = "force-dynamic"

export default async function SuperAdminSettingsPage() {
  // Check auth and require super_admin role
  const session = await requireSuperAdminRole(["super_admin"])

  // Get current password protection config
  const config = await getPasswordProtectionConfig()

  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "0 auto", 
      padding: "clamp(1rem, 3vw, 2rem)",
      boxSizing: "border-box"
    }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: "700",
          color: "#0A0A0A",
          marginBottom: "0.5rem"
        }}>
          Einstellungen
        </h1>
        <p style={{ color: "#7A7A7A", fontSize: "clamp(0.9rem, 2vw, 1rem)" }}>
          Systemweite Konfigurationen und Einstellungen verwalten
        </p>
      </div>

      {/* Password Protection Settings */}
      <PasswordProtectionSettings initialConfig={config} adminId={session.id} />
    </div>
  )
}

