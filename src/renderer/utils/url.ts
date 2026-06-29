export const HOME_URL = 'mogulus://home'

export function normalizeUrl(input: string, searchEngine = 'brave'): string {
  const t = input.trim()
  if (!t || t === HOME_URL) return HOME_URL

  if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(t)) return t

  // Looks like a hostname: has dot(s), no spaces, valid chars
  if (!t.includes(' ') && /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(t)) {
    return `https://${t}`
  }

  const engines: Record<string, string> = {
    brave:  `https://search.brave.com/search?q=${encodeURIComponent(t)}`,
    google: `https://www.google.com/search?q=${encodeURIComponent(t)}`,
    ddg:    `https://duckduckgo.com/?q=${encodeURIComponent(t)}`,
    ecosia: `https://www.ecosia.org/search?q=${encodeURIComponent(t)}`,
  }

  return engines[searchEngine] ?? engines.brave
}

export function displayUrl(url: string): string {
  if (!url || url === HOME_URL) return ''
  try {
    const u = new URL(url)
    // Strip 'www.' prefix for cleaner display
    return u.hostname.replace(/^www\./, '') + (u.pathname !== '/' ? u.pathname : '')
  } catch {
    return url
  }
}

export function isSecure(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}
