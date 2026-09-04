// ==UserScript==
// @name        GitHub Keyboard Shortcuts
// @namespace   https://khinshankhan.com
// @version     0.1.0
// @description Adds extra keyboard shortcuts to GitHub (g f -> feed).
// @author      khinshankhan
// @license     Apache-2.0
// @match       https://github.com/*
// @grant       none
// @run-at      document-end
// @noframes
// @homepageURL https://github.com/khinshankhan/userscripts
// @supportURL  https://github.com/khinshankhan/userscripts/issues
// ==/UserScript==

(function() {
	"use strict";
	const SHORTCUTS = { "g f": "https://github.com/feed" };
	const MAX_DELAY_MS = 300;
	function isEditable(el) {
		if (!(el instanceof HTMLElement)) return false;
		if (el.isContentEditable) return true;
		const tag = el.tagName;
		return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
	}
	function installKeyboardShortcuts() {
		const parsed = Object.entries(SHORTCUTS).map(([seq, url]) => ({
			keys: seq.split(" "),
			url
		}));
		const maxLen = Math.max(...parsed.map((s) => s.keys.length));
		let buffer = [];
		let lastKeyTime = 0;
		document.addEventListener("keydown", (e) => {
			if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
			if (isEditable(e.target)) return;
			const now = Date.now();
			if (now - lastKeyTime > MAX_DELAY_MS) buffer = [];
			lastKeyTime = now;
			buffer.push(e.key);
			if (buffer.length > maxLen) buffer = buffer.slice(-maxLen);
			for (const { keys, url } of parsed) {
				if (buffer.length < keys.length) continue;
				if (buffer.slice(-keys.length).every((k, i) => k === keys[i])) {
					buffer = [];
					window.location.href = url;
					return;
				}
			}
		});
	}
	installKeyboardShortcuts();
})();
