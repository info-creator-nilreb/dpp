import type { GoldenRequest, HttpResponse } from "./types.js"
import { resolvePath } from "./utils.js"

export async function executeRequest(
  baseUrl: string,
  request: GoldenRequest,
  timeoutMs: number,
  cookies?: string
): Promise<HttpResponse> {
  const path = resolvePath(request.path, request.pathParams ?? {})
  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl).toString()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...request.headers,
  }
  if (cookies) headers["Cookie"] = cookies

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: request.method,
      headers,
      body: request.body != null ? JSON.stringify(request.body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const headerRecord: Record<string, string> = {}
    res.headers.forEach((v, k) => {
      headerRecord[k] = v
    })

    let body: unknown
    const ct = res.headers.get("content-type") ?? ""
    if (ct.includes("application/json")) {
      const text = await res.text()
      try {
        body = text ? JSON.parse(text) : null
      } catch {
        body = text
      }
    } else {
      body = await res.text()
    }

    return { status: res.status, headers: headerRecord, body }
  } catch (e) {
    clearTimeout(timeout)
    throw e
  }
}
