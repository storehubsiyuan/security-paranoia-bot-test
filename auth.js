const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// VULNERABILITY: Hardcoded credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';
const SECRET_KEY = 'secret'; // Weak secret

// VULNERABILITY: Timing attack vulnerability
function authenticateUser(username, password) {
  if (username === ADMIN_USERNAME) {
    // Early return creates timing difference
    if (password === ADMIN_PASSWORD) {
      return true;
    }
  }
  return false;
}

// VULNERABILITY: JWT without expiration
function generateToken(user) {
  return jwt.sign({ user: user }, SECRET_KEY); // No expiration
}

// VULNERABILITY: Insecure password reset
function resetPassword(email) {
  const resetToken = Math.random().toString(36); // Weak token generation
  console.log(`Reset token for ${email}: ${resetToken}`);
  return resetToken;
}

// VULNERABILITY: Race condition in authentication
let loginAttempts = {};

function checkLoginAttempts(username) {
  if (!loginAttempts[username]) {
    loginAttempts[username] = 0;
  }
  
  if (loginAttempts[username] > 3) {
    return false; // Blocked
  }
  
  loginAttempts[username]++; // Race condition here
  return true;
}

module.exports = {
  authenticateUser,
  generateToken,
  resetPassword,
  checkLoginAttempts
};