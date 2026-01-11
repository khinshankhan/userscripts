import { sayHello } from "./hello"

defineUserScript({
  name: "Hello",
  namespace: "https://khinshankhan.com",
  version: "0.1.0",
  description: "Logs a friendly message to the console on every page load.",
  author: "khinshankhan",
  license: "Apache-2.0",

  match: ["*://*/*"],

  grant: ["none"],

  runAt: "document-end",
  noframes: true,

  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",
})

sayHello()
