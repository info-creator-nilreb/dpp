"use client"

import { useEffect, useState } from "react"
import TrialBanner from "@/components/TrialBanner"

export default function TrialBannerWrapper() {
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrganizationId() {
      try {
        const response = await fetch("/api/app/subscription/usage")
        if (response.ok) {
          const data = await response.json()
          if (data.organizationId) {
            setOrganizationId(data.organizationId)
          }
        }
      } catch (error) {
        console.error("Error fetching organization ID:", error)
      }
    }

    fetchOrganizationId()
  }, [])

  if (!organizationId) {
    return null
  }

  return <TrialBanner organizationId={organizationId} />
}


