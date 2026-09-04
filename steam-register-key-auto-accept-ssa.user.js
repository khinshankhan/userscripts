// ==UserScript==
// @name        Steam Register Key Auto Accept SSA
// @namespace   https://khinshankhan.com
// @version     0.1.0
// @description Automatically checks the steam subscriber agreement box on Steam register key pages.
// @author      khinshankhan
// @license     Apache-2.0
// @match       https://store.steampowered.com/account/registerkey*
// @grant       none
// @run-at      document-end
// @noframes
// @homepageURL https://github.com/khinshankhan/userscripts
// @supportURL  https://github.com/khinshankhan/userscripts/issues
// ==/UserScript==

(function() {
	"use strict";
	function isInput(el) {
		return el instanceof HTMLInputElement;
	}
	function ensureSsaAccepted(doc) {
		const el = doc.getElementById("accept_ssa");
		if (!isInput(el)) return;
		if (el.type !== "checkbox") return;
		if (!el.checked) el.click();
	}
	ensureSsaAccepted(document);
})();
