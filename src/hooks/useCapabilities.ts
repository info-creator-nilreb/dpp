"use client";

import { useState, useEffect } from "react";

export interface ResolvedCapabilities {
  cms_access: boolean;
  block_editor: boolean;
  storytelling_blocks: boolean;
  interaction_blocks: boolean;
  styling_controls: boolean;
  publishing: boolean;
}

interface SubscriptionData {
  id: string;
  plan: string;
  status: string;
  trialExpiresAt: string | null;
  trialStartedAt: string | null;
  currentPeriodEnd: string | null;
}

interface UseCapabilitiesResult {
  capabilities: ResolvedCapabilities;
  subscription: SubscriptionData | null;
  isTrial: boolean;
  trialDaysRemaining: number | null;
  isLoading: boolean;
  error: any;
}

export function useCapabilities(dppId: string): UseCapabilitiesResult {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!dppId || dppId === "new") {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchCapabilities() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/app/dpp/${dppId}/capabilities`);
        if (!response.ok) {
          throw new Error("Failed to fetch capabilities");
        }
        const result = await response.json();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchCapabilities();

    return () => {
      cancelled = true;
    };
  }, [dppId]);

  const capabilities: ResolvedCapabilities = data?.capabilities || {
    cms_access: false,
    block_editor: false,
    storytelling_blocks: false,
    interaction_blocks: false,
    styling_controls: false,
    publishing: false,
  };

  const subscription: SubscriptionData | null = data?.subscription || null;
  const isTrial = subscription?.status === "trial_active";
  const trialDaysRemaining = data?.trialDaysRemaining ?? null;

  return {
    capabilities,
    subscription,
    isTrial,
    trialDaysRemaining,
    isLoading,
    error,
  };
}

