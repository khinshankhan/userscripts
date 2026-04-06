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

function createCopyOnlyButton(doc: Document): HTMLButtonElement {
  const button = doc.createElement("button")
  button.type = "button"
  button.className = "s-btn s-btn__filled s-btn__xs ws-nowrap"
  button.setAttribute(COPY_ONLY_BUTTON_ATTR, "true")
  button.textContent = "Copy code only"
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

function removeNativeCopyButtons(pre: HTMLPreElement): void {
  const existingButtons = pre.querySelectorAll<HTMLButtonElement>(".js-copy-button, .copy-code-button")
  for (const existingButton of existingButtons) {
    let wrapper: HTMLElement | null = existingButton
    while (wrapper?.parentElement && wrapper.parentElement !== pre) {
      wrapper = wrapper.parentElement
    }

    if (wrapper && wrapper.parentElement === pre) {
      wrapper.remove()
      continue
    }

    existingButton.remove()
  }
}

function attachButton(pre: HTMLPreElement): void {
  removeNativeCopyButtons(pre)
  if (pre.querySelector(`[${COPY_ONLY_BUTTON_ATTR}]`)) {
    return
  }

  const button = createCopyOnlyButton(pre.ownerDocument)
  pre.style.position = "relative"
  button.classList.add(OVERLAY_BUTTON_CLASS)
  pre.prepend(button)
}

export function enhanceCodeBlocks(root: ParentNode): void {
  const doc = root instanceof Document ? root : root.ownerDocument
  if (!doc?.head) return

  ensureStyles(doc)

  for (const code of root.querySelectorAll<HTMLElement>("pre > code")) {
    const pre = code.parentElement
    if (!(pre instanceof HTMLPreElement)) continue
    attachButton(pre)
  }
}

function enhanceClosestCodeBlock(node: HTMLElement): void {
  const pre = node.closest("pre")
  if (!(pre instanceof HTMLPreElement)) return

  const code = pre.querySelector<HTMLElement>("code")
  if (!code) return

  attachButton(pre)
}

async function handleCopyButtonClick(button: HTMLButtonElement): Promise<void> {
  const pre = button.closest("pre")
  if (!(pre instanceof HTMLPreElement)) return

  const code = pre.querySelector("code")
  if (!(code instanceof HTMLElement)) return

  const ok = await copyToClipboardGraceful(getCodeText(code))
  setTemporaryButtonText(button, ok ? "Copied" : "Copy failed")
}

export function installStackExchangeCopyCodeOnly(doc: Document = document): () => void {
  enhanceCodeBlocks(doc)

  const onClick = (event: Event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const button = target.closest<HTMLButtonElement>(`button[${COPY_ONLY_BUTTON_ATTR}="true"]`)
    if (!button) return

    event.preventDefault()
    event.stopPropagation()
    void handleCopyButtonClick(button)
  }

  const observer = new MutationObserver((mutations) => {
    const addedNodes = mutations.flatMap((mutation) => Array.from(mutation.addedNodes))
    for (const node of addedNodes) {
      if (!(node instanceof HTMLElement)) continue
      enhanceCodeBlocks(node)
      enhanceClosestCodeBlock(node)
    }
  })

  observer.observe(doc.body, { childList: true, subtree: true })
  doc.addEventListener("click", onClick, true)
  const unsubscribeNavigate = onNavigate(() => enhanceCodeBlocks(doc), { immediate: false })

  return () => {
    observer.disconnect()
    doc.removeEventListener("click", onClick, true)
    unsubscribeNavigate()
  }
}
