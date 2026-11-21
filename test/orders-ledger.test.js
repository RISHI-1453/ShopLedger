const test = require('node:test');
const assert = require('node:assert/strict');
const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function history() {
  return { orders: [
    { id: 1001, date: '28/12/2021' },
    { id: 1008, date: '15/03/2022' },
    { id: 1004, date: '30/01/2022' }
  ] };
}

function khata() {
  return {
    customers: [{ id: 1, name: 'Meera', openingBalance: 450, totalBilled: 1982.01, totalSettled: 1200, balance: 1232.01 }],
    settlements: [],
    nextSettlementId: 501
  };
}

test('history sorts by calendar date newest first', () => {
  assert.deepEqual(orders.list(history()).map(o => o.id), [1008, 1004, 1001]);
});

test('January range excludes other months', () => {
  assert.deepEqual(orders.list(history(), { from: '2022-01-01', to: '2022-01-31' }).map(o => o.id), [1004]);
});

test('stored and date picker values share a sortable date key', () => {
  assert.equal(dates.normalizeDateKey('2022-01-30'), '2022-01-30');
  assert.equal(dates.normalizeDateKey('30/01/2022'), '2022-01-30');
});

test('CURRENT BEHAVIOUR: numeric settlement lowers the balance', () => {
  const db = khata();
  const result = ledger.recordSettlement(db, 1, 500);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(db.settlements[0].amount, 500);
});

test('string settlement adds to the total numerically', () => {
  const db = khata();
  const result = ledger.recordSettlement(db, 1, '500');
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(db.settlements[0].amount, 500);
});

test('CURRENT BEHAVIOUR: zero and negative payments are rejected', () => {
  for (const amount of [0, -1]) {
    const db = khata();
    assert.equal(ledger.recordSettlement(db, 1, amount).ok, false);
    assert.deepEqual(db, khata());
  }
});

test('non-numeric settlement is rejected without mutating the ledger', () => {
  const db = khata();
  const result = ledger.recordSettlement(db, 1, 'oops');
  assert.equal(result.ok, false);
  assert.deepEqual(db, khata());
});

test('history uses chronological days and string settlements update Khata numerically', () => {
  const db = khata();
  const result = ledger.recordSettlement(db, 1, '500');
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(ledger.recordSettlement(db, 1, true).ok, false);
  assert.equal(ledger.recordSettlement(db, 1, Infinity).ok, false);
  assert.equal(ledger.recordSettlement(db, 1, [500]).ok, false);
  assert.equal(ledger.recordSettlement(db, 1, '0.001').ok, false);
  assert.equal(db.settlements.length, 1);

  const data = history();
  data.orders.push({ id: 1009, date: '2022-03-15' });
  assert.deepEqual(orders.list(data).map(o => o.id), [1009, 1008, 1004, 1001]);
  assert.deepEqual(orders.list(data, { from: '2022-01-30', to: '2022-01-30' }).map(o => o.id), [1004]);
  assert.equal(dates.getFiscalYear('31/03/2022'), 'FY21-22');
  assert.equal(dates.getFiscalYear('2022-04-01'), 'FY22-23');
});
