defineUserScript({
  name: "Steam Register Key Auto Accept SSA",
  description:
    "Automatically checks the steam subscriber agreement box on Steam register key pages.",
  namespace: "https://github.com/khinshankhan/userscripts",
  version: "0.1.0",

  author: "khinshankhan",
  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",

  match: ["https://store.steampowered.com/account/registerkey*"],

  runAt: "document-end",
  grant: ["none"],
})

const checkbox = document.getElementById("accept_ssa") as HTMLInputElement | null
if (checkbox && !checkbox.checked) {
  checkbox.click()
}
