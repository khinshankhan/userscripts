import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  enhanceCodeBlocks,
  getCodeText,
  installStackExchangeCopyCodeOnly,
} from "./stackexchange-copy-code-only"

describe("stackexchange-copy-code-only", () => {
  let cleanup: (() => void) | null = null

  beforeEach(() => {
    document.head.innerHTML = ""
    document.body.innerHTML = ""
    cleanup = null
  })

  afterEach(() => {
    cleanup?.()
    cleanup = null
  })

  it("reads only the code text", () => {
    document.body.innerHTML = `<pre><code>nuitka --standalone your_script.py</code></pre>`
    const code = document.querySelector("code")
    if (!code) {
      throw new Error("Code element not found")
    }

    expect(getCodeText(code)).toBe("nuitka --standalone your_script.py")
  })

  it("removes nearby native copy buttons and adds an overlay button on the code block", () => {
    document.body.innerHTML = `
      <pre class="s-code-block">
        <div>
          <div>
            <button class="js-copy-button" type="button">Copy</button>
          </div>
        </div>
        <code>print("hi")</code>
      </pre>
    `

    enhanceCodeBlocks(document)

    const buttons = Array.from(document.querySelectorAll("button"))
    expect(buttons).toHaveLength(1)
    expect(buttons[0]?.textContent).toBe("Copy code only")
    expect(buttons[0]?.matches("[data-shan-copy-code-only='true']")).toBe(true)
    expect(buttons[0]?.parentElement?.tagName).toBe("PRE")
    expect(buttons[0]?.className).toContain("shan-copy-code-only-overlay")
    expect(document.querySelector(".js-copy-button")).toBeNull()
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

    cleanup = installStackExchangeCopyCodeOnly(document)

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
