#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { contrastRatio, rate, suggest } from '../src/index.js';

const HELP = `Usage: contrast-check <text color> <background color> [--json]

Shows the WCAG contrast ratio between two colors and whether it passes
AA and AAA for normal and large text.

Use --fail-under to exit with code 1 when normal text misses a level
(handy in CI).

Use --suggest to get the closest text color that passes AA.

Colors can be #rgb, #rrggbb, rgb(r, g, b) or hsl(h, s%, l%). Quote them in your shell:
  contrast-check "#1e293b" "#ffffff"`;

let args;
try {
  args = parseArgs({
    allowPositionals: true,
    options: {
      json: { type: 'boolean' },
      'fail-under': { type: 'string' },
      suggest: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  });
} catch (err) {
  console.error(err.message);
  process.exit(2);
}

const { values, positionals } = args;
if (values.version) {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  console.log(pkg.version);
  process.exit(0);
}
if (values.help) {
  console.log(HELP);
  process.exit(0);
}
if (positionals.length !== 2) {
  console.error(HELP);
  process.exit(2);
}

const level = values['fail-under']?.toUpperCase();
if (level !== undefined && level !== 'AA' && level !== 'AAA') {
  console.error('--fail-under must be AA or AAA');
  process.exit(2);
}

const [text, background] = positionals;
let ratio;
try {
  ratio = contrastRatio(text, background);
} catch (err) {
  console.error(err.message);
  process.exit(2);
}

const result = rate(ratio);
if (values.json) {
  console.log(JSON.stringify({ text, background, ratio: Number(ratio.toFixed(2)), ...result }, null, 2));
} else {
  const mark = (pass) => (pass ? 'pass' : 'fail');
  console.log(`${text} on ${background}`);
  console.log(`Contrast ${ratio.toFixed(2)}:1`);
  console.log(`  Normal text  AA ${mark(result.normal.AA)}  AAA ${mark(result.normal.AAA)}`);
  console.log(`  Large text   AA ${mark(result.large.AA)}  AAA ${mark(result.large.AAA)}`);
  if (values.suggest && !result.normal.AA) {
    const fix = suggest(text, background, 4.5);
    console.log(fix ? `Try ${fix} for AA (${contrastRatio(fix, background).toFixed(2)}:1)` : 'No text color reaches AA on this background');
  }
}

if (level && !result.normal[level]) process.exit(1);
