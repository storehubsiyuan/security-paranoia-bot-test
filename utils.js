const crypto = require('crypto');
const fs = require('fs');

// VULNERABILITY: Weak random number generation
function generateApiKey() {
  return Math.random().toString(36).substring(2, 15);
}

// VULNERABILITY: Insecure file operations
function saveUserFile(filename, content) {
  // No path validation - directory traversal
  const filePath = './uploads/' + filename;
  fs.writeFileSync(filePath, content);
  return filePath;
}

// VULNERABILITY: XML External Entity (XXE)
function parseXMLConfig(xmlString) {
  const xml2js = require('xml2js');
  const parser = new xml2js.Parser({
    // No XXE protection
  });
  
  return new Promise((resolve, reject) => {
    parser.parseString(xmlString, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// VULNERABILITY: Deserialization of untrusted data
function deserializeUserData(serializedData) {
  // Direct eval of user data
  return eval('(' + serializedData + ')');
}

// VULNERABILITY: Insufficient input validation
function validateEmail(email) {
  // Weak email validation
  return email.includes('@');
}

// VULNERABILITY: Hardcoded encryption key
const ENCRYPTION_KEY = 'mySecretKey123456';

function encryptSensitiveData(data) {
  const cipher = crypto.createCipher('aes192', ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// VULNERABILITY: Prototype pollution
function mergeObjects(target, source) {
  for (let key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) target[key] = {};
      mergeObjects(target[key], source[key]);
    } else {
      target[key] = source[key]; // No __proto__ check
    }
  }
  return target;
}

module.exports = {
  generateApiKey,
  saveUserFile,
  parseXMLConfig,
  deserializeUserData,
  validateEmail,
  encryptSensitiveData,
  mergeObjects
};