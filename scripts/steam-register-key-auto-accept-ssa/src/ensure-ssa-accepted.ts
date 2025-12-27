function isInput(el: Element | null): el is HTMLInputElement {
  return el instanceof HTMLInputElement
}

export function ensureSsaAccepted(doc: Document): void {
  const el = doc.getElementById("accept_ssa")

  if (!isInput(el)) return
  if (el.type !== "checkbox") return

  if (!el.checked) {
    el.click()
  }
}
