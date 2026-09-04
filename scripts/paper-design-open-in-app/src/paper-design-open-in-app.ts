export const PAPER_APP_HOST = "app.paper.design"

export function redirectTo(url: string): void {
  window.location.replace(url)
}

/**
 * Map a paper.design web URL to its `paper://` deep link.
 *
 * `https://app.paper.design/file/{id}/{rest}` -> `paper://file/{id}/{rest}`
 *
 * The path is carried over verbatim (including query and hash) since the app
 * understands the same routes the web app does.
 */
export function toPaperAppUrl(loc: Location): string | null {
  if (loc.hostname !== PAPER_APP_HOST) {
    return null
  }

  // only file routes are deep linkable, everything else (dashboard, settings,
  // ...) is web only.
  const parts = loc.pathname.split("/").filter(Boolean)
  if (parts[0] !== "file" || !parts[1]) {
    return null
  }

  return `paper://${parts.join("/")}${loc.search}${loc.hash}`
}
