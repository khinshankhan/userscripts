export function sayHello(log: typeof console.log = console.log): void {
  log(
    "%cHello. I see you've loaded another web page.\nRemember: prolonged surfing may attract viruses.",
    "font-family: monospace; color: #d6a6db;"
  )
}
