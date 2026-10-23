'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const format = require('../js/backup-format.js');
const quoteMath = require('../js/quote-math.js');

function backup() {
  const stores = Object.fromEntries(format.stores.map(name => [name, []]));
  stores.clients.push({ id: 'client-1', name: 'عميل' });
  stores.quotes.push({
    id: 'Q-1001', client: { name: 'عميل' }, currency: 'EGP',
    items: [{ name: 'كاميرا', category: 'camera', qty: 1, price: 100, cost: null }],
    discount: { type: 'fixed', value: 0 }, vatEnabled: false, vatPct: 0, terms: []
  });
  return { format: 'zoom-cctv-manager-backup', schemaVersion: 4, stores };
}

test('accepts a complete v4 backup and reports store counts without mutating it', function () {
  const value = backup();
  const original = JSON.stringify(value);
  const summary = format.validate(value, quoteMath);
  assert.equal(summary.clients, 1);
  assert.equal(summary.quotes, 1);
  assert.equal(JSON.stringify(value), original);
});

test('rejects unsupported versions, missing stores, duplicate IDs and malformed quotes', function () {
  const wrongVersion = backup();
  wrongVersion.schemaVersion = 3;
  assert.throws(() => format.validate(wrongVersion, quoteMath), /إصدار 4/);

  const missingStore = backup();
  delete missingStore.stores.payables;
  assert.throws(() => format.validate(missingStore, quoteMath), /جميع أقسام/);

  const duplicate = backup();
  duplicate.stores.clients.push({ id: 'client-1', name: 'مكرر' });
  assert.throws(() => format.validate(duplicate, quoteMath), /معرّف مكرر/);

  const malformedQuote = backup();
  malformedQuote.stores.quotes[0].items[0].qty = 'bad';
  assert.throws(() => format.validate(malformedQuote, quoteMath), /غير صالح/);
});

test('accepts app-generated logos and rejects markup or executable logo URLs', function () {
  const safe = backup();
  safe.stores.settings.push({ id: 'main', businessName: 'Zoom', logoDataUrl: 'data:image/jpeg;base64,AA==' });
  assert.doesNotThrow(() => format.validate(safe, quoteMath));
  safe.stores.settings[0].logoDataUrl = 'data:image/svg+xml,<svg onload=alert(1)>';
  assert.throws(() => format.validate(safe, quoteMath), /إعدادات النسخة غير صالحة/);
});

test('restore writes in one transaction with add-only conflict handling', function () {
  const source = fs.readFileSync(path.join(__dirname, '../js/db.js'), 'utf8');
  const mergeMethod = source.match(/mergeSnapshot:function\(snapshot\)[\s\S]*?\n    settings:function/);
  assert.ok(mergeMethod);
  assert.match(mergeMethod[0], /db\.transaction\(stores,'readwrite'\)/);
  assert.match(mergeMethod[0], /objectStore\.add\(row\)/);
  assert.match(mergeMethod[0], /existing\.has\(row\.id\)/);
  assert.doesNotMatch(mergeMethod[0], /objectStore\.put\(row\)|objectStore\.clear\(/);
});
