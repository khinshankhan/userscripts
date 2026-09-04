// ==UserScript==
// @name        YouTube Shorts to Watch Redirect
// @namespace   https://khinshankhan.com
// @version     0.1.0
// @description Redirects YouTube Shorts URLs to the standard watch page.
// @author      khinshankhan
// @license     Apache-2.0
// @match       https://*.youtube.com/*
// @match       https://youtube.com/*
// @grant       none
// @run-at      document-start
// @noframes
// @homepageURL https://github.com/khinshankhan/userscripts
// @supportURL  https://github.com/khinshankhan/userscripts/issues
// ==/UserScript==

(function() {
	"use strict";
	function onNavigate(handler, opts = {}) {
		const rootWindow = window;
		const rootDocument = document;
		const rootHistory = history;
		const immediate = opts.immediate ?? true;
		const useMO = opts.useMutationObserverFallback ?? true;
		let active = true;
		let lastUrl = rootWindow.location.href;
		const emitIfChanged = () => {
			if (!active) return;
			const url = rootWindow.location.href;
			if (url === lastUrl) return;
			const prev = lastUrl;
			lastUrl = url;
			handler(url, prev);
		};
		const scheduleEmit = () => queueMicrotask(emitIfChanged);
		if (immediate) handler(lastUrl, null);
		const nav = rootWindow.navigation;
		const onNavSuccess = () => scheduleEmit();
		if (nav?.addEventListener) nav.addEventListener("navigatesuccess", onNavSuccess);
		const originalPushState = rootHistory.pushState;
		const originalReplaceState = rootHistory.replaceState;
		rootHistory.pushState = function(...args) {
			const ret = originalPushState.apply(this, args);
			scheduleEmit();
			return ret;
		};
		rootHistory.replaceState = function(...args) {
			const ret = originalReplaceState.apply(this, args);
			scheduleEmit();
			return ret;
		};
		const onPop = () => scheduleEmit();
		const onHash = () => scheduleEmit();
		rootWindow.addEventListener("popstate", onPop, true);
		rootWindow.addEventListener("hashchange", onHash, true);
		let mo = null;
		if (useMO) {
			let scheduled = false;
			mo = new MutationObserver(() => {
				if (scheduled) return;
				scheduled = true;
				queueMicrotask(() => {
					scheduled = false;
					emitIfChanged();
				});
			});
			mo.observe(rootDocument, {
				subtree: true,
				childList: true
			});
		}
		return () => {
			active = false;
			if (nav?.removeEventListener) nav.removeEventListener("navigatesuccess", onNavSuccess);
			rootHistory.pushState = originalPushState;
			rootHistory.replaceState = originalReplaceState;
			rootWindow.removeEventListener("popstate", onPop, true);
			rootWindow.removeEventListener("hashchange", onHash, true);
			mo?.disconnect();
		};
	}
	function redirectTo(url) {
		if (window.location.href === url) return;
		window.location.replace(url);
	}
	function toWatchUrlFromShortsUrl(loc) {
		const parts = loc.pathname.split("/").filter(Boolean);
		if (parts[0] !== "shorts") return null;
		const vid = parts[1];
		if (!vid) return null;
		const out = new URL(loc.href);
		out.pathname = "/watch";
		out.searchParams.set("v", vid);
		out.hash = "";
		return out.toString();
	}
	function handleNavigate() {
		const target = toWatchUrlFromShortsUrl(window.location);
		if (target) redirectTo(target);
	}
	onNavigate(handleNavigate);
})();
