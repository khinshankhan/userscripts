import fs from "node:fs"
import path from "node:path"
import { runInNewContext } from "node:vm"
import { defineConfig, Rolldown, type UserConfig } from "tsdown"
import { walk } from "estree-walker"
import type { UserscriptBanner } from "./types/banner"
import externalGlobals from "rollup-plugin-external-globals"

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
      if (typeof v === "boolean") {
        if (v) {
          entries.push([key, ""])
        }
        continue
      }

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

// tsdown eliminates region comments, so we add them back here with a plugin that matches the filter
// https://rolldown.rs/options/output#legalcomments
function saveNodeModulesRegion(): Rolldown.Plugin {
  const nodeModulesPath = process.cwd() + "/node_modules/"

  return {
    name: "save-node-modules-region",
    transform(code, id) {
      if (!id.includes(nodeModulesPath)) {
        return code
      }
      return (
        "//!#region node_modules/" +
        id.slice(nodeModulesPath.length) +
        "\n" +
        code +
        "\n//!#endregion"
      )
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
      const possibleEntries = [
        path.join(dir, id, "src", "index.ts"),
        path.join(dir, id, "src", "index.tsx"),
        path.join(dir, id, "src", "index.js"),
        path.join(dir, id, "src", "index.jsx"),
      ]
      return possibleEntries.map((entry) => {
        return {
          id: d.name,
          entry,
        }
      })
    })
    .flat()
    .filter(({ entry }) => fs.existsSync(entry))
}

const GLOBAL_IMPORT_FORMATS = ["esm", "umd"] as const
type GlobalImportFormat = (typeof GLOBAL_IMPORT_FORMATS)[number]

const globalImportFormatGroups = {
  cdn: ["umd"],
  dynamic: ["esm"],
} as const satisfies Record<string, readonly GlobalImportFormat[]>

// TODO: figure out a better way to manage external globals and their URLs for userscripts
const externalGlobalsTable: Record<
  string,
  { lib: string; format: GlobalImportFormat; url: string }
> = {
  zod: {
    lib: "Zod",
    format: "esm",
    url: "https://esm.sh/zod@4.2.1",
  },
}

const importsTables = Object.entries(externalGlobalsTable).map((kv) => {
  return [kv[0], kv[1].lib + ` /* ${["__USERSCRIPT_IMPORT", kv[0]].join(":")} */`] as const
})

export default defineConfig(
  getScripts("./scripts").map(({ id, entry }): UserConfig => {
    const requires = new Set<string>()
    return {
      entry,
      platform: "browser",
      format: "iife",
      noExternal: [],
      inputOptions: {
        experimental: {
          attachDebugInfo: "none",
        },
      },
      minify: "dce-only",
      outputOptions: {
        entryFileNames: `${id}.user.js`,
        legalComments: "inline",
        intro: '"use strict"',
      },
      plugins: [
        externalGlobals(Object.fromEntries(importsTables)),
        // due to how tsdown works, we need to capture requires in a separate plugin before the banner extractor runs
        {
          name: "capture-node-modules-requires",
          transform(code) {
            const regex = new RegExp("__USERSCRIPT_IMPORT:([@a-zA-Z0-9_/-]+)")

            const match = code.match(regex)
            const result = match?.[1]
            if (result) {
              requires.add(result)
            }

            return code
          },
        },
        saveNodeModulesRegion(),
        userscriptsBannerExtractorPlugin(),
        {
          name: "add-node-modules-userscript-cdn-requires",
          generateBundle(_options: any, bundle: any) {
            const formats: readonly GlobalImportFormat[] = globalImportFormatGroups.cdn
            if (formats.length === 0) {
              return
            }

            const first = Object.values(bundle)[0] as any
            if (!first || first.type !== "chunk") return

            let code: string = first.code

            const headerEnd = code.indexOf("// ==/UserScript==")
            let header = code.slice(0, headerEnd)
            const pad = /\/\/ @([a-zA-Z]+ +)/.exec(header)![1]!.length

            const requiresList = Array.from(requires)
            if (requiresList.length === 0) {
              return
            }

            header += requiresList
              .map((req) => {
                const importEntry = externalGlobalsTable[req]
                if (!importEntry) {
                  throw new Error(`Cannot find externalGlobalsTable entry for ${req}`)
                }

                if (!formats.includes(importEntry.format)) {
                  return null
                }

                return `// ${"@require".padEnd(pad)} ${importEntry.url}`
              })
              .filter((line) => line !== null)
            code = header.trimEnd() + "\n" + code.slice(headerEnd)
            first.code = code
          },
        },
        {
          name: "add-node-modules-userscript-dynamic-requires",
          generateBundle(_options: any, bundle: any) {
            const formats: readonly GlobalImportFormat[] = globalImportFormatGroups.dynamic
            if (formats.length === 0) {
              return
            }

            const first = Object.values(bundle)[0] as any
            if (!first || first.type !== "chunk") return

            let code: string = first.code

            const iffeStartKey = 'use strict";\n'
            const iffeFirstLineEnd = code.indexOf(iffeStartKey) + iffeStartKey.length
            const beforeIffeStart = code.slice(0, iffeFirstLineEnd)
            const afterIffeStart = code.slice(iffeFirstLineEnd)

            const requiresList = Array.from(requires)
            if (requiresList.length === 0) {
              return
            }

            const dynamicRequires = requiresList
              .map((req) => {
                const importEntry = externalGlobalsTable[req]
                if (!importEntry) {
                  throw new Error(`Cannot find externalGlobalsTable entry for ${req}`)
                }

                if (!formats.includes(importEntry.format)) {
                  return null
                }

                return `\tconst ${importEntry.lib} = await import('${importEntry.url}');`
              })
              .filter((line) => line !== null)
              .join("\n")

            const dynamicRequiresLines = dynamicRequires.length > 0 ? dynamicRequires + "\n" : ""

            code = beforeIffeStart + dynamicRequiresLines + afterIffeStart
            code = code.replace("(function() {", "(async function() {")
            first.code = code
          },
        },
      ],
    }
  })
)
