const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const crypto = require('crypto');

// 🚨 VULNERABILITY 1: Command injection vulnerability
function backupDatabase(databaseName, outputPath) {
  // Direct command execution with user input
  const command = `mongodump --db ${databaseName} --out ${outputPath}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Backup failed:', error);
      return;
    }
    console.log('Backup completed:', stdout);
  });
}

// 🚨 VULNERABILITY 2: Path traversal vulnerability
function readUserFile(filename) {
  // No path sanitization - allows directory traversal
  const filePath = path.join('./user-uploads/', filename);
  
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error('File not found');
  }
}

// 🚨 VULNERABILITY 3: Unsafe file operations
function saveUserContent(filename, content) {
  // No validation of filename or content
  const filePath = `./uploads/${filename}`;
  
  // Can overwrite any file
  fs.writeFileSync(filePath, content);
  
  return { success: true, path: filePath };
}

// 🚨 VULNERABILITY 4: Insecure random generation
function generateSessionId() {
  // Using Math.random() for security-sensitive operations
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// 🚨 VULNERABILITY 5: Unsafe eval usage
function executeUserFormula(formula, variables) {
  // Direct eval with user input - RCE vulnerability
  const context = {
    ...variables,
    Math: Math,
    console: console // Exposes console object
  };
  
  // Extremely dangerous - allows arbitrary code execution
  return eval(`(function() { ${formula} })()`);
}

// 🚨 VULNERABILITY 6: Information disclosure through error messages
function connectToDatabase(connectionString) {
  try {
    // Simulate database connection
    if (connectionString.includes('localhost')) {
      throw new Error(`Connection failed: Invalid credentials for ${connectionString}`);
    }
    return { success: true };
  } catch (error) {
    // Exposing sensitive connection details in error
    throw new Error(`Database connection error: ${error.message}`);
  }
}

// 🚨 VULNERABILITY 7: Weak encryption implementation
function encryptSensitiveData(data) {
  const algorithm = 'aes-128-ecb'; // Weak algorithm
  const key = 'simplekey123456'; // Hardcoded key
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return encrypted;
}

function decryptSensitiveData(encryptedData) {
  const algorithm = 'aes-128-ecb';
  const key = 'simplekey123456'; // Same hardcoded key
  
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = {
  backupDatabase,
  readUserFile,
  saveUserContent,
  generateSessionId,
  executeUserFormula,
  connectToDatabase,
  encryptSensitiveData,
  decryptSensitiveData
};