/**
 * Types für DPP Preflight Feature
 */

export type PreflightStatus = "GREEN" | "YELLOW" | "RED"

export interface DetectedCategory {
  key: string
  confidence: number
}

export interface PreflightResult {
  field: string
  status: PreflightStatus
  confidence: number
  comment: string
  source: string
}

export interface PreflightResponse {
  detectedCategory: DetectedCategory
  overallScore: number
  results: PreflightResult[]
}

export interface AIAnalysisResponse {
  detectedCategory: DetectedCategory
  results: PreflightResult[]
}

