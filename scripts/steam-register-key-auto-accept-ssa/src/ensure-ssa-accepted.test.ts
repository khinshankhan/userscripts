import { describe, it, expect, vi, beforeEach } from "vitest"
import { ensureSsaAccepted } from "./ensure-ssa-accepted"

describe("ensureSsaAccepted", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("clicks when unchecked", () => {
    document.body.innerHTML = `<input id="accept_ssa" type="checkbox" />`
    const el = document.getElementById("accept_ssa")
    if (!el) {
      throw new Error("Checkbox not found")
    }

    const clickSpy = vi.spyOn(el, "click")
    ensureSsaAccepted(document)

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it("does not click when already checked", () => {
    document.body.innerHTML = `<input id="accept_ssa" type="checkbox" checked />`
    const el = document.getElementById("accept_ssa")
    if (!el) {
      throw new Error("Checkbox not found")
    }

    const clickSpy = vi.spyOn(el, "click")
    ensureSsaAccepted(document)

    expect(clickSpy).toHaveBeenCalledTimes(0)
  })

  it("no-ops if element missing or not an input", () => {
    expect(() => ensureSsaAccepted(document)).not.toThrow()

    document.body.innerHTML = `<div id="accept_ssa"></div>`
    expect(() => ensureSsaAccepted(document)).not.toThrow()
  })
})
