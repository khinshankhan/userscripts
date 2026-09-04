// ==UserScript==
// @name        Paper Design Open in App
// @namespace   https://khinshankhan.com
// @version     0.1.0
// @description Opens paper.design file links in the Paper desktop app.
// @author      khinshankhan
// @license     Apache-2.0
// @match       https://app.paper.design/*
// @grant       none
// @run-at      document-end
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
	const PAPER_APP_HOST = "app.paper.design";
	function openInApp(url) {
		const frame = document.createElement("iframe");
		frame.style.display = "none";
		frame.src = url;
		document.body.appendChild(frame);
		setTimeout(() => frame.remove(), 0);
	}
	function toPaperAppUrl(loc) {
		if (loc.hostname !== PAPER_APP_HOST) return null;
		const parts = loc.pathname.split("/").filter(Boolean);
		if (parts[0] !== "file" || !parts[1]) return null;
		return `paper://${parts.join("/")}${loc.search}${loc.hash}`;
	}
	const seen = /* @__PURE__ */ new Set();
	function handleNavigate() {
		const target = toPaperAppUrl(window.location);
		if (!target || seen.has(target)) return;
		seen.add(target);
		openInApp(target);
	}
	onNavigate(handleNavigate);
})();
