import { describe, it, expect } from "vitest"
import { toPaperAppUrl } from "./paper-design-open-in-app"

function loc(href: string): Location {
  const u = new URL(href)
  return {
    href: u.toString(),
    hostname: u.hostname,
    pathname: u.pathname,
    search: u.search,
    hash: u.hash,
  } as unknown as Location
}

describe("toPaperAppUrl", () => {
  it("converts a file url to a paper:// deep link", () => {
    expect(toPaperAppUrl(loc("https://app.paper.design/file/01M1G35MBAXJESC0Q8VFMQ549C/1-0"))).toBe(
      "paper://file/01M1G35MBAXJESC0Q8VFMQ549C/1-0"
    )
  })

  it("converts a bare file url without a page segment", () => {
    expect(toPaperAppUrl(loc("https://app.paper.design/file/01M1G35MBAXJESC0Q8VFMQ549C"))).toBe(
      "paper://file/01M1G35MBAXJESC0Q8VFMQ549C"
    )
  })

  it("preserves query params and hash", () => {
    expect(toPaperAppUrl(loc("https://app.paper.design/file/abc/1-0?node=42#thread"))).toBe(
      "paper://file/abc/1-0?node=42#thread"
    )
  })

  it("preserves extra path segments", () => {
    expect(toPaperAppUrl(loc("https://app.paper.design/file/abc/1-0/extra/stuff"))).toBe(
      "paper://file/abc/1-0/extra/stuff"
    )
  })

  it("ignores a trailing slash", () => {
    expect(toPaperAppUrl(loc("https://app.paper.design/file/abc/"))).toBe("paper://file/abc")
  })

  it("returns null for non-file routes", () => {
    expect(toPaperAppUrl(loc("https://app.paper.design/"))).toBeNull()
    expect(toPaperAppUrl(loc("https://app.paper.design/dashboard"))).toBeNull()
    expect(toPaperAppUrl(loc("https://app.paper.design/settings/account"))).toBeNull()
  })

  it("returns null when the file id is missing", () => {
    expect(toPaperAppUrl(loc("https://app.paper.design/file"))).toBeNull()
    expect(toPaperAppUrl(loc("https://app.paper.design/file/"))).toBeNull()
  })

  it("returns null for other hosts", () => {
    expect(toPaperAppUrl(loc("https://paper.design/file/abc/1-0"))).toBeNull()
    expect(toPaperAppUrl(loc("https://evil.example.com/file/abc/1-0"))).toBeNull()
  })
})
