defineUserScript({
  name: "Hello",
  description: "Logs a friendly message to the console on every page load.",
  namespace: "https://github.com/khinshankhan/userscripts",
  version: "0.1.0",
  author: "khinshankhan",

  match: ["*://*/*"],

  runAt: "document-end",
  grant: ["none"],
})

console.log(
  "%cHello. I see you've loaded another web page.\nRemember: prolonged surfing may attract viruses.",
  "font-family: monospace; color: #d6a6db;"
)
