export interface RuntimeConfig {
  googleClientId: string
  sheetId: string
}

let cachedConfigPromise: Promise<RuntimeConfig> | null = null

async function readCloudflareRuntimeConfig(): Promise<Partial<RuntimeConfig>> {
  try {
    const res = await fetch('/api/config', { cache: 'no-store' })
    if (!res.ok) return {}
    return (await res.json()) as Partial<RuntimeConfig>
  } catch {
    return {}
  }
}

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  if (!cachedConfigPromise) {
    cachedConfigPromise = (async () => {
      const runtime = await readCloudflareRuntimeConfig()
      return {
        googleClientId: runtime.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        sheetId: runtime.sheetId || import.meta.env.VITE_SHEET_ID || '',
      }
    })()
  }

  return cachedConfigPromise
}
