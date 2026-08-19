const dim = (s: string) => `\x1b[2m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const green = (s: string) => `\x1b[32m${s}\x1b[0m`

export const log = {
  step: (name: string) => console.log(`\n${bold(`▸ ${name}`)}`),
  info: (message: string) => console.log(`  ${message}`),
  detail: (message: string) => console.log(dim(`  ${message}`)),
  warn: (message: string) => console.log(yellow(`  ! ${message}`)),
  error: (message: string) => console.log(red(`  ✖ ${message}`)),
  done: (message: string) => console.log(green(`  ✓ ${message}`)),
  progress: (current: number, total: number, label: string) => {
    if (current % 25 !== 0 && current !== total) return
    console.log(dim(`  ${current}/${total} ${label}`))
  },
}
