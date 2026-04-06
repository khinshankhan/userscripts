import { copyToClipboardGraceful } from "../../_common/clipboard"
import { onNavigate } from "../../_common/on-navigate"

const COPY_ONLY_BUTTON_ATTR = "data-shan-copy-code-only"
const OVERLAY_BUTTON_CLASS = "shan-copy-code-only-overlay"
const STYLE_ID = "shan-copy-code-only-style"

export function getCodeText(code: Element): string {
  return code.textContent ?? ""
}

function setTemporaryButtonText(button: HTMLButtonElement, text: string): void {
  const original = button.dataset.originalText ?? button.textContent ?? "Copy code only"
  button.dataset.originalText = original
  button.textContent = text

  window.setTimeout(() => {
    button.textContent = original
  }, 1500)
}

function createCopyOnlyButton(doc: Document, code: Element): HTMLButtonElement {
  const button = doc.createElement("button")
  button.type = "button"
  button.className = "s-btn s-btn__filled s-btn__xs ws-nowrap"
  button.setAttribute(COPY_ONLY_BUTTON_ATTR, "true")
  button.textContent = "Copy code only"
  button.addEventListener("click", async (event) => {
    event.preventDefault()
    event.stopPropagation()

    const ok = await copyToClipboardGraceful(getCodeText(code))
    setTemporaryButtonText(button, ok ? "Copied" : "Copy failed")
  })
  return button
}

function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return

  const style = doc.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    .${OVERLAY_BUTTON_CLASS} {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      z-index: 2;
    }
  `
  doc.head.append(style)
}

function attachButton(pre: HTMLPreElement, code: HTMLElement): void {
  if (pre.querySelector(`[${COPY_ONLY_BUTTON_ATTR}]`)) {
    return
  }

  const doc = pre.ownerDocument
  const existingButton = pre.parentElement?.querySelector<HTMLButtonElement>(
    ".js-copy-button, .copy-code-button"
  )
  const button = createCopyOnlyButton(doc, code)

  if (existingButton?.parentElement) {
    existingButton.insertAdjacentElement("afterend", button)
    return
  }

  pre.style.position = "relative"
  button.classList.add(OVERLAY_BUTTON_CLASS)
  pre.append(button)
}

export function enhanceCodeBlocks(root: ParentNode): void {
  const doc = root instanceof Document ? root : root.ownerDocument
  if (!doc?.head) return

  ensureStyles(doc)

  for (const code of root.querySelectorAll<HTMLElement>("pre > code")) {
    const pre = code.parentElement
    if (!(pre instanceof HTMLPreElement)) continue
    attachButton(pre, code)
  }
}

export function installStackExchangeCopyCodeOnly(doc: Document = document): () => void {
  enhanceCodeBlocks(doc)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue
        enhanceCodeBlocks(node)
      }
    }
  })

  observer.observe(doc.body, { childList: true, subtree: true })
  const unsubscribeNavigate = onNavigate(() => enhanceCodeBlocks(doc), { immediate: false })

  return () => {
    observer.disconnect()
    unsubscribeNavigate()
  }
}
