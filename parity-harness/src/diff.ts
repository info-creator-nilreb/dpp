import type { DiffItem, DiffResult } from "./types.js"

export function diff(a: unknown, b: unknown): DiffResult {
  const differences: DiffItem[] = []
  compare(a, b, "", differences)
  const bodyMatch = differences.length === 0
  return { statusMatch: true, bodyMatch, differences }
}

function compare(a: unknown, b: unknown, path: string, out: DiffItem[]): void {
  if (a === b) return

  if (typeof a !== typeof b) {
    out.push({ path: path || "(root)", altValue: a, newValue: b })
    return
  }

  if (a === null || b === null) {
    if (a !== b) out.push({ path: path || "(root)", altValue: a, newValue: b })
    return
  }

  if (typeof a !== "object") {
    if (a !== b) out.push({ path: path || "(root)", altValue: a, newValue: b })
    return
  }

  const arrA = Array.isArray(a)
  const arrB = Array.isArray(b)
  if (arrA !== arrB) {
    out.push({ path: path || "(root)", altValue: a, newValue: b })
    return
  }

  if (arrA && arrB) {
    const len = Math.max((a as unknown[]).length, (b as unknown[]).length)
    for (let i = 0; i < len; i++) {
      compare(
        (a as unknown[])[i],
        (b as unknown[])[i],
        path ? `${path}[${i}]` : `[${i}]`,
        out
      )
    }
    return
  }

  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>
  const keys = new Set([...Object.keys(objA), ...Object.keys(objB)])
  for (const k of keys) {
    const p = path ? `${path}.${k}` : k
    if (!(k in objB)) {
      out.push({ path: p, altValue: objA[k], newValue: undefined })
      continue
    }
    if (!(k in objA)) {
      out.push({ path: p, altValue: undefined, newValue: objB[k] })
      continue
    }
    if (objA[k] === "[TOLERATED]" || objB[k] === "[TOLERATED]") continue
    compare(objA[k], objB[k], p, out)
  }
}
