import fs from "node:fs"
import path from "node:path"
import { runInNewContext } from "node:vm"
import { defineConfig, Rolldown, type UserConfig } from "tsdown"
import { walk } from "estree-walker"
import type { UserscriptBanner } from "./types/banner"

function evalDefineUserScript(callExpressionCode: string): ReturnType<typeof defineUserScript> {
  // execute in a sandbox with defineUserScript stub
  const json = runInNewContext(`
    RegExp.prototype.toJSON = function() { return this.toString() }
    Function.prototype.toJSON = function() { return this.toString() }
    function defineUserScript(banner) { return banner }
    JSON.stringify(${callExpressionCode})
  `)

  // TODO: validate structure?
  return JSON.parse(json)
}

function bannerObjectToString(opts: UserscriptBanner): string {
  const entries: Array<[string, string]> = []

  for (const [k, v] of Object.entries(opts)) {
    const key = k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()).replaceAll("-u-r-l", "URL")
    if (Array.isArray(v)) {
      for (const item of v) entries.push([key, String(item)])
    } else {
      entries.push([key, String(v)])
    }
  }

  const pad = Math.max(...entries.map(([k]) => k.length), 0)
  return [
    "// ==UserScript==",
    ...entries.map(([k, v]) => `// @${k.padEnd(pad)} ${v}`.replaceAll(/ +$/g, "")),
    "// ==/UserScript==",
    "",
  ].join("\n")
}

function userscriptsBannerExtractorPlugin(): Rolldown.Plugin {
  return {
    name: "userscripts-banner-extractor",
    generateBundle(_options: any, bundle: any) {
      const first = Object.values(bundle)[0] as any
      if (!first || first.type !== "chunk") return

      let code: string = first.code
      if (!code.includes("defineUserScript")) return

      const ast = this.parse(code)
      walk(ast as any, {
        enter(node: any) {
          if (
            node.type === "CallExpression" &&
            node.callee?.type === "Identifier" &&
            node.callee.name === "defineUserScript" &&
            typeof node.start === "number" &&
            typeof node.end === "number"
          ) {
            const callCode = code.slice(node.start, node.end)
            const bannerObj = evalDefineUserScript(callCode)
            const header = bannerObjectToString(bannerObj)

            // remove the defineUserScript(...) call (and optional trailing ;)
            const after = code[node.end] === ";" ? node.end + 1 : node.end
            code = header + "\n" + code.slice(0, node.start) + code.slice(after).trimStart()
          }
        },
      })

      first.code = code
    },
  }
}

function getScripts(dir: string): Array<{ id: string; entry: string }> {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .map((d) => {
      // support for flat files, just in case
      if (!d.isDirectory()) {
        const id = d.name.replace(/\..*$/, "")
        const entry = path.join(dir, d.name)
        return { id, entry }
      }

      const id = d.name
      const entry = path.join(dir, id, "src", "index.ts")
      return { id, entry }
    })
    .filter(({ entry }) => fs.existsSync(entry))
}

export default defineConfig(
  getScripts("./scripts").map(({ id, entry }): UserConfig => {
    return {
      entry,
      platform: "browser",
      format: "iife",
      inputOptions: {
        experimental: {
          attachDebugInfo: "none",
        },
      },
      outputOptions: {
        entryFileNames: `${id}.user.js`,
      },
      plugins: [userscriptsBannerExtractorPlugin()],
    }
  })
)
