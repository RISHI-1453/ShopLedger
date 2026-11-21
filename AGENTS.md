## Stack

ShopLedger uses CommonJS, Node.js, Express 4, body-parser, vanilla browser JavaScript and a single JSON store.

## Module map

- `routes/orders.js` handles order creation, lookups, filtering and cancellation.
- `routes/customers.js` lists Khata accounts and records settlements.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard, GST reconciliation, pricing preview and admin export.
- `lib/coupons.js` normalizes, validates and calculates coupons.
- `lib/dates.js` formats dates, builds date keys and resolves fiscal years.
- `lib/inventory.js` checks sellable stock, deducts and releases units, and summarizes inventory.
- `lib/invoice.js` computes invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata charges, reversals and settlements.
- `lib/orders.js` creates, retrieves, cancels and lists orders.
- `lib/pricing.js` computes checkout totals and line breakdowns.
- `lib/reports.js` computes dashboard summaries and GST reconciliation.
- `lib/store.js` reads and writes the JSON store and adds audit events.
- `lib/tax.js` resolves GST rates and splits CGST and SGST.

## Commands

- `npm start` starts the app. For workshop reproductions, run it from a temporary copy on port 3100.
- `node --test` runs the workshop tests.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the app modules named for the ticket.
3. Use in-memory data in tests. Never read or write `data/db.json` from tests.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current tickets

- Invoice total and GST mismatch (upstream #1). Allowed: `lib/invoice.js`, and `lib/tax.js` if needed.
- Order history and Khata settlements (upstream #3). Allowed: `lib/orders.js` (list only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`.
- Last sellable unit and cancellation (upstream #2). Allowed: `lib/inventory.js`, `lib/orders.js` (cancel only).
