// Date utilities for ShopLedger (Indian DD/MM/YYYY format)

function pad2(n) {
  return ('0' + n).slice(-2);
}

exports.today = function () {
  var d = new Date();
  return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
};

// Added for date-picker filtering (Vikram, Oct 2021)
// Return YYYY-MM-DD so string order matches calendar order.
exports.normalizeDateKey = function (str) {
  if (!str) return '';
  var s = String(str).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  var parts = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  return parts ? parts[3] + '-' + pad2(parts[2]) + '-' + pad2(parts[1]) : '';
};

exports.getFiscalYear = function (dateStr) {
  var key = exports.normalizeDateKey(dateStr);
  if (!key) return 'FY21-22';
  var parts = key.split('-');
  var month = parseInt(parts[1], 10);
  var year = parseInt(parts[0], 10);
  if (month >= 4) {
    return 'FY' + String(year).slice(-2) + '-' + String(year + 1).slice(-2);
  }
  return 'FY' + String(year - 1).slice(-2) + '-' + String(year).slice(-2);
};
