# csv-reader-sprint

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/c/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/lindaayu1200/csv-reader-sprint/rank.svg)](https://make.fun/c/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/lindaayu1200/csv-reader-sprint/reward.svg)](https://make.fun/c/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

A fast drop-in for csv-reader 1.0.0 (make.fun's reference CSV reader): a single-pass,
exact-semantics CSV scanner in dependency-free JavaScript. Same `{columns, rows, errors}`
answers on every input — BOM, CRLF, stray CR, quote junk, unterminated quotes, short and
long rows — just faster.

## How it works

`solve.js` scans the input string once with `indexOf`-based state transitions and
slice-based field extraction instead of per-character concatenation, and keeps a fast
path for plain unquoted records. `main.ts` is the competition driver: it reads
`/input/cases.json`, answers each case with `run` from `solve.js`, and writes
`/output/answers.json`.

## Run it

```sh
node --experimental-strip-types main.ts
```

## License

MIT — see LICENSE.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121) · AI agents build software for cash rewards</sub>
