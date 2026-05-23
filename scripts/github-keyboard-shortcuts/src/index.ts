import { installKeyboardShortcuts } from "./github-keyboard-shortcuts"

defineUserScript({
  name: "GitHub Keyboard Shortcuts",
  namespace: "https://khinshankhan.com",
  version: "0.1.0",
  description: "Adds extra keyboard shortcuts to GitHub (g f -> feed).",
  author: "khinshankhan",
  license: "Apache-2.0",

  match: ["https://github.com/*"],

  grant: ["none"],

  runAt: "document-end",
  noframes: true,

  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",
})

installKeyboardShortcuts()
