export const PAPER_APP_HOST = "app.paper.design"

/**
 * Fire a `paper://` deep link without disturbing the current page.
 *
 * The web app is deliberately left loaded underneath: the browser shows an
 * "Open Paper?" prompt and there is no event for either outcome, so if the
 * user cancels (or has no app installed) they simply stay on a working page.
 * A hidden iframe does the handoff without touching history the way
 * `location.replace` would.
 */
export function openInApp(url: string): void {
  const frame = document.createElement("iframe")
  frame.style.display = "none"
  frame.src = url

  document.body.appendChild(frame)

  // the navigation is handed to the OS synchronously, so the frame has done
  // its job by the next tick.
  setTimeout(() => frame.remove(), 0)
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
