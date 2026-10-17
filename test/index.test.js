import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { contrastRatio, parseColor, rate, suggest } from '../src/index.js';

const cli = fileURLToPath(new URL('../bin/contrast-check.js', import.meta.url));
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.005, `${actual} != ${expected}`);

test('parses hex and rgb() colors', () => {
  assert.deepEqual(parseColor('#fff'), [255, 255, 255]);
  assert.deepEqual(parseColor('1E293B'), [30, 41, 59]);
  assert.deepEqual(parseColor(' rgb(12, 34 ,56) '), [12, 34, 56]);
});

test('rejects colors it cannot read', () => {
  for (const bad of ['#12', '#ggg', 'red', 'rgb(256,0,0)', 'rgb(1,2)', '']) {
    assert.throws(() => parseColor(bad), /Can't read the color/, bad);
  }
});

test('matches known WCAG ratios', () => {
  close(contrastRatio('#000', '#fff'), 21);
  close(contrastRatio('#fff', '#fff'), 1);
  close(contrastRatio('#767676', '#fff'), 4.54);
  close(contrastRatio('#777', '#fff'), 4.48);
});

test('order of the two colors does not matter', () => {
  assert.equal(contrastRatio('#1e293b', '#fff'), contrastRatio('#fff', '#1e293b'));
});

test('rates against AA and AAA thresholds', () => {
  assert.deepEqual(rate(4.5), { normal: { AA: true, AAA: false }, large: { AA: true, AAA: true } });
  assert.deepEqual(rate(3), { normal: { AA: false, AAA: false }, large: { AA: true, AAA: false } });
  assert.deepEqual(rate(7), { normal: { AA: true, AAA: true }, large: { AA: true, AAA: true } });
});

test('CLI prints the ratio and results', () => {
  const out = execFileSync(process.execPath, [cli, '#777', '#fff'], { encoding: 'utf8' });
  assert.match(out, /Contrast 4\.48:1/);
  assert.match(out, /Normal text {2}AA fail {2}AAA fail/);
  assert.match(out, /Large text {3}AA pass {2}AAA fail/);
});

test('CLI --json output', () => {
  const out = JSON.parse(execFileSync(process.execPath, [cli, '#000', '#fff', '--json'], { encoding: 'utf8' }));
  assert.equal(out.ratio, 21);
  assert.equal(out.normal.AAA, true);
});

test('CLI exits 2 on bad input', () => {
  assert.equal(spawnSync(process.execPath, [cli, '#12', '#fff']).status, 2);
  assert.equal(spawnSync(process.execPath, [cli, '#fff']).status, 2);
});

test('CLI --fail-under sets the exit code', () => {
  assert.equal(spawnSync(process.execPath, [cli, '#777', '#fff', '--fail-under', 'AA']).status, 1);
  assert.equal(spawnSync(process.execPath, [cli, '#767676', '#fff', '--fail-under', 'aa']).status, 0);
  assert.equal(spawnSync(process.execPath, [cli, '#000', '#fff', '--fail-under', 'AAA']).status, 0);
  assert.equal(spawnSync(process.execPath, [cli, '#000', '#fff', '--fail-under', 'B']).status, 2);
});

test('parses hsl() colors', () => {
  assert.deepEqual(parseColor('hsl(0, 100%, 50%)'), [255, 0, 0]);
  assert.deepEqual(parseColor('hsl(120, 100%, 25%)'), [0, 128, 0]);
  assert.deepEqual(parseColor('hsl(0, 0%, 100%)'), [255, 255, 255]);
  assert.throws(() => parseColor('hsl(400, 10%, 10%)'), /Can't read/);
});

test('CLI --version prints the package version', () => {
  const out = execFileSync(process.execPath, [cli, '--version'], { encoding: 'utf8' });
  assert.match(out.trim(), /^\d+\.\d+\.\d+$/);
});

test('suggest finds a passing color', () => {
  assert.equal(suggest('#777', '#fff'), '#767676');
  assert.equal(suggest('#000', '#fff'), '#000000');
  const fix = suggest('#3b82f6', '#1e293b', 7);
  assert.ok(contrastRatio(fix, '#1e293b') >= 7);
});
