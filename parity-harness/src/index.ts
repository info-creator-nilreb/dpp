#!/usr/bin/env node
/**
 * Parity Harness – compares API responses between ALT and NEW base URLs
 *
 * Usage:
 *   npm run parity
 *   MODE=record   # fetch ALT only, save normalized snapshots
 *   MODE=compare  # fetch ALT + NEW, diff (default)
 *   ALT_BASE_URL=... NEW_BASE_URL=... npm run parity
 *   NORMALIZE_CONFIG=config/normalize.json npm run parity
 *   npm run parity:ci   (exit 1 on failure)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import type { GoldenRequest, ParityConfig, ParityReport, RequestResult } from "./types.js"
import { executeRequest } from "./executor.js"
import { normalize, loadNormalizeConfig, normalizeForSnapshot } from "./normalizer.js"
import { diff } from "./diff.js"
import { writeReports } from "./reporter.js"
import { resolvePath } from "./utils.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const REQUESTS_DIR = join(ROOT, "tests", "golden", "requests")
const SNAPSHOTS_DIR = join(ROOT, "tests", "golden", "snapshots")
const CONFIG_PATH = join(ROOT, "parity.config.json")
const DEFAULT_OUTPUT = "parity-reports"

const MODE_RECORD = "record"
const MODE_COMPARE = "compare"

function loadConfig(): ParityConfig {
  const envAlt = process.env.ALT_BASE_URL
  const envNew = process.env.NEW_BASE_URL
  let config: ParityConfig
  if (existsSync(CONFIG_PATH)) {
    config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"))
  } else {
    config = {
      altBaseUrl: "http://localhost:3000",
      newBaseUrl: "http://localhost:3001",
    }
  }
  if (envAlt) config.altBaseUrl = envAlt
  if (envNew) config.newBaseUrl = envNew
  config.normalizeConfigPath = config.normalizeConfigPath ?? process.env.NORMALIZE_CONFIG ?? "config/normalize.json"
  return config
}

function getMode(): string {
  const mode = (process.env.MODE ?? MODE_COMPARE).toLowerCase()
  return mode === MODE_RECORD ? MODE_RECORD : MODE_COMPARE
}

function loadRequests(): GoldenRequest[] {
  if (!existsSync(REQUESTS_DIR)) {
    return []
  }
  const files = readdirSync(REQUESTS_DIR).filter((f) => f.endsWith(".json"))
  const requests: GoldenRequest[] = []
  for (const f of files) {
    const content = readFileSync(join(REQUESTS_DIR, f), "utf-8")
    try {
      const req = JSON.parse(content) as GoldenRequest
      if (req.method && req.path) requests.push(req)
    } catch {
      console.warn(`[parity] Skip invalid JSON: ${f}`)
    }
  }
  return requests
}

function shouldSkip(request: GoldenRequest): boolean {
  const params = request.pathParams ?? {}
  for (const [_, v] of Object.entries(params)) {
    if (
      !v ||
      v === "REPLACE_WITH_REAL_DPP_ID" ||
      v.startsWith("REPLACE_") ||
      v === "{{" + "DPP_ID" + "}}"
    ) {
      return true
    }
  }
  return false
}

async function runRecordMode(config: ParityConfig, requests: GoldenRequest[]): Promise<void> {
  const timeoutMs = config.timeoutMs ?? 10000
  if (!existsSync(SNAPSHOTS_DIR)) mkdirSync(SNAPSHOTS_DIR, { recursive: true })
  console.log("[parity] MODE=record – saving snapshots to", SNAPSHOTS_DIR)
  for (const req of requests) {
    if (shouldSkip(req)) {
      console.log(`  [SKIP] ${req.name}`)
      continue
    }
    const path = resolvePath(req.path, req.pathParams ?? {})
    try {
      const res = await executeRequest(config.altBaseUrl, { ...req, path }, timeoutMs)
      const normalized = normalizeForSnapshot(res.body, config)
      const snapshot = { requestName: req.name, method: req.method, path, status: res.status, body: normalized }
      const safeName = req.name.replace(/[^a-zA-Z0-9_-]/g, "_")
      writeFileSync(join(SNAPSHOTS_DIR, `${safeName}.json`), JSON.stringify(snapshot, null, 2), "utf-8")
      console.log(`  [OK] ${req.name} → ${safeName}.json`)
    } catch (err) {
      console.error(`  [ERR] ${req.name}:`, err instanceof Error ? err.message : String(err))
    }
  }
}

async function runCompareMode(config: ParityConfig, requests: GoldenRequest[], isCi: boolean, outputDir: string): Promise<void> {
  const nc = loadNormalizeConfig(config)
  const results: RequestResult[] = []
  const timeoutMs = config.timeoutMs ?? 10000

  for (const req of requests) {
    if (shouldSkip(req)) {
      results.push({
        requestName: req.name,
        method: req.method,
        path: resolvePath(req.path, req.pathParams ?? {}),
        skipped: true,
        alt: { status: 0, headers: {}, body: null },
        new: { status: 0, headers: {}, body: null },
        normalizedAlt: null,
        normalizedNew: null,
        diff: { statusMatch: true, bodyMatch: true, differences: [] },
      })
      continue
    }

    const path = resolvePath(req.path, req.pathParams ?? {})

    try {
      const [altRes, newRes] = await Promise.all([
        executeRequest(config.altBaseUrl, { ...req, path }, timeoutMs),
        executeRequest(config.newBaseUrl, { ...req, path }, timeoutMs),
      ])

      const normAlt = normalize(altRes.body, config, "", nc)
      const normNew = normalize(newRes.body, config, "", nc)
      const diffResult = diff(normAlt, normNew)
      diffResult.statusMatch = altRes.status === newRes.status

      results.push({
        requestName: req.name,
        method: req.method,
        path,
        alt: altRes,
        new: newRes,
        normalizedAlt: normAlt,
        normalizedNew: normNew,
        diff: diffResult,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[parity] Error for ${req.name}:`, msg)
      results.push({
        requestName: req.name,
        method: req.method,
        path,
        alt: { status: 0, headers: {}, body: { error: msg } },
        new: { status: 0, headers: {}, body: { error: msg } },
        normalizedAlt: null,
        normalizedNew: null,
        diff: { statusMatch: false, bodyMatch: false, differences: [{ path: "(root)", altValue: msg, newValue: msg }] },
      })
    }
  }

  const skipped = results.filter((r) => r.skipped).length
  const failed = results.filter((r) => !r.skipped && (!r.diff.statusMatch || !r.diff.bodyMatch)).length
  const passed = results.length - failed - skipped

  const report: ParityReport = {
    timestamp: new Date().toISOString(),
    config: { altBaseUrl: config.altBaseUrl, newBaseUrl: config.newBaseUrl },
    totalRequests: requests.length,
    passed,
    failed,
    skipped,
    results,
  }

  writeReports(report, outputDir, ROOT)
  console.log("[parity] Report written to", join(ROOT, outputDir))
  console.log("[parity] Passed:", passed, "| Failed:", failed, "| Skipped:", skipped)

  if (isCi && failed > 0) process.exit(1)
}

async function main(): Promise<void> {
  const isCi = process.argv.includes("--ci")
  const dryRun = process.argv.includes("--dry-run")
  const outputDir = process.env.PARITY_OUTPUT ?? DEFAULT_OUTPUT
  const mode = getMode()

  const config = loadConfig()
  const requests = loadRequests()

  console.log("[parity] Config:", {
    mode,
    altBaseUrl: config.altBaseUrl,
    newBaseUrl: config.newBaseUrl,
    normalizeConfig: config.normalizeConfigPath ?? "(default)",
    requestsDir: REQUESTS_DIR,
  })
  console.log("[parity] Loaded", requests.length, "request(s)")

  if (requests.length === 0) {
    console.log("[parity] No requests found. Add JSON files to tests/golden/requests/")
    process.exit(isCi ? 1 : 0)
  }

  if (dryRun) {
    console.log("[parity] Dry run – not executing")
    for (const r of requests) {
      const skip = shouldSkip(r)
      console.log(`  - ${r.name} (${r.method} ${r.path}) ${skip ? "[SKIP]" : ""}`)
    }
    process.exit(0)
  }

  if (mode === MODE_RECORD) {
    await runRecordMode(config, requests)
    return
  }

  await runCompareMode(config, requests, isCi, outputDir)
}

main().catch((err) => {
  console.error("[parity] Fatal:", err)
  process.exit(1)
})
