const mongoose = require('mongoose');

// VULNERABILITY: MongoDB connection with credentials in code
const DB_URL = 'mongodb://admin:supersecret@localhost:27017/myapp';

mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// VULNERABILITY: NoSQL Injection in queries
class UserService {
  static async findUser(query) {
    // Direct use of user input in query
    return await User.find(query);
  }
  
  static async updateBalance(userId, amount) {
    // VULNERABILITY: Race condition in financial operation
    const user = await User.findById(userId);
    const newBalance = user.balance + amount;
    
    // Delay to simulate race condition
    setTimeout(async () => {
      await User.findByIdAndUpdate(userId, { balance: newBalance });
    }, 100);
  }
  
  static async searchUsers(criteria) {
    // VULNERABILITY: Regex DoS
    const regex = new RegExp(criteria.name, 'i'); // User-controlled regex
    return await User.find({ name: regex });
  }
}

// VULNERABILITY: Aggregation injection
class OrderService {
  static async getOrderStats(pipeline) {
    // Direct use of user input in aggregation pipeline
    return await Order.aggregate(pipeline);
  }
  
  static async getOrdersByUser(userId, filters) {
    // VULNERABILITY: Object injection in MongoDB query
    const query = { userId: userId, ...filters };
    return await Order.find(query);
  }
}

module.exports = {
  UserService,
  OrderService
};