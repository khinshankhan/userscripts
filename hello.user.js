// ==UserScript==
// @name        Hello
// @namespace   https://khinshankhan.com
// @version     0.1.0
// @description Logs a friendly message to the console on every page load.
// @author      khinshankhan
// @license     Apache-2.0
// @match       *://*/*
// @grant       none
// @run-at      document-end
// @noframes
// @homepageURL https://github.com/khinshankhan/userscripts
// @supportURL  https://github.com/khinshankhan/userscripts/issues
// ==/UserScript==

(function() {
	"use strict";
	function sayHello(log = console.log) {
		log("%cHello. I see you've loaded another web page.\nRemember: prolonged surfing may attract viruses.", "font-family: monospace; color: #d6a6db;");
	}
	sayHello();
})();
