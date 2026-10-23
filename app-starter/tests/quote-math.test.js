'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const quoteMath = require('../js/quote-math.js');

function line(overrides) {
  return Object.assign({ name: 'كاميرا', category: 'camera', qty: 1, price: 1, cost: null }, overrides || {});
}

function calculate(items, discount, vatEnabled, vatPct) {
  return quoteMath.calculate(items, discount || { type: 'fixed', value: 0 }, vatEnabled || false, vatPct == null ? 0 : vatPct);
}

test('rejects blank numeric inputs but accepts intentional zero', function () {
  assert.throws(function () { quoteMath.inputNumber('', 'الكمية'); }, /مطلوب/);
  assert.throws(function () { quoteMath.inputNumber('   ', 'سعر الوحدة'); }, /مطلوب/);
  assert.equal(quoteMath.inputNumber('0', 'سعر الوحدة'), 0);
  assert.deepEqual(calculate([line({ qty: 0, price: 0 })]).lineTotals, [0]);
});

test('rounds each line to two decimals before summing, including half-cent amounts', function () {
  const result = calculate([
    line({ category: 'cable', qty: 0.5, price: 0.01 }),
    line({ category: 'cable', qty: 0.5, price: 0.01 })
  ]);
  assert.deepEqual(result.lineTotals, [0.01, 0.01]);
  assert.equal(result.subtotal, 0.02);
  assert.equal(calculate([line({ category: 'cable', qty: 1.5, price: 0.01 })]).lineTotals[0], 0.02);
});

test('rounds percentage and fixed discounts, tax after discount, then derives final total', function () {
  const percentDiscount = calculate([line({ price: 10.05 })], { type: 'percent', value: 10 }, true, 10);
  assert.equal(percentDiscount.subtotal, 10.05);
  assert.equal(percentDiscount.discount, 1.01);
  assert.equal(percentDiscount.tax, 0.90);
  assert.equal(percentDiscount.total, 9.94);
  const fixedDiscount = calculate([line({ price: 1 })], { type: 'fixed', value: 0.005 }, false, 0);
  assert.equal(fixedDiscount.discount, 0.01);
  assert.equal(fixedDiscount.total, 0.99);
});

test('selects VAT from the saved quote, then project, then current settings input', function () {
  assert.equal(quoteMath.selectVatRate(15, 20, 25), 15);
  assert.equal(quoteMath.selectVatRate(null, 20, 25), 20);
  assert.equal(quoteMath.selectVatRate(undefined, 0, 25), 0);
  assert.equal(quoteMath.selectVatRate(null, null, 25), 25);
});

test('rejects invalid, negative, fractional non-cable and overflowing inputs and results', function () {
  assert.throws(function () { calculate([line({ qty: NaN })]); }, /الكمية/);
  assert.throws(function () { calculate([line({ price: -1 })]); }, /سعر الوحدة/);
  assert.throws(function () { calculate([line({ price: 1.005 })]); }, /منزلتين عشريتين/);
  assert.throws(function () { calculate([line({ qty: 1.5 })]); }, /الكمية/);
  assert.throws(function () { calculate([line({ category: 'cable', qty: Infinity })]); }, /الكمية/);
  assert.throws(function () { calculate([line({ category: 'cable', qty: Number.MAX_VALUE, price: 0 })]); }, /الكمية/);
  assert.throws(function () { calculate([line({ qty: 0, price: Number.MAX_VALUE })]); }, /سعر الوحدة/);
  assert.throws(function () { calculate([line({ qty: Number.MAX_SAFE_INTEGER, price: 2 })]); }, /إجمالي/);
  const largeLine = Number.MAX_SAFE_INTEGER / 200;
  assert.throws(function () { calculate([line({ price: largeLine }), line({ price: largeLine })]); }, /المجموع/);
  assert.throws(function () { calculate([line({ price: Number.MAX_SAFE_INTEGER })]); }, /يتجاوز/);
  assert.throws(function () { calculate([line()], { type: 'percent', value: 101 }); }, /نسبة الخصم/);
  assert.throws(function () { calculate([line({ price: 1 })], { type: 'fixed', value: 2 }); }, /الخصم/);
});

test('rejects malformed legacy quote data without mutating its original object', function () {
  const original = { items: [line({ qty: 'not-a-number', price: 1 })], discount: { type: 'fixed', value: 0 }, vatEnabled: false, vatPct: 0 };
  const before = JSON.stringify(original);
  assert.throws(function () { quoteMath.calculate(original.items, original.discount, original.vatEnabled, original.vatPct); });
  assert.equal(JSON.stringify(original), before);
});

test('editor, quote list, preview and PDF consume the same shared calculation result', function () {
  const root = path.resolve(__dirname, '..');
  const quoteSource = fs.readFileSync(path.join(root, 'js/quotes.js'), 'utf8');
  const pdfSource = fs.readFileSync(path.join(root, 'js/pdf.js'), 'utf8');
  assert.match(quoteSource, /function calc\(items,discount,vatEnabled,vatPct\)\{return window\.AinQuoteMath\.calculate/);
  assert.match(quoteSource, /result\.lineTotals\[index\]/);
  assert.match(quoteSource, /calc\(v\.items,v\.discount,v\.vatEnabled,v\.vatPct\)\.total/);
  assert.match(quoteSource, /function effectiveVatPct\(\).*selectVatRate\(current&&current\.vatPct,draftVatPct,U\.number\(document\.getElementById\('vat-pct'\)\.value\)\)/);
  assert.equal((quoteSource.match(/vatPct=effectiveVatPct\(\)/g) || []).length, 2);
  assert.match(pdfSource, /AinQuotes\.calc\(quote\.items,quote\.discount,quote\.vatEnabled,quote\.vatPct\)/);
  assert.match(pdfSource, /totals\.lineTotals\[n\]/);
  assert.match(pdfSource, /U\.escapeHtml\(settings\.logoDataUrl\)/);
});
