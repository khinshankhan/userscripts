import { redirectTo, toWatchUrlFromShortsUrl } from "./youtube-shorts-to-watch-redirect"

defineUserScript({
  name: "YouTube Shorts to Watch Redirect",
  namespace: "https://khinshankhan.com",
  version: "0.1.0",
  description: "Redirects YouTube Shorts URLs to the standard watch page.",
  author: "khinshankhan",
  license: "Apache-2.0",

  match: ["https://*.youtube.com/shorts/*", "https://youtube.com/shorts/*"],

  grant: ["none"],

  runAt: "document-start",
  noframes: true,

  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",
})

const target = toWatchUrlFromShortsUrl(window.location)
if (target) {
  redirectTo(target)
}
