
function isJSON(str) {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null;
    } catch (e) {
      return false;
    }
  }

function isUUID(value) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function isValidRegex(str) {
  if (!str) return true;
    try {
        new RegExp(str);
        return true
    } catch {
        return false
    }
}

module.exports = {
    isJSON,
    isUUID,
    isValidRegex
}