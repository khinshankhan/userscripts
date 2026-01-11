import { ensureSsaAccepted } from "./ensure-ssa-accepted"

defineUserScript({
  name: "Steam Register Key Auto Accept SSA",
  namespace: "https://khinshankhan.com",
  version: "0.1.0",
  description:
    "Automatically checks the steam subscriber agreement box on Steam register key pages.",
  author: "khinshankhan",
  license: "Apache-2.0",

  match: ["https://store.steampowered.com/account/registerkey*"],

  grant: ["none"],

  runAt: "document-end",
  noframes: true,

  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",
})

ensureSsaAccepted(document)
