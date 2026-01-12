import { redirectTo, toWatchUrlFromShortsUrl } from "./youtube-shorts-to-watch-redirect"

defineUserScript({
  name: "YouTube Shorts to Watch Redirect",
  namespace: "https://khinshankhan.com",
  version: "0.1.0",
  description: "Redirects YouTube Shorts URLs to the standard watch page.",
  author: "khinshankhan",
  license: "Apache-2.0",

  match: ["https://*.youtube.com/*", "https://youtube.com/*"],

  grant: ["none"],

  runAt: "document-start",
  noframes: true,

  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",
})

function handleNavigate() {
  const target = toWatchUrlFromShortsUrl(window.location)
  if (target) {
    redirectTo(target)
  }
}

// handle initial load
handleNavigate()

// listen for SPA URL changes (throttled)
let lastUrl = location.href
let scheduled = false

new MutationObserver(() => {
  if (scheduled) return
  scheduled = true

  queueMicrotask(() => {
    scheduled = false
    const url = location.href
    if (url !== lastUrl) {
      lastUrl = url
      handleNavigate()
    }
  })
}).observe(document, { subtree: true, childList: true })
