export interface GoldenRequest {
  name: string
  method: string
  path: string
  headers?: Record<string, string>
  body?: unknown
  pathParams?: Record<string, string>
}

export interface ParityConfig {
  altBaseUrl: string
  newBaseUrl: string
  timeoutMs?: number
  toleratedFields?: string[]
  toleratedPathPatterns?: string[]
  normalizeConfigPath?: string
}

export interface NormalizeConfig {
  ignorePaths?: string[]
  ignorePathPatterns?: string[]
  redactPaths?: string[]
  redactPathPatterns?: string[]
  sortRules?: Array<{ path: string; by: string | string[]; order?: "asc" | "desc" | ("asc" | "desc")[] }>
  urlSanitizePaths?: string[]
}

export interface HttpResponse {
  status: number
  headers: Record<string, string>
  body: unknown
}

export interface RequestResult {
  requestName: string
  method: string
  path: string
  skipped?: boolean
  alt: HttpResponse
  new: HttpResponse
  normalizedAlt: unknown
  normalizedNew: unknown
  diff: DiffResult
}

export interface DiffResult {
  statusMatch: boolean
  bodyMatch: boolean
  differences: DiffItem[]
}

export interface DiffItem {
  path: string
  altValue: unknown
  newValue: unknown
}

export interface ParityReport {
  timestamp: string
  config: {
    altBaseUrl: string
    newBaseUrl: string
  }
  totalRequests: number
  passed: number
  failed: number
  skipped: number
  results: RequestResult[]
}
