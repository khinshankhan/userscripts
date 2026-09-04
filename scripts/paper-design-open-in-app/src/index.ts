import { onNavigate } from "../../_common/on-navigate"
import { redirectTo, toPaperAppUrl } from "./paper-design-open-in-app"

defineUserScript({
  name: "Paper Design Open in App",
  namespace: "https://khinshankhan.com",
  version: "0.1.0",
  description: "Opens paper.design file links in the Paper desktop app.",
  author: "khinshankhan",
  license: "Apache-2.0",

  match: ["https://app.paper.design/*"],

  grant: ["none"],

  runAt: "document-start",
  noframes: true,

  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",
})

function handleNavigate() {
  const target = toPaperAppUrl(window.location)
  if (target) {
    redirectTo(target)
  }
}

onNavigate(handleNavigate)
