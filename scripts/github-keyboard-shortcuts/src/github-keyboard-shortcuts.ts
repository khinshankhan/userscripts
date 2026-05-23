const SHORTCUTS: Record<string, string> = {
  "g f": "https://github.com/feed",
}

const MAX_DELAY_MS = 300

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) {
    return false
  }
  if (el.isContentEditable) {
    return true
  }
  const tag = el.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
}

export function installKeyboardShortcuts() {
  const parsed = Object.entries(SHORTCUTS).map(([seq, url]) => ({
    keys: seq.split(" "),
    url,
  }))
  const maxLen = Math.max(...parsed.map((s) => s.keys.length))

  let buffer: string[] = []
  let lastKeyTime = 0

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
      return
    }
    if (isEditable(e.target)) {
      return
    }

    const now = Date.now()
    if (now - lastKeyTime > MAX_DELAY_MS) {
      buffer = []
    }
    lastKeyTime = now
    buffer.push(e.key)

    if (buffer.length > maxLen) {
      buffer = buffer.slice(-maxLen)
    }

    for (const { keys, url } of parsed) {
      if (buffer.length < keys.length) {
        continue
      }
      const tail = buffer.slice(-keys.length)
      if (tail.every((k, i) => k === keys[i])) {
        buffer = []
        window.location.href = url
        return
      }
    }
  })
}
