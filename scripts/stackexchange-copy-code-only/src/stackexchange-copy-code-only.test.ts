import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  enhanceCodeBlocks,
  getCodeText,
  installStackExchangeCopyCodeOnly,
} from "./stackexchange-copy-code-only"

describe("stackexchange-copy-code-only", () => {
  beforeEach(() => {
    document.head.innerHTML = ""
    document.body.innerHTML = ""
  })

  it("reads only the code text", () => {
    document.body.innerHTML = `<pre><code>nuitka --standalone your_script.py</code></pre>`
    const code = document.querySelector("code")
    if (!code) {
      throw new Error("Code element not found")
    }

    expect(getCodeText(code)).toBe("nuitka --standalone your_script.py")
  })

  it("adds a button next to the existing Stack Exchange copy button", () => {
    document.body.innerHTML = `
      <div>
        <button class="js-copy-button" type="button">Copy</button>
        <pre><code>print("hi")</code></pre>
      </div>
    `

    enhanceCodeBlocks(document)

    const buttons = Array.from(document.querySelectorAll("button"))
    expect(buttons.map((button) => button.textContent)).toEqual(["Copy", "Copy code only"])
  })

  it("falls back to an overlay button when no native copy button exists", () => {
    document.body.innerHTML = `<pre><code>print("hi")</code></pre>`

    enhanceCodeBlocks(document)

    const pre = document.querySelector("pre")
    const button = document.querySelector('button[data-shan-copy-code-only="true"]')

    expect(pre?.style.position).toBe("relative")
    expect(button?.className).toContain("shan-copy-code-only-overlay")
  })

  it("copies only the code text when clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    })

    document.body.innerHTML = `
      <div>
        <button class="js-copy-button" type="button">Copy</button>
        <pre><code>nuitka --standalone your_script.py</code></pre>
      </div>
    `

    installStackExchangeCopyCodeOnly(document)

    const button = document.querySelector<HTMLButtonElement>(
      'button[data-shan-copy-code-only="true"]'
    )
    if (!button) {
      throw new Error("Copy-only button not found")
    }

    button.click()
    await Promise.resolve()

    expect(writeText).toHaveBeenCalledWith("nuitka --standalone your_script.py")
  })
})
