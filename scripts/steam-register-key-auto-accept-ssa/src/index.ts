import { ensureSsaAccepted } from "./ensure-ssa-accepted"

defineUserScript({
  name: "Steam Register Key Auto Accept SSA",
  description:
    "Automatically checks the steam subscriber agreement box on Steam register key pages.",
  namespace: "https://khinshankhan.com",
  version: "0.1.0",

  author: "khinshankhan",
  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",

  match: ["https://store.steampowered.com/account/registerkey*"],

  runAt: "document-end",
  grant: ["none"],
})

ensureSsaAccepted(document)
