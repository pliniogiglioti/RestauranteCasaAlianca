const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim()
const browserUrl =
  typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol)
    ? window.location.origin
    : ''

export const PUBLIC_APP_URL = (
  configuredUrl || browserUrl || 'https://restaurantecasaalianca.vercel.app'
).replace(/\/+$/, '')
