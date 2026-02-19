import { readFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type { ParityConfig, NormalizeConfig } from "./types.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

export function loadNormalizeConfig(config: ParityConfig): NormalizeConfig | null {
  const path = config.normalizeConfigPath ?? process.env.NORMALIZE_CONFIG
  if (!path) return null
  try {
    const base = join(__dirname, "..")
    const fullPath = path.startsWith("/") ? path : join(base, path)
    if (!existsSync(fullPath)) return null
    return JSON.parse(readFileSync(fullPath, "utf-8"))
  } catch {
    return null
  }
}

function matchPathPattern(pattern: string, fullPath: string): boolean {
  const regex = pattern
    .replace(/\./g, "\\.")
    .replace(/\[\]/g, "\\.\\d+")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^.\\[]+")
  return new RegExp(`^${regex}$`).test(fullPath)
}

function sortArray(arr: unknown[], parentPath: string, nc: NormalizeConfig): unknown[] {
  if (!Array.isArray(arr)) return arr
  const rule = nc.sortRules?.find((r) => {
    const p = r.path
    return parentPath === p || parentPath.endsWith("." + p) || parentPath.endsWith("." + p + "[]")
  })
  if (!rule) return arr
  const by = Array.isArray(rule.by) ? rule.by : [rule.by]
  const order = Array.isArray(rule.order) ? rule.order : [rule.order ?? "asc"]
  return [...arr].sort((a, b) => {
    if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return 0
    const aa = a as Record<string, unknown>
    const bb = b as Record<string, unknown>
    for (let i = 0; i < by.length; i++) {
      const key = by[i]
      const ord = order[i] ?? "asc"
      const va = aa[key]
      const vb = bb[key]
      if (va === vb) continue
      if (va == null) return ord === "asc" ? 1 : -1
      if (vb == null) return ord === "asc" ? -1 : 1
      let cmp = 0
      if (typeof va === "string" && typeof vb === "string") cmp = va.localeCompare(vb)
      else if (typeof va === "number" && typeof vb === "number") cmp = va - vb
      else if (typeof va === "string" && typeof vb === "string" && /^\d{4}-\d{2}-\d{2}/.test(va)) cmp = va.localeCompare(vb)
      else cmp = String(va).localeCompare(String(vb))
      if (cmp !== 0) return ord === "desc" ? -cmp : cmp
    }
    return 0
  })
}

function sanitizeUrl(val: unknown, key: string, nc: NormalizeConfig): unknown {
  if (typeof val !== "string" || !nc.urlSanitizePaths?.includes(key)) return val
  const q = val.indexOf("?")
  return q >= 0 ? val.slice(0, q) : val
}

/**
 * Normalizes a value for comparison or snapshot storage.
 * - ignorePaths/ignorePathPatterns: replace with [TOLERATED]
 * - redactPaths/redactPathPatterns: replace with [REDACTED]
 * - sortRules: sort arrays before processing
 * - urlSanitizePaths: strip ?query from URLs at these keys
 */
export function normalize(
  value: unknown,
  config: ParityConfig,
  path = "",
  nc: NormalizeConfig | null = null
): unknown {
  if (value === null || value === undefined) return value
  const normConfig = nc ?? loadNormalizeConfig(config)
  const toleratedFields = config.toleratedFields ?? []
  const toleratedPathPatterns = config.toleratedPathPatterns ?? []
  const ignorePaths = normConfig?.ignorePaths ?? []
  const ignorePathPatterns = normConfig?.ignorePathPatterns ?? []
  const redactPaths = normConfig?.redactPaths ?? []
  const redactPathPatterns = normConfig?.redactPathPatterns ?? []

  const isTolerated = (key: string, currentPath: string): boolean => {
    const fullPath = currentPath ? `${currentPath}.${key}` : key
    if (toleratedFields.includes(key) || ignorePaths.includes(key)) return true
    if (toleratedPathPatterns.some((p) => matchPathPattern(p, fullPath))) return true
    if (ignorePathPatterns.some((p) => matchPathPattern(p, fullPath))) return true
    return false
  }

  const isRedacted = (key: string, currentPath: string): boolean => {
    const fullPath = currentPath ? `${currentPath}.${key}` : key
    if (redactPaths.includes(key)) return true
    if (redactPathPatterns.some((p) => matchPathPattern(p, fullPath))) return true
    return false
  }

  if (typeof value !== "object") return value

  if (Array.isArray(value)) {
    const parentPath = path.replace(/\[\d+\]$/, "").replace(/\[\]$/, "")
    const sorted = normConfig ? sortArray(value, parentPath, normConfig) : value
    return sorted.map((item, i) =>
      normalize(item, config, path ? `${path}[${i}]` : `[${i}]`, normConfig)
    )
  }

  const obj = value as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${k}` : k
    if (isRedacted(k, path)) {
      out[k] = "[REDACTED]"
      continue
    }
    if (isTolerated(k, path)) {
      out[k] = "[TOLERATED]"
      continue
    }
    let val = normalize(v, config, currentPath, normConfig)
    if (normConfig && typeof val === "string") val = sanitizeUrl(val, k, normConfig)
    out[k] = val
  }
  return out
}

/** For record mode: apply full normalization + redaction before saving snapshot. */
export function normalizeForSnapshot(value: unknown, config: ParityConfig): unknown {
  return normalize(value, config, "", loadNormalizeConfig(config))
}
