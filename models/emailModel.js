var mongoose = require('mongoose');

var emailSchema = mongoose.Schema({
    from: String,
    to: String,
    subject: String,
    content: String,
    date: Date,
    read: Number,
    deleted: Number
});

module.exports = mongoose.model('Email',emailSchema);