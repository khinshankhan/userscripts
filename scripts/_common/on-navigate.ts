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
  const immediate = opts.immediate ?? true
  const useMO = opts.useMutationObserverFallback ?? true

  let lastUrl = window.location.href

  const emitIfChanged = () => {
    const url = window.location.href
    if (url === lastUrl) return
    const prev = lastUrl
    lastUrl = url
    handler(url, prev)
  }

  const scheduleEmit = () => queueMicrotask(emitIfChanged)

  if (immediate) handler(lastUrl, null)

  // navigation API
  const nav = (self as any).navigation
  const onNavSuccess = () => scheduleEmit()
  if (nav?.addEventListener) {
    nav.addEventListener("navigatesuccess", onNavSuccess)
  }

  // history API hooks
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  history.pushState = function (this: History, ...args: any[]) {
    const ret = originalPushState.apply(this, args as any)
    scheduleEmit()
    return ret
  } as History["pushState"]

  history.replaceState = function (this: History, ...args: any[]) {
    const ret = originalReplaceState.apply(this, args as any)
    scheduleEmit()
    return ret
  } as History["replaceState"]

  // browser navigation / hash
  const onPop = () => scheduleEmit()
  const onHash = () => scheduleEmit()
  window.addEventListener("popstate", onPop, true)
  window.addEventListener("hashchange", onHash, true)

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
    mo.observe(document, { subtree: true, childList: true })
  }

  // cleanup / unsubscribe
  return () => {
    if (nav?.removeEventListener) {
      nav.removeEventListener("navigatesuccess", onNavSuccess)
    }
    history.pushState = originalPushState
    history.replaceState = originalReplaceState
    window.removeEventListener("popstate", onPop, true)
    window.removeEventListener("hashchange", onHash, true)
    mo?.disconnect()
  }
}
