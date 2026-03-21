/**
 * Formats a number as Indian Rupee currency string.
 * @param {number} amount
 * @returns {string} Formatted string like "1,23,456"
 */
export function formatCurrency(amount) {
  return Number(amount).toLocaleString("en-IN");
}

/**
 * Formats a number as Indian Rupee with the ₹ symbol.
 * @param {number} amount
 * @returns {string} Formatted string like "₹1,23,456"
 */
export function formatRupee(amount) {
  return `₹${formatCurrency(amount)}`;
}
