interface Env {
  VITE_GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_ID?: string
  VITE_SHEET_ID?: string
  SHEET_ID?: string
}

export const onRequestGet = ({ env }: { env: Env }) => {
  const googleClientId = env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || ''
  const sheetId = env.VITE_SHEET_ID || env.SHEET_ID || ''

  return new Response(JSON.stringify({ googleClientId, sheetId }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
