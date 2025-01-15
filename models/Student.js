const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    adminNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    diploma: { type: String, required: true },
    cGPA: { type: mongoose.Schema.Types.Decimal128, required: true },
    image: { type: String, required: true }

}, { versionKey: false });

module.exports = mongoose.model('Student', studentSchema);