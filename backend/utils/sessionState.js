/**
 * Simple in-memory session state for role exclusivity.
 * NOTE: This resets when the server restarts. Suitable for dev/demo.
 */
let activeUserRole = null; // 'employee' | 'admin' | null

function getActiveUserRole() {
  return activeUserRole;
}

function setActiveUserRole(role) {
  // normalize to known values
  if (role === 'employee' || role === 'admin' || role === null) {
    activeUserRole = role;
    return true;
  }
  return false;
}

function clearActiveUserRole() {
  activeUserRole = null;
}

module.exports = {
  getActiveUserRole,
  setActiveUserRole,
  clearActiveUserRole,
};