const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json());
app.use(cookieParser());

// VULNERABILITY 1: SQL Injection (even though using MongoDB)
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = " + userId; // SQL injection vulnerability
  res.send(query);
});

// VULNERABILITY 2: NoSQL Injection (MongoDB)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // Direct use of user input in MongoDB query
  const user = await User.findOne({ username: username, password: { $ne: null } });
  if (user) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// VULNERABILITY 3: Cross-Site Scripting (XSS)
app.get('/profile', (req, res) => {
  const name = req.query.name;
  // Direct insertion of user input into HTML
  res.send('<h1>Welcome ' + name + '</h1>');
});

// VULNERABILITY 4: Command Injection
app.post('/ping', (req, res) => {
  const host = req.body.host;
  const { exec } = require('child_process');
  // Direct execution of user input
  exec('ping -c 1 ' + host, (error, stdout, stderr) => {
    res.send(stdout);
  });
});

// VULNERABILITY 5: Path Traversal
app.get('/file', (req, res) => {
  const filename = req.query.file;
  const fs = require('fs');
  // Direct file access without validation
  fs.readFile('/uploads/' + filename, 'utf8', (err, data) => {
    if (err) {
      res.status(404).send('File not found');
    } else {
      res.send(data);
    }
  });
});

// VULNERABILITY 6: Weak JWT Secret
const JWT_SECRET = '123456'; // Weak secret

app.post('/auth', (req, res) => {
  const token = jwt.sign({ user: req.body.username }, JWT_SECRET);
  res.json({ token });
});

// VULNERABILITY 7: Missing Authentication
app.get('/admin', (req, res) => {
  // No authentication check
  res.json({ admin: true, secrets: ['password123', 'api_key_456'] });
});

// VULNERABILITY 8: Insecure Direct Object Reference
app.get('/order/:id', (req, res) => {
  const orderId = req.params.id;
  // No authorization check - any user can access any order
  Order.findById(orderId).then(order => {
    res.json(order);
  });
});

// VULNERABILITY 9: Price Manipulation (Business Logic)
app.post('/checkout', (req, res) => {
  const { items, total } = req.body;
  // Trust client-side total calculation
  processPayment(total); // Should calculate server-side
  res.json({ success: true, charged: total });
});

// VULNERABILITY 10: Unvalidated Redirects
app.get('/redirect', (req, res) => {
  const url = req.query.url;
  // Direct redirect without validation
  res.redirect(url);
});

// VULNERABILITY 11: Information Disclosure
app.get('/error', (req, res) => {
  try {
    throw new Error('Database connection failed: mongodb://admin:password123@localhost:27017/app');
  } catch (err) {
    // Exposing sensitive information in error messages
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// VULNERABILITY 12: Insecure Cryptographic Storage
app.post('/password', (req, res) => {
  const password = req.body.password;
  // Storing password in plain text
  const user = {
    username: req.body.username,
    password: password // Should be hashed
  };
  res.json({ saved: true });
});

// VULNERABILITY 13: Session Fixation
app.post('/session', (req, res) => {
  const sessionId = req.query.sessionId || generateSessionId();
  // Using user-provided session ID
  req.session = { id: sessionId, user: req.body.username };
  res.json({ sessionId });
});

// VULNERABILITY 14: CSRF (Missing CSRF Protection)
app.post('/transfer', (req, res) => {
  const { from, to, amount } = req.body;
  // No CSRF token validation
  transferMoney(from, to, amount);
  res.json({ success: true });
});

// VULNERABILITY 15: Inventory Manipulation
app.post('/purchase', (req, res) => {
  const { productId, quantity, price } = req.body;
  // Trust client-side price and don't check inventory
  const total = quantity * price; // Price from client
  res.json({ success: true, total });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});