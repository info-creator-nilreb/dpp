/**
 * Data model for the co2_emissions template field type.
 * Used for DPP compliance (CO₂e information).
 * Unit is fixed; value can be manual or from a calculation provider (e.g. Climatiq).
 */

export const CO2_EMISSIONS_UNIT = "kgCO2e" as const

export type Co2EmissionsSource = "manual" | "calculated"

export interface Co2EmissionsCalculationMeta {
  provider: "climatiq"
  version?: string
  breakdown?: {
    material?: number
    transport?: number
    packaging?: number
  }
}

export interface Co2EmissionsValue {
  value: number | null
  unit: typeof CO2_EMISSIONS_UNIT
  source: Co2EmissionsSource
  methodology?: string
  calculationMeta?: Co2EmissionsCalculationMeta
}

/** Default value for a new/empty co2_emissions field */
export function defaultCo2EmissionsValue(
  overrides?: Partial<Co2EmissionsValue>
): Co2EmissionsValue {
  return {
    value: null,
    unit: CO2_EMISSIONS_UNIT,
    source: "manual",
    ...overrides,
  }
}

/** Check if a value is a valid Co2EmissionsValue object */
export function isCo2EmissionsValue(
  v: unknown
): v is Co2EmissionsValue {
  if (!v || typeof v !== "object") return false
  const o = v as Record<string, unknown>
  return (
    o.unit === CO2_EMISSIONS_UNIT &&
    (o.source === "manual" || o.source === "calculated") &&
    (o.value === null || typeof o.value === "number")
  )
}

/** Normalize stored value to Co2EmissionsValue (e.g. from JSON or legacy string) */
export function normalizeCo2EmissionsValue(
  raw: unknown
): Co2EmissionsValue {
  if (isCo2EmissionsValue(raw)) return raw
  if (typeof raw === "number" && !Number.isNaN(raw))
    return defaultCo2EmissionsValue({ value: raw, source: "manual" })
  if (typeof raw === "string") {
    const n = parseFloat(raw)
    if (!Number.isNaN(n))
      return defaultCo2EmissionsValue({ value: n, source: "manual" })
  }
  return defaultCo2EmissionsValue()
}
