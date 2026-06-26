/**
 * PhishGuard 360 — API client
 * Calls the Flask backend for real phishing analysis
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export interface Finding {
  type: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  detail: string
  explanation: string
  source?: string
}

export interface ScanResult {
  verdict: 'MALICIOUS' | 'SUSPICIOUS' | 'CLEAN'
  score: number
  channel: string
  findings: Finding[]
  urls_analyzed: string[]
  finding_count: number
  high_count: number
  medium_count: number
  low_count: number
  apis_used?: {
    google_safe_browsing: boolean
    virustotal: boolean
    heuristics: boolean
    whois: boolean
  }
  error?: string
}

export async function scanContent(channel: string, content: string): Promise<ScanResult> {
  const res = await fetch(`${API_BASE}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, content }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }))
    throw new Error(err.error || `Server error: ${res.status}`)
  }

  return res.json()
}

export async function checkHealth(): Promise<{ status: string; apis: Record<string, boolean> }> {
  const res = await fetch(`${API_BASE}/health`)
  return res.json()
}
