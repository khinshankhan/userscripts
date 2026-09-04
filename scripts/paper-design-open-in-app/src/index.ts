import { onNavigate } from "../../_common/on-navigate"
import { openInApp, toPaperAppUrl } from "./paper-design-open-in-app"

defineUserScript({
  name: "Paper Design Open in App",
  namespace: "https://khinshankhan.com",
  version: "0.1.0",
  description: "Opens paper.design file links in the Paper desktop app.",
  author: "khinshankhan",
  license: "Apache-2.0",

  match: ["https://app.paper.design/*"],

  grant: ["none"],

  // run once the page is usable: the handoff is best effort, so the loaded web
  // app stays as the fallback when the user cancels the open prompt.
  runAt: "document-end",
  noframes: true,

  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",
})

// avoid re-prompting for a file we already handed off in this page session,
// since SPA navigation can revisit the same url.
const seen = new Set<string>()

function handleNavigate() {
  const target = toPaperAppUrl(window.location)
  if (!target || seen.has(target)) {
    return
  }

  seen.add(target)
  openInApp(target)
}

onNavigate(handleNavigate)
