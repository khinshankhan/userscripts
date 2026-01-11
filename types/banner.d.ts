export type UserscriptBanner = {
  // identity
  name: string
  namespace: string
  version: string
  description: string
  author: string
  // SPDX license identifiers: https://spdx.org/licenses/
  license: "Apache-2.0" | "MIT"

  // scope
  match?: string[]
  include?: string[]
  exclude?: string[]

  // permissions
  grant: "none"[]
  connect?: string[]

  // execution
  runAt?: "document-start" | "document-end" | "document-idle"
  noframes: boolean

  // maintenance
  homepageURL: string
  supportURL: string
  // TODO: create a more stable dist and dev server before enabling these
  // updateURL?: string
  // downloadURL?: string
}

declare global {
  function defineUserScript(banner: UserscriptBanner): UserscriptBanner
}
