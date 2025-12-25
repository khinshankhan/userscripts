// ==UserScript==
// @name         Hello
// @namespace    https://github.com/khinshankhan/userscripts
// @version      0.1.0
// @description  Logs a friendly message to the console on every page load.
// @author       khinshankhan
// @match        *://*/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

console.log(
  "%cHello. I see you've loaded another web page.\nRemember: prolonged surfing may attract viruses.",
  "font-family: monospace; color: #d6a6db;"
)
