// based on https://stackoverflow.com/a/65996386
async function copyToClipboardModern(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

function copyToClipboardLegacy(text: string): boolean {
  const textArea = document.createElement("textarea")
  textArea.value = text
  textArea.setAttribute("readonly", "")
  textArea.style.position = "absolute"
  textArea.style.left = "-999999px"

  document.body.prepend(textArea)
  textArea.select()

  try {
    if (typeof document.execCommand !== "function") {
      return false
    }
    return document.execCommand("copy")
  } catch (error) {
    console.error(error)
    return false
  } finally {
    textArea.remove()
  }
}

export async function copyToClipboardGraceful(text: string): Promise<boolean> {
  // Navigator clipboard API needs a secure context.
  if (navigator.clipboard && window.isSecureContext) {
    return copyToClipboardModern(text)
  }

  return copyToClipboardLegacy(text)
}
