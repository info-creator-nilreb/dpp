/**
 * Super-Admin: Abrechnung & Erlöse
 * Systemübersicht, Rechnungen (filterbar), Debug-fähig.
 */

import { requireSuperAdminPermission } from "@/lib/super-admin-guards"
import BillingRevenueContent from "./BillingRevenueContent"

export const dynamic = "force-dynamic"

export default async function SuperAdminBillingPage() {
  await requireSuperAdminPermission("billing", "read")

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "clamp(1rem, 3vw, 2rem)",
        boxSizing: "border-box",
        width: "100%",
        overflowX: "hidden",
      }}
    >
      <BillingRevenueContent />
    </div>
  )
}
