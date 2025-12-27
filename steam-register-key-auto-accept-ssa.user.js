// ==UserScript==
// @name        Steam Register Key Auto Accept SSA
// @description Automatically checks the steam subscriber agreement box on Steam register key pages.
// @namespace   https://khinshankhan.com
// @version     0.1.0
// @author      khinshankhan
// @homepageURL https://github.com/khinshankhan/userscripts
// @supportURL  https://github.com/khinshankhan/userscripts/issues
// @match       https://store.steampowered.com/account/registerkey*
// @run-at      document-end
// @grant       none
// ==/UserScript==

(function() {


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