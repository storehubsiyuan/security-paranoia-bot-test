const express = require('express');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());

// 🚨 VULNERABILITY 1: Hardcoded database credentials
const mongoUrl = 'mongodb://admin:password123@localhost:27017/ecommerce';
const client = new MongoClient(mongoUrl);

// 🚨 VULNERABILITY 2: Hardcoded JWT secret
const JWT_SECRET = 'super-secret-key-12345';

// 🚨 VULNERABILITY 3: XSS vulnerability - unsanitized user input
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`<h1>Search results for: ${query}</h1>`); // Direct HTML injection
});

// 🚨 VULNERABILITY 4: SQL injection in user comments
app.get('/comments/:productId', async (req, res) => {
  const productId = req.params.productId;
  const db = client.db('ecommerce');
  
  // NoSQL injection vulnerability
  const comments = await db.collection('comments').find({ productId: productId }).toArray();
  res.json(comments);
});

// 🚨 VULNERABILITY 5: Information disclosure
app.get('/admin/users', (req, res) => {
  // No authentication check!
  res.json({
    users: [
      { id: 1, email: 'admin@example.com', password: 'hashed_password_123' },
      { id: 2, email: 'user@example.com', creditCard: '4111-1111-1111-1111' }
    ]
  });
});

// 🚨 VULNERABILITY 6: Weak password validation
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  // No password strength validation
  if (password.length < 3) {
    return res.status(400).json({ error: 'Password too short' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  // Save user...
  res.json({ message: 'User registered successfully' });
});

// 🚨 VULNERABILITY 7: Unsafe redirect
app.get('/redirect', (req, res) => {
  const url = req.query.url;
  res.redirect(url); // Can redirect to malicious sites
});

// 🚨 VULNERABILITY 8: Price manipulation vulnerability
app.post('/purchase', async (req, res) => {
  const { productId, quantity, price } = req.body; // Price comes from client!
  
  const total = quantity * price; // Trusting client-side price
  
  // Process payment with manipulated price
  console.log(`Processing payment of $${total} for product ${productId}`);
  res.json({ success: true, total });
});

// 🚨 VULNERABILITY 9: Inventory tampering
app.post('/admin/inventory', (req, res) => {
  const { productId, newStock } = req.body;
  
  // No authentication or authorization check
  console.log(`Setting stock for product ${productId} to ${newStock}`);
  res.json({ success: true });
});

// 🚨 VULNERABILITY 10: Session fixation
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Authenticate user...
  const sessionId = req.headers['session-id'] || 'default-session';
  
  // Using session ID from client (fixation vulnerability)
  res.json({
    success: true,
    sessionId: sessionId,
    token: jwt.sign({ email }, JWT_SECRET)
  });
});

// 🚨 VULNERABILITY 11: Command injection
app.post('/backup', (req, res) => {
  const { filename } = req.body;
  const { exec } = require('child_process');
  
  // Direct command execution with user input
  exec(`tar -czf ${filename}.tar.gz /data`, (error, stdout) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      res.json({ message: 'Backup created successfully' });
    }
  });
});

// 🚨 VULNERABILITY 12: Path traversal
app.get('/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const fs = require('fs');
  
  // No path sanitization - can access any file
  try {
    const content = fs.readFileSync(`./uploads/${filename}`, 'utf8');
    res.send(content);
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// 🚨 VULNERABILITY 13: Weak authentication middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // Weak token validation
  if (token === 'admin-token') {
    req.user = { role: 'admin' };
    next();
  } else {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// 🚨 VULNERABILITY 14: Mass assignment
app.put('/profile/:userId', (req, res) => {
  const userId = req.params.userId;
  const updateData = req.body; // Accepting all fields from request
  
  // Can update any field including role, isAdmin, etc.
  console.log(`Updating user ${userId} with:`, updateData);
  res.json({ success: true });
});

// 🚨 VULNERABILITY 15: Insufficient logging for security events
app.post('/admin/delete-user', (req, res) => {
  const { userId } = req.body;
  
  // Critical action with no logging
  console.log('User deleted'); // Insufficient logging
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});