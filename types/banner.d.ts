export type UserscriptBanner = {
  name: string
  description?: string
  namespace: string
  version: string
  author: string

  match?: string[]
  include?: string[]
  exclude?: string[]

  runAt?: "document-start" | "document-end" | "document-idle"
  grant?: string[]
}

declare global {
  function defineUserScript<const T extends UserscriptBanner>(banner: T): T
}
