export function redirectTo(url: string): void {
  if (window.location.href === url) return
  window.location.replace(url)
}

export function toWatchUrlFromShortsUrl(loc: Location): string | null {
  // expect `/shorts/{vid}` (sometimes with extra segments)
  const parts = loc.pathname.split("/").filter(Boolean)
  if (parts[0] !== "shorts") {
    return null
  }

  const vid = parts[1]
  if (!vid) return null

  const out = new URL(loc.href)
  out.pathname = "/watch"

  // preserve any existing query params, but ensure v={vid}
  // ...should we be preserving parameters at all? for now, yes but we'll noodle on it.
  // perhaps a different userscript can handle stripping unneeded params.
  out.searchParams.set("v", vid)

  // shorts pages sometimes carry an annoying fragment, just drop it.
  out.hash = ""

  return out.toString()
}
