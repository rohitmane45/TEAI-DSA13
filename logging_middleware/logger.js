const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const LOG_URL = process.env.TEST_SERVER_LOGS_URL || 'http://4.224.186.213/evaluation-service/logs';
const AUTH_URL = process.env.TEST_SERVER_AUTH_URL || 'http://4.224.186.213/evaluation-service/auth';

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Retrieve a valid authorization token from the test server.
 * Caches the token to optimize network calls.
 */
async function getAuthToken() {
  const now = Date.now();
  // If token exists and is not expiring in the next 10 seconds, reuse it
  if (cachedToken && tokenExpiry > now + 10000) {
    return cachedToken;
  }

  const payload = {
    email: process.env.EMAIL,
    name: process.env.NAME,
    rollNo: process.env.ROLL_NO,
    accessCode: process.env.ACCESS_CODE,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  };

  try {
    const response = await axios.post(AUTH_URL, payload);
    if (response.status === 201 && response.data.access_token) {
      cachedToken = response.data.access_token;
      // expires_in is in seconds, typically unix epoch
      const expiresAt = response.data.expires_in;
      if (expiresAt) {
        tokenExpiry = expiresAt * 1000;
      } else {
        // Fallback: 5 minutes expiry
        tokenExpiry = Date.now() + 5 * 60 * 1000;
      }
      return cachedToken;
    }
  } catch (error) {
    // Silently fail if auth fails to avoid infinite loops and comply with no-console rule
  }
  return null;
}

/**
 * Send a structured log to the test server.
 * @param {string} level - 'debug' | 'info' | 'warn' | 'error' | 'fatal' (lowercase only)
 * @param {string} pkg - 'cache' | 'controller' | 'cron_job' | 'db' | 'domain' (lowercase only)
 * @param {string} message - Description of the log event
 */
async function logToServer(level, pkg, message) {
  const token = await getAuthToken();
  if (!token) {
    // Skip silently
    return;
  }

  const payload = {
    stack: 'backend',
    level: level.toLowerCase(),
    package: pkg.toLowerCase(),
    message: message.substring(0, 48)
  };

  try {
    await axios.post(LOG_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    // Silently fail to avoid infinite error loops
  }
}

module.exports = { logToServer };
