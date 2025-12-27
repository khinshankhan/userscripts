import { sayHello } from "./hello"

defineUserScript({
  name: "Hello",
  description: "Logs a friendly message to the console on every page load.",
  namespace: "https://khinshankhan.com",
  version: "0.1.0",

  author: "khinshankhan",
  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",

  match: ["*://*/*"],

  runAt: "document-end",
  grant: ["none"],
})

sayHello()
