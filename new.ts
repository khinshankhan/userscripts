import readline from "node:readline"
import fs from "node:fs"

export async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

function kebabCase(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-")
}

let name = ""
let id = ""
let dir = ""
do {
  name = await prompt("Name: ")
  id = kebabCase(name)
  dir = `./scripts/${id}`
} while (fs.existsSync(dir))

fs.mkdirSync(dir, { recursive: true })
fs.mkdirSync(`${dir}/src`, { recursive: true })
fs.writeFileSync(
  `${dir}/src/index.ts`,
  `defineUserScript({
  name: "${name}",
  description: "TODO",
  namespace: "https://khinshankhan.com",
  version: "0.1.0",

  author: "khinshankhan",
  homepageURL: "https://github.com/khinshankhan/userscripts",
  supportURL: "https://github.com/khinshankhan/userscripts/issues",

  match: ["*://*/*"],

  runAt: "document-end",
  grant: ["none"],
})

console.log("%c${name}.", "font-family: monospace; color: #d6a6db;")`
)
