import { installStackExchangeCopyCodeOnly } from "./stackexchange-copy-code-only"

defineUserScript({
  name: "Stack Exchange Copy Code Only",
  namespace: "https://khinshankhan.com",
  version: "0.1.0",
  description: "Adds a copy button that copies only the code, without Stack Exchange attribution text.",
  author: "khinshankhan",
  license: "Apache-2.0",

  match: [
    "https://*.stackoverflow.com/*",
    "https://*.stackexchange.com/*",
    "https://superuser.com/*",
    "https://serverfault.com/*",
    "https://askubuntu.com/*",
    "https://mathoverflow.net/*",
    "https://stackapps.com/*",
  ],

  grant: ["none"],

  runAt: "document-end",
  noframes: true,

  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",
})

installStackExchangeCopyCodeOnly()
