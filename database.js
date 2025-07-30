const { MongoClient } = require('mongodb');
const mysql = require('mysql2');

// 🚨 VULNERABILITY 1: Hardcoded database credentials
const MONGO_URL = 'mongodb://admin:SuperSecret123@production-db:27017/ecommerce';
const MYSQL_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'root123',
  database: 'users'
};

// 🚨 VULNERABILITY 2: NoSQL injection vulnerability
async function findUser(email, password) {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  
  const db = client.db('ecommerce');
  
  // Direct object insertion allows injection
  const user = await db.collection('users').findOne({
    email: email,
    password: password // Should be hashed comparison
  });
  
  await client.close();
  return user;
}

// 🚨 VULNERABILITY 3: SQL injection in MySQL queries
function getUserById(userId) {
  const connection = mysql.createConnection(MYSQL_CONFIG);
  
  // String concatenation allows SQL injection
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  
  return new Promise((resolve, reject) => {
    connection.execute(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results[0]);
      }
      connection.end();
    });
  });
}

// 🚨 VULNERABILITY 4: Direct object reference vulnerability
async function getOrderDetails(orderId, userId) {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  
  const db = client.db('ecommerce');
  
  // No authorization check - any user can access any order
  const order = await db.collection('orders').findOne({
    _id: orderId
    // Missing: userId validation
  });
  
  await client.close();
  return order;
}

// 🚨 VULNERABILITY 5: Missing input sanitization
async function searchProducts(searchTerm, category) {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  
  const db = client.db('ecommerce');
  
  // Allows regex injection and other NoSQL attacks
  const products = await db.collection('products').find({
    $or: [
      { name: { $regex: searchTerm } }, // Unescaped regex
      { description: { $regex: searchTerm } },
      { category: category }
    ]
  }).toArray();
  
  await client.close();
  return products;
}

// 🚨 VULNERABILITY 6: Price manipulation through database query
async function updateProductPrice(productId, newPrice, userId) {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  
  const db = client.db('ecommerce');
  
  // No authorization check - any user can update prices
  const result = await db.collection('products').updateOne(
    { _id: productId },
    { $set: { price: newPrice, lastModified: new Date() } }
  );
  
  await client.close();
  return result;
}

// 🚨 VULNERABILITY 7: Inventory manipulation vulnerability
async function adjustInventory(productId, quantityChange, reason) {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  
  const db = client.db('ecommerce');
  
  // No validation on quantity change - can go negative
  const result = await db.collection('products').updateOne(
    { _id: productId },
    { 
      $inc: { stock: quantityChange },
      $push: { 
        stockHistory: {
          change: quantityChange,
          reason: reason,
          timestamp: new Date()
        }
      }
    }
  );
  
  await client.close();
  return result;
}

// 🚨 VULNERABILITY 8: Aggregation injection vulnerability
async function getRevenueReport(startDate, endDate, groupBy) {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  
  const db = client.db('ecommerce');
  
  // Dynamic aggregation pipeline allows injection
  const pipeline = [
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: JSON.parse(groupBy) // Direct JSON parsing allows injection
    }
  ];
  
  const results = await db.collection('orders').aggregate(pipeline).toArray();
  
  await client.close();
  return results;
}

// 🚨 VULNERABILITY 9: Cross-tenant data access
async function getUserOrders(userId, tenantId) {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  
  const db = client.db('ecommerce');
  
  // Missing tenant isolation - can access other tenants' data
  const orders = await db.collection('orders').find({
    userId: userId
    // Missing: tenantId filter
  }).toArray();
  
  await client.close();
  return orders;
}

// 🚨 VULNERABILITY 10: Exposed database connection details
function getDatabaseInfo() {
  return {
    mongoUrl: MONGO_URL, // Exposes credentials
    mysqlConfig: MYSQL_CONFIG, // Exposes credentials
    connectionPoolSize: 10,
    serverInfo: 'MongoDB 4.4.0, MySQL 8.0.25'
  };
}

module.exports = {
  findUser,
  getUserById,
  getOrderDetails,
  searchProducts,
  updateProductPrice,
  adjustInventory,
  getRevenueReport,
  getUserOrders,
  getDatabaseInfo
};