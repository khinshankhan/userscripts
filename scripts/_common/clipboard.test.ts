import { beforeEach, describe, expect, it, vi } from "vitest"
import { copyToClipboardGraceful } from "./clipboard"

describe("copyToClipboardGraceful", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
    vi.restoreAllMocks()
  })

  it("uses navigator.clipboard in a secure context", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    })

    await expect(copyToClipboardGraceful("hello")).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith("hello")
  })

  it("falls back to execCommand outside a secure context", async () => {
    const execCommand = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn() },
    })
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: false,
    })
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    })

    await expect(copyToClipboardGraceful("fallback")).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith("copy")
    expect(document.querySelector("textarea")).toBeNull()
  })

  it("returns false when navigator.clipboard throws", async () => {
    const error = new Error("nope")
    const writeText = vi.fn().mockRejectedValue(error)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    })

    await expect(copyToClipboardGraceful("hello")).resolves.toBe(false)
    expect(consoleError).toHaveBeenCalledWith(error)
  })
})
