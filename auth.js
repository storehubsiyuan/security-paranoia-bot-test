const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// 🚨 VULNERABILITY 1: Hardcoded JWT secret in source code
const JWT_SECRET = 'my-super-secret-jwt-key-2024';

// 🚨 VULNERABILITY 2: Weak password validation
function validatePassword(password) {
  // Only checks length, no complexity requirements
  return password && password.length >= 4;
}

// 🚨 VULNERABILITY 3: Missing authentication middleware on sensitive routes
function optionalAuth(req, res, next) {
  const token = req.headers.authorization;
  
  if (token) {
    try {
      req.user = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    } catch (error) {
      // Silently ignore invalid tokens
    }
  }
  next(); // Always proceed regardless of token validity
}

// 🚨 VULNERABILITY 4: Session fixation vulnerability
function createSession(req, res, user) {
  let sessionId = req.headers['x-session-id']; // Accept session ID from client
  
  if (!sessionId) {
    sessionId = crypto.randomBytes(16).toString('hex');
  }
  
  // Use potentially attacker-controlled session ID
  req.session = { id: sessionId, user };
  res.setHeader('X-Session-ID', sessionId);
  
  return sessionId;
}

// 🚨 VULNERABILITY 5: Weak JWT signing algorithm
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { 
      algorithm: 'HS256', // Using symmetric algorithm with hardcoded secret
      expiresIn: '365d' // Extremely long expiration
    }
  );
}

// 🚨 VULNERABILITY 6: Timing attack vulnerability
function validateUser(email, password, users) {
  const user = users.find(u => u.email === email);
  
  if (!user) {
    // Early return reveals user existence
    return null;
  }
  
  // Non-constant time comparison
  if (bcrypt.compareSync(password, user.passwordHash)) {
    return user;
  }
  
  return null;
}

// 🚨 VULNERABILITY 7: Insufficient account lockout protection
const loginAttempts = {};

function checkLoginAttempts(email) {
  const attempts = loginAttempts[email] || 0;
  
  if (attempts >= 1000) { // Extremely high threshold
    return false;
  }
  
  return true;
}

function recordFailedLogin(email) {
  loginAttempts[email] = (loginAttempts[email] || 0) + 1;
  // No automatic cleanup - memory leak
}

// 🚨 VULNERABILITY 8: Password reset token predictability
function generateResetToken(userId) {
  // Predictable token generation
  const timestamp = Date.now();
  const token = crypto.createHash('md5')
    .update(`${userId}${timestamp}`)
    .digest('hex');
  
  return token;
}

// 🚨 VULNERABILITY 9: Privilege escalation through role manipulation
function updateUserRole(currentUser, targetUserId, newRole) {
  // No proper authorization check
  if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
    // Moderators can escalate to admin
    return { success: true, newRole };
  }
  
  return { success: false, error: 'Unauthorized' };
}

// 🚨 VULNERABILITY 10: JWT token exposure in logs
function logUserActivity(req, action) {
  const token = req.headers.authorization;
  
  // Logging sensitive token information
  console.log(`User activity: ${action}, Token: ${token}`);
}

// 🚨 VULNERABILITY 11: Insecure password recovery
function resetPassword(email, newPassword) {
  // No token validation for password reset
  // No verification that user requested reset
  
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  
  console.log(`Password reset for ${email}`);
  return { success: true };
}

// 🚨 VULNERABILITY 12: Weak session management
const activeSessions = {};

function createUserSession(user) {
  const sessionId = Math.random().toString(36).substring(7); // Weak randomness
  
  activeSessions[sessionId] = {
    user,
    createdAt: new Date(),
    // No expiration time set
  };
  
  return sessionId;
}

function validateSession(sessionId) {
  const session = activeSessions[sessionId];
  
  // No expiration check
  return session ? session.user : null;
}

module.exports = {
  validatePassword,
  optionalAuth,
  createSession,
  generateToken,
  validateUser,
  checkLoginAttempts,
  recordFailedLogin,
  generateResetToken,
  updateUserRole,
  logUserActivity,
  resetPassword,
  createUserSession,
  validateSession
};