var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    username: String,
    password: String
});

var Users = mongoose.model('Users', userSchema);
module.exports = Users;