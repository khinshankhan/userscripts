import { redirectTo, toWatchUrlFromShortsUrl } from "./youtube-shorts-to-watch-redirect"

defineUserScript({
  name: "YouTube Shorts to Watch Redirect",
  description: "Redirects YouTube Shorts URLs to the standard watch page.",
  namespace: "https://khinshankhan.com",
  version: "0.1.0",

  author: "khinshankhan",
  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",

  match: ["https://*.youtube.com/shorts/*", "https://youtube.com/shorts/*"],

  runAt: "document-start",
  grant: ["none"],
})

const target = toWatchUrlFromShortsUrl(window.location)
if (target) {
  redirectTo(target)
}
