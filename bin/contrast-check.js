#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { contrastRatio, rate } from '../src/index.js';

const HELP = `Usage: contrast-check <text color> <background color> [--json]

Shows the WCAG contrast ratio between two colors and whether it passes
AA and AAA for normal and large text.

Colors can be #rgb, #rrggbb or rgb(r, g, b). Quote them in your shell:
  contrast-check "#1e293b" "#ffffff"`;

let args;
try {
  args = parseArgs({
    allowPositionals: true,
    options: {
      json: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });
} catch (err) {
  console.error(err.message);
  process.exit(2);
}

const { values, positionals } = args;
if (values.help) {
  console.log(HELP);
  process.exit(0);
}
if (positionals.length !== 2) {
  console.error(HELP);
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
}
