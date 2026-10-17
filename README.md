# contrast-check

Check the contrast between two colors from the command line, using the
[WCAG 2.x](https://www.w3.org/TR/WCAG21/#contrast-minimum) formula.
No dependencies, Node 18+.

```console
$ npx github:wesomitsu/YOLO "#1e293b" "#ffffff"
#1e293b on #ffffff
Contrast 14.63:1
  Normal text  AA pass  AAA pass
  Large text   AA pass  AAA pass
```

## Usage

```sh
contrast-check <text color> <background color> [--json]
```

Colors can be `#rgb`, `#rrggbb` (the `#` is optional) or `rgb(r, g, b)`.
Quote them, since `#` starts a comment in most shells.

`--json` prints the result as JSON, handy for scripts:

```console
$ contrast-check "#777" "#fff" --json
{
  "text": "#777",
  "background": "#fff",
  "ratio": 4.48,
  "normal": {
    "AA": false,
    "AAA": false
  },
  "large": {
    "AA": true,
    "AAA": false
  }
}
```

`--fail-under AA` (or `AAA`) exits with code 1 when normal text misses that level, so you can use it in CI:

```sh
contrast-check "#777" "#fff" --fail-under AA  # exits 1
```

## What the levels mean

| Level | Normal text | Large text (24px+, or 18.66px+ bold) |
| ----- | ----------- | ------------------------------------ |
| AA    | 4.5:1       | 3:1                                  |
| AAA   | 7:1         | 4.5:1                                |

## Use it in code

```sh
npm install github:wesomitsu/YOLO
```

```js
import { contrastRatio, rate } from 'contrast-check';

const ratio = contrastRatio('#1e293b', '#fff'); // 14.63...
rate(ratio).normal.AA; // true
```

## Development

```sh
npm test
```

## License

MIT
