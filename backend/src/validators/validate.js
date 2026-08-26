function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

function positiveNumber(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${field} must be a non-negative number`);
  return n;
}

module.exports = { requiredString, positiveNumber };
