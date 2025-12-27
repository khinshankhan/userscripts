import { describe, it, expect, vi } from "vitest"
import { sayHello } from "./hello"

describe("sayHello", () => {
  it("logs the greeting message", () => {
    const log = vi.fn()

    sayHello(log)

    expect(log).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Hello. I see you've loaded another web page."),
      expect.stringContaining("font-family: monospace")
    )
  })
})
