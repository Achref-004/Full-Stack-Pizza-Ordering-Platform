const { User } = require('../model');

class AuthRepository {
  async findById(id) {
    return await User.findById(id).select('-password');
  }

  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

}

module.exports = new AuthRepository();