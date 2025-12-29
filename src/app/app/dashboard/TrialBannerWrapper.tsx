"use client"

import { useEffect, useState } from "react"
import TrialBanner from "@/components/TrialBanner"

export default function TrialBannerWrapper() {
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [trialEndDate, setTrialEndDate] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTrialData() {
      try {
        // Get organizationId from usage endpoint
        const usageResponse = await fetch("/api/app/subscription/usage")
        if (usageResponse.ok) {
          const usageData = await usageResponse.json()
          if (usageData.organizationId) {
            setOrganizationId(usageData.organizationId)
          }
        }

        // Get trialEndDate from status endpoint
        const statusResponse = await fetch("/api/app/subscription/status")
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.trialEndDate) {
            setTrialEndDate(statusData.trialEndDate)
          }
        }
      } catch (error) {
        console.error("Error fetching trial data:", error)
      }
    }

    fetchTrialData()
  }, [])

  if (!organizationId || !trialEndDate) {
    return null
  }

  return <TrialBanner organizationId={organizationId} trialEndDate={trialEndDate} />
}


