// ==UserScript==
// @name        Stack Exchange Copy Code Only
// @namespace   https://khinshankhan.com
// @version     0.1.2
// @description Adds a copy button that copies only the code, without Stack Exchange attribution text.
// @author      khinshankhan
// @license     Apache-2.0
// @match       https://*.stackoverflow.com/*
// @match       https://*.stackexchange.com/*
// @match       https://superuser.com/*
// @match       https://serverfault.com/*
// @match       https://askubuntu.com/*
// @match       https://mathoverflow.net/*
// @match       https://stackapps.com/*
// @grant       none
// @run-at      document-end
// @noframes
// @homepageURL https://github.com/khinshankhan/userscripts
// @supportURL  https://github.com/khinshankhan/userscripts/issues
// ==/UserScript==

(function() {
	"use strict";
	async function copyToClipboardModern(text) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (error) {
			console.error(error);
			return false;
		}
	}
	function copyToClipboardLegacy(text) {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		textArea.setAttribute("readonly", "");
		textArea.style.position = "absolute";
		textArea.style.left = "-999999px";
		document.body.prepend(textArea);
		textArea.select();
		try {
			if (typeof document.execCommand !== "function") return false;
			return document.execCommand("copy");
		} catch (error) {
			console.error(error);
			return false;
		} finally {
			textArea.remove();
		}
	}
	async function copyToClipboardGraceful(text) {
		if (navigator.clipboard && window.isSecureContext) return copyToClipboardModern(text);
		return copyToClipboardLegacy(text);
	}
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
	const COPY_ONLY_BUTTON_ATTR = "data-shan-copy-code-only";
	const OVERLAY_BUTTON_CLASS = "shan-copy-code-only-overlay";
	const STYLE_ID = "shan-copy-code-only-style";
	function getCodeText(code) {
		return code.textContent ?? "";
	}
	function setTemporaryButtonText(button, text) {
		const original = button.dataset.originalText ?? button.textContent ?? "Copy code only";
		button.dataset.originalText = original;
		button.textContent = text;
		window.setTimeout(() => {
			button.textContent = original;
		}, 1500);
	}
	function createCopyOnlyButton(doc) {
		const button = doc.createElement("button");
		button.type = "button";
		button.className = "s-btn s-btn__filled s-btn__xs ws-nowrap";
		button.setAttribute(COPY_ONLY_BUTTON_ATTR, "true");
		button.textContent = "Copy code only";
		return button;
	}
	function ensureStyles(doc) {
		if (doc.getElementById(STYLE_ID)) return;
		const style = doc.createElement("style");
		style.id = STYLE_ID;
		style.textContent = `
    .${OVERLAY_BUTTON_CLASS} {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      z-index: 2;
    }
  `;
		doc.head.append(style);
	}
	function removeNativeCopyButtons(pre) {
		const existingButtons = pre.querySelectorAll(".js-copy-button, .copy-code-button");
		for (const existingButton of existingButtons) {
			let wrapper = existingButton;
			while (wrapper?.parentElement && wrapper.parentElement !== pre) wrapper = wrapper.parentElement;
			if (wrapper && wrapper.parentElement === pre) {
				wrapper.remove();
				continue;
			}
			existingButton.remove();
		}
	}
	function attachButton(pre) {
		removeNativeCopyButtons(pre);
		if (pre.querySelector(`[${COPY_ONLY_BUTTON_ATTR}]`)) return;
		const button = createCopyOnlyButton(pre.ownerDocument);
		pre.style.position = "relative";
		button.classList.add(OVERLAY_BUTTON_CLASS);
		pre.prepend(button);
	}
	function enhanceCodeBlocks(root) {
		const doc = root instanceof Document ? root : root.ownerDocument;
		if (!doc?.head) return;
		ensureStyles(doc);
		for (const code of root.querySelectorAll("pre > code")) {
			const pre = code.parentElement;
			if (!(pre instanceof HTMLPreElement)) continue;
			attachButton(pre);
		}
	}
	function enhanceClosestCodeBlock(node) {
		const pre = node.closest("pre");
		if (!(pre instanceof HTMLPreElement)) return;
		if (!pre.querySelector("code")) return;
		attachButton(pre);
	}
	async function handleCopyButtonClick(button) {
		const pre = button.closest("pre");
		if (!(pre instanceof HTMLPreElement)) return;
		const code = pre.querySelector("code");
		if (!(code instanceof HTMLElement)) return;
		setTemporaryButtonText(button, await copyToClipboardGraceful(getCodeText(code)) ? "Copied" : "Copy failed");
	}
	function installStackExchangeCopyCodeOnly(doc = document) {
		enhanceCodeBlocks(doc);
		const onClick = (event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			const button = target.closest(`button[${COPY_ONLY_BUTTON_ATTR}="true"]`);
			if (!button) return;
			event.preventDefault();
			event.stopPropagation();
			handleCopyButtonClick(button);
		};
		const observer = new MutationObserver((mutations) => {
			const addedNodes = mutations.flatMap((mutation) => Array.from(mutation.addedNodes));
			for (const node of addedNodes) {
				if (!(node instanceof HTMLElement)) continue;
				enhanceCodeBlocks(node);
				enhanceClosestCodeBlock(node);
			}
		});
		observer.observe(doc.body, {
			childList: true,
			subtree: true
		});
		doc.addEventListener("click", onClick, true);
		const unsubscribeNavigate = onNavigate(() => enhanceCodeBlocks(doc), { immediate: false });
		return () => {
			observer.disconnect();
			doc.removeEventListener("click", onClick, true);
			unsubscribeNavigate();
		};
	}
	installStackExchangeCopyCodeOnly();
})();
