export function resolvePath(path: string, params: Record<string, string>): string {
  let out = path
  for (const [key, value] of Object.entries(params)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
  }
  return out
}
