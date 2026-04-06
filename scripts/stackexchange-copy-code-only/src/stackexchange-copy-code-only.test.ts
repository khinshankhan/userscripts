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
    expect(document.querySelector("pre > div")).toBeNull()
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

  it("handles Stack Overflow's nested s-code-block toolbar markup", () => {
    document.body.innerHTML = `
      <pre class="s-code-block">
        <div>
          <div class="mtn4 d-flex jc-end ps-sticky l0 mrn4">
            <button
              type="button"
              class="py2 mb2 s-btn s-btn__muted s-btn__xs fs-caption ff-sans d-flex ai-center js-copy-button fc-black-400 h:fc-black-500 f:bg-black-200 v3 svelte-1tzwzlq"
            >
              Copy
            </button>
          </div>
        </div>
        <code class="hljs language-crmsh">
          $ git log --oneline origin/next..origin/<span class="hljs-keyword">master</span>
          <span class="hljs-title">59b5552</span> <span class="hljs-keyword">master</span>
        </code>
      </pre>
    `

    enhanceCodeBlocks(document)

    const pre = document.querySelector("pre.s-code-block")
    const customButton = document.querySelector<HTMLButtonElement>(
      'button[data-shan-copy-code-only="true"]'
    )

    expect(pre?.querySelector(".js-copy-button")).toBeNull()
    expect(pre?.firstElementChild).toBe(customButton)
    expect(customButton?.className).toContain("shan-copy-code-only-overlay")
  })

  it("removes a native toolbar injected after the custom button is mounted", async () => {
    document.body.innerHTML = `
      <pre class="s-code-block"><code>print("hi")</code></pre>
    `

    cleanup = installStackExchangeCopyCodeOnly(document)

    const pre = document.querySelector("pre.s-code-block")
    if (!(pre instanceof HTMLPreElement)) {
      throw new Error("Pre element not found")
    }

    const lateToolbar = document.createElement("div")
    lateToolbar.innerHTML = `
      <div class="mtn4 d-flex jc-end ps-sticky l0 mrn4">
        <button type="button" class="js-copy-button">Copy</button>
      </div>
    `
    pre.prepend(lateToolbar)

    await vi.waitFor(() => {
      expect(pre.querySelector(".js-copy-button")).toBeNull()
      expect(pre.querySelectorAll('button[data-shan-copy-code-only="true"]')).toHaveLength(1)
    })
  })
})
