// Packages
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shelfSchema = new Schema({
    // It will add the primary key field automatically
    name: {
        // The comments are just notes below
        type: String, // What vartype is it
        required: true, // Is it required
        unique: false, // Can only one value exist
        trim: true, // Whitespace trimming
        minlength: 3 // Minimum string length validation
    },
    root: {
        type: [String], // Each folder will be an array item
        required: true,
        unique: false,
        minlength: 0
    },
    showDirectories: {
        type: Boolean,
        required: false,
        default: true,
        unique: false,
    },
    multiFile: {
        type: Boolean,
        required: false,
        default: false,
        unique: false
    }
}, {
    timestamps: true // Add created and modified fields
});

const Shelf = mongoose.model('Shelf', shelfSchema);
module.exports = Shelf;