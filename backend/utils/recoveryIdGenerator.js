/**
 * Generates formatted Recovery ID
 * Example format: CL-MYS-2026-00556
 */
function generateRecoveryId(hospitalCode = 'MYS') {
  const currentYear = new Date().getFullYear();
  const randomSerial = Math.floor(10000 + Math.random() * 90000); // 5-digit number
  return `CL-${hospitalCode}-${currentYear}-${randomSerial}`;
}

module.exports = {
  generateRecoveryId
};
