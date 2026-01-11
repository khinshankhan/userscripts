import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { toWatchUrlFromShortsUrl } from "./youtube-shorts-to-watch-redirect"

function loc(href: string): Location {
  const u = new URL(href)
  return {
    href: u.toString(),
    pathname: u.pathname,
  } as unknown as Location
}

describe("toWatchUrlFromShortsUrl", () => {
  it("returns null for non-shorts paths", () => {
    expect(toWatchUrlFromShortsUrl(loc("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))).toBeNull()
    expect(toWatchUrlFromShortsUrl(loc("https://www.youtube.com/"))).toBeNull()
    expect(toWatchUrlFromShortsUrl(loc("https://www.youtube.com/shorts"))).toBeNull()
  })

  it("converts /shorts/{vid} to /watch?v={vid}", () => {
    expect(toWatchUrlFromShortsUrl(loc("https://www.youtube.com/shorts/dQw4w9WgXcQ"))).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    )
  })

  it("converts mobile /shorts/{vid} to /watch?v={vid}", () => {
    expect(toWatchUrlFromShortsUrl(loc("https://m.youtube.com/shorts/dQw4w9WgXcQ"))).toBe(
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ"
    )
  })

  it("preserves existing query params and overwrites v", () => {
    expect(
      toWatchUrlFromShortsUrl(
        loc("https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share&t=12&v=WRONG")
      )
    ).toBe("https://www.youtube.com/watch?feature=share&t=12&v=dQw4w9WgXcQ")
  })

  it("drops the hash fragment", () => {
    expect(
      toWatchUrlFromShortsUrl(loc("https://www.youtube.com/shorts/dQw4w9WgXcQ#something"))
    ).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
  })

  it("ignores extra path segments after the video id", () => {
    expect(
      toWatchUrlFromShortsUrl(loc("https://www.youtube.com/shorts/dQw4w9WgXcQ/extra/stuff?x=1"))
    ).toBe("https://www.youtube.com/watch?x=1&v=dQw4w9WgXcQ")
  })

  it("returns null if /shorts/ has no video id", () => {
    expect(toWatchUrlFromShortsUrl(loc("https://www.youtube.com/shorts/"))).toBeNull()
  })
})
