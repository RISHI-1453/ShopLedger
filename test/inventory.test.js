const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

function product(stock, reserved) {
  return { id: 6, sku: 'DRY-001', name: 'Ghee', hsn: '0405', price: 450, stock, reserved };
}

function line(qty) {
  return { id: 6, sku: 'DRY-001', name: 'Ghee', hsn: '0405', price: 450, qty };
}

test('exact sellable stock can be sold without consuming reserved units', () => {
  for (const p of [product(1, 0), product(4, 3)]) {
    assert.equal(inventory.getSellableStock(p), 1);
    assert.equal(inventory.check([p], [line(1)]).ok, true);
  }
});

test('CURRENT BEHAVIOUR: overstock is rejected and zero quantity is accepted', () => {
  const products = [product(1, 0)];
  assert.equal(inventory.check(products, [line(2)]).ok, false);
  assert.equal(inventory.check(products, [line(0)]).ok, true);
});

test('a pending cancellation restores stock without changing reserved units', () => {
  const p = product(7, 3);
  const order = { id: 1007, status: 'pending', items: [line(2)] };
  const db = { products: [p], orders: [order] };

  assert.deepEqual([p.stock, p.reserved], [7, 3]);
  inventory.reserve(db.products, order.items);
  assert.deepEqual([p.stock, p.reserved], [5, 3]);
  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual([p.stock, p.reserved], [7, 3]);
});

test('checkout honors reserved stock and cancellation restores physical units exactly once', () => {
  const p = product(5, 3);
  const order = { id: 1007, status: 'pending', items: [line(1), line(1)] };
  const db = { products: [p], orders: [order] };

  assert.equal(inventory.check(db.products, [line(2)]).ok, true);
  assert.equal(inventory.check(db.products, order.items).ok, true);
  assert.equal(inventory.check(db.products, [line(2), line(1)]).ok, false);
  inventory.reserve(db.products, order.items);
  assert.deepEqual([p.stock, p.reserved], [3, 3]);

  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(orders.cancel(db, order.id).ok, false);
  assert.deepEqual([p.stock, p.reserved], [5, 3]);
});
