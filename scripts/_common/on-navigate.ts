export type NavigateHandler = (url: string, prevUrl: string | null) => void

export type OnNavigateOptions = {
  /**
   * Call handler immediately with current URL.
   * Default: true
   */
  immediate?: boolean

  /**
   * Use a throttled MutationObserver fallback.
   * Default: true
   */
  useMutationObserverFallback?: boolean
}

export function onNavigate(handler: NavigateHandler, opts: OnNavigateOptions = {}): () => void {
  const rootWindow = window
  const rootDocument = document
  const rootHistory = history

  const immediate = opts.immediate ?? true
  const useMO = opts.useMutationObserverFallback ?? true

  let active = true
  let lastUrl = rootWindow.location.href

  const emitIfChanged = () => {
    if (!active) return

    const url = rootWindow.location.href
    if (url === lastUrl) return
    const prev = lastUrl
    lastUrl = url
    handler(url, prev)
  }

  const scheduleEmit = () => queueMicrotask(emitIfChanged)

  if (immediate) handler(lastUrl, null)

  // navigation API
  const nav = (rootWindow as any).navigation
  const onNavSuccess = () => scheduleEmit()
  if (nav?.addEventListener) {
    nav.addEventListener("navigatesuccess", onNavSuccess)
  }

  // history API hooks
  const originalPushState = rootHistory.pushState
  const originalReplaceState = rootHistory.replaceState

  rootHistory.pushState = function (this: History, ...args: any[]) {
    const ret = originalPushState.apply(this, args as any)
    scheduleEmit()
    return ret
  } as History["pushState"]

  rootHistory.replaceState = function (this: History, ...args: any[]) {
    const ret = originalReplaceState.apply(this, args as any)
    scheduleEmit()
    return ret
  } as History["replaceState"]

  // browser navigation / hash
  const onPop = () => scheduleEmit()
  const onHash = () => scheduleEmit()
  rootWindow.addEventListener("popstate", onPop, true)
  rootWindow.addEventListener("hashchange", onHash, true)

  // throttled MutationObserver fallback
  let mo: MutationObserver | null = null
  if (useMO) {
    let scheduled = false
    mo = new MutationObserver(() => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(() => {
        scheduled = false
        emitIfChanged()
      })
    })
    mo.observe(rootDocument, { subtree: true, childList: true })
  }

  // cleanup / unsubscribe
  return () => {
    active = false

    if (nav?.removeEventListener) {
      nav.removeEventListener("navigatesuccess", onNavSuccess)
    }
    rootHistory.pushState = originalPushState
    rootHistory.replaceState = originalReplaceState
    rootWindow.removeEventListener("popstate", onPop, true)
    rootWindow.removeEventListener("hashchange", onHash, true)
    mo?.disconnect()
  }
}
