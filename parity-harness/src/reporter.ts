import type { ParityReport } from "./types.js"
import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export function writeReports(
  report: ParityReport,
  outputDir: string,
  baseDir: string = join(__dirname, "..")
): void {
  const outPath = join(baseDir, outputDir)
  if (!existsSync(outPath)) {
    mkdirSync(outPath, { recursive: true })
  }
  const jsonPath = join(outPath, "parity-report.json")
  const mdPath = join(outPath, "parity-report.md")

  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf-8")
  writeFileSync(mdPath, toMarkdown(report), "utf-8")
}

function toMarkdown(report: ParityReport): string {
  const lines: string[] = []
  lines.push("# Parity Test Report")
  lines.push("")
  lines.push(`**Generated:** ${report.timestamp}`)
  lines.push("")
  lines.push("## Configuration")
  lines.push("")
  lines.push("| Setting | Value |")
  lines.push("|---------|-------|")
  lines.push(`| ALT_BASE_URL | \`${report.config.altBaseUrl}\` |`)
  lines.push(`| NEW_BASE_URL | \`${report.config.newBaseUrl}\` |`)
  lines.push("")
  lines.push("## Summary")
  lines.push("")
  lines.push("| Metric | Count |")
  lines.push("|--------|-------|")
  lines.push(`| Total  | ${report.totalRequests} |`)
  lines.push(`| Passed | ${report.passed} |`)
  lines.push(`| Failed | ${report.failed} |`)
  lines.push(`| Skipped | ${report.skipped} |`)
  lines.push("")

  const failedResults = report.results.filter(
    (r) => !r.skipped && (!r.diff.statusMatch || !r.diff.bodyMatch)
  )
  if (failedResults.length > 0) {
    lines.push("## Failed Requests")
    lines.push("")
    for (const r of failedResults) {
      lines.push(`### ${r.requestName}`)
      lines.push("")
      lines.push(`- **Method:** ${r.method}`)
      lines.push(`- **Path:** ${r.path}`)
      lines.push(`- **Status:** ALT=${r.alt.status} / NEW=${r.new.status} ${!r.diff.statusMatch ? "❌" : "✓"}`)
      lines.push(`- **Body match:** ${r.diff.bodyMatch ? "✓" : "❌"}`)
      if (r.diff.differences.length > 0) {
        lines.push("")
        lines.push("| Path | ALT | NEW |")
        lines.push("|------|-----|-----|")
        for (const d of r.diff.differences) {
          const av = formatValue(d.altValue)
          const nv = formatValue(d.newValue)
          lines.push(`| \`${d.path}\` | ${av} | ${nv} |`)
        }
      }
      lines.push("")
    }
  }

  lines.push("## All Results")
  lines.push("")
  lines.push("| Request | ALT Status | NEW Status | Body Match | Skipped |")
  lines.push("|---------|------------|------------|------------|---------|")
  for (const r of report.results) {
    const statusOk = r.diff.statusMatch ? "✓" : "❌"
    const bodyOk = r.diff.bodyMatch ? "✓" : "❌"
    const skip = r.skipped ? "✓" : ""
    const altStatus = r.skipped ? "-" : String(r.alt.status)
    const newStatus = r.skipped ? "-" : String(r.new.status)
    lines.push(`| ${r.requestName} | ${altStatus} | ${newStatus} | ${bodyOk} | ${skip} |`)
  }

  return lines.join("\n")
}

function formatValue(v: unknown): string {
  if (v === undefined) return "_undefined_"
  if (v === null) return "null"
  if (typeof v === "string") return `"${v.slice(0, 80)}${v.length > 80 ? "…" : ""}"`
  if (typeof v === "object") return JSON.stringify(v).slice(0, 80) + "…"
  return String(v)
}
