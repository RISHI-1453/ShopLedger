const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

const cases = [
  {
    name: '#1001 mixed HSN rates without a coupon',
    items: [{ price: 140, qty: 2, hsn: '0405' }, { price: 165, qty: 2, hsn: '0713' }],
    expectedInvoice: [610, 0, 50.1, 660.1],
    expectedCheckout: [610, 0, 50.1, 660.1]
  },
  {
    name: '#1002 SAVE10',
    items: [{ price: 640, qty: 1, hsn: '1006' }, { price: 190, qty: 2, hsn: '1512' }],
    coupon: 'SAVE10',
    expectedInvoice: [1020, 102, 45.9, 963.9],
    expectedCheckout: [1020, 102, 45.9, 963.9]
  },
  {
    name: '#1004 SAVE10 discount cap',
    items: [{ price: 1120, qty: 2, hsn: '1508' }],
    coupon: 'SAVE10',
    expectedInvoice: [2240, 150, 104.5, 2194.5],
    expectedCheckout: [2240, 150, 104.5, 2194.5]
  },
  {
    name: '#1008 18% items without a coupon',
    items: [{ price: 140, qty: 1, hsn: '0902', gstRate: 18 }, { price: 180, qty: 2, hsn: '2106' }],
    expectedInvoice: [500, 0, 90, 590],
    expectedCheckout: [500, 0, 90, 590]
  }
];

function amounts({ subtotal, discount, tax, total }) {
  return [subtotal, discount, tax, total];
}

for (const { name, items, coupon, expectedInvoice, expectedCheckout } of cases) {
  test(`invoice and checkout agree for ${name}`, () => {
    assert.deepEqual(amounts(invoice.computeInvoiceFigures({ items, coupon })), expectedInvoice);
    assert.deepEqual(amounts(pricing.computeTotals(items, coupon)), expectedCheckout);
  });
}

test('invoice uses capped checkout discounts and post-discount HSN tax per line', () => {
  const items = [
    { price: 1120, qty: 2, hsn: '1508', sku: 'OIL-002' },
    { price: 450, qty: 1, hsn: '0405', sku: 'DRY-001' }
  ];
  const coupon = 'SAVE10';
  const actual = invoice.computeInvoiceFigures({ items, coupon });
  const checkout = pricing.computeTotals(items, coupon);

  assert.equal(actual.discount, 150);
  assert.deepEqual(amounts(actual), amounts(checkout));
  assert.deepEqual(actual.rows.map(row => [row.gstPercent, row.lineTax]), [[5, 105.75], [12, 50.99]]);
  assert.equal(actual.cgst + actual.sgst, actual.tax);
});
